import {useEffect,useRef,useState} from 'react';
import {parseGuideMarkdown,serializeGuideMarkdown} from './guideMarkdown';
import {validateGuides,type GuideData} from './guideContent';
import type {MeasureResearch,MeasureSyncData} from './measureSyncModel';
import {authorGuideRevisions} from './authorFiles';

export function ContentImport({data,reference,measures,research,onApply,onReset}:{data:GuideData;reference:GuideData;measures:MeasureSyncData;research:MeasureResearch;onApply:(data:GuideData)=>void;onReset:()=>void}){
 const revision=authorGuideRevisions[reference.movement];
 const storageKey=revision==='v1.0'?`mahler-development-guides-markdown-v2:${reference.movement}`:`mahler-development-guides-markdown-v3:${reference.movement}:${revision}`;
 const input=useRef<HTMLInputElement>(null);const[message,Message]=useState(''),[error,ErrorMessage]=useState(''),[busy,Busy]=useState(false);const token=useRef(0);
 function parse(text:string){return validateGuides(parseGuideMarkdown(text),measures,research,reference)}
 useEffect(()=>{try{const saved=localStorage.getItem(storageKey);if(saved){onApply(parse(saved));Message('已恢复本浏览器上次导入的导读。')}}catch(e){ErrorMessage(`保存的导读未载入：${String(e)}`)}},[]);
 async function load(file:File){const current=++token.current;Busy(true);ErrorMessage('');try{if(file.size>1024*1024)throw Error('文件超过 1 MB');const text=await file.text();const next=parse(text);if(current!==token.current)return;localStorage.setItem(storageKey,text);onApply(next);Message(`已更新 ${next.guides.length} 段导读及提示。刷新后仍会保留在本浏览器。`)}catch(e){if(current===token.current)ErrorMessage(`导入失败，原内容保持可用：${e instanceof Error?e.message:String(e)}`)}finally{if(current===token.current)Busy(false)}}
 function download(){const url=URL.createObjectURL(new Blob([serializeGuideMarkdown(data)],{type:'text/markdown;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`movement-${data.movement}-guides.md`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 return <section className="content-import" aria-label="开发版内容导入"><h3>导读 Markdown</h3><p>下载后修改五个栏目，再导入即可更新当前页面。内容保存在本浏览器；若要随项目交付，请替换仓库中的 Markdown 文件。</p><div className="content-import-actions"><button onClick={download}>下载当前导读 Markdown</button><button disabled={busy} onClick={()=>input.current?.click()}>{busy?'正在检查…':'导入解读 Markdown'}</button><button onClick={()=>{token.current++;Busy(false);localStorage.removeItem(storageKey);onReset();ErrorMessage('');Message('已恢复项目内置导读。')}}>恢复项目内置导读</button></div><input ref={input} hidden type="file" accept=".md,.markdown,text/markdown,text/plain" aria-label="选择导读 Markdown" onChange={e=>{const file=e.target.files?.[0];if(file)void load(file);e.target.value=''}}/>{message&&<p role="status">{message}</p>}{error&&<p role="alert">{error}</p>}</section>
}
