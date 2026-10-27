import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const manifest=JSON.parse(await readFile('.local/recording.json','utf8'));
function pcmHash(args){const r=spawnSync('ffmpeg',['-nostdin','-v','error',...args,'-map','0:a:0','-c:a','pcm_s32le','-f','hash','-hash','sha256','-'],{encoding:'utf8',windowsHide:true});if(r.status!==0)throw Error(r.stderr||'PCM hash failed');return r.stdout.trim()}
for(const track of manifest.continuousTracks){
 const parts=track.parts.map(p=>manifest.tracks.find(t=>t.id===p.trackId));
 const list=resolve('.local/audio',`check-movement-${track.movement}.ffconcat`);
 await writeFile(list,['ffconcat version 1.0',...parts.map(p=>`file '${resolve(p.file).replaceAll('\\','/').replaceAll("'","'\\''")}'`)].join('\n')+'\n');
 const expected=pcmHash(['-safe','0','-f','concat','-i',list]),actual=pcmHash(['-i',track.file]);
 if(expected!==actual)throw Error(`Movement ${track.movement}: concatenated PCM differs`);
 console.log(`PASS movement ${track.movement}: decoded PCM matches original files in order`);
}
