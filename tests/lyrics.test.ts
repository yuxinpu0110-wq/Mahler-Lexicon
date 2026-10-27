import {describe,it,expect} from 'vitest';
import rawFourth from '../content/listen_guide/script/m4.md?raw';
import rawFifth from '../content/listen_guide/script/m5.md?raw';
import rawSync from '../content/real/lyrics-sync.json';
import rawScores from '../content/real/work-score-sync.json';
import rawCatalog from '../content/real/catalog.json';
import rawContinuous from '../content/real/continuous-recording.json';
import {parseLyricsMarkdown,validateLyricsSync,lyricAt} from '../src/lyricsModel';
import {validate} from '../src/model';
import {validateContinuous,continuousCatalog} from '../src/continuousRecording';
import {validateWorkSync} from '../src/workScoreSync';
const original=validate(rawCatalog),catalog=continuousCatalog(original,validateContinuous(rawContinuous,original));
const scores=validateWorkSync(rawScores,catalog,rawSync.scoreFingerprint),library={4:parseLyricsMarkdown(rawFourth),5:parseLyricsMarkdown(rawFifth)};
const sync=validateLyricsSync(rawSync,library,catalog,scores);
describe('vocal lyrics tied to score phrases and recording files',()=>{
 it('reads all three author languages and preserves line breaks and score range labels',()=>{
  expect(library[4].lyrics).toHaveLength(7);expect(library[5].lyrics).toHaveLength(16);
  expect(library[5].lyrics[0].de).toContain('\n');expect(library[5].lyrics[0].from).toBe(472);expect(library[5].lyrics.at(-1)!.to).toBe(671);
 });
 it('shows the current phrase at half-open boundaries and hides in instrumental gaps and other movements',()=>{
  for(const track of sync.tracks){
   let previousEnd=0;
   for(const span of track.intervals){expect(lyricAt(sync,library,track.movement,track.id,track.fingerprint,span.start)?.id).toBe(span.lyricId);if(span.start>previousEnd)expect(lyricAt(sync,library,track.movement,track.id,track.fingerprint,(previousEnd+span.start)/2)).toBeNull();previousEnd=span.end}
   expect(lyricAt(sync,library,track.movement,track.id,track.fingerprint,previousEnd)).toBeNull();
   expect(lyricAt(sync,library,3,track.id,track.fingerprint,track.intervals[0].start)).toBeNull();
   expect(lyricAt(sync,library,track.movement,track.id,'sha256:'+'0'.repeat(64),track.intervals[0].start)).toBeNull();
  }
 });
 it('does not duplicate the shared fourth-movement bar 44 at the phrase transition',()=>{
  const fourth=sync.tracks[0],before=fourth.intervals[3],after=fourth.intervals[4];expect(before.to).toBe(44);expect(after.from).toBe(44);expect(before.end).toBe(after.start);
  expect(lyricAt(sync,library,4,fourth.id,fourth.fingerprint,after.start)?.de).toContain('Ach nein');
 });
 it('rejects stale text, ranges, score, files, overlaps and missing phrases',()=>{
  for(const change of [(d:typeof rawSync)=>{d.tracks[0].intervals[0].de='wrong text'},(d:typeof rawSync)=>{d.tracks[0].intervals[0].from=2},(d:typeof rawSync)=>{d.scoreFingerprint='sha256:'+'0'.repeat(64)},(d:typeof rawSync)=>{d.tracks[0].fingerprint='sha256:'+'0'.repeat(64)},(d:typeof rawSync)=>{d.tracks[0].intervals[1].start=0},(d:typeof rawSync)=>{d.tracks[1].intervals.pop()}]){const broken=structuredClone(rawSync);change(broken);expect(()=>validateLyricsSync(broken,library,catalog,scores)).toThrow()}
 });
 it('rejects incomplete translations and executable markup rather than rendering raw HTML',()=>{
  expect(()=>parseLyricsMarkdown(rawFourth.replace('| **English** | O little red rose! |',''))).toThrow();
  expect(()=>parseLyricsMarkdown(rawFourth.replace('O Röschen rot!','<script>bad()</script>'))).toThrow();
 });
});
