import{useState}from'react';
export function ScoreImage({src,alt}:{src:string;alt:string}){const[failed,F]=useState(false);return failed?<p className="notice">谱面图片暂不可用：{alt}</p>:<img className="score-image" src={src} alt={alt} onError={()=>F(true)}/>}
