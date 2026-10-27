import {describe,it,expect} from 'vitest';
import raw from '../content/real/work-measure-sync.json';
import rawScores from '../content/real/work-score-sync.json';
import rawCatalog from '../content/real/catalog.json';
import rawContinuous from '../content/real/continuous-recording.json';
import evidence from '../content/real/score-observations.json';
import {validate} from '../src/model';
import {continuousCatalog,validateContinuous} from '../src/continuousRecording';
import {validateWorkSync} from '../src/workScoreSync';
import {validateWorkMeasures,workMeasureAt,workBarRange} from '../src/workMeasureSync';
import {authorGuideLibrary} from '../src/guideLibrary';
import {guideAt} from '../src/guideContent';
import type {MeasureResearch} from '../src/measureSyncModel';

const original=validate(rawCatalog),catalog=continuousCatalog(original,validateContinuous(rawContinuous,original));
const scores=validateWorkSync(rawScores,catalog,'sha256:'+evidence.pdfSHA256);
const library=validateWorkMeasures(raw,catalog,scores);
describe('edition-bound local bar navigation for I, II, IV and V',()=>{
 it('keeps score numbering separate from author ranges and produces no invented bar rectangles',()=>{
  expect(Object.values(library).map(d=>d.barCount)).toEqual([445,299,68,764]);
  for(const d of Object.values(library)){
   const t=d.tracks[0];expect(t.intervals[0].start).toBe(0);expect(t.intervals.at(-1)!.end).toBeCloseTo(t.duration,5);
   for(const span of t.intervals){
    const result=workMeasureAt(d,t.id,t.fingerprint,(span.start+span.end)/2)!;
    expect(result.measure.id).toBe(span.measureId);expect(result.measure.status).toBe('needs_review');expect(result.measure).not.toHaveProperty('box');
   }
   expect(d.evidence.humanAuditionVerified).toBe(false);
  }
  expect(authorGuideLibrary[1].guides.at(-1)!.from).toBe(446);
  expect(workBarRange(library[1],library[1].tracks[0].id,library[1].tracks[0].fingerprint,446,454)).toBeNull();
 });
 it('uses half-open windows and isolates wrong files, movements and invalid ranges',()=>{
  for(const d of Object.values(library)){
   const t=d.tracks[0],second=t.intervals[1];
   expect(workMeasureAt(d,t.id,t.fingerprint,second.start)?.measure.number).toBe(2);
   expect(workMeasureAt(d,t.id,t.fingerprint,t.duration)).toBeNull();
   expect(workMeasureAt(d,t.id,'sha256:'+'0'.repeat(64),30)).toBeNull();
   expect(workMeasureAt(d,'another-track',t.fingerprint,30)).toBeNull();
   for(const [a,b]of [[0,1],[1,1.5],[5,3],[d.barCount,d.barCount+1]])expect(workBarRange(d,t.id,t.fingerprint,a,b)).toBeNull();
   expect(workBarRange(d,t.id,t.fingerprint,5,10)).toMatchObject({start:t.intervals[4].start,end:t.intervals[9].end});
  }
 });
 it('rejects broken source references, numbering, fingerprint identities, missing bars and time gaps',()=>{
  const changes=[(d:typeof raw)=>{d.movements.pop()},(d:typeof raw)=>{d.movements[0].tracks[0].fingerprint='sha256:'+'0'.repeat(64)},(d:typeof raw)=>{d.movements[0].scoreFingerprint='sha256:'+'0'.repeat(64)},(d:typeof raw)=>{d.movements[0].measures[1].id='fake-id'},(d:typeof raw)=>{d.movements[0].measures[1].regionId=d.movements[0].measures.at(-1)!.regionId},(d:typeof raw)=>{d.movements[0].tracks[0].intervals[1].start+=.1},(d:typeof raw)=>{d.movements[0].measures.pop()},(d:typeof raw)=>{d.movements[0].readings[0].firstBar=2},(d:typeof raw)=>{d.movements[1]=d.movements[0]}];
  for(const change of changes){const d=structuredClone(raw);change(d);expect(()=>validateWorkMeasures(d,catalog,scores)).toThrow()}
 });
 it('recalls only the guide at the played bar, with an empty state beyond manuscript coverage',()=>{
  const research={} as MeasureResearch;
  for(const d of Object.values(library)){
   const guide=authorGuideLibrary[d.movement].guides[1],t=d.tracks[0],range=workBarRange(d,t.id,t.fingerprint,guide.from)!;
   const at=workMeasureAt(d,t.id,t.fingerprint,range.start+.01)!;
   expect(guideAt(authorGuideLibrary[d.movement],research,at.measure.number)?.id).toBe(guide.id);
  }
  expect(guideAt(authorGuideLibrary[4],research,68)).toBeUndefined();
  expect(guideAt(authorGuideLibrary[5],research,764)).toBeUndefined();
 });
});
