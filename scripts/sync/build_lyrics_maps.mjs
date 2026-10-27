import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {parseLyricsMarkdown} from '../../src/lyricsModel.ts';
process.chdir(fileURLToPath(new URL('../../',import.meta.url)));
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const anchors=await read('scripts/sync/lyric-anchors.json'),warp=await read('tmp/sync/work-time-map.json'),manifest=await read('content/real/continuous-recording.json'),scores=await read('content/real/work-score-sync.json');
const referenceHash=createHash('sha256').update(await readFile('tmp/sync/score-audio.m4a')).digest('hex');
if(referenceHash!==warp.inputs.referenceAudioSHA256||JSON.stringify(warp.inputs.targetFingerprints)!==JSON.stringify(manifest.tracks.map(t=>t.fingerprint)))throw Error('Audio changed; regenerate whole-work alignment');
function target(time){const w=warp.anchors;let lo=0,hi=w.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(w[mid][0]<=time)lo=mid;else hi=mid}return w[lo][1]+(time-w[lo][0])/(w[hi][0]-w[lo][0])*(w[hi][1]-w[lo][1])}
const local=([start,end,offset,total])=>start+(end-start)*offset/total;
const tracks=[];
for(const movement of [4,5]){
 const doc=parseLyricsMarkdown(await readFile(`content/listen_guide/script/m${movement}.md`,'utf8'));
 const track=manifest.tracks.find(t=>t.movement===movement),offset=manifest.tracks.filter(t=>t.movement<movement).reduce((s,t)=>s+t.duration,0);
 const intervals=anchors.anchors.filter(a=>a.movement===movement).map(a=>{
  const lyric=doc.lyrics.find(l=>l.from===a.from&&l.to===a.to);if(!lyric)throw Error('Lyric range changed');
  const sourceStart=local(a.start),sourceEnd=local(a.end);
  return{lyricId:lyric.id,from:lyric.from,to:lyric.to,de:lyric.de,start:Math.max(0,Number((target(sourceStart)-offset).toFixed(6))),end:Math.min(track.duration,Number((target(sourceEnd)-offset).toFixed(6))),status:'needs_review',sourceStart,sourceEnd,scorePages:a.pages,basis:a.basis};
 });
 tracks.push({id:track.id,movement,fingerprint:track.fingerprint,duration:track.duration,intervals});
 console.log(`Movement ${movement}: ${intervals.length} lyric phrases; timing is estimated from local score views, not word alignment`);
}
await writeFile('content/real/lyrics-sync.json',JSON.stringify({version:1,edition:scores.movements[0].edition,scoreFingerprint:scores.movements[0].scoreFingerprint,method:anchors.method+' Then transformed with the fingerprint-bound full-work audio DTW into continuous-file-local seconds.',tracks,evidence:{referenceAudioSHA256:referenceHash,sourceFile:'scripts/sync/lyric-anchors.json',humanAuditionVerified:false}},null,2)+'\n');
