import {z} from 'zod';
import {validate,type Catalog} from './model.ts';
import type {ScoreSyncData} from './scoreSyncModel';
import type {MeasureSyncData} from './measureSyncModel';

const fingerprint=z.string().regex(/^sha256:[a-f0-9]{64}$/);
const schema=z.object({version:z.literal(1),recording:z.string(),tracks:z.array(z.object({id:z.string(),recording:z.string(),movement:z.number().int().min(1).max(5),fingerprint,duration:z.number().positive(),url:z.string().regex(/^\/audio\/movement-[1-5]-continuous\.flac$/),parts:z.array(z.object({trackId:z.string(),fingerprint,start:z.number().nonnegative(),end:z.number().positive()})).min(1)})).length(5)});
export type ContinuousRecording=z.infer<typeof schema>;
export function validateContinuous(raw:unknown,catalog:Catalog){
 const d=schema.parse(raw);const ids=new Set<string>(),movements=new Set<number>(),parts=new Set<string>();
 for(const t of d.tracks){
  if(ids.has(t.id)||movements.has(t.movement)||t.recording!==d.recording||t.id!==`movement-${t.movement}-continuous`||t.url!==`/audio/movement-${t.movement}-continuous.flac`)throw Error('连续录音编号、文件或乐章无效');ids.add(t.id);movements.add(t.movement);
  let end=0;const originals=catalog.tracks.filter(x=>x.movement===t.movement);
  for(const [index,p]of t.parts.entries()){const original=catalog.tracks.find(x=>x.id===p.trackId);if(parts.has(p.trackId)||!original||originals[index]?.id!==p.trackId||original.movement!==t.movement||original.recording!==t.recording||original.fingerprint!==p.fingerprint||Math.abs(p.start-end)>.001||Math.abs(p.end-p.start-original.duration)>.01)throw Error('连续录音来源、顺序、指纹或偏移无效');parts.add(p.trackId);end=p.end}
  if(Math.abs(end-t.duration)>.15)throw Error('连续录音时长不匹配');
 }
 if(parts.size!==catalog.tracks.length)throw Error('连续录音缺少来源文件');
 return d;
}
export function continuousCatalog(original:Catalog,d:ContinuousRecording):Catalog{
 const locate=(id:string)=>{const track=d.tracks.find(t=>t.parts.some(p=>p.trackId===id));const part=track?.parts.find(p=>p.trackId===id);if(!track||!part)throw Error('缺少连续文件映射');return{track,part}};
 return validate({...original,tracks:d.tracks.map(({parts,...t})=>({...t,source:'user-recording',label:`第 ${t.movement} 乐章 · 完整录音`})),alignments:original.alignments.map(a=>{const{track,part}=locate(a.trackId);return{...a,trackId:track.id,fingerprint:track.fingerprint,start:a.start+part.start,end:a.end+part.start,notes:`${a.notes||''} 连续播放文件的无损拼接映射；原文件 ${a.trackId}，偏移 ${part.start} 秒。`}}),cues:original.cues.map(c=>{const a=original.alignments.find(a=>a.id===c.alignmentId);if(!a)return c;const{part}=locate(a.trackId);return{...c,start:c.start+part.start,end:c.end+part.start}})});
}
function projectTracks<T extends {id:string;fingerprint:string;intervals:{start:number;end:number}[]}>(tracks:T[],d:ContinuousRecording,movement:number){
 const target=d.tracks.find(t=>t.movement===movement)!;
 const intervals=target.parts.flatMap(p=>{const source=tracks.find(t=>t.id===p.trackId&&t.fingerprint===p.fingerprint);if(!source)throw Error('谱面映射的来源文件不匹配');return source.intervals.map(i=>({...i,start:i.start+p.start,end:i.end+p.start}))});
 return [{id:target.id,fingerprint:target.fingerprint,duration:target.duration,intervals}];
}
export function continuousSync(data:ScoreSyncData,d:ContinuousRecording):ScoreSyncData{return{...data,tracks:projectTracks(data.tracks,d,3) as ScoreSyncData['tracks']}}
export function continuousMeasures(data:MeasureSyncData,d:ContinuousRecording):MeasureSyncData{return{...data,tracks:projectTracks(data.tracks,d,3) as MeasureSyncData['tracks']}}
