import {z} from 'zod';
const id=z.string().min(1);
const movement=z.number().int().min(1).max(5);
const review=z.object({status:z.enum(['draft','needs_review','reviewed']),reviewer:id,date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),method:id});
const position=z.object({measureId:id,display:id,offset:z.tuple([z.number().int().nonnegative(),z.number().int().positive()])});
const source=z.object({id,title:id,usage:id,author:z.string().optional(),url:z.string().url().refine(s=>/^https?:/.test(s)).optional(),locator:z.string().optional(),accessed:z.string().optional()});
const event=z.object({id,title:id,category:z.enum(['动机','和声','音响/结构']),movement,start:z.number().nonnegative().default(0),end:z.number().nonnegative().default(0),related:z.array(id).default([]),notes:z.array(z.number()).default([]),fact:z.string().default(''),analysis:z.string().default(''),interpretation:z.string().default(''),source:id,position:position.optional(),scoreRangeId:id.optional(),claimIds:z.array(id).default([]),review:review.optional()});
const track=z.object({id,recording:id,fingerprint:id,movement,duration:z.number().positive(),url:z.string().default(''),source:id.optional(),label:z.string().optional()});
export const schema=z.object({kind:z.enum(['demo','real']),edition:id,tracks:z.array(track),sources:z.array(source),events:z.array(event),cues:z.array(z.object({id,event:id,start:z.number().nonnegative(),end:z.number(),text:z.string().min(1).max(50),priority:z.number(),review:review.optional(),source:id.optional(),alignmentId:id.optional()})),
 scoreRanges:z.array(z.object({id,edition:id,movement,start:position.optional(),end:position.optional(),voices:id,granularity:z.enum(['measure','region']).default('measure'),locator:z.string().optional()})).default([]),
 claims:z.array(z.object({id,layer:z.enum(['score_fact','analysis','interpretation']),text:id,sourceIds:z.array(id).min(1),review})).default([]),
 relations:z.array(z.object({id,from:id,to:id,type:z.enum(['quotation','transformation','recurrence','proposed']),claimIds:z.array(id).min(1),review})).default([]),
 alignments:z.array(z.object({id,event:id,trackId:id,edition:id,fingerprint:id,start:z.number().nonnegative(),end:z.number(),method:z.literal('manual'),uncertaintySeconds:z.number().nonnegative().nullable(),boundaryKind:z.enum(['musical_range','audition_window']).default('musical_range'),notes:z.string().optional(),review})).default([]),
 excerpts:z.array(z.object({id,scoreRangeId:id,url:z.string().regex(/^\/assets\/[\w/.-]+\.(png|jpg|jpeg|webp)$/),alt:id,page:id,sourceId:id,simplified:z.boolean(),usage:id,review})).default([])
});
export type Catalog=z.infer<typeof schema>;export type Event=Catalog['events'][number];
export function validate(raw:unknown){
 const d=schema.parse(raw);const fail=(message:string):never=>{throw Error(message)};
 for(const group of [d.events,d.tracks,d.sources,d.cues,d.scoreRanges,d.claims,d.relations,d.alignments,d.excerpts])if(new Set(group.map(x=>x.id)).size!==group.length)fail('重复 ID');
 const hasSource=(s:string)=>d.sources.some(x=>x.id===s);
 for(const t of d.tracks){if(t.source&&!hasSource(t.source))fail('音轨来源不存在: '+t.id);if(d.kind==='real'&&(!/^sha256:[a-f0-9]{64}$/.test(t.fingerprint)||!t.source))fail('真实音轨需要文件指纹和来源: '+t.id)}
 for(const r of d.scoreRanges)if(r.edition!==d.edition||(r.granularity==='measure'&&(!r.start||!r.end))||(r.granularity==='region'&&!r.locator)||(r.start&&r.end&&r.start.measureId===r.end.measureId&&r.start.offset[0]/r.start.offset[1]>=r.end.offset[0]/r.end.offset[1]))fail('谱段版本不匹配: '+r.id);
 for(const c of d.claims){if(c.sourceIds.some(s=>!hasSource(s)))fail('主张来源不存在: '+c.id)}
 for(const e of d.events){
  if(!hasSource(e.source)||e.related.some(id=>!d.events.some(x=>x.id===id)))fail('事件引用无效: '+e.id);
  if(d.kind==='demo'){if(!e.position)fail('演示事件缺少谱位: '+e.id);const t=d.tracks.find(t=>t.movement===e.movement);if(!t||e.end<=e.start||e.end>t.duration)fail('事件区间无效: '+e.id);continue;}
  if(e.start!==0||e.end!==0||e.fact||e.analysis||e.interpretation)fail('真实事件请把时间放入 alignments，把解释放入 claims: '+e.id);
  const range=d.scoreRanges.find(r=>r.id===e.scoreRangeId);if(!range||range.movement!==e.movement||range.edition!==d.edition)fail('真实事件需要版本匹配的谱段: '+e.id);
  if(e.review?.status!=='reviewed'||!e.claimIds.length||e.claimIds.some(id=>!d.claims.some(c=>c.id===id&&c.review.status==='reviewed')))fail('真实事件及主张尚未完成审阅: '+e.id);
  if(!d.alignments.some(a=>a.event===e.id&&a.review.status==='reviewed'))fail('真实事件缺少已审阅映射: '+e.id);
  if(e.related.length)fail('真实关系请使用带主张的 relations: '+e.id);
 }
 for(const a of d.alignments){const e=d.events.find(e=>e.id===a.event);const t=d.tracks.find(t=>t.id===a.trackId);if(!e||!t||t.movement!==e.movement||a.edition!==d.edition||a.fingerprint!==t.fingerprint||a.end<=a.start||a.end>t.duration)fail('映射引用、指纹或区间无效: '+a.id)}
 for(const r of d.relations)if(!d.events.some(e=>e.id===r.from)||!d.events.some(e=>e.id===r.to)||r.claimIds.some(id=>!d.claims.some(c=>c.id===id&&c.review.status==='reviewed'))||r.review.status!=='reviewed')fail('关系端点或审阅无效: '+r.id);
 for(const x of d.excerpts)if(!d.scoreRanges.some(r=>r.id===x.scoreRangeId)||!hasSource(x.sourceId)||x.url.includes('..')||x.review.status!=='reviewed')fail('谱例引用或审阅无效: '+x.id);
 for(const c of d.cues){const e=d.events.find(e=>e.id===c.event);const a=d.alignments.find(a=>a.id===c.alignmentId);const t=d.kind==='demo'?d.tracks.find(t=>t.movement===e?.movement):d.tracks.find(t=>t.id===a?.trackId);if(!e||!t||c.end<=c.start||c.end>t.duration)fail('提示引用或区间无效: '+c.id);if(d.kind==='real'&&(!a||a.event!==e?.id||c.review?.status!=='reviewed'||!c.source||!hasSource(c.source)))fail('真实提示缺少审阅或映射: '+c.id)}
 if(d.kind==='real')for(const s of d.sources)if(!s.author||!s.url||!s.locator||!s.accessed)fail('真实来源缺少机构、链接或定位: '+s.id);
 return d;
}
export function candidates(events:Event[],time:number){return events.map(e=>({e,inside:e.start<=time&&time<e.end,d:time<e.start?e.start-time:time>=e.end?time-e.end:0})).filter(x=>x.d<=8).sort((a,b)=>Number(b.inside)-Number(a.inside)||a.d-b.d||a.e.id.localeCompare(b.e.id)).slice(0,5).map(x=>x.e)}
export function mapped(d:Catalog,movement:number,recording:string,track:string,fingerprint:string,edition:string){
 if(d.edition!==edition||!d.tracks.some(t=>t.movement===movement&&t.recording===recording&&t.id===track&&t.fingerprint===fingerprint))return [];
 if(d.kind==='demo')return d.events.filter(e=>e.movement===movement);
 return d.alignments.filter(a=>a.trackId===track&&a.edition===edition&&a.fingerprint===fingerprint&&a.review.status==='reviewed').map(a=>{const e=d.events.find(e=>e.id===a.event)!;return {...e,start:a.start,end:a.end,related:d.relations.filter(r=>r.from===e.id).map(r=>r.to)}});
}
export type Mode='自由检索'|'启发探索';
export type Context={trackId?:string;movement:number,time:number,mode:Mode,selected:string,range:[number,number],loop:boolean,tab:string,binding:string,bar?:number|null,scoreRegion?:string|null};
export type State={panel:boolean,playing:boolean,dragging:boolean,resume:boolean};
export function transition(s:State,a:string):State{switch(a){case 'play':return {...s,playing:true,panel:false};case 'audition':return {...s,playing:true};case 'preview-ended':return {...s,playing:false};case 'pause':return {...s,playing:false,panel:true};case 'drag':return {...s,dragging:true,resume:s.playing,playing:false};case 'drop':return {...s,dragging:false,playing:s.resume,panel:!s.resume};case 'ended':case 'error':return {...s,playing:false};default:return s}}
