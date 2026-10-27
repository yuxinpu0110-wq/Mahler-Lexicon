import {z} from 'zod';
import type {Catalog} from './model';
import type {ScoreSyncData} from './scoreSyncModel';

const hash=z.string().regex(/^sha256:[a-f0-9]{64}$/);
const status=z.literal('needs_review');
const span=z.object({measureId:z.string().min(1),start:z.number().nonnegative(),end:z.number().positive(),status});
const schema=z.object({version:z.literal(1),movement:z.union([z.literal(1),z.literal(2),z.literal(4),z.literal(5)]),edition:z.string().min(1),scoreFingerprint:hash,barCount:z.number().int().positive(),granularity:z.literal('estimated_measure_navigation'),status,method:z.string().min(1),
 sources:z.array(z.object({title:z.string().min(1),url:z.string().url(),usage:z.string().min(1)})).min(1),notes:z.array(z.string()),
 readings:z.array(z.object({regionId:z.string(),firstBar:z.number().int().positive(),lastBar:z.number().int().positive(),referenceFrameSeconds:z.number().nonnegative(),pages:z.array(z.number().int()).min(1),timing:z.enum(['reference_subdivision_then_dtw','local_view_subdivision_dtw_plateau']),basis:z.string().min(1)})).min(1),
 measures:z.array(z.object({id:z.string(),number:z.number().int().positive(),regionId:z.string(),sourceStart:z.number().nonnegative(),sourceEnd:z.number().positive(),status})).min(1),
 tracks:z.array(z.object({id:z.string(),fingerprint:hash,duration:z.number().positive(),intervals:z.array(span).min(1)})).length(1),
 evidence:z.object({referenceVideoSHA256:z.string().regex(/^[a-f0-9]{64}$/),referenceAudioSHA256:z.string().regex(/^[a-f0-9]{64}$/),anchorFile:z.literal('scripts/sync/work-measure-anchors.json'),humanAuditionVerified:z.literal(false)})});
export type WorkMeasureData=z.infer<typeof schema>;

export function validateWorkMeasures(raw:unknown,catalog:Catalog,scores:Record<number,ScoreSyncData>):Record<number,WorkMeasureData>{
 const collection=z.object({version:z.literal(1),movements:z.array(z.unknown()).length(4)}).parse(raw);
 const library:Record<number,WorkMeasureData>={};
 for(const entry of collection.movements){
  const d=schema.parse(entry),score=scores[d.movement],t=d.tracks[0];
  if(library[d.movement]||!score||d.edition!==catalog.edition||d.edition!==score.edition||d.scoreFingerprint!==score.scoreFingerprint)throw Error('小节导航乐章、谱本或指纹不匹配');
  const original=catalog.tracks.find(x=>x.id===t.id),st=score.tracks.find(x=>x.id===t.id);
  if(!original||!st||original.movement!==d.movement||original.fingerprint!==t.fingerprint||st.fingerprint!==t.fingerprint||Math.abs(original.duration-t.duration)>.001||Math.abs(st.duration-t.duration)>.001)throw Error('小节导航录音指纹或时长不匹配');
  if(d.measures.length!==d.barCount||t.intervals.length!==d.barCount||d.readings.length!==score.regions.length)throw Error('小节导航数量不完整');
  let previousEnd=0,sourceEnd=score.regions[0].sourceStart,nextBar=1;
  for(const [i,r] of d.readings.entries()){
   const region=score.regions[i];
   if(r.regionId!==region.id||r.firstBar!==nextBar||r.lastBar<r.firstBar||Math.abs(r.referenceFrameSeconds-region.sourceStart-2)>.001||JSON.stringify(r.pages)!==JSON.stringify(region.pages.map(p=>p.page)))throw Error('小节编号依据与谱段不匹配');
   nextBar=r.lastBar+1;
  }
  if(nextBar!==d.barCount+1)throw Error('小节编号依据未覆盖结尾');
  for(const [i,m]of d.measures.entries()){
   const interval=t.intervals[i],r=d.readings.find(r=>r.firstBar<=m.number&&m.number<=r.lastBar),region=score.regions.find(x=>x.id===m.regionId),ss=st.intervals.find(x=>x.regionId===m.regionId);
   if(m.number!==i+1||m.id!==`ue-${d.movement}-m${String(i+1).padStart(3,'0')}`||interval.measureId!==m.id||!region||!ss||r?.regionId!==m.regionId)throw Error('小节导航编号或谱段引用无效');
   if(m.sourceEnd<=m.sourceStart||Math.abs(m.sourceStart-sourceEnd)>.00001||m.sourceStart<region.sourceStart-.00001||m.sourceEnd>region.sourceEnd+.00001)throw Error('小节来源时间越界或不连续');
   if(interval.end<=interval.start||Math.abs(interval.start-previousEnd)>.00001||interval.start<ss.start-.00001||interval.end>ss.end+.00001)throw Error('小节本地时间越界或不连续');
   sourceEnd=m.sourceEnd;previousEnd=interval.end;
  }
  if(Math.abs(previousEnd-t.duration)>.00001||Math.abs(sourceEnd-score.regions.at(-1)!.sourceEnd)>.00001)throw Error('小节导航未覆盖录音末尾');
  library[d.movement]=d;
 }
 return library;
}

export function workMeasureAt(d:WorkMeasureData,trackId:string,fingerprint:string,time:number){
 const track=d.tracks.find(t=>t.id===trackId&&t.fingerprint===fingerprint);
 if(!track||!Number.isFinite(time)||time<0||time>=track.duration)return null;
 const interval=track?.intervals.find(i=>i.start<=time&&time<i.end);
 const measure=interval&&d.measures.find(m=>m.id===interval.measureId);
 return interval&&measure?{interval,measure}:null;
}

/** Exact file identity required; ranges never clamp an unknown manuscript bar. */
export function workBarRange(d:WorkMeasureData,trackId:string,fingerprint:string,from:number,to=from){
 if(!Number.isInteger(from)||!Number.isInteger(to)||from<1||to<from||to>d.barCount)return null;
 const t=d.tracks.find(t=>t.id===trackId&&t.fingerprint===fingerprint);
 const start=t?.intervals[from-1],end=t?.intervals[to-1];
 return start&&end?{trackId:t!.id,start:start.start,end:end.end,regionId:d.measures[from-1].regionId}:null;
}
