import {authorGuideRevisions} from './authorFiles';
import type {GuideData} from './guideContent';
import {guideAt,movementLabels} from './guideContent';
import type {MeasureResearch} from './measureSyncModel';
import {Segmented} from './Segmented';
import {listeningLayers,type ListeningLayer} from './ListeningLayers';
import {GuideText} from './GuideText';

export function GuidePanel({data,research,bar,layer,canSeek,isRangeMapped,showPrompt,promptOnly=false,onExplore,onLayer,onBrowse,onReference}:{data:GuideData;research:MeasureResearch;bar:number|null;layer:ListeningLayer;canSeek:boolean;isRangeMapped?:(from:number,to:number)=>boolean;showPrompt:boolean;promptOnly?:boolean;onExplore?:()=>void;onLayer:(value:ListeningLayer)=>void;onBrowse:(number:number)=>void;onReference:(from:number,to?:number)=>void}){
 if(!bar)return <p className="muted">此处暂无可对应的导读；可继续聆听或用小节号浏览。</p>;
 const guide=guideAt(data,research,bar);
 if(!guide)return <p className="muted">第 {bar} 小节暂无导读；谱面仍可浏览和回听。</p>;
 const source=data.movement===3?research.notes.find(n=>n.id===guide.researchId):undefined;
 const index=data.guides.findIndex(g=>g.id===guide.id);
 const label=movementLabels[data.movement-1]+'乐章';
 const body=layer==='赏析'?guide.appreciation:layer==='结构'?guide.structure:layer==='和声'?guide.harmony:guide.orchestration;
 const canSeekRange=canSeek&&(isRangeMapped?.(guide.from,guide.to)??true);
 return <section className="guide-panel" aria-label={label+'导读'} data-prompt-only={promptOnly}>
  <div className="guide-heading"><div><p className="eyebrow">在这一段，听什么</p><h3>{guide.title}</h3></div>{canSeekRange?<button className="bar-link guide-range" onClick={()=>onReference(guide.from,guide.to)}>第 {guide.from}—{guide.to} 小节 ↗</button>:<span>第 {guide.from}—{guide.to} 小节</span>}</div>
  {canSeek&&!canSeekRange&&<p className="guide-reading-status">本段稿件编号尚未对应到当前谱本，可阅读正文；此范围暂不提供音频跳转。</p>}
  {!canSeek&&<p className="guide-reading-status">可按段落和小节引用浏览解读；当前尚不能按小节跳转，浏览不会移动播放位置。</p>}
  {promptOnly&&<div className="guide-listening-state"><p>先听音乐，留一个问题在心里。</p><button className="liquid-glass-pill" onClick={onExplore}>暂停并展开深度解析</button></div>}
  <div className="guide-depth" hidden={promptOnly}>
  <Segmented label="导读角度" options={[...listeningLayers]} value={layer} onChange={v=>onLayer(v as ListeningLayer)}/>
  <GuideText text={body||`这一段暂无${layer}解读。`} onReference={onReference}/>
  <div className="guide-navigation"><button disabled={index<=0} onClick={()=>onBrowse(data.guides[index-1].from)}>上一段</button><span>{index+1} / {data.guides.length}</span><button disabled={index>=data.guides.length-1} onClick={()=>onBrowse(data.guides[index+1].from)}>下一段</button></div>
  {showPrompt&&!canSeek&&<details className="guide-reading-prompt"><summary>这一段的聆听提示</summary><p>{guide.prompt}</p></details>}
  <details className="guide-index"><summary>浏览{label}的 {data.guides.length} 段导读{canSeek?' · 点击后定位并暂停':''}</summary><div>{data.guides.map(g=><button key={g.id} aria-current={g.id===guide.id?'true':undefined} onClick={()=>onBrowse(g.from)}><span>{g.from}—{g.to}</span>{g.title}</button>)}</div></details>
  <details className="guide-source"><summary>解读依据</summary><p>项目内容作者提供 · 乐章导读 {authorGuideRevisions[data.movement]}。依据标识：{guide.researchId}。</p>{source?<><p>相关背景研究如下；作者本次扩写不自动视为这些资料逐句作出的结论。</p><p><a href={source.sourceUrl} target="_blank" rel="noreferrer">{source.sourceTitle}</a> · {source.sourceLocation}</p>{source.supportingSources?.map(s=><p key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a> · {s.location}</p>)}</>:<p>本段随作者稿件接入，尚未附外部文献条目。小节范围按稿件保留，录音定位另行配置。</p>}</details>
  </div>
 </section>
}
