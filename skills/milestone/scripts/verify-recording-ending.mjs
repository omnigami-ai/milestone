// Compare the chosen song landing with actual captured activity and the cut's
// declared duration. Run with the SAME landing argument used by the exporter.
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';

export function recordingEnding({samples,timeline,recording,sourceTime,settledErrors,meta,land}) {
 const errors=[],{size,duration,fps}=meta;
 if(!Number.isFinite(land)||!(duration>0)||!(fps>0)||!size)return {ok:false,errors:['Need a finite landing and actual size/duration/fps metadata']};
 const sourceEnd=sourceTime(duration-1/fps,size),step=samples[1].time-samples[0].time;
 let ready=0;
 for(const move of timeline.moves||[])if(move.start<=sourceEnd)ready=Math.max(ready,move.end);
 for(const touch of timeline.touches||[])if(touch.start<=sourceEnd)ready=Math.max(ready,touch.end+.45,touch.kind==='scroll'?touch.start+touch.duration:0);
 let previous;
 for(const sample of samples){
  if(sample.time>sourceEnd+1e-7)break;
  const active=(sample.animations||[]).some(a=>Number.isFinite(a.duration)&&a.time>=0&&a.time<a.duration);
  if(sample.navigation||sample.loading||sample.pressed||sample.finger?.press>0||sample.arriving||active)ready=Math.max(ready,sample.time+step);
  if(previous&&['route','hash','scroll','scrollLeft','scrollTop'].some(k=>sample[k]!==previous[k]))ready=Math.max(ready,sample.time);
  previous=sample;
 }
 const pauses=size===recording.store?[]:recording.socialPauses||[],covered=t=>pauses.some(p=>t>=p.from&&t<p.to);
 let finalProofAt=null;
 for(let f=0;f<Math.round(duration*fps);f++){const t=f/fps;if(!covered(t)&&sourceTime(t,size)>=ready-1e-6){finalProofAt=t;break;}}
 if(finalProofAt===null)errors.push('Final captured activity does not settle within the visible cut');
 else if(land+1e-6<finalProofAt)errors.push(`Landing ${land}s precedes final settled activity at ${finalProofAt}s`);
 if(land<0||land>=duration)errors.push('Landing is outside the cut');
 if(duration-land<3.5-1e-6)errors.push('Leave at least 3.5 seconds after the landing');
 if(Math.abs(land-Math.round(land/2.4)*2.4)>1/fps+1e-6)errors.push('Landing must be on a 2.4-second song bar');
 if(covered(land))errors.push('Landing is hidden by an opaque benefit card');
 if(land>=0&&land<duration)errors.push(...settledErrors(samples,[sourceTime(land,size)]));
 return {ok:errors.length===0,size,duration,land,sourceReadyAt:ready,finalProofAt,tail:duration-land,errors};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 const [film,events,landing]=process.argv.slice(2);
 if(!film||!events||landing===undefined)throw Error('usage: node scripts/verify-recording-ending.mjs film out/events/<size>-events.json <same-export-landing>');
 const root=path.resolve(film),module=await import(pathToFileURL(path.join(root,'recording.js')));
 const [samples,timeline,meta]=await Promise.all(['capture/samples.json','capture/timeline.json',path.resolve(events)].map(async p=>JSON.parse(await readFile(path.isAbsolute(p)?p:path.join(root,p),'utf8'))));
 const report=recordingEnding({samples,timeline,recording:module.RECORDING,sourceTime:module.sourceTime,settledErrors:module.settledErrors,meta,land:Number(landing)});
 console.log(JSON.stringify(report,null,2));if(!report.ok)process.exitCode=1;
}
