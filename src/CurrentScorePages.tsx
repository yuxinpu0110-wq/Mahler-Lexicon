import {useState} from 'react';
import {ScoreViewport,type ScorePage} from './ScoreViewport';
import {createWorkBoxLookup} from './workMeasureBoxes';
import rawBoxes from '../content/real/work-measure-boxes.json';
import {syncAt,regionIntervals,type ScoreSyncData} from './scoreSyncModel';
import {workMeasureAt,workBarRange,type WorkMeasureData} from './workMeasureSync';
const workMeasureBox=createWorkBoxLookup(rawBoxes);

/** Spatial candidates follow the registered scan; audio timings remain estimates. */
export function CurrentScorePages({data,measures,trackId,fingerprint,time,selectedRegion,selectedNumber,onBarSelect,onSelect,onLocate,onReplay}:{data:ScoreSyncData;measures:WorkMeasureData;trackId:string;fingerprint:string;time:number;selectedRegion:string|null;selectedNumber:number|null;onBarSelect:(number:number|null)=>void;onSelect:(id:string|null)=>void;onLocate:(id:string,start:number,end:number)=>void;onReplay:(start:number,end:number)=>void}){
 const manual=selectedRegion,Manual=onSelect;
 const [zoom,Zoom]=useState(false);
 const active=syncAt(data,trackId,fingerprint,time);
 const matched=data.tracks.some(t=>t.id===trackId&&t.fingerprint===fingerprint);
 const current=workMeasureAt(measures,trackId,fingerprint,time);
 const selectedBar=selectedNumber?measures.measures[selectedNumber-1]:undefined;
 const region=manual?data.regions.find(r=>r.id===manual):selectedBar?data.regions.find(r=>r.id===selectedBar.regionId):active?.region;
 const number=selectedBar?.number||current?.measure.number||1;
 const barRange=workBarRange(measures,trackId,fingerprint,number);
 const spatial=matched&&!manual?workMeasureBox(measures,number):undefined;
 const sourcePages=region?(spatial&&!region.pages.some(p=>p.page===spatial.page)?[{page:spatial.page,url:`/assets/scores/work/page-${spatial.page}.webp`,box:[0,0,1,1]}]:region.pages):[];
 const scene:ScorePage[]=sourcePages.map(p=>{
  let [x,y,w,h]=p.box;
  const highlight=spatial?.page===p.page?spatial.box:undefined;
  if(highlight){const [bx,by,bw,bh]=highlight;const right=Math.max(x+w,bx+bw+.012),bottom=Math.max(y+h,by+bh+.012);x=Math.max(0,Math.min(x,bx-.012));y=Math.max(0,Math.min(y,by-.012));w=Math.min(1,right)-x;h=Math.min(1,bottom)-y}
  return {url:p.url,page:p.page,view:[x*911,y*1232,w*911,h*1232],box:highlight?[highlight[0]*911,highlight[1]*1232,highlight[2]*911,highlight[3]*1232]:undefined,label:`第 ${data.movement} 乐章 PDF 第 ${p.page} 页原谱`};
 });
 const index=data.regions.findIndex(r=>r.id===region?.id);
 const local=region&&regionIntervals(data,region.id).find(i=>i.trackId===trackId&&i.fingerprint===fingerprint);
 function locate(id:string){const interval=regionIntervals(data,id).find(i=>i.trackId===trackId&&i.fingerprint===fingerprint);if(!interval)return;Manual(id);onLocate(trackId,interval.start,interval.end)}
 return <figure className="current-score score-page-follow" aria-label={`第 ${data.movement} 乐章同步谱面`} data-region={region?.id||''}>
  <div className="listening-score-heading"><strong>{manual||selectedBar?'浏览谱面':'附近谱面'}</strong><span>{region?`${matched&&!manual?`第 ${number} 小节 · `:''}PDF 第 ${sourcePages.map(p=>p.page).join('、')} 页 · ${manual||selectedBar?'手动选择':'估计位置 · 随播放跟随'}`:'谱面随音乐出现'}</span></div>
  {!matched?<p role="status">当前音频没有匹配的谱面映射；请使用已配置录音。</p>:<>
   <div className="score-toolbar"><div className="current-score-controls bar-navigation"><button aria-label="上一小节" disabled={number<=1} onClick={()=>onBarSelect(number-1)}>←</button><label>小节号 <input aria-label="小节号" type="number" min="1" max={measures.barCount} value={number} onChange={e=>{const n=Number(e.target.value);if(Number.isInteger(n)&&n>=1&&n<=measures.barCount)onBarSelect(n)}}/></label><button aria-label="下一小节" disabled={number>=measures.barCount} onClick={()=>onBarSelect(number+1)}>→</button>{selectedNumber!==null&&<button onClick={()=>onBarSelect(null)}>跟随播放</button>}</div>
   {selectedNumber!==null&&!selectedBar&&<p className="guide-reading-status">稿件第 {selectedNumber} 小节尚未对应到此谱本；谱面保持当前播放位置。</p>}
   <div className="current-score-controls"><button aria-label="上一谱段" disabled={index<=0} onClick={()=>locate(data.regions[index-1].id)}>←</button><label>谱段 <select aria-label="选择附近谱段" value={region?.id||''} onChange={e=>locate(e.target.value)}>{!region&&<option value="">此处暂无同步</option>}{data.regions.map((r,i)=><option value={r.id} key={r.id}>{i+1} · PDF 第 {r.pages.map(p=>p.page).join('、')} 页</option>)}</select></label><button aria-label="下一谱段" disabled={index<0||index>=data.regions.length-1} onClick={()=>locate(data.regions[index+1].id)}>→</button>{manual&&selectedNumber===null&&<button onClick={()=>Manual(null)}>跟随播放</button>}<button aria-pressed={zoom} onClick={()=>Zoom(!zoom)}>{zoom?'收起放大':'放大谱面'}</button></div>
   {matched&&barRange&&!manual&&<div className="current-score-actions"><button aria-label="定位到此小节" title="定位到此小节" onClick={()=>onLocate(trackId,barRange.start,barRange.end)}>定位小节</button><button aria-label="回听附近" title="回听附近" onClick={()=>onReplay(Math.max(0,barRange.start-2),Math.min(measures.tracks[0].duration,barRange.end+2))}>回听小节</button></div>}
   {local&&<div className="current-score-actions"><button aria-label="定位到此谱段" title="定位到此谱段" onClick={()=>onLocate(trackId,local.start,local.end)}>定位谱段</button><button aria-label="回听此谱段" title="回听此谱段" onClick={()=>onReplay(local.start,local.end)}>回听谱段</button></div>}
   </div>
   {region?<div className="score-follow-pages" data-zoom={zoom}><ScoreViewport pages={scene} preload={(data.regions[index+1]?.pages||[]).map(p=>p.url)}/></div>:<p role="status">此处暂无同步谱面，可继续聆听。</p>}

  </>}
   
  <figcaption>小节时间与框选位置为估计，尚待逐小节校核；可在播放条上微调回听位置。</figcaption>
  <details><summary>同步来源与精度</summary><p>根据参考跟谱视频的局部小节编号，在对应谱段内估算时间，再离线对齐至本项目录音。变速、停顿与提前翻页会造成偏移，尚未逐小节审听。框选来自扫描谱的小节线候选与局部编号约束，尚未逐小节人工校核；第二、四章开头的弱起包含在第一个编号框内。</p>{data.sources.map((s,i)=><p key={i}><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a> · {s.usage}</p>)}</details>
 </figure>
}
