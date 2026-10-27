import {bandEnergy,computeMovement5DawnProgress,damp} from './dawnProgress';
export type VisualState={movement:number;playing:boolean;bar:number|null};

/** A single unity-gain media graph. Visual analysis never controls playback. */
export class AudioReactiveEngine {
 private ctx:AudioContext|null=null;
 private analyser:AnalyserNode|null=null;
 private sourceMap=new WeakMap<HTMLMediaElement,MediaElementAudioSourceNode>();
 private connecting:Promise<void>|null=null;
 private data:Uint8Array<ArrayBuffer>|null=null;
 private status:'idle'|'analysed'|'fallback'='idle';
 private raf=0;
 private lastTime=0;
 private lastFFT=0;
 private elapsed=0;
 private energies=[0,0,0];
 private targets=[0,0,0];
 private dawn=0;
 private ink=0;
 private movement=0;
 private disposed=false;
 private read:()=>VisualState=()=>({movement:0,playing:false,bar:null});
 private reduce:MediaQueryList;
 private written=new Map<string,string>();
 constructor(){this.reduce=matchMedia('(prefers-reduced-motion: reduce)');this.reduce.addEventListener('change',this.wake);document.addEventListener('visibilitychange',this.wake)}
 update(read:()=>VisualState){this.read=read;this.wake()}
 /** Called alongside audio.play() inside its existing user gesture. */
 connectAudio(audio:HTMLMediaElement):Promise<void>{
  if(this.disposed||this.status==='fallback')return Promise.resolve();
  if(this.connecting)return this.connecting;
  const task=this.connect(audio);this.connecting=task;void task.finally(()=>{if(this.connecting===task)this.connecting=null});return task;
 }
 private async connect(audio:HTMLMediaElement){
  let source:MediaElementAudioSourceNode|undefined;
  try{
   const Constructor=window.AudioContext||(window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
   if(!Constructor)throw Error('Web Audio unavailable');
   const ctx=this.ctx||(this.ctx=new Constructor({latencyHint:'playback'}));
   // Do not capture a native media element until the context can emit sound.
   if(ctx.state!=='running')await ctx.resume();
   if(this.disposed||ctx.state!=='running')return;
   if(!this.analyser){this.analyser=ctx.createAnalyser();this.analyser.fftSize=2048;this.analyser.smoothingTimeConstant=.85;this.data=new Uint8Array(this.analyser.frequencyBinCount);this.analyser.connect(ctx.destination)}
   source=this.sourceMap.get(audio);
   if(!source){source=ctx.createMediaElementSource(audio);this.sourceMap.set(audio,source);source.connect(this.analyser)}
   this.status='analysed';
  }catch{
   // If graph setup fails after capture, preserve a direct unity-gain route.
   if(source&&this.ctx){try{source.disconnect();source.connect(this.ctx.destination)}catch{}}
   this.status='fallback';
  }
  this.wake();
 }
 private write(name:string,value:number){const next=value.toFixed(4);if(this.written.get(name)!==next){document.documentElement.style.setProperty(name,next);this.written.set(name,next)}}
 private wake=()=>{if(!this.disposed&&!this.raf)this.raf=requestAnimationFrame(this.tick)};
 private tick=(now:number)=>{
  this.raf=0;if(this.disposed)return;
  const state=this.read(),reduced=this.reduce.matches,dt=this.lastTime?Math.min(.1,(now-this.lastTime)/1000):1/60;this.lastTime=now;this.elapsed+=dt;
  if(this.movement!==state.movement){this.movement=state.movement;this.dawn=0;this.ink=0}
  const targetDawn=state.movement===5&&state.bar!==null?computeMovement5DawnProgress(state.bar):0;
  this.dawn=reduced?targetDawn:damp(this.dawn,targetDawn,dt,.9,.9);
  if(Math.abs(this.dawn-targetDawn)<.0002)this.dawn=targetDawn;
  const inkTarget=this.dawn>=.65?1:0;this.ink=reduced?inkTarget:damp(this.ink,inkTarget,dt,.12,.12);
  if(Math.abs(this.ink-inkTarget)<.0002)this.ink=inkTarget;
  if(!state.playing||reduced)this.targets=[0,0,0];
  else if(this.status==='analysed'&&this.analyser&&this.data&&this.ctx){
   if(now-this.lastFFT>=32){this.lastFFT=now;this.analyser.getByteFrequencyData(this.data);this.targets=[bandEnergy(this.data,this.ctx.sampleRate,2048,20,240)**1.3,bandEnergy(this.data,this.ctx.sampleRate,2048,240,2600),bandEnergy(this.data,this.ctx.sampleRate,2048,2600,10000)**1.2]}
  }else if(this.status==='fallback'){
   // Explicit unsupported-analysis fallback only. Real digital silence stays still.
   this.targets=[.18+Math.sin(this.elapsed*.5)*.12,.22+Math.cos(this.elapsed*.35)*.1,.1+Math.sin(this.elapsed*.65)*.08];
  }else this.targets=[0,0,0];
  this.energies=this.energies.map((n,i)=>{const value=reduced?0:damp(n,this.targets[i],dt);return Math.abs(value-this.targets[i])<.0001?this.targets[i]:value});
  this.write('--dawn-progress',this.dawn);this.write('--dawn-ink-progress',this.ink);
  for(const [i,name]of ['--audio-bass','--audio-mid','--audio-high'].entries())this.write(name,this.energies[i]);
  const root=document.documentElement;if(root.dataset.audioReactive!==this.status)root.dataset.audioReactive=this.status;
  const stage=String(this.dawn<=0?0:this.dawn<=.25?1:this.dawn<=.55?2:this.dawn<=.85?3:4);if(root.dataset.dawnStage!==stage)root.dataset.dawnStage=stage;
  const mode=state.movement===2||(state.movement===5&&this.ink>=.5)?'light':'dark';
  if(document.body.dataset.scoreMode!==mode)document.body.dataset.scoreMode=mode;const main=document.getElementById('main-content');if(main&&main.dataset.scoreMode!==mode)main.dataset.scoreMode=mode;if(root.style.colorScheme!==mode)root.style.colorScheme=mode;
  if((!reduced&&state.playing)||Math.abs(this.dawn-targetDawn)>.00001||Math.abs(this.ink-inkTarget)>.00001||this.energies.some((n,i)=>Math.abs(n-this.targets[i])>.00001))this.wake();else this.lastTime=0;
 };
 dispose(){this.disposed=true;cancelAnimationFrame(this.raf);this.reduce.removeEventListener('change',this.wake);document.removeEventListener('visibilitychange',this.wake);void this.ctx?.close().catch(()=>{});for(const name of this.written.keys())document.documentElement.style.removeProperty(name);delete document.documentElement.dataset.audioReactive;delete document.documentElement.dataset.dawnStage}
}
