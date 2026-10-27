import {describe,it,expect} from 'vitest';
import raw from '../content/real/work-measure-boxes.json';
import {validateWorkBoxes,createWorkBoxLookup} from '../src/workMeasureBoxes';
import navigation from '../content/real/work-measure-sync.json';
import type {WorkMeasureData} from '../src/workMeasureSync';
describe('scan-bound bar rectangles',()=>{
 it('covers all four chapters while retaining review status',()=>{
  const d=validateWorkBoxes(raw);expect(d.entries).toHaveLength(1576);
  expect(d.entries.every(e=>e.status==='needs_review')).toBe(true);
  expect(d.entries.find(e=>e.movement===1&&e.number===399)?.page).toBe(50);
 });
 it('rejects a different edition or scan fingerprint',()=>{
  expect(()=>validateWorkBoxes({...raw,edition:'other'})).toThrow();
  expect(()=>validateWorkBoxes({...raw,scoreFingerprint:`sha256:${'a'.repeat(64)}`})).toThrow();
 });
 it('does not attach a valid rectangle to another scan identity',()=>{
  const lookup=createWorkBoxLookup(raw),measures=navigation.movements[0] as WorkMeasureData;
  expect(lookup(measures,1)?.page).toBe(3);
  expect(lookup({...measures,scoreFingerprint:`sha256:${'b'.repeat(64)}`},1)).toBeUndefined();
  expect(lookup(measures,446)).toBeUndefined();
 });
 it('rejects duplicate, missing, misplaced, and out-of-page boxes',()=>{
  const bad=structuredClone(raw);bad.entries[1]=bad.entries[0];expect(()=>validateWorkBoxes(bad)).toThrow();
  expect(()=>validateWorkBoxes({...raw,entries:raw.entries.slice(1)})).toThrow();
  for(const patch of [{page:128},{box:[.9,.1,.2,.2]},{box:[0,0,0,.3]}])expect(()=>validateWorkBoxes({...raw,entries:raw.entries.map((e,i)=>i===0?{...e,...patch}:e)})).toThrow();
 });
});
