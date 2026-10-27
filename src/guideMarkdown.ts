import {guideBarLimits,type GuideData,type Guide} from './guideContent.ts';

const headings={'赏析':'appreciation','结构':'structure','和声':'harmony','配器':'orchestration','提示':'prompt'} as const;
type Section=keyof typeof headings;
export function validateGuideLinks(text:string,movement=3){
 if(/<[^>]*>/.test(text))throw Error('正文不支持 HTML，请使用纯文字和 Markdown 链接');
 for(const match of text.matchAll(/\[([^\]\n]+)\]\(([^)\n]+)\)/g)){
  const target=/^bar:(\d+)(?:-(\d+))?$/.exec(match[2]);
  const limit=guideBarLimits[movement];
  if(!target||!limit||+target[1]<1||+target[1]>limit||(target[2]&&(+target[2]<+target[1]||+target[2]>limit)))throw Error(`无效的小节链接：${match[2]}；本乐章导读范围为 bar:1 至 bar:${limit}`);
 }
 const rest=text.replace(/\[[^\]\n]+\]\([^)\n]+\)/g,'');
 if(/\]\(|\[[^\]\n]*$/.test(rest))throw Error('小节链接括号不完整');
}
export function parseGuideMarkdown(text:string):GuideData{
 text=text.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');
 const lines=text.split('\n');let i=0;
 function fail(message:string):never{throw Error(`第 ${i+1} 行：${message}`)}
 if(lines[i++]!=='---')fail('文档须以 --- 元信息开始');
 const meta:Record<string,string>={};
 while(i<lines.length&&lines[i]!=='---'){const m=/^(format|edition|movement):\s*(.+)$/.exec(lines[i]);if(!m||meta[m[1]])fail('元信息字段无效或重复');meta[m[1]]=m[2].trim();i++}
 if(lines[i++]!=='---'||meta.format!=='mahler-lexicon-guides/1'||! /^[1-5]$/.test(meta.movement)||!meta.edition)fail('需要 format: mahler-lexicon-guides/1、edition 和 movement: 1—5');
 const guides:Guide[]=[];let current:Guide|null=null,section:Section|null=null;let fields=new Set<string>();
 function finish(){if(!current)return;for(const key of Object.keys(headings))if(!fields.has(key))fail(`${current.id} 缺少 ### ${key}`);for(const key of ['appreciation','structure','prompt'] as const)if(!current[key].trim())fail(`${current.id} 的 ${key} 不能为空`);for(const key of ['appreciation','structure','harmony','orchestration','prompt'] as const){const value=current[key]?.trim()||'';validateGuideLinks(value,+meta.movement);if(key==='harmony'||key==='orchestration')current[key]=value==='（暂缺）'?null:value||null;else current[key]=value}if(!current.researchId||!current.from||!current.to)fail(`${current.id} 缺少小节或依据字段`);guides.push(current)}
 for(;i<lines.length;i++){
  const line=lines[i];
  if(/^# /.test(line)){if(current)fail('文档标题只能出现在条目之前');continue}
  if(line.startsWith('## ')){finish();const m=/^## ([a-zA-Z0-9_-]+) \| (.+)$/.exec(line);if(!m)fail('条目标题格式：## g01 | 标题');current={id:m[1],title:m[2].trim(),researchId:'',from:0,to:0,appreciation:'',structure:'',harmony:'',orchestration:'',prompt:'',status:'research_only'};fields=new Set();section=null;continue}
  if(!current){if(line.trim())fail('条目之外只能有文档标题和空行');continue}
  if(line.startsWith('### ')){const title=line.slice(4) as Section;if(!Object.hasOwn(headings,title)||fields.has(title))fail('章节名称无效或重复；请使用赏析、结构、和声、配器、提示');fields.add(title);section=title;continue}
  if(!section){if(!line.trim())continue;let m=/^小节:\s*(\d+)\s*-\s*(\d+)\s*$/.exec(line);if(m){if(current.from)fail('小节字段重复');current.from=+m[1];current.to=+m[2];continue}m=/^依据:\s*([a-zA-Z0-9_-]+)\s*$/.exec(line);if(m){if(current.researchId)fail('依据字段重复');current.researchId=m[1];continue}fail('标题下应填写 小节: 起点-终点 和 依据: 资料ID')}
  if(/^#{1,6}\s/.test(line))fail('正文不支持额外标题');
  const key=headings[section];current[key]=(current[key]||'')+line+'\n';
 }
 finish();if(!guides.length)throw Error('Markdown 没有导读条目');
 return{version:1,edition:meta.edition,movement:+meta.movement,guides};
}
export function serializeGuideMarkdown(data:GuideData){
 const output=['---','format: mahler-lexicon-guides/1',`edition: ${data.edition}`,`movement: ${data.movement}`,'---','',`# 第${data.movement}乐章 · 聆听导读`,''];
 for(const g of data.guides){output.push(`## ${g.id} | ${g.title}`,`小节: ${g.from}-${g.to}`,`依据: ${g.researchId}`,'');for(const [name,key]of Object.entries(headings) as [Section,typeof headings[Section]][])output.push(`### ${name}`,'',g[key]||'（暂缺）','')}
 return output.join('\n');
}
