import {describe,it,expect} from 'vitest';
import {bandEnergy,computeMovement5DawnProgress as dawn,damp,fractionalBarAt} from '../src/dawnProgress';
describe('four-stage recording-driven dawn',()=>{
 it('retains night at choral entry and follows the phase-table endpoints',()=>{
  for(const [bar,progress]of [[1,0],[471,0],[472,0],[511,.25],[512,.25],[579,.55],[580,.55],[639,.85],[640,.85],[762,1],[764,1]])expect(dawn(bar)).toBeCloseTo(progress,9);
  expect(dawn(NaN)).toBe(0);expect(dawn(500.5)).toBeGreaterThan(dawn(500));
 });
 it('is continuous and monotone across all stage boundaries',()=>{
  let last=0;for(let bar=470;bar<=764;bar+=.05){const p=dawn(bar);expect(p).toBeGreaterThanOrEqual(last-1e-10);expect(p-last).toBeLessThan(.001);last=p}
 });
 it('uses recording intervals for sub-bar progress and rejects unmapped times',()=>{
  const spans=[{start:0,end:2},{start:2,end:6}];expect(fractionalBarAt(spans,1)).toBe(1.5);expect(fractionalBarAt(spans,2)).toBe(2);expect(fractionalBarAt(spans,5)).toBe(2.75);
  expect(fractionalBarAt(spans,6)).toBe(2);expect(fractionalBarAt(spans,7)).toBeNull();expect(fractionalBarAt(spans,-1)).toBeNull();expect(fractionalBarAt([],0)).toBeNull();
 });
 it('has frame-rate-independent damping and a longer release than attack',()=>{
  const values=[30,60,120].map(hz=>{let n=0;for(let i=0;i<hz;i++)n=damp(n,1,1/hz);return n});for(const n of values)expect(n).toBeCloseTo(values[0],10);
  expect(damp(0,1,.1)).toBeGreaterThan(1-damp(1,0,.1));
 });
 it('reads physical frequency bands and preserves digital silence',()=>{
  const bins=new Uint8Array(1024);expect(bandEnergy(bins,48000,2048,20,240)).toBe(0);bins.fill(255,1,11);
  expect(bandEnergy(bins,48000,2048,20,240)).toBe(1);expect(bandEnergy(bins,48000,2048,2600,10000)).toBe(0);
 });
});
