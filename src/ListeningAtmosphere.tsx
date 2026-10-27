export function ListeningAtmosphere({movement,phase,visualEvent}:{movement:number;phase:string;visualEvent:string}){
 return <div className="ambient-scene ambient-canvas" aria-hidden="true">
  {[1,2,3,4,5,6,7].map(n=><div key={n} className="ambient-layer" data-movement={n===6?5:n===7?3:n} data-phase={n===6?'dawn':'storm'} data-event={n===7?'cry':'none'} data-active={n===7?movement===3&&visualEvent==='cry':n===6?movement===5&&phase==='dawn':n===movement&&(n!==5||phase==='storm')&&(n!==3||visualEvent!=='cry')}/>)}
  <div className="ambient-orb-primary"/><div className="ambient-orb-secondary"/>
  {movement===5&&<><div className="ambient-horizon-dawn"/><div className="ambient-solar-halo"/></>}
 </div>;
}
export function PoeticClue({text,id,onExplore}:{text:string;id:string;onExplore:()=>void}){
 return <button className="focus-clue-button" onClick={onExplore} aria-label={text}>
  <span className="focus-clue-text" key={id}>{text}</span>
  <span className="focus-clue-subhint" aria-hidden="true">暂停，走近这段音乐 <span>↗</span></span>
 </button>;
}
