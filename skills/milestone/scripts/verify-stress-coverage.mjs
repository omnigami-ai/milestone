// Verify that completed stress windows jointly inspected every planned target
// and its real ±2-frame context for every requested size and copy case.
import {readFile} from 'node:fs/promises';
const files=process.argv.slice(2);
if(!files.length)throw Error('usage: node scripts/verify-stress-coverage.mjs out/*/stress/coverage.json');
const key=t=>t.toFixed(6),groups=new Map(),required=new Set();
for(const file of files){
 const rows=JSON.parse(await readFile(file,'utf8'));
 if(!Array.isArray(rows)||!rows.length)throw Error(`No completed stress cases: ${file}`);
 for(const row of rows){
  if(![row.plannedTimes,row.inspectedTimes,row.sampleTimes,row.cases,row.sizes].every(Array.isArray)||!(row.fps>0)||!(row.duration>0))throw Error(`Invalid stress coverage: ${file}`);
  for(const size of row.sizes)for(const name of row.cases)required.add(size+'|'+name);
  const id=row.size+'|'+row.case,plan=row.plannedTimes.map(key);
  let group=groups.get(id);
  if(!group){group={size:row.size,case:row.case,fps:row.fps,duration:row.duration,plan,covered:new Set()};groups.set(id,group);}
  if(group.fps!==row.fps||group.duration!==row.duration||JSON.stringify(group.plan)!==JSON.stringify(plan))throw Error(`Mismatched stress plans for ${id}`);
  const samples=new Set(row.sampleTimes.map(key)),planned=new Set(plan);
  for(const t of row.inspectedTimes){
   if(!Number.isFinite(t)||!planned.has(key(t)))throw Error(`Unplanned stress target for ${id}`);
   for(let f=-2;f<=2;f++){const n=t+f/row.fps;if(n>=0&&n<row.duration&&!samples.has(key(n)))throw Error(`Missing neighbour ${n} for ${id}`);}
   group.covered.add(key(t));
  }
 }
}
const reports=[...required].map(id=>{const g=groups.get(id);if(!g)return {id,ok:false,error:'Missing size/copy case'};const missing=g.plan.filter(t=>!g.covered.has(t));return {size:g.size,case:g.case,ok:missing.length===0,planned:g.plan.length,inspected:g.covered.size,missing:missing.map(Number)};});
const ok=reports.every(r=>r.ok);console.log(JSON.stringify({ok,files,reports},null,2));if(!ok)process.exitCode=1;
