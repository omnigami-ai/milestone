"""Decode a final MP4 once for motion review; never re-render or modify it.
Usage: python3 scripts/review-video.py movie.mp4 out/review events.json
events.json: a list of seconds, or {"events":[seconds or {"t":seconds,"rect":[x,y,w,h]}],
"darks":[seconds]}. Include every cut, UI event and gesture phase of THIS movie.
Original frames stay on disk. Each ui-*.png contains every original-size ROI
from -.5 through +1 s, with frame/time labels. Memory holds one strip at a time.
"""
import hashlib,json,math,subprocess,sys
from pathlib import Path
from PIL import Image,ImageDraw,ImageEnhance

def sha256(file):
 digest=hashlib.sha256()
 with file.open('rb') as encoded:
  for chunk in iter(lambda:encoded.read(1024**2),b''):digest.update(chunk)
 return digest.hexdigest()

if len(sys.argv)!=4:raise SystemExit(__doc__)
video,out,spec=Path(sys.argv[1]),Path(sys.argv[2]),json.loads(Path(sys.argv[3]).read_text())
source_digest=sha256(video)
events=spec.get('events') if isinstance(spec,dict) else spec
if not isinstance(events,list) or not events:raise ValueError('Supply actual movie event times')
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height,avg_frame_rate,nb_frames,duration','-of','json',str(video)]))['streams'][0]
w,h=probe['width'],probe['height'];num,den=map(int,probe['avg_frame_rate'].split('/'));fps=num/den
if not math.isfinite(fps) or fps<=0:raise ValueError('Video needs a valid frame rate')
duration=float(probe['duration']);frame_at=lambda t:math.floor(t*fps+.5)
normalized=[]
for event in events:
 event={'t':event} if isinstance(event,(int,float)) else event
 t=event['t'];rect=event.get('rect',[0,0,w,h])
 if not isinstance(t,(int,float)) or not math.isfinite(t) or not 0<=t<duration:raise ValueError('Event outside the movie')
 if len(rect)!=4 or not all(isinstance(x,int) for x in rect) or min(rect)<0 or min(rect[2:])<1 or rect[0]+rect[2]>w or rect[1]+rect[3]>h:raise ValueError('Invalid review rectangle')
 normalized.append({'t':t,'rect':rect})
out.mkdir(parents=True,exist_ok=True);frames=out/'frames';frames.mkdir(exist_ok=True)
if any(frames.iterdir()):raise ValueError('Use a fresh review output directory')
darks=spec.get('darks',[]) if isinstance(spec,dict) else []
if not darks:darks=[duration*(i+1)/9 for i in range(8)]
if any(not isinstance(t,(int,float)) or not math.isfinite(t) or not 0<=t<duration for t in darks):raise ValueError('Dark-review time outside the movie')
dark_frames={frame_at(t) for t in darks};contact=[];count=0;nbytes=w*h*3
command=['ffmpeg','-v','error','-threads','1','-filter_threads','1','-i',str(video),'-threads','1','-fps_mode','passthrough','-f','rawvideo','-pix_fmt','rgb24','pipe:1']
p=subprocess.Popen(command,stdout=subprocess.PIPE)
try:
 while True:
  data=p.stdout.read(nbytes)
  if not data:break
  if len(data)!=nbytes:raise RuntimeError('Partial decoded frame')
  with Image.frombytes('RGB',(w,h),data) as im:
   im.save(frames/f'f{count:05d}.png',compress_level=1)
   if count%max(1,round(fps))==0:
    small=im.copy();small.thumbnail((180,320));contact.append((count,small))
    phone=im.copy();phone.thumbnail((360,640));phone.save(out/f'phone-f{count:05d}.jpg',quality=95);phone.close()
   if count in dark_frames:
    lifted=ImageEnhance.Brightness(im).enhance(7);lifted.save(out/f'darks-x7-f{count:05d}.png');lifted.close()
  count+=1
finally:
 p.stdout.close();p.wait()
expected=probe.get('nb_frames','')
if p.returncode or (str(expected).isdigit() and count!=int(expected)):raise RuntimeError('Incomplete video decode')
sheet=Image.new('RGB',(180*8,342*math.ceil(len(contact)/8)),'#333');draw=ImageDraw.Draw(sheet)
for i,(f,im) in enumerate(contact):
 x=i%8*180;y=i//8*342;sheet.paste(im,(x,y+22));draw.text((x+4,y+3),f'f{f} / {f/fps:.3f}s',fill='white');im.close()
sheet.save(out/'contact.jpg',quality=95);sheet.close();index=[]
for i,event in enumerate(normalized):
 t=event['t'];x,y,cw,ch=event['rect'];a=max(0,frame_at(t)-frame_at(.5));b=min(count-1,frame_at(t)+frame_at(1))
 strip=Image.new('RGB',(cw*5,(ch+22)*math.ceil((b-a+1)/5)),'#333');draw=ImageDraw.Draw(strip)
 for cell,f in enumerate(range(a,b+1)):
  dx=cell%5*cw;dy=cell//5*(ch+22)
  with Image.open(frames/f'f{f:05d}.png') as im:
   crop=im.crop((x,y,x+cw,y+ch));strip.paste(crop,(dx,dy+22));crop.close()
  draw.text((dx+4,dy+3),f'f{f} / {f/fps:.6f}s',fill='white')
 name=f'ui-{i:03d}-{t:.6f}.png';strip.save(out/name,compress_level=1);strip.close()
 index.append({**event,'from':a,'to':b,'strip':name})
digest=sha256(video)
if digest!=source_digest:raise RuntimeError('Movie changed during review extraction')
report={'video':str(video),'movieSHA256':digest,'frozen':True,'width':w,'height':h,'fps':fps,'decodedFrames':count,'savedFrames':count,'events':index,'darkFrames':sorted(dark_frames),'fullFramePattern':'frames/f%05d.png'}
(out/'index.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'decodedFrames':count,'events':len(index),'movieSHA256':digest,'out':str(out)}))
