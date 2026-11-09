// Rebuildable, local video frame caches. Nothing here runs inside seek().
import {createReadStream} from 'node:fs';
import {mkdir, readFile, writeFile, stat, realpath, mkdtemp, rm, rename, copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawn, fork, execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const hashFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
const command = (bin, args) => execFileSync(bin, args, {encoding:'utf8', timeout:600000, maxBuffer:16*1024**2});
export const frameName = n => `${String(n + 1).padStart(6, '0')}.webp`;
// Windows cwebp uses WIC, which cannot decode PPM. A top-down 24-bit BMP
// carries the same RGB pixels without another image codec or child process.
export function rgbBitmap(rgb,width,height) {
  if(rgb.length!==width*height*3)throw Error('RGB bitmap size mismatch');
  const stride=(width*3+3)&~3, data=Buffer.alloc(54+stride*height);
  data.write('BM');data.writeUInt32LE(data.length,2);data.writeUInt32LE(54,10);
  data.writeUInt32LE(40,14);data.writeInt32LE(width,18);data.writeInt32LE(-height,22);
  data.writeUInt16LE(1,26);data.writeUInt16LE(24,28);data.writeUInt32LE(stride*height,34);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const from=(y*width+x)*3,to=54+y*stride+x*3;
    data[to]=rgb[from+2];data[to+1]=rgb[from+1];data[to+2]=rgb[from];
  }
  return data;
}

function webpEncoder() {
  if(process.env.OMNIGAMI_WEBP_ENCODER!=='pillow'){
    try{return{bin:'cwebp',version:command('cwebp',['-version']).trim()};}catch{/* portable fallback below */}
  }
  try{
    const version=command('python3',['-c','from PIL import Image, features; assert features.check("webp"), "Pillow needs WebP support"; print("Pillow " + Image.__version__ + " / WebP " + features.version("webp"))']).trim();
    return{bin:'python3',version};
  }catch{throw Error('Install cwebp or Python Pillow with WebP support to prepare the video cache');}
}

export async function describeVideo(input, width = 990) {
  const probe = JSON.parse(command('ffprobe', ['-v','error','-select_streams','v:0','-count_frames','-show_streams','-of','json',input])).streams[0];
  const [num, den] = probe.avg_frame_rate.split('/').map(Number), fps = num / den;
  const height = probe.height * width / probe.width;
  if (!Number.isInteger(width) || width < 100 || !Number.isInteger(height)) throw Error('Choose a width giving a uniform integer-sized scale');
  if (!(fps > 0) || !Number.isInteger(Number(probe.nb_read_frames))) throw Error('Normalize the input to constant frame rate first');
  if (!Number.isInteger(fps / 30) || fps < 30) throw Error('Normalize the input to CFR 30 or 60 fps before packing (no optical interpolation)');
  // The timestamp-selection contract is CFR; do not silently reinterpret VFR.
  const timestamps = command('ffprobe', ['-v','error','-select_streams','v:0','-show_entries','frame=best_effort_timestamp_time','-of','csv=p=0',input])
    .split('\n').map(s => s.trim().split(',')[0]).filter(Boolean).map(Number);
  const first = timestamps[0];
  if (!timestamps.length || timestamps.some((t, i) => !Number.isFinite(t) || Math.abs(t - first - i / fps) > .00001))
    throw Error('Normalize variable frame rate/timestamps before packing');
  const frames = Number(probe.nb_read_frames), duration = frames / fps;
  return {version:2, fps:30, width, height, duration, frameCount:Math.ceil(duration * 30 - 1e-6),
    format:'webp-q92-m4', originalSource:{name:path.basename(input),width:probe.width,height:probe.height,fps,frames,duration,sha256:await hashFile(input)},
    originalSegments:[{from:0,duration,speed:1}], sampling:'First source frame at or after each 30fps slot; no interpolation'};
}

