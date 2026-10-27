import {Fragment,type ReactNode} from 'react';

function inline(text:string,onReference:(from:number,to?:number)=>void):ReactNode[]{
 const tokens=/\[([^\]\n]+)\]\(bar:(\d+)(?:-(\d+))?\)|\*\*([^*\n]+)\*\*/g;const result:ReactNode[]=[];let at=0;
 for(const m of text.matchAll(tokens)){result.push(text.slice(at,m.index));if(m[1])result.push(<a key={m.index} className="bar-link" href={`#bar-${m[2]}`} data-bar-from={m[2]} data-bar-to={m[3]||m[2]} title={`定位到第 ${m[2]}${m[3]?`—${m[3]}`:''} 小节（估计位置）`} onClick={e=>{e.preventDefault();onReference(+m[2],m[3]?+m[3]:undefined)}}><span className="bar-play-mark" aria-hidden="true"/>{m[1]}</a>);else result.push(<strong key={m.index}>{inline(m[4],onReference)}</strong>);at=m.index!+m[0].length}
 result.push(text.slice(at));return result;
}
export function GuideText({text,onReference}:{text:string;onReference:(from:number,to?:number)=>void}){return <div className="guide-body">{text.split(/\n\s*\n/).map((paragraph,i)=><p key={i}>{paragraph.split('\n').map((line,j)=><Fragment key={j}>{j>0&&<br/>}{inline(line,onReference)}</Fragment>)}</p>)}</div>}
