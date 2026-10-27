import {z} from 'zod';
import type {Catalog} from './model';
const hash=z.string().regex(/^sha256:[a-f0-9]{64}$/);
export const scorePageRanges:Record<number,readonly[number,number]>={1:[3,56],2:[57,79],3:[80,127],4:[128,133],5:[134,209]};
const page=z.object({page:z.number().int().min(3).max(209),url:z.string().regex(/^\/assets\/scores\/(third|work)\/page-\d+\.webp$/),box:z.tuple([z.number(),z.number(),z.number().positive(),z.number().positive()])});
export const syncSchema=z.object({version:z.literal(1),movement:z.number().int().min(1).max(5),edition:z.string().min(1),scoreFingerprint:hash,granularity:z.literal('page_system'),status:z.literal('needs_review'),method:z.string(),sources:z.array(z.object({title:z.string(),url:z.string().url(),usage:z.string()})),regions:z.array(z.object({id:z.string().min(1),pages:z.array(page).min(1).max(2),sourceStart:z.number().nonnegative(),sourceEnd:z.number().positive()})).min(1),tracks:z.array(z.object({id:z.string(),fingerprint:hash,duration:z.number().positive(),intervals:z.array(z.object({regionId:z.string(),start:z.number().nonnegative(),end:z.number().positive(),status:z.literal('needs_review')})).min(1)})).min(1)});
export type ScoreSyncData=z.infer<typeof syncSchema>;
export type SyncRegion=ScoreSyncData['regions'][number];
export type SyncTrack=ScoreSyncData['tracks'][number];
export function validateSync(raw:unknown,catalog:Catalog,scoreFingerprint?:string):ScoreSyncData{
 const d=syncSchema.parse(raw);if(scoreFingerprint&&d.scoreFingerprint!==scoreFingerprint)throw Error('同步谱本指纹不匹配');if(d.edition!==catalog.edition)throw Error('同步谱本不匹配');
 const [first,last]=scorePageRanges[d.movement];const folder=d.movement===3?'third':'work';let sourceEnd=0;
 const ids=new Set<string>();for(const r of d.regions){if(ids.has(r.id)||r.sourceEnd<=r.sourceStart||r.sourceStart<sourceEnd-.001)throw Error('同步谱段重复或范围无效');sourceEnd=r.sourceEnd;ids.add(r.id);for(const p of r.pages){const[x,y,w,h]=p.box;if(p.page<first||p.page>last||x<0||y<0||x+w>1.001||y+h>1.001||p.url!==`/assets/scores/${folder}/page-${p.page}.webp`)throw Error('同步谱页或裁切范围无效')}}
 const trackIds=new Set<string>();for(const t of d.tracks){if(trackIds.has(t.id))throw Error('同步音轨重复');trackIds.add(t.id);const original=catalog.tracks.find(x=>x.id===t.id);if(!original||original.movement!==d.movement||original.fingerprint!==t.fingerprint||Math.abs(original.duration-t.duration)>.01)throw Error('同步音轨指纹或时长不匹配');let end=0;for(const i of t.intervals){if(!ids.has(i.regionId)||i.end<=i.start||i.start<end-.001||i.end>t.duration+.001)throw Error('同步区间引用、重叠或边界无效');end=i.end}}
 return d;
}
export function syncAt(d:ScoreSyncData,trackId:string,fingerprint:string,time:number){const t=d.tracks.find(t=>t.id===trackId&&t.fingerprint===fingerprint);const interval=t?.intervals.find(i=>i.start<=time&&time<i.end);return interval?{interval,region:d.regions.find(r=>r.id===interval.regionId)!}:null}
export function regionIntervals(d:ScoreSyncData,regionId:string){return d.tracks.flatMap(t=>t.intervals.filter(i=>i.regionId===regionId).map(i=>({trackId:t.id,fingerprint:t.fingerprint,...i})))}
export function annotationDraft(d:ScoreSyncData,regionId:string,note:string){if(!d.regions.some(r=>r.id===regionId))throw Error('谱段不存在');return{version:1,kind:'score_annotation_draft',edition:d.edition,scoreFingerprint:d.scoreFingerprint,regionId,note,status:'needs_review',granularity:d.granularity,alignments:regionIntervals(d,regionId)}}
