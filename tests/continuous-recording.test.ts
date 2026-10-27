import {describe,it,expect} from 'vitest';
import raw from '../content/real/continuous-recording.json';
import catalogRaw from '../content/real/catalog.json';
import syncRaw from '../content/real/score-sync.json';
import measuresRaw from '../content/real/measure-sync.json';
import {validate,mapped} from '../src/model';
import {validateSync,syncAt} from '../src/scoreSyncModel';
import {validateMeasures,measureAt} from '../src/measureSyncModel';
import {validateContinuous,continuousCatalog,continuousSync,continuousMeasures} from '../src/continuousRecording';
const catalog=validate(catalogRaw),manifest=validateContinuous(raw,catalog),sourceSync=validateSync(syncRaw,catalog),sourceMeasures=validateMeasures(measuresRaw,catalog,sourceSync);
describe('whole-movement playback',()=>{
 it('uses one distinct audio file per movement while retaining all 25 source identities',()=>{expect(manifest.tracks).toHaveLength(5);expect(manifest.tracks.flatMap(t=>t.parts)).toHaveLength(25);const playback=continuousCatalog(catalog,manifest);expect(playback.tracks.filter(t=>t.movement===3)).toHaveLength(1);expect(playback.tracks[2].duration).toBeCloseTo(684.826667,4);const t=playback.tracks[2];expect(mapped(playback,3,t.recording,t.id,t.fingerprint,playback.edition)).toHaveLength(2)});
 it('projects every source interval by its exact file offset, including former split boundaries',()=>{const scores=continuousSync(sourceSync,manifest),measures=continuousMeasures(sourceMeasures,manifest),third=manifest.tracks[2];for(const part of third.parts){const source=sourceMeasures.tracks.find(t=>t.id===part.trackId)!;for(const interval of source.intervals){const time=(interval.start+interval.end)/2;expect(measureAt(measures,third.id,third.fingerprint,time+part.start)?.measure.id).toBe(interval.measureId)}const first=sourceSync.tracks.find(t=>t.id===part.trackId)!.intervals[0];expect(syncAt(scores,third.id,third.fingerprint,part.start+(first.start+first.end)/2)?.region.id).toBe(first.regionId)}expect(measureAt(measures,third.id,'sha256:'+'0'.repeat(64),400)).toBeNull()});
 it('rejects changed source files, offset gaps, missing movements and duplicate files',()=>{for(const change of [(d:typeof raw)=>{d.tracks[2].parts[1].fingerprint='sha256:'+'0'.repeat(64)},(d:typeof raw)=>{d.tracks[2].parts[1].start+=1},(d:typeof raw)=>{d.tracks.pop()},(d:typeof raw)=>{d.tracks[2].parts[1].trackId=d.tracks[2].parts[0].trackId}]){const bad=structuredClone(raw);change(bad);expect(()=>validateContinuous(bad,catalog)).toThrow()}});
});
