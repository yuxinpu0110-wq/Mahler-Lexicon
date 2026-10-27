export type LensRect={x:number;y:number;width:number;height:number};
type Edges=[number,number,number,number];
const frameSeconds=1/60;
const damping=.68;

/** Fixed-time spring integration keeps the same viscosity at 30/60/120Hz. */
export class LiquidLensMotion {
 private position:Edges=[0,0,0,0];
 private velocity:Edges=[0,0,0,0];
 private target:Edges=[0,0,0,0];
 private initialized=false;
 private accumulator=0;
 private direction=1;
 private reformFrames=0;
 private compression=1;
 private compressionVelocity=0;
 settled=true;

 setTarget(rect:LensRect,snap=false,rowChanged=false){
  if(!Object.values(rect).every(Number.isFinite)||rect.width<=0||rect.height<=0)return;
  const next:Edges=[rect.x,rect.x+Math.max(16,rect.width),rect.y,rect.height];
  if(!this.initialized||snap){this.target=next;this.initialized=true;this.snap();return}
  if(next.every((n,i)=>Math.abs(n-this.target[i])<.001))return;
  this.direction=next[0]+next[1]>=this.target[0]+this.target[1]?1:-1;
  this.target=next;this.settled=false;
  if(rowChanged)this.reformFrames=7;
 }
 snap(){this.position=[...this.target];this.velocity=[0,0,0,0];this.compression=1;this.compressionVelocity=0;this.reformFrames=0;this.accumulator=0;this.settled=true}
 advance(seconds:number){
  if(this.settled)return this.sample();
  // Bound work after a background-tab stall; never simulate an unbounded backlog.
  this.accumulator+=Math.max(0,Math.min(seconds,.064));
  while(this.accumulator+1e-9>=frameSeconds){
   this.accumulator-=frameSeconds;
   const stiffness=[this.direction>0?.13:.16,this.direction>0?.16:.13,.15,.15];
   for(let i=0;i<4;i++){this.velocity[i]=(this.velocity[i]+(this.target[i]-this.position[i])*stiffness[i])*damping;this.position[i]+=this.velocity[i]}
   const compressTo=this.reformFrames>0?.97:1;if(this.reformFrames>0)this.reformFrames--;
   this.compressionVelocity=(this.compressionVelocity+(compressTo-this.compression)*.18)*damping;this.compression+=this.compressionVelocity;
   if(this.reformFrames===0&&this.target.every((n,i)=>Math.abs(n-this.position[i])<.2&&Math.abs(this.velocity[i])<.1)&&Math.abs(this.compression-1)<.001&&Math.abs(this.compressionVelocity)<.001){this.snap();break}
  }
  return this.sample();
 }
 sample(){
  const [left,right,top,height]=this.position,speed=Math.min(1,(Math.abs(this.velocity[0])+Math.abs(this.velocity[1]))/25);
  return {x:left,y:top,width:Math.max(16,right-left),height:Math.max(1,height),speed,scaleY:Math.max(.94,this.compression)*(1-speed*.01),settled:this.settled};
 }
}
