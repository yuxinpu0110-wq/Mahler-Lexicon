import {describe,it,expect} from 'vitest';
import raw from '../content/real/work-score-sync.json';
import rawCatalog from '../content/real/catalog.json';
import rawContinuous from '../content/real/continuous-recording.json';
import score from '../content/real/score-observations.json';
import {validate} from '../src/model';
import {continuousCatalog,validateContinuous} from '../src/continuousRecording';
import {validateWorkSync} from '../src/workScoreSync';
import {syncAt,scorePageRanges,annotationDraft} from '../src/scoreSyncModel';
const original=validate(rawCatalog),continuous=validateContinuous(rawContinuous,original),catalog=continuousCatalog(original,continuous);
const hash='sha256:'+score.pdfSHA256;
const library=validateWorkSync(raw,catalog,hash);
describe('remaining movement score synchronization',()=>{
 it('covers every registered score page and every local second of four complete recordings',()=>{
  expect(Object.keys(library)).toEqual(['1','2','4','5']);
  for(const d of Object.values(library)){
   const [first,last]=scorePageRanges[d.movement];const pages=new Set(d.regions.flatMap(r=>r.pages.map(p=>p.page)));
   expect([...pages].sort((a,b)=>a-b)).toEqual(Array.from({length:last-first+1},(_,i)=>first+i));
   const t=d.tracks[0];expect(t.intervals[0].start).toBe(0);expect(t.intervals.at(-1)!.end).toBe(t.duration);
   for(const span of t.intervals){expect(syncAt(d,t.id,t.fingerprint,(span.start+span.end)/2)?.region.id).toBe(span.regionId);expect(span.status).toBe('needs_review')}
  }
 });
 it('changes at half-open boundaries and rejects another movement or imported file',()=>{
  for(const d of Object.values(library)){
   const t=d.tracks[0],next=t.intervals[1];
   expect(syncAt(d,t.id,t.fingerprint,next.start)?.region.id).toBe(next.regionId);
   expect(syncAt(d,t.id,'sha256:'+'0'.repeat(64),20)).toBeNull();
   expect(syncAt(d,catalog.tracks.find(t=>t.movement!==d.movement)!.id,t.fingerprint,20)).toBeNull();
   expect(syncAt(d,t.id,t.fingerprint,t.duration)).toBeNull();
  }
 });
 it('rejects missing movements, page leakage, stale fingerprints and time gaps',()=>{
  const changes=[(d:typeof raw)=>d.movements.pop(),(d:typeof raw)=>{d.movements[0].regions[0].pages[0].page=80},(d:typeof raw)=>{d.movements[0].tracks[0].fingerprint='sha256:'+'0'.repeat(64)},(d:typeof raw)=>{d.movements[0].tracks[0].intervals[1].start+=.1},(d:typeof raw)=>{d.movements[1]=d.movements[0]}];
  for(const change of changes){const d=structuredClone(raw);change(d);expect(()=>validateWorkSync(d,catalog,hash)).toThrow()}
  expect(()=>validateWorkSync(raw,catalog,'sha256:'+'0'.repeat(64))).toThrow();
 });
 it('includes recovered chorus/final pages and exports score identities without inventing measures',()=>{
  const fifth=library[5];for(const page of [154,184,190,208,209])expect(fifth.regions.some(r=>r.pages.some(p=>p.page===page))).toBe(true);
  const draft=annotationDraft(fifth,fifth.regions.at(-1)!.id,'结尾的听觉线索');
  expect(draft.granularity).toBe('page_system');expect(draft.status).toBe('needs_review');expect(draft.alignments).toHaveLength(1);
  expect('measureNumber' in draft).toBe(false);
 });
});
