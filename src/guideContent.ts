import {z} from 'zod';
import type {MeasureResearch,MeasureSyncData} from './measureSyncModel';
import {validateGuideLinks} from './guideMarkdown.ts';

const guide=z.object({id:z.string().min(1),researchId:z.string().min(1),from:z.number().int().min(1),to:z.number().int().min(1),title:z.string().min(1),prompt:z.string().min(1).max(90),appreciation:z.string().min(1),structure:z.string().min(1),harmony:z.string().nullable(),orchestration:z.string().nullable(),status:z.literal('research_only')});
const schema=z.object({version:z.literal(1),edition:z.string().min(1),movement:z.number().int().min(1).max(5).default(3),guides:z.array(guide).min(1)});
export type GuideData=z.infer<typeof schema>;
export type Guide=GuideData['guides'][number];
// Manuscript limits are independent of the scan's navigation limits. Keep
// unmatched author ranges readable instead of clamping them to a score bar.
export const guideBarLimits:Record<number,number>={1:454,2:299,3:581,4:67,5:762};
export const movementLabels=['第一','第二','第三','第四','第五'];
export function validateGuideDocument(raw:unknown):GuideData{
 const result=schema.parse(raw);
 const ids=new Set<string>();
 for(const item of result.guides){
  if(ids.has(item.id)||item.from>item.to||item.to>guideBarLimits[result.movement])throw Error(`导读 ${item.id}：编号或范围无效`);
  ids.add(item.id);
  if(/[\n\r\[\]*]/.test(item.prompt))throw Error(`导读 ${item.id}：提示必须是一行纯文字`);
  for(const text of [item.appreciation,item.structure,item.harmony,item.orchestration])if(text){try{validateGuideLinks(text,result.movement)}catch(e){throw Error(`导读 ${item.id}：${e instanceof Error?e.message:String(e)}`)}}
 }
 return result;
}
export function validateGuides(raw:unknown,measures:MeasureSyncData,research:MeasureResearch,reference?:GuideData):GuideData{
 const result=validateGuideDocument(raw);
 if(result.edition!==measures.edition)throw Error('导读谱本版本不匹配');
 if(reference&&result.movement!==reference.movement)throw Error(`文件属于第 ${result.movement} 乐章，请先切换到该乐章再导入`);
 for(const item of result.guides){
  const sources=result.movement===3?research.notes.filter(n=>n.id===item.researchId):reference?.guides.filter(n=>n.researchId===item.researchId)||[];
  if(!sources.length||item.from<Math.min(...sources.map(n=>n.from))||item.to>Math.max(...sources.map(n=>n.to))||(result.movement===3&&(!measures.measures[item.from-1]||!measures.measures[item.to-1])))throw Error(`导读 ${item.id}：范围或资料引用无效`);
 }
 return result;
}
export function guideAt(data:GuideData,_research:MeasureResearch,number:number){
 return data.guides.filter(g=>g.from<=number&&number<=g.to).sort((a,b)=>(a.to-a.from)-(b.to-b.from))[0];
}
