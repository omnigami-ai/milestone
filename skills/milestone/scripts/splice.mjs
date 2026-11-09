// Replace an inclusive frame range without rendering the rest of the film.
//   node scripts/splice.mjs film.mp4 segment.mp4 --at 300 [--out fixed.mp4]
// CFR H.264 MP4s only. --at is a zero-based output frame; segment has no audio.
// Re-encodes the video stream losslessly in its original pixel format, fps and
// color tags. Lossy bitrate/CRF cannot remain the same AND preserve untouched
// decoded pixels exactly; the intermediate file is larger (H.264 High 4:4:4
// Predictive even for YUV420). Use the usual full render once for final delivery.
// Audio packets are copied, never re-fit or re-encoded.
// Every output frame is hashed after decoding; outside must match the original,
// inside must match the segment. A failed verification never replaces a file.
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, readFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const startedAt = performance.now();
const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf('--' + name); return i < 0 ? fallback : args[i + 1]; };
if (args.length < 2 || args[0].startsWith('--')) throw Error('usage: splice.mjs film.mp4 segment.mp4 --at <frame> [--out fixed.mp4]');
const original = path.resolve(args[0]), segment = path.resolve(args[1]);
const at = Number(opt('at', NaN));
const output = path.resolve(opt('out', original.replace(/\.mp4$/i, '') + '-spliced.mp4'));
if (!Number.isSafeInteger(at) || at < 0) throw Error('--at must be a nonnegative integer frame');
if (output === original || output === segment) throw Error('--out must be a new file (keep the original for verification)');
const run = (cmd, argv) => new Promise((resolve, reject) => {
  const p = spawn(cmd, argv, { stdio: ['ignore', 'pipe', 'pipe'] }); let out = '', err = '';
  p.stdout.on('data', d => { out += d; }); p.stderr.on('data', d => { err = (err + d).slice(-4000); });
  p.once('error', reject); p.once('close', code => code ? reject(Error(`${cmd} exited ${code}: ${err}`)) : resolve(out));
});
const probe = async file => JSON.parse(await run('ffprobe', ['-v', 'error', '-count_frames', '-show_streams', '-of', 'json', file]));
const rational = s => s.split('/').map(Number).reduce((a,b) => a/b);
const a = await probe(original), b = await probe(segment), v = a.streams.find(s => s.codec_type === 'video'), patch = b.streams.find(s => s.codec_type === 'video');
if (!v || !patch || v.codec_name !== 'h264' || patch.codec_name !== 'h264') throw Error('Both inputs must contain H.264 video');
for (const key of ['width', 'height', 'pix_fmt', 'color_range', 'color_space', 'color_primaries', 'color_transfer']) if (v[key] !== patch[key]) throw Error(`Input ${key} differs (${v[key]} vs ${patch[key]})`);
const fps = rational(v.avg_frame_rate), count = Number(v.nb_read_frames), length = Number(patch.nb_read_frames), end = at + length;
if (!Number.isFinite(fps) || fps <= 0 || Math.abs(fps - rational(patch.avg_frame_rate)) > 1e-6 || Math.abs(fps - rational(v.r_frame_rate)) > 1e-6 || Math.abs(fps - rational(patch.r_frame_rate)) > 1e-6) throw Error('Inputs must have the same constant frame rate');
if (!Number.isSafeInteger(count) || !Number.isSafeInteger(length) || !length || end > count) throw Error(`Segment ${at}–${end - 1} exceeds original ${count} frames`);
// A renderer sidecar prevents accidentally inserting a different shot or quality.
let source;
try { source = JSON.parse(await readFile(segment + '.render.json', 'utf8')); } catch(e) { if (e.code !== 'ENOENT') throw e; }
if (source && (source.firstFrame !== at || source.frames !== length)) throw Error('Segment render metadata disagrees with --at/decoded frame count');
const tmp = await mkdtemp(path.join(path.dirname(output), '.splice-'));
const ff = argv => run('ffmpeg', ['-v', 'error', '-y', ...argv]);
const hashes = async file => (await run('ffmpeg', ['-v', 'error', '-i', file, '-map', '0:v:0', '-f', 'framemd5', '-'])).split('\n').filter(s => s && !s.startsWith('#')).map(s => s.split(',').at(-1).trim());
const audioHash = async file => createHash('sha256').update(await run('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_packets', '-show_data_hash', 'sha256', '-show_entries', 'packet=pts,dts,duration,data_hash', '-of', 'json', file])).digest('hex');
try {
  const chunks = [], inputs = []; let n = 0;
  if (at) { chunks.push(`[0:v]trim=end_frame=${at},setpts=PTS-STARTPTS[p${n}]`); inputs.push(`[p${n++}]`); }
  chunks.push(`[1:v]setpts=PTS-STARTPTS[p${n}]`); inputs.push(`[p${n++}]`);
  if (end < count) { chunks.push(`[0:v]trim=start_frame=${end},setpts=PTS-STARTPTS[p${n}]`); inputs.push(`[p${n++}]`); }
  chunks.push(`${inputs.join('')}concat=n=${n}:v=1:a=0[v]`);
  const candidate = path.join(tmp, 'result.mp4');
  // Changing a lossy stream's GOPs to lossless changes SPS/profile. A single
  // lossless stream avoids decoder corruption at those profile boundaries.
  // Keep native YUV samples/range/matrix, dimensions and fps; never RGB-roundtrip.
  const colour = ['color_range','color_space','color_primaries','color_transfer'].flatMap((key,i) => {
    const value = v[key]; return !value || value === 'unknown' ? [] : [['-color_range','-colorspace','-color_primaries','-color_trc'][i], value];
  });
  await ff(['-i', original, '-i', segment, '-filter_complex', chunks.join(';'), '-map', '[v]', '-map', '0:a?',
    '-map_metadata', '0', '-c:v', 'libx264', '-qp', '0', '-preset', 'fast', '-pix_fmt', v.pix_fmt, ...colour,
    '-r', v.avg_frame_rate, '-video_track_timescale', v.time_base.split('/')[1], '-c:a', 'copy', '-movflags', '+faststart', candidate]);
  const before = await hashes(original), inserted = await hashes(segment), after = await hashes(candidate);
  if (after.length !== count) throw Error(`Splice changed frame count (${after.length} vs ${count})`);
  const mismatches = after.flatMap((h,i) => h !== (i >= at && i < end ? inserted[i-at] : before[i]) ? [i] : []);
  if (mismatches.length) throw Error(`Decoded pixels changed at ${mismatches.length} unexpected frames: ${mismatches.slice(0,12)}`);
  if (await audioHash(original) !== await audioHash(candidate)) throw Error('Audio packets or timestamps changed');
  const report = { seconds: (performance.now() - startedAt) / 1000, original, segment, at, end: end - 1, frames: count, replacedFrames: length, videoFramesReencoded: count, outsideFramesChecked: count - length, outsideMismatches: 0, segmentMismatches: 0, audioPacketsUnchanged: true, encoding: 'lossless H.264; original pixel format, fps and color tags; audio stream copied', render: source || null };
  await rename(candidate, output);
  await writeFile(output + '.splice.json', JSON.stringify(report, null, 2) + '\n');
  console.log(`wrote ${output}; replaced ${length} frames, all ${count-length} outside frames and audio packets unchanged`);
} finally { await rm(tmp, { recursive: true, force: true }); }