export async function packVideo(input, output, width = 990) {
  const index = await describeVideo(input, width);
  await mkdir(output, {recursive:true});
  // Never overwrite an approved take or leave the obsolete frame store behind.
  for (const name of ['index.json','source.mp4','frames']) {
    try { await stat(path.join(output,name)); throw Error(`Refusing existing recording: ${path.join(output,name)}`); }
    catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  index.source = 'source.mp4';
  index.cache = `out/video-frames/${index.originalSource.sha256.slice(0,16)}-${width}`;
  await copyFile(input, path.join(output,'source.mp4'));
  await writeFile(path.join(output,'index.json'), JSON.stringify(index,null,2)+'\n');
  return index;
}

const inside = (root, file) => file.startsWith(root + path.sep);
export async function prepareVideoSources(film, sources = []) {
  const root = await realpath(film), reports = [];
  for (const relative of sources) {
    if (typeof relative !== 'string') throw Error('frameSources entries must be local manifest paths');
    const manifest = await realpath(path.resolve(root, relative));
    if (!inside(root,manifest)) throw Error('Video manifest must stay inside the film');
    const index = JSON.parse(await readFile(manifest,'utf8'));
    if (index.version !== 2 || !(index.fps > 0) || !Number.isInteger(index.frameCount) || index.frameCount < 1 ||
        ![index.width,index.height].every(n => Number.isInteger(n) && n > 0) || !index.source || !index.cache)
      throw Error(`Invalid video manifest: ${relative}`);
    if (!Number.isInteger(index.originalSource?.fps / index.fps) || index.originalSource.fps < index.fps)
      throw Error('Video cache needs an integer source/presentation rate; normalize to CFR 30 or 60 fps');
    const source = await realpath(path.resolve(path.dirname(manifest), index.source));
    const cache = path.resolve(root, index.cache);
    if (!inside(root,source) || !inside(path.join(root,'out','video-frames'),cache)) throw Error('Video source/cache must stay inside the film');
    if (await hashFile(source) !== index.originalSource.sha256) throw Error(`Recording SHA-256 differs: ${relative}`);
    await mkdir(path.dirname(cache),{recursive:true});
    if (!inside(root,await realpath(path.dirname(cache)))) throw Error('Video cache parent must stay inside the film');
    const codec=webpEncoder(),encoder=codec.version;
    const decoder = command('ffmpeg',['-version']).split('\n')[0];
    const fingerprint = createHash('sha256').update(JSON.stringify({index,encoder,decoder,pipeline:1})).digest('hex');
    let ready;
    try { ready = JSON.parse(await readFile(path.join(cache,'ready.json'),'utf8')); }
    catch (e) { if (e.code !== 'ENOENT') throw e; }
    if (ready?.fingerprint === fingerprint) {
      // Detect interrupted or manually removed caches, including interior files.
      try { await Promise.all(Array.from({length:index.frameCount},(_,n)=>stat(path.join(cache,frameName(n))))); }
      catch { ready = null; }
      if (ready) { reports.push({...ready,cache:index.cache,reused:true}); continue; }
    }
    const temp = await mkdtemp(cache+'-building-');
    console.log(`preparing ${relative}: ${index.frameCount} frames → ${index.cache}`);
    try {
      const rate = index.originalSource.fps / index.fps;
      const select = Number.isInteger(rate) && rate >= 1 ? `not(mod(n,${rate}))` : `gte(t+0.000001,selected_n/${index.fps})`;
      // Raw RGB is the same scaled RGB as the former PNG/cwebp preparation.
      // Backpressure plus two encoders bounds memory; no full PNG store exists.
      const ff = spawn('ffmpeg',['-hide_banner','-loglevel','error','-threads','1','-filter_threads','1','-i',source,'-vf',`select='${select}',scale=${index.width}:${index.height}:flags=lanczos`,
        '-fps_mode','vfr','-threads','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{stdio:['ignore','pipe','pipe']});
      let error = '', childError;
      ff.stderr.on('data',d=>{error=(error+d).slice(-4000);});
      const finished = new Promise(resolve=>{ff.on('error',e=>{childError=e;resolve(-1);});ff.on('close',resolve);});
      const bytesPerFrame = index.width * index.height * 3, header = Buffer.from(`P6\n${index.width} ${index.height}\n255\n`);
      const active = new Set(); let pendingError, count = 0, used = 0, bytes = 0, buffer = Buffer.allocUnsafe(bytesPerFrame);
      const encode = async (rgb, n) => {
        const target = path.join(temp,frameName(n));
        const bitmap=process.platform==='win32'&&codec.bin==='cwebp';
        const ppm=target+(bitmap?'.bmp':'.ppm');
        await writeFile(ppm,bitmap?rgbBitmap(rgb,index.width,index.height):Buffer.concat([header,rgb]));
        try {
          await new Promise((resolve,reject)=>{
            const argv=codec.bin==='cwebp'?['-quiet','-q','92','-m','4',ppm,'-o',target]
              :['-c',"from PIL import Image; import sys; Image.open(sys.argv[1]).save(sys.argv[2], 'WEBP', quality=92, method=4)",ppm,target];
            const child = spawn(codec.bin,argv,{stdio:['ignore','ignore','pipe']});
            let message=''; child.stderr.on('data',d=>{message+=d;});
            child.on('error',reject);
            child.on('close',code=>code?reject(Error(`${codec.bin} WebP encoding exited ${code}: ${message}`)):resolve());
          });
          bytes+=(await stat(target)).size;
        } finally {await rm(ppm,{force:true});}
      };
      try {
        for await (const chunk of ff.stdout) {
          for (let offset=0; offset<chunk.length;) {
            const n=Math.min(bytesPerFrame-used,chunk.length-offset); chunk.copy(buffer,used,offset,offset+n);used+=n;offset+=n;
            if (used===bytesPerFrame) {
              if (count>=index.frameCount) throw Error('Decoded recording exceeds manifest frame count');
              const work=encode(buffer,count++).catch(e=>{pendingError=e;}).finally(()=>active.delete(work));active.add(work);
              buffer=Buffer.allocUnsafe(bytesPerFrame);used=0;
              if(active.size>=2)await Promise.race(active);
              if(pendingError)throw pendingError;
            }
          }
        }
        const code=await finished;
        if(code!==0)throw childError||Error(`ffmpeg exited ${code}: ${error}`);
        await Promise.all(active);if(pendingError)throw pendingError;
        if(used||count!==index.frameCount)throw Error(`Decoded ${count} frames; expected ${index.frameCount}`);
      } finally {ff.kill();await finished;await Promise.all(active);}
      ready={fingerprint,sourceSHA256:index.originalSource.sha256,width:index.width,height:index.height,frameCount:count,bytes,encoder,decoder};
      await writeFile(path.join(temp,'ready.json'),JSON.stringify(ready,null,2)+'\n');
      await rm(cache,{recursive:true,force:true});await rename(temp,cache);
      reports.push({...ready,cache:index.cache,reused:false});
    } finally {await rm(temp,{recursive:true,force:true});}
  }
  return reports;
}

// Cache building owns large transient RGB buffers. Let a short-lived process
// release its entire heap before the parent allocates a live 3D renderer.
export function prepareVideoSourcesIsolated(film,sources=[]) {
  if(!sources.length)return Promise.resolve([]);
  return new Promise((resolve,reject)=>{
    const child=fork(fileURLToPath(import.meta.url),['--prepare',film,JSON.stringify(sources)],{execArgv:[],stdio:['ignore','inherit','inherit','ipc']});
    let reports;
    child.on('message',m=>{if(Array.isArray(m.reports))reports=m.reports;});
    child.once('error',reject);
    child.once('close',(code,signal)=>code===0&&reports?resolve(reports):reject(Error(`Video preparation failed (${signal||code})`)));
  });
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)&&process.argv[2]==='--prepare'){
  try{
    const reports=await prepareVideoSources(process.argv[3],JSON.parse(process.argv[4]));
    if(process.send)await new Promise((resolve,reject)=>process.send({reports},e=>e?reject(e):resolve()));
    else console.log(JSON.stringify(reports));
  }catch(e){console.error(e.message);process.exitCode=1;}
  finally{if(process.connected)process.disconnect();}
}
