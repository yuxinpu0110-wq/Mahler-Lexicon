import {afterEach,describe,it,expect,vi} from 'vitest';
import {AudioReactiveEngine,type VisualState} from '../src/AudioReactiveEngine';
function environment(options:{unsupported?:boolean;resumeFails?:boolean}={}){
 const values=new Map<string,string>(),callbacks=new Map<number,FrameRequestCallback>(),mediaListeners=new Set<()=>void>();let id=0,time=0,level=0,creates=0,sourceLinks=0,destinationLinks=0;
 const root={style:{setProperty:(k:string,v:string)=>values.set(k,v),removeProperty:(k:string)=>values.delete(k),colorScheme:''},dataset:{} as Record<string,string>};
 const main={dataset:{} as Record<string,string>},body={dataset:{} as Record<string,string>};
 const media={matches:false,addEventListener:(_e:string,f:()=>void)=>mediaListeners.add(f),removeEventListener:(_e:string,f:()=>void)=>mediaListeners.delete(f)};
 class FakeContext {
  state='suspended';sampleRate=48000;destination={};
  async resume(){if(options.resumeFails)throw Error('blocked');this.state='running'}
  async close(){this.state='closed'}
  createAnalyser(){return {fftSize:0,smoothingTimeConstant:0,frequencyBinCount:1024,connect:()=>destinationLinks++,getByteFrequencyData:(a:Uint8Array)=>a.fill(level)}}
  createMediaElementSource(){creates++;return {connect:()=>sourceLinks++,disconnect:()=>{}}}
 }
 vi.stubGlobal('window',options.unsupported?{}:{AudioContext:FakeContext});
 vi.stubGlobal('document',{documentElement:root,body,getElementById:()=>main,addEventListener:()=>{},removeEventListener:()=>{}});
 vi.stubGlobal('matchMedia',()=>media);vi.stubGlobal('requestAnimationFrame',(cb:FrameRequestCallback)=>{callbacks.set(++id,cb);return id});vi.stubGlobal('cancelAnimationFrame',(n:number)=>callbacks.delete(n));
 return {values,root,media,counts:()=>({creates,sourceLinks,destinationLinks}),level:(n:number)=>{level=n},reduce:()=>{media.matches=true;for(const f of mediaListeners)f()},step:(frames=1)=>{for(let i=0;i<frames;i++){time+=1000/60;const todo=[...callbacks.values()];callbacks.clear();todo.forEach(cb=>cb(time))}},pending:()=>callbacks.size};
}
afterEach(()=>vi.unstubAllGlobals());
describe('audio-reactive lifecycle',()=>{
 it('creates one media source and one destination connection across repeated starts',async()=>{
  const e=environment(),engine=new AudioReactiveEngine(),audio={} as HTMLMediaElement;
  engine.update(()=>({movement:5,playing:false,bar:472}));e.step();expect(e.counts().creates).toBe(0);
  await engine.connectAudio(audio);await engine.connectAudio(audio);await engine.connectAudio(audio);
  expect(e.counts()).toEqual({creates:1,sourceLinks:1,destinationLinks:1});engine.dispose();expect(e.pending()).toBe(0);
 });
 it('measures real bands, releases on pause, and stops idle animation',async()=>{
  const e=environment(),engine=new AudioReactiveEngine();let playing=true;e.level(255);
  engine.update(()=>({movement:1,playing,bar:1}));await engine.connectAudio({} as HTMLMediaElement);e.step(60);
  for(const name of ['--audio-bass','--audio-mid','--audio-high'])expect(Number(e.values.get(name))).toBeGreaterThan(.9);
  playing=false;engine.update(()=>({movement:1,playing,bar:1}));e.step(600);expect(e.values.get('--audio-bass')).toBe('0.0000');expect(e.pending()).toBe(0);engine.dispose();
 });
 it('does not turn analysed digital silence into artificial breathing',async()=>{
  const e=environment(),engine=new AudioReactiveEngine();engine.update(()=>({movement:5,playing:true,bar:472}));await engine.connectAudio({} as HTMLMediaElement);e.step(120);
  expect(e.values.get('--audio-bass')).toBe('0.0000');expect(e.values.get('--dawn-progress')).toBe('0.0000');expect(e.root.dataset.audioReactive).toBe('analysed');engine.dispose();
 });
 it('leaves native playback uncaptured when audio context is unavailable or blocked',async()=>{
  for(const options of [{unsupported:true},{resumeFails:true}]){
   const e=environment(options),engine=new AudioReactiveEngine();engine.update(()=>({movement:5,playing:true,bar:500}));await engine.connectAudio({} as HTMLMediaElement);e.step(60);
   expect(e.counts().creates).toBe(0);expect(e.root.dataset.audioReactive).toBe('fallback');expect(Number(e.values.get('--audio-mid'))).toBeGreaterThan(0);engine.dispose();
  }
 });
 it('damps seeks, updates paused positions, and snaps with reduced motion',()=>{
  const e=environment(),engine=new AudioReactiveEngine();let state:VisualState={movement:5,playing:false,bar:472};engine.update(()=>state);e.step(120);expect(e.values.get('--dawn-progress')).toBe('0.0000');
  state={...state,bar:762};engine.update(()=>state);e.step();expect(Number(e.values.get('--dawn-progress'))).toBeGreaterThan(0);expect(Number(e.values.get('--dawn-progress'))).toBeLessThan(.1);
  e.reduce();e.step();expect(e.values.get('--dawn-progress')).toBe('1.0000');expect(e.values.get('--dawn-ink-progress')).toBe('1.0000');expect(e.pending()).toBe(0);engine.dispose();
 });
});
