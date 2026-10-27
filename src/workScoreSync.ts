import {z} from 'zod';
import type {Catalog} from './model';
import {validateSync,type ScoreSyncData} from './scoreSyncModel.ts';

export function validateWorkSync(raw:unknown,catalog:Catalog,scoreFingerprint:string):Record<number,ScoreSyncData>{
 const collection=z.object({version:z.literal(1),movements:z.array(z.unknown()).length(4)}).parse(raw);
 const library:Record<number,ScoreSyncData>={};
 for(const entry of collection.movements){
  const d=validateSync(entry,catalog,scoreFingerprint);
  if(d.movement===3||library[d.movement])throw Error('全曲同步乐章重复或覆盖已有第三乐章');
  const pages=new Set(d.regions.flatMap(r=>r.pages.map(p=>p.page)));
  const ranges:Record<number,[number,number]>={1:[3,56],2:[57,79],4:[128,133],5:[134,209]};
  const [first,last]=ranges[d.movement];
  if(pages.size!==last-first+1)throw Error('全曲同步存在缺页');
  if(d.tracks.length!==1)throw Error('新增乐章同步须绑定完整乐章文件');
  const t=d.tracks[0];let end=0;
  for(const span of t.intervals){if(Math.abs(span.start-end)>.00001)throw Error('完整乐章谱面同步存在时间空隙');end=span.end;}
  if(Math.abs(end-t.duration)>.00001)throw Error('完整乐章谱面同步未覆盖末尾');
  library[d.movement]=d;
 }
 return library;
}
