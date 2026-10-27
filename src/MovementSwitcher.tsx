import type {CSSProperties} from 'react';

export function MovementSwitcher({movement,names,descriptions,onChange}:{movement:number;names:string[];descriptions:string[];onChange:(movement:number)=>void}){
 return <nav className="movement-nav" aria-label="五个乐章"><div className="movement-rail" style={{'--movement-index':movement-1} as CSSProperties}>
  <span className="movement-highlight" aria-hidden="true"/>
  {names.map((name,i)=><button key={name} aria-pressed={movement===i+1} onClick={()=>onChange(i+1)}><small>0{i+1}</small><span className="movement-name" lang="de">{name}</span><em>{descriptions[i]}</em></button>)}
 </div></nav>
}
