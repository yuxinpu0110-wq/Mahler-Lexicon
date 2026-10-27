import {useState} from 'react';
import {annotationDraft,regionIntervals,syncAt,type ScoreSyncData} from './scoreSyncModel';
import {measureAt,measureDraft,measureIntervals,type MeasureSyncData,type MeasureResearch} from './measureSyncModel';

function label(r:ScoreSyncData['regions'][number]){return `谱页 ${r.pages.map(p=>p.page).join('–')}${r.pages.length===1&&r.pages[0].box[3]<.7?' · 局部系统':''}`}
function downloadJson(name:string,value:unknown){const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}

export function ScoreSync({data,measures,research,trackId,fingerprint,time,onLocate,onReplay}:{data:ScoreSyncData;measures:MeasureSyncData;research:MeasureResearch;trackId:string;fingerprint:string;time:number;onLocate:(track:string,start:number,end:number)=>void;onReplay:(start:number,end:number)=>void}){
 const [following,Follow]=useState(true),[manual,Manual]=useState(''),[barPick,BarPick]=useState<number|null>(null),[open,Open]=useState(true),[notes,Notes]=useState<Record<string,string>>({}),[barNotes,BarNotes]=useState<Record<string,string>>({}),[zoom,Zoom]=useState(false),[failed,Failed]=useState<string[]>([]);
 const active=syncAt(data,trackId,fingerprint,time);
 const selected=data.regions.find(r=>r.id===manual);
 const region=following?active?.region:selected||active?.region;
 const index=data.regions.findIndex(r=>r.id===region?.id);
 const matched=data.tracks.some(t=>t.id===trackId&&t.fingerprint===fingerprint);
 const estimated=measureAt(measures,trackId,fingerprint,time);
 const bar=following?estimated?.measure:barPick?measures.measures[barPick-1]:measures.measures.find(m=>m.regionId===region?.id);
 const barIntervals=bar?measureIntervals(measures,bar.id):[];
 const barLocal=barIntervals.find(i=>i.trackId===trackId&&i.fingerprint===fingerprint);
 const researchNotes=bar?research.notes.filter(n=>n.from<=bar.number&&bar.number<=n.to):[];
 const intervals=region?regionIntervals(data,region.id):[];
 const local=intervals.find(i=>i.trackId===trackId&&i.fingerprint===fingerprint);
 const note=region?notes[region.id]||'':'';
 const barNote=bar?barNotes[bar.id]||'':'';
 function browse(id:string){Manual(id);BarPick(null);Follow(false)}
 function browseBar(number:number){const target=measures.measures[number-1];if(!target)return;Manual(target.regionId);BarPick(number);Follow(false)}
 function downloadBar(){if(!bar)return;downloadJson(`mahler-${bar.id}-research.json`,{...measureDraft(measures,bar,barNote,researchNotes.map(n=>n.id)),researchContext:researchNotes})}

 return <section className="score-sync" aria-label="曲谱同步">
  <div className="sync-heading"><div><p className="eyebrow">SCORE REVIEW / 内容校对</p><h2>第三乐章谱面定位</h2></div><button aria-expanded={open} onClick={()=>Open(!open)}>{open?'收起谱面':'展开谱面'}</button></div>
  <p className="sync-status">{following?'跟随播放':'手动浏览'} · 小节候选／页系统同步 · 时间待校对</p>
  {open&&<>
   <p className="muted">本谱本第三乐章已建立 581 个小节位置。小节秒数由跟谱视频翻页及录音对齐估算；停顿和变速处可能偏离数小节，目前没有逐音位置。</p>
   {!matched?<p role="status">当前文件没有匹配的谱曲映射；不会套用其他录音的时间。</p>:<>
    <div className="sync-toolbar">
     <button aria-pressed={following} onClick={()=>{Follow(true);BarPick(null)}}>恢复跟随</button>
     <button disabled={index<=0} onClick={()=>browse(data.regions[index-1].id)}>上一谱段</button>
     <label>浏览谱段<select aria-label="同步谱段" value={region?.id||''} onChange={e=>browse(e.target.value)}>{!region&&<option value="">此处暂无同步</option>}{data.regions.map(r=><option key={r.id} value={r.id}>{label(r)}</option>)}</select></label>
     <button disabled={index<0||index>=data.regions.length-1} onClick={()=>browse(data.regions[index+1].id)}>下一谱段</button>
     <button aria-pressed={zoom} onClick={()=>Zoom(!zoom)}>{zoom?'适应窗口':'放大阅读'}</button>
    </div>
    {region?<>
     <div className="measure-navigation"><div><strong>{bar?`${following?'估计当前':'手动选择'} · 第 ${bar.number} 小节`:'此处暂无小节候选'}</strong><span>{bar?`原谱第 ${bar.page} 页 · 第 ${bar.system+1} 系统 · 时间待核验`:''}</span></div><div className="measure-controls"><button disabled={!bar||bar.number<=1} onClick={()=>bar&&browseBar(bar.number-1)}>上一小节</button><label>小节号 <input aria-label="浏览小节号" type="number" min="1" max="581" value={bar?.number||''} onChange={e=>browseBar(Number(e.target.value))}/></label><button disabled={!bar||bar.number>=581} onClick={()=>bar&&browseBar(bar.number+1)}>下一小节</button></div></div>
     <div className={`sync-pages ${zoom?'zoomed':''}`} data-region={region.id}>{region.pages.map(p=><figure key={p.page}><svg style={{aspectRatio:`${p.box[2]*911}/${p.box[3]*1232}`,height:zoom?'auto':undefined}} viewBox={`${p.box[0]*911} ${p.box[1]*1232} ${p.box[2]*911} ${p.box[3]*1232}`} role="img" aria-label={`同步谱面，印刷页${p.page}${bar?.page===p.page?`，估计第${bar.number}小节`:''}`} preserveAspectRatio="xMidYMid meet"><rect width="911" height="1232" fill="white"/>{!failed.includes(p.url)&&<image href={p.url} width="911" height="1232" onError={()=>Failed(f=>f.includes(p.url)?f:[...f,p.url])}/>}{bar?.page===p.page&&<rect className="measure-highlight" x={bar.box[0]*911} y={bar.box[1]*1232} width={bar.box[2]*911} height={bar.box[3]*1232}/>}</svg>{failed.includes(p.url)&&<p role="status">谱页加载失败；可继续播放或选择其他谱段。</p>}<figcaption>印刷页 {p.page} · 原谱扫描</figcaption></figure>)}</div>
     <div className="sync-actions">{barLocal?<><button onClick={()=>onLocate(trackId,barLocal.start,barLocal.end)}>定位估计小节</button><button onClick={()=>onReplay(Math.max(0,barLocal.start-2),Math.min(measures.tracks.find(t=>t.id===trackId)?.duration||barLocal.end+2,barLocal.end+2))}>回听小节附近</button></>:barIntervals[0]&&<button onClick={()=>onLocate(barIntervals[0].trackId,barIntervals[0].start,barIntervals[0].end)}>切换音轨并定位小节</button>}{local?<><button onClick={()=>onLocate(trackId,local.start,local.end)}>定位所示谱段</button><button onClick={()=>onReplay(local.start,local.end)}>回听所示谱段</button></>:intervals[0]&&<button onClick={()=>onLocate(intervals[0].trackId,intervals[0].start,intervals[0].end)}>切换音轨并定位谱段</button>}<span>{following?'谱面会在固定区域更新，不移动页面。':'浏览不改变播放位置；恢复跟随可返回当前音乐。'}</span></div>
     {bar&&<div className="measure-workbench"><p className="eyebrow">ANNOTATION WORKSPACE</p><h3>第 {bar.number} 小节 · 研究卡</h3><p className="muted">研究卡按小节区间召回资料观点；此小节的音符、动机与和声尚未逐一核验。</p>{researchNotes.length?researchNotes.map(n=><section className="measure-context" key={n.id}><strong>{n.title} · 第 {n.from}–{n.to} 小节</strong>{n.scoreFact&&<p><b>谱面可查：</b>{n.scoreFact}</p>}{n.analysis&&<p><b>分析主张：</b>{n.analysis}</p>}{n.motif&&<p><b>动机线索：</b>{n.motif}</p>}{n.harmony&&<p><b>和声线索：</b>{n.harmony}</p>}{n.meaning&&<p><b>意义解释：</b>{n.meaning}</p>}<p><b>回听问题：</b>{n.question}</p><a href={n.sourceUrl} target="_blank" rel="noreferrer">{n.sourceTitle} · {n.sourceLocation} ↗</a>{n.supportingSources?.map((s,i)=><a className="supporting-source" key={i} href={s.url} target="_blank" rel="noreferrer">{s.title} · {s.location} ↗</a>)}</section>):<p>此小节暂无研究札记；可先在下方记录问题。</p>}<label>这一小节的核验笔记<textarea aria-label="小节核验笔记" value={barNote} onChange={e=>{Manual(bar.regionId);BarPick(bar.number);Follow(false);BarNotes(n=>({...n,[bar.id]:e.target.value}))}} placeholder="例如：需要核对的旋律声部、和弦、回听时间或资料出处"/></label><button onClick={downloadBar}>导出当前小节工作包 JSON</button><p className="muted">工作包含稳定小节 ID、谱页位置、录音指纹、估计时间及来源观点；导出不会把札记升级成正式条目。</p></div>}
     <details className="score-annotation"><summary>针对这个谱段写标注</summary><p>标注绑定谱本与稳定谱段 ID；试听时间由独立映射提供。导出为待核验草稿。</p><label>标注内容<textarea aria-label="谱段标注内容" value={note} onChange={e=>{Manual(region.id);Follow(false);Notes(n=>({...n,[region.id]:e.target.value}))}} placeholder="记录听觉问题、分析或需要核对的谱面信息"/></label><button disabled={!note.trim()} onClick={()=>downloadJson(`mahler-${region.id}-draft.json`,annotationDraft(data,region.id,note))}>导出谱段标注草稿</button></details>
    </>:<p role="status">此处暂无同步。可继续聆听，或手动选择谱段。</p>}
   </>}
   <details><summary>同步来源与精度</summary><p>581 是谱面小节线检测、六处视觉修正与独立文献终点核对的数量；每条时间边界仍待逐段回听。视频翻页、匀分秒数或当前高亮都不能证明具体音符何时发声。</p>{[...data.sources,...measures.sources].map((s,i)=><p key={`${s.url}-${i}`}><a href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a> · {s.usage}</p>)}</details>
  </>}
 </section>
}
