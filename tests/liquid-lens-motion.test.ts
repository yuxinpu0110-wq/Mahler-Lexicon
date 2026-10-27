import {describe,it,expect} from 'vitest';
import {LiquidLensMotion} from '../src/liquidLensMotion';
const start={x:20,y:40,width:60,height:200},right={...start,x:160};
function run(m:LiquidLensMotion,n=180){for(let i=0;i<n;i++)m.advance(1/60);return m.sample()}
describe('liquid lens physics',()=>{
 it('stretches the leading edge first in either direction, then settles exactly',()=>{
  const m=new LiquidLensMotion();m.setTarget(start);m.setTarget(right);
  const r=m.advance(1/60);expect(r.width).toBeGreaterThan(start.width);expect(r.speed).toBeGreaterThan(0);
  expect(run(m)).toMatchObject({...right,settled:true,scaleY:1,speed:0});
  m.setTarget(start);expect(m.advance(1/60).width).toBeGreaterThan(start.width);expect(run(m)).toMatchObject({...start,settled:true});
 });
 it('reuses velocity on interruption and converges after rapid reversals and size changes',()=>{
  const m=new LiquidLensMotion();m.setTarget(start);m.setTarget(right);m.advance(.06);const before=m.sample();
  m.setTarget({...start,width:28,height:90});expect(m.sample()).toEqual(before);
  const end=run(m);expect(end).toMatchObject({...start,width:28,height:90,settled:true});
 });
 it('compresses on a row change, reforms, and settles height as well as edges',()=>{
  const m=new LiquidLensMotion();m.setTarget(start);const next={x:10,y:350,width:80,height:100};m.setTarget(next,false,true);
  expect(m.advance(1/60).scaleY).toBeLessThan(1);expect(run(m)).toMatchObject({...next,scaleY:1,settled:true});
 });
 it('has equivalent motion at different refresh rates and bounded work after stalls',()=>{
  const states=[30,60,120].map(hz=>{const m=new LiquidLensMotion();m.setTarget(start);m.setTarget(right);for(let i=0;i<hz/2;i++)m.advance(1/hz);return m.sample()});
  for(const s of states){expect(s.x).toBeCloseTo(states[0].x,8);expect(s.width).toBeCloseTo(states[0].width,8)}
  const m=new LiquidLensMotion();m.setTarget(start);m.setTarget(right);expect(m.advance(30).x).toBeLessThan(right.x);
 });
 it('snaps for reduced motion and rejects invalid geometry',()=>{
  const m=new LiquidLensMotion();m.setTarget(start);m.setTarget(right);m.advance(.05);m.snap();expect(m.sample()).toMatchObject({...right,speed:0,scaleY:1,settled:true});
  m.setTarget({...start,x:NaN});expect(m.sample().x).toBe(right.x);
 });
});
