import {useId,type CSSProperties} from 'react';
/** Project adaptation of the persistent traveling-indicator pattern. */
export function Segmented({label,options,value,onChange}:{label:string;options:string[];value:string;onChange:(value:string)=>void}){
 const id=useId();const index=Math.max(0,options.indexOf(value));
 return <fieldset className="segmented" style={{'--count':options.length,'--index':index} as CSSProperties}><legend className="sr-only">{label}</legend><span className="segment-indicator" aria-hidden="true"/>{options.map((option,i)=><label className="segment-option" key={option}><input type="radio" name={id} value={option} checked={value===option} onChange={()=>onChange(option)}/><span>{option}</span></label>)}</fieldset>
}
