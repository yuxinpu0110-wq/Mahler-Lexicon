import type {Catalog,Event} from './model';
import {Segmented} from './Segmented';

export const listeningLayers=['赏析','结构','和声','配器'] as const;
export type ListeningLayer=typeof listeningLayers[number];

function reviewedSource(data:Catalog,event:Event){
 const claim=data.claims.find(c=>event.claimIds.includes(c.id)&&c.layer==='score_fact');
 return claim?.sourceIds.map(id=>data.sources.find(s=>s.id===id)).filter(s=>s!==undefined)||[];
}

export function ListeningLayers({data,event,layer,onLayer}:{data:Catalog;event:Event;layer:ListeningLayer;onLayer:(layer:ListeningLayer)=>void}){
 const demo=data.kind==='demo';
 const excerpt=data.excerpts.find(x=>x.scoreRangeId===event.scoreRangeId);
 const range=data.scoreRanges.find(x=>x.id===event.scoreRangeId);
 const related=data.relations.filter(r=>r.from===event.id&&r.review.status==='reviewed');
 const first=event.id==='iii-opening-timpani-first';
 const second=event.id==='iii-opening-timpani-second';
 const opening=first||second;
 return <div className="listening-detail">
  <Segmented label="从哪个角度听" options={[...listeningLayers]} value={layer} onChange={value=>onLayer(value as ListeningLayer)}/>
  <div className="listening-layer" role="region" aria-label={`${layer}内容`}>
   {demo?<>
    <p className="demo-badge">交互演示 · 以下音符与文字均为虚构</p>
    {layer==='赏析'&&<><p>先听这一小段，再试着说出你注意到的变化。这里的音乐只用于体验操作，不代表马勒原作。</p><p>{event.interpretation}</p></>}
    {layer==='结构'&&<p>{event.analysis}</p>}
    {layer==='和声'&&<p>演示数据没有经过真实和声分析。</p>}
    {layer==='配器'&&<p>这里只有一条合成旋律，没有真实乐队配器。</p>}
   </>:<>
    {layer==='赏析'&&<><p>{first?'先听一声短促的鼓点，再留意它后面的停顿。':second?'再听一次鼓点与停顿：和刚才那一组相比，它给你的感觉有什么不同？':'先听这个片段，再留意它与前后音乐有什么变化。'}</p><p className="listening-question">{opening?'不必先找“正确答案”：停顿会让你期待接下来发生什么？':'你最先注意到的是旋律、音色，还是节奏？'}</p></>}
    {layer==='结构'&&<>{related.length?<><p>这里有两组可以并排回听的短音型。先记住这一组，再用下方“关联比较”听另一组，比较它们的力度和停留。</p><p className="muted">这是开头两组材料的局部比较；它们在全乐章中如何发展，尚待核验。</p></>:<p>此处的旋律来源和全曲结构作用尚待核验。</p>}</>}
    {layer==='和声'&&<p>此处暂无经过核验的和声与进行分析。可以先听低音和整体色彩如何变化。</p>}
    {layer==='配器'&&<><p>{opening?'这两组短音型都可在第一定音鼓声部找到。试着只听鼓点的力度，再听乐队随后怎样接上。':'此处暂无经过核验的配器说明。'}</p>{opening&&<p className="muted">谱面标记：{first?'第一组 ff、kurz（短促）':'第二组 f'}；两组之后都有带延长记号的休止。</p>}</>}
   </>}
  </div>
  <figure className="listening-score">
   <div className="listening-score-heading"><strong>对照谱面</strong><span>{demo?'虚构单声部谱例':range?.locator||'已核验谱段'}</span></div>
   {demo?<svg role="img" aria-label="虚构单声部谱例，仅用于交互演示" viewBox="0 0 600 120">{[30,40,50,60,70].map(y=><line key={y} x1="20" y1={y} x2="580" y2={y} stroke="currentColor"/>)}{event.notes.map((n,i)=><g key={i}><ellipse cx={55+i*60} cy={65-(n-60)*2} rx="7" ry="5" fill="currentColor"/><line x1={62+i*60} x2={62+i*60} y1={65-(n-60)*2} y2={30-(n-60)*2} stroke="currentColor"/></g>)}</svg>:excerpt?<img className="score-image" src={excerpt.url} alt={excerpt.alt}/>:<p>此条目暂无可显示的谱例。</p>}
   <figcaption>{demo?'示例谱本 v1 · 虚构音符与位置':excerpt?`原谱第 ${excerpt.page} 页 · 试听窗口含前后余量，不是逐音跟随`:'仍可回听已核验片段'}</figcaption>
  </figure>
  {!demo&&<details className="listening-sources"><summary>查看谱面依据与审阅记录</summary>{event.claimIds.map(id=>{const claim=data.claims.find(c=>c.id===id);return claim&&<p key={id}>{claim.text}<br/><span className="muted">{claim.review.reviewer} · {claim.review.date}</span></p>})}{reviewedSource(data,event).map(s=><p key={s.id}><a href={s.url} target="_blank" rel="noreferrer">{s.author} · {s.title}</a> · {s.locator}</p>)}</details>}
 </div>
}
