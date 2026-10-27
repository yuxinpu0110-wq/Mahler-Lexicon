import {ScoreViewport} from './ScoreViewport';
import {measureAt,measureIntervals,type MeasureSyncData} from './measureSyncModel';

export function CurrentScore({data,trackId,fingerprint,time,selectedNumber,onSelect,onLocate,onReplay}:{data:MeasureSyncData;trackId:string;fingerprint:string;time:number;selectedNumber:number|null;onSelect:(number:number|null)=>void;onLocate:(trackId:string,start:number,end:number)=>void;onReplay:(start:number,end:number)=>void}){
 const current=measureAt(data,trackId,fingerprint,time);
 const m=selectedNumber?data.measures[selectedNumber-1]:current?.measure;
 if(!m)return <p className="muted">此处还没有可用的谱面定位；可以继续回听或保存位置。</p>;
 const interval=measureIntervals(data,m.id).find(i=>i.trackId===trackId&&i.fingerprint===fingerprint);
 const top=Math.max(0,m.box[1]*1232-28);
 const height=Math.min(1232-top,Math.max(160,m.box[3]*1232+56));
 const left=Math.max(0,Math.min(911-560,m.box[0]*911+m.box[2]*911/2-280));
 const url=`/assets/scores/third/page-${m.page}.webp`;
 return <figure className="current-score">
  <div className="listening-score-heading"><strong>{selectedNumber?'浏览小节':'附近谱面'}</strong><span>第 {m.number} 小节 · 原谱第 {m.page} 页 · {selectedNumber?'手动浏览':'估计位置'}</span></div>
  <div className="score-toolbar"><div className="current-score-controls"><button disabled={m.number<=1} onClick={()=>onSelect(m.number-1)} aria-label="上一小节">←</button><label>小节号 <input aria-label="小节号" type="number" min="1" max="581" value={m.number} onChange={e=>{const n=Number(e.target.value);if(n>=1&&n<=581)onSelect(n)}}/></label><button disabled={m.number>=581} onClick={()=>onSelect(m.number+1)} aria-label="下一小节">→</button>{selectedNumber&&<button onClick={()=>onSelect(null)}>跟随播放</button>}</div>
  {interval&&<div className="current-score-actions"><button aria-label="定位到此小节" title="定位到此小节" onClick={()=>onLocate(trackId,interval.start,interval.end)}>定位小节</button><button aria-label="回听附近" title="回听附近" onClick={()=>onReplay(Math.max(0,interval.start-2),Math.min(data.tracks.find(t=>t.id===trackId)!.duration,interval.end+2))}>回听小节</button></div>}
  </div>
  <ScoreViewport pages={[{url,page:m.page,view:[left,top,560,height],box:[m.box[0]*911,m.box[1]*1232,m.box[2]*911,m.box[3]*1232],label:`第三乐章第 ${m.number} 小节附近的原谱`}]} preload={[m.page<127?`/assets/scores/third/page-${m.page+1}.webp`:url]}/>

  <figcaption>点击小节可从附近回听；如果想听得更准，可以在播放条上微调位置。</figcaption>
 </figure>
}
