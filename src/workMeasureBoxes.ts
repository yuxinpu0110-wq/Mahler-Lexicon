import {z} from 'zod';
import type {WorkMeasureData} from './workMeasureSync';

const entry=z.object({movement:z.union([z.literal(1),z.literal(2),z.literal(4),z.literal(5)]),measureId:z.string(),number:z.number().int().positive(),page:z.number().int().positive(),system:z.number().int().nonnegative(),box:z.tuple([z.number(),z.number(),z.number(),z.number()]),status:z.literal('needs_review'),basis:z.literal('raster_barline_candidates_with_local_numbered_view'),includesPickup:z.boolean()});
const schema=z.object({version:z.literal(1),edition:z.literal('mahler2-imslp415748-ue-scan'),scoreFingerprint:z.literal('sha256:e56f9fb7f1e6507483b8cee8d806e722d95d9be8a8c265adf509dcd0e7d5d3f6'),status:z.literal('needs_review'),method:z.string(),entries:z.array(entry)});
export type WorkMeasureBox=z.infer<typeof entry>;
export function validateWorkBoxes(input:unknown){
 const data=schema.parse(input),seen=new Set<string>();
 const bounds:Record<number,[number,number,number]>={1:[3,56,445],2:[57,79,299],4:[128,133,68],5:[134,209,764]};
 for(const e of data.entries){
  const [first,last,count]=bounds[e.movement], [x,y,w,h]=e.box;
  if(seen.has(e.measureId)||e.measureId!==`ue-${e.movement}-m${String(e.number).padStart(3,'0')}`||e.number>count||e.page<first||e.page>last||x<0||y<0||w<=0||h<=0||x+w>1.000001||y+h>1.000001)throw Error('小节框编号、谱页或坐标无效');
  seen.add(e.measureId);
 }
 for(const [movement,[,,count]] of Object.entries(bounds))if(data.entries.filter(e=>e.movement===Number(movement)).length!==count)throw Error('小节框覆盖不完整');
 return data;
}
export function createWorkBoxLookup(raw:unknown){
 const data=validateWorkBoxes(raw),byId=new Map(data.entries.map(e=>[e.measureId,e]));
 return (measures:WorkMeasureData,number:number)=>{
  if(measures.edition!==data.edition||measures.scoreFingerprint!==data.scoreFingerprint)return undefined;
  return byId.get(measures.measures[number-1]?.id);
 };
}
