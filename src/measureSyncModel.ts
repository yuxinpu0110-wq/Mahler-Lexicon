import {z} from 'zod';
import type {Catalog} from './model';
import type {ScoreSyncData} from './scoreSyncModel';

const hash=z.string().regex(/^sha256:[a-f0-9]{64}$/);
const source=z.object({title:z.string().min(1),url:z.string().url(),usage:z.string().min(1)});
const measure=z.object({id:z.string().regex(/^ue-iii-m\d{3}$/),number:z.number().int().min(1).max(581),page:z.number().int().min(80).max(127),system:z.number().int().min(0),box:z.tuple([z.number(),z.number(),z.number().positive(),z.number().positive()]),status:z.literal('needs_review'),sourceStart:z.number().nonnegative(),sourceEnd:z.number().positive(),regionId:z.string().min(1)});
export const measureSchema=z.object({version:z.literal(1),movement:z.literal(3),edition:z.string().min(1),scoreFingerprint:hash,granularity:z.literal('estimated_measure'),status:z.literal('needs_review'),method:z.string().min(1),corrections:z.array(z.object({page:z.number().int(),system:z.number().int(),action:z.enum(['insert','remove']),xs:z.array(z.number().int()),reason:z.string()})),sources:z.array(source).min(1),measures:z.array(measure).length(581),tracks:z.array(z.object({id:z.string(),fingerprint:hash,duration:z.number().positive(),intervals:z.array(z.object({measureId:z.string(),start:z.number().nonnegative(),end:z.number().positive(),status:z.literal('needs_review')})).min(1)})).length(3)});
export type MeasureSyncData=z.infer<typeof measureSchema>;
export type Measure=MeasureSyncData['measures'][number];
const context=z.object({id:z.string().min(1),from:z.number().int().min(1),to:z.number().int().max(581),title:z.string().min(1),scoreFact:z.string().optional(),analysis:z.string().optional(),meaning:z.string().optional(),motif:z.string().optional(),harmony:z.string().optional(),question:z.string().min(1),sourceUrl:z.string().url(),sourceTitle:z.string().min(1),sourceLocation:z.string().min(1),supportingSources:z.array(z.object({title:z.string().min(1),url:z.string().url(),location:z.string().min(1)})).optional(),status:z.literal('research_only')});
export const researchSchema=z.object({version:z.literal(1),edition:z.string().min(1),scoreFingerprint:hash,notes:z.array(context).min(1)});
export type MeasureResearch=z.infer<typeof researchSchema>;

export function validateMeasures(raw:unknown,catalog:Catalog,score:ScoreSyncData):MeasureSyncData{
 const d=measureSchema.parse(raw);if(d.edition!==score.edition||d.scoreFingerprint!==score.scoreFingerprint)throw Error('小节索引的谱本或指纹不匹配');
 const regions=new Map(score.regions.map(r=>[r.id,r]));let sourceEnd=0;
 for(let i=0;i<d.measures.length;i++){
  const m=d.measures[i];if(m.number!==i+1||m.id!==`ue-iii-m${String(i+1).padStart(3,'0')}`)throw Error('小节编号或稳定 ID 不连续');
  if(m.sourceEnd<=m.sourceStart||m.sourceStart<sourceEnd-.0001)throw Error('小节来源时间重叠或无效');sourceEnd=m.sourceEnd;
  const r=regions.get(m.regionId);if(!r||m.sourceStart<r.sourceStart-.0001||m.sourceEnd>r.sourceEnd+.0001||!r.pages.some(p=>p.page===m.page))throw Error('小节谱段引用无效');
  const[x,y,w,h]=m.box;if(x<0||y<0||x+w>1.001||y+h>1.001)throw Error('小节谱面框越界');
 }
 if(Math.abs(sourceEnd-650)>.001)throw Error('小节索引未覆盖来源乐章末端');
 const scoreTracks=new Map(score.tracks.map(t=>[t.id,t]));const seen=new Set<string>();
 for(const t of d.tracks){if(seen.has(t.id))throw Error('重复小节音轨');seen.add(t.id);const original=catalog.tracks.find(x=>x.id===t.id);const st=scoreTracks.get(t.id);if(!original||original.movement!==3||!st||original.fingerprint!==t.fingerprint||st.fingerprint!==t.fingerprint||Math.abs(original.duration-t.duration)>.01)throw Error('小节音轨与录音指纹不符');
  let end=0;let number=0;for(const span of t.intervals){const m=d.measures.find(m=>m.id===span.measureId);if(!m||m.number<number||span.end<=span.start||span.start<end-.001||span.end>t.duration+.001)throw Error('小节音轨区间无效');number=m.number;end=span.end}
 }
 return d;
}
export function validateMeasureResearch(raw:unknown,d:MeasureSyncData):MeasureResearch{
 const r=researchSchema.parse(raw);if(r.edition!==d.edition||r.scoreFingerprint!==d.scoreFingerprint)throw Error('研究札记谱本不匹配');const ids=new Set<string>();for(const n of r.notes){if(ids.has(n.id)||n.to<n.from)throw Error('研究札记范围或 ID 无效');ids.add(n.id)}return r;
}
export function measureAt(d:MeasureSyncData,trackId:string,fingerprint:string,time:number){const t=d.tracks.find(t=>t.id===trackId&&t.fingerprint===fingerprint);const interval=t?.intervals.find(i=>i.start<=time&&time<i.end);const measure=interval&&d.measures.find(m=>m.id===interval.measureId);return interval&&measure?{interval,measure}:null}
export function measureIntervals(d:MeasureSyncData,id:string){return d.tracks.flatMap(t=>t.intervals.filter(i=>i.measureId===id).map(i=>({trackId:t.id,fingerprint:t.fingerprint,...i})))}
export function measureDraft(d:MeasureSyncData,m:Measure,note:string,contextIds:string[]){return{version:1,kind:'measure_annotation_draft',edition:d.edition,scoreFingerprint:d.scoreFingerprint,measureId:m.id,measureNumber:m.number,page:m.page,system:m.system,scoreBox:m.box,status:'needs_review',timing:'estimated',note,contextIds,alignments:measureIntervals(d,m.id)}}
