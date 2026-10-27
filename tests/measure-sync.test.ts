import {describe,it,expect} from 'vitest';
import catalogRaw from '../content/real/catalog.json';
import scoreRaw from '../content/real/score-sync.json';
import measureRaw from '../content/real/measure-sync.json';
import researchRaw from '../content/real/measure-research.json';
import guideText from '../content/real/listening-guides.md?raw';
import {parseGuideMarkdown} from '../src/guideMarkdown';
const guideRaw=parseGuideMarkdown(guideText);
import {validate} from '../src/model';
import {validateSync} from '../src/scoreSyncModel';
import {measureAt,measureDraft,measureIntervals,validateMeasures,validateMeasureResearch} from '../src/measureSyncModel';
import {guideAt,validateGuides} from '../src/guideContent';

const catalog=validate(catalogRaw);
const score=validateSync(scoreRaw,catalog);
const data=validateMeasures(measureRaw,catalog,score);
const research=validateMeasureResearch(researchRaw,data);
const guides=validateGuides(guideRaw,data,research);

describe('third movement measure index',()=>{
 it('indexes all 581 measures and retains six explicit raster corrections',()=>{
  expect(data.measures).toHaveLength(581);
  expect(data.measures[0]).toMatchObject({id:'ue-iii-m001',page:80});
  expect(data.measures.at(-1)).toMatchObject({id:'ue-iii-m581',page:127});
  expect(data.corrections.map(c=>c.page)).toEqual([84,88,89,100,117,118]);
  expect(data.measures.filter(m=>m.page===88)).toHaveLength(18);
  expect(data.measures.filter(m=>m.page===100)).toHaveLength(10);
  expect(data.measures.filter(m=>m.page===117)).toHaveLength(6);
  expect(data.measures.filter(m=>m.page===118)).toHaveLength(11);
  expect([190,257,328,348,441,465,473,545,577].map(n=>data.measures[n-1].page)).toEqual([93,98,105,107,114,116,118,124,127]);
 });
 it('keeps file-local estimates isolated from every other recording fingerprint',()=>{
  for(const t of data.tracks){
   expect(t.intervals[0].start).toBe(0);
   expect(t.intervals.at(-1)!.end).toBe(t.duration);
   for(let i=1;i<t.intervals.length;i++)expect(Math.abs(t.intervals[i].start-t.intervals[i-1].end)).toBeLessThan(.001);
   expect(measureAt(data,t.id,'sha256:'+'0'.repeat(64),20)).toBeNull();
   expect(measureAt(data,t.id,t.fingerprint,t.duration)).toBeNull();
  }
 });
 it('retains one score identity when an estimated measure crosses an audio file boundary',()=>{
  const crossing=data.measures.filter(m=>measureIntervals(data,m.id).length===2);
  expect(crossing).toHaveLength(2);
  for(const m of crossing){
   const intervals=measureIntervals(data,m.id);
   expect(intervals[0].trackId).not.toBe(intervals[1].trackId);
  }
 });
 it('binds research to actual cited bar spans without promoting it to reviewed events',()=>{
  const cry=data.measures[464];
  expect(cry.page).toBe(116);
  const note=research.notes.find(n=>n.id==='iii-cry')!;
  expect([note.from,note.to,note.status]).toEqual([465,480,'research_only']);
  const packet=measureDraft(data,cry,'待核验',[note.id]);
  expect(packet).toMatchObject({measureId:'ue-iii-m465',status:'needs_review',timing:'estimated'});
  expect(packet.alignments.length).toBeGreaterThan(0);
 });
 it('shows the narrowest source-backed listening guide while keeping source status',()=>{
  expect(guides.guides).toHaveLength(23);
  for(let n=1;n<=581;n++)expect(guideAt(guides,research,n),`第 ${n} 小节缺导读窗口`).toBeDefined();
  expect(guideAt(guides,research,1)?.id).toBe('g01');
  expect(guideAt(guides,research,258)?.id).toBe('g09');
  expect(guideAt(guides,research,465)?.id).toBe('g18');
  expect(guideAt(guides,research,473)?.id).toBe('g19');
  expect(guideAt(guides,research,577)?.id).toBe('g23');
  expect(guideAt(guides,research,465)?.status).toBe('research_only');
  expect(guides.guides.every(g=>!/[？?]/.test(g.appreciation))).toBe(true);
  expect(guides.guides.every(g=>/[？?]/.test(g.prompt))).toBe(true);
  expect(()=>validateGuides({...guideRaw,guides:[{...guideRaw.guides[0],researchId:'missing'}]},data,research)).toThrow();
  expect(()=>validateGuides({...guideRaw,guides:[{...guideRaw.guides[0],to:189}]},data,research)).toThrow();
 });
 it('rejects stale score, audio, measure references and invalid research',()=>{
  expect(()=>validateMeasures({...measureRaw,scoreFingerprint:'sha256:'+'0'.repeat(64)},catalog,score)).toThrow();
  const stale=structuredClone(measureRaw);stale.tracks[0].fingerprint='sha256:'+'0'.repeat(64);
  expect(()=>validateMeasures(stale,catalog,score)).toThrow();
  const bad=structuredClone(measureRaw);bad.measures[100].regionId='unknown';
  expect(()=>validateMeasures(bad,catalog,score)).toThrow();
  const badResearch=structuredClone(researchRaw);badResearch.notes[0].to=0;
  expect(()=>validateMeasureResearch(badResearch,data)).toThrow();
 });
});
