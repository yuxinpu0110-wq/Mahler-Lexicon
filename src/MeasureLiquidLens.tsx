import {useLayoutEffect,useRef,type RefObject} from 'react';
import {LiquidLensMotion,type LensRect} from './liquidLensMotion';

/** A DOM lens above the SVG: optical backdrop filters never blur the scan. */
export function MeasureLiquidLens({svg,box,page}:{svg:RefObject<SVGSVGElement|null>;box:[number,number,number,number];page:number}){
 const lens=useRef<HTMLDivElement>(null),motion=useRef(new LiquidLensMotion()),latest=useRef(box),project=useRef<(()=>void)|null>(null);
 latest.current=box;
 useLayoutEffect(()=>{
  const el=lens.current,source=svg.current,parent=source?.parentElement;if(!el||!source||!parent)return;
  const spring=motion.current,reduce=matchMedia('(prefers-reduced-motion: reduce)');let frame=0,lastTime=0,disposed=false;
  let previousY=latest.current[1],lastWidth=0,lastHeight=0,lastView='';
  const draw=()=>{
   const s=spring.sample();el.style.transform=`translate3d(${s.x.toFixed(3)}px,${s.y.toFixed(3)}px,0) scaleY(${s.scaleY.toFixed(5)})`;
   el.style.width=`${s.width.toFixed(3)}px`;el.style.height=`${s.height.toFixed(3)}px`;
   el.style.setProperty('--lens-velocity',s.speed.toFixed(4));
   el.style.setProperty('--lens-glint-offset',(-60+s.speed*120).toFixed(3));
   el.dataset.moving=String(!s.settled);el.dataset.ready='true';
  };
  const step=(time:number)=>{
   frame=0;if(disposed)return;spring.advance(lastTime?Math.max(0,(time-lastTime)/1000):1/60);lastTime=time;draw();
   if(!spring.settled)frame=requestAnimationFrame(step);else lastTime=0;
  };
  const update=()=>{
   const matrix=source.getScreenCTM();if(!matrix)return;
   const [x,y,w,h]=latest.current,origin=parent.getBoundingClientRect();
   const start=new DOMPoint(x,y).matrixTransform(matrix),end=new DOMPoint(x+w,y+h).matrixTransform(matrix);
   const target:LensRect={x:start.x-origin.left-4,y:start.y-origin.top-10,width:end.x-start.x+8,height:end.y-start.y+20};
   const bounds=source.getBoundingClientRect(),view=source.getAttribute('viewBox')||'';
   const resized=lastWidth>0&&(Math.abs(bounds.width-lastWidth)>.5||(view===lastView&&Math.abs(bounds.height-lastHeight)>.5));
   lastWidth=bounds.width;lastHeight=bounds.height;lastView=view;
   const rowChanged=Math.abs(y-previousY)>Math.max(30,h*.2);previousY=y;
   spring.setTarget(target,reduce.matches||resized,rowChanged);draw();
   if(!spring.settled&&!frame)frame=requestAnimationFrame(step);
  };
  const changed=()=>{if(reduce.matches){spring.snap();cancelAnimationFrame(frame);frame=0;lastTime=0;draw()}else update()};
  project.current=update;const observer=new ResizeObserver(update);observer.observe(source);observer.observe(parent);
  reduce.addEventListener('change',changed);update();
  return()=>{disposed=true;project.current=null;observer.disconnect();reduce.removeEventListener('change',changed);cancelAnimationFrame(frame);spring.snap()};
 },[svg]);
 // Every camera frame projects the actual SVG CTM, including meet letterboxing.
 useLayoutEffect(()=>{project.current?.()});
 return <div ref={lens} className="measure-liquid-lens" data-page={page} aria-hidden="true"><span className="measure-lens-rim"/></div>;
}
