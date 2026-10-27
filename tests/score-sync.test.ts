import {describe,it,expect} from 'vitest';
import {validateSync,syncAt,annotationDraft} from '../src/scoreSyncModel';
import {validate} from '../src/model';
import catalog from '../content/real/catalog.json';
import raw from '../content/real/score-sync.json';
import score from '../content/real/score-observations.json';
const c=validate(catalog), d=validateSync(raw,c,'sha256:'+score.pdfSHA256);
describe('score synchronization',()=>{
 it('covers all 48 pages with 52 independently identified views and file-local maps',()=>{expect(d.regions).toHaveLength(52);expect(new Set(d.regions.flatMap(r=>r.pages.map(p=>p.page))).size).toBe(48);expect(d.tracks).toHaveLength(3);for(const t of d.tracks){expect(t.intervals[0].start).toBe(0);expect(t.intervals.at(-1)!.end).toBe(t.duration);for(let i=1;i<t.intervals.length;i++)expect(t.intervals[i].start).toBeCloseTo(t.intervals[i-1].end,3)}});
 it('selects half-open intervals, preserves gaps, and never transfers between fingerprints',()=>{const t=d.tracks[0], a=t.intervals[0], b=t.intervals[1];expect(syncAt(d,t.id,t.fingerprint,a.end)?.region.id).toBe(b.regionId);expect(syncAt(d,t.id,'sha256:unknown',2)).toBeNull();expect(syncAt(d,t.id,t.fingerprint,t.duration)).toBeNull();const sparse=structuredClone(d);sparse.tracks[0].intervals.shift();expect(syncAt(sparse,t.id,t.fingerprint,0)).toBeNull()});
 it('splits a view across tracks without resetting its score identity',()=>{expect(d.tracks[0].intervals.at(-1)!.regionId).toBe(d.tracks[1].intervals[0].regionId);expect(d.tracks[1].intervals.at(-1)!.regionId).toBe(d.tracks[2].intervals[0].regionId)});
 it('rejects unknown regions, overlaps, stale audio and stale score assets',()=>{const bad=structuredClone(raw);bad.tracks[0].intervals[0].regionId='missing';expect(()=>validateSync(bad,c)).toThrow();const overlap=structuredClone(raw);overlap.tracks[0].intervals[1].start=0;expect(()=>validateSync(overlap,c)).toThrow();const stale=structuredClone(raw);stale.tracks[0].fingerprint='sha256:'+'0'.repeat(64);expect(()=>validateSync(stale,c)).toThrow();expect(()=>validateSync(raw,c,'sha256:'+'0'.repeat(64))).toThrow()});
 it('exports annotations attached to score identity without laundering estimated times into reviewed claims',()=>{const r=d.regions[28],draft=annotationDraft(d,r.id,'比较这次出现');expect(draft.regionId).toBe(r.id);expect(draft.edition).toBe(d.edition);expect(draft.status).toBe('needs_review');expect(draft.alignments.length).toBeGreaterThan(0);expect(draft.alignments.every(a=>a.status==='needs_review')).toBe(true);expect(()=>annotationDraft(d,'unknown','test')).toThrow()});
});
