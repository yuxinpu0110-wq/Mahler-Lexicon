import {readFile,writeFile,stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {parseFile} from 'music-metadata';

const root=resolve('.');
const manifestPath=resolve('.local/recording.json');
const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
async function hash(file){const h=createHash('sha256');for await(const chunk of createReadStream(file))h.update(chunk);return h.digest('hex')}
const continuous=[];
for(let movement=1;movement<=5;movement++){
 const parts=manifest.tracks.filter(t=>t.movement===movement).sort((a,b)=>a.order-b.order);
 if(!parts.length)continue;
 const identity=createHash('sha256').update(parts.map(t=>t.fingerprint).join('|')).digest('hex').slice(0,20);
 const output=resolve('.local/audio',`movement-${movement}-${identity}.flac`);
 let exists=true;try{await stat(output);const cached=await parseFile(output,{duration:true,skipCovers:true});if(Math.abs(cached.format.duration-parts.reduce((n,t)=>n+t.duration,0))>.15)exists=false}catch{exists=false}
 if(!exists){
  const playlist=resolve('.local/audio',`movement-${movement}-${identity}.ffconcat`);
  const lines=['ffconcat version 1.0',...parts.map(t=>`file '${resolve(root,t.file).replaceAll('\\','/').replaceAll("'","'\\''")}'`)];
  await writeFile(playlist,lines.join('\n')+'\n');
  const result=spawnSync('ffmpeg',['-nostdin','-v','error','-safe','0','-f','concat','-i',playlist,'-map','0:a:0','-c:a','flac','-map_metadata','-1','-y',output],{encoding:'utf8',windowsHide:true});
  if(result.status!==0)throw Error(result.stderr||`Movement ${movement} concat failed`);
 }
 const metadata=await parseFile(output,{duration:true,skipCovers:true});
 let offset=0;const spans=parts.map(part=>{const start=offset;offset+=part.duration;return{trackId:part.id,fingerprint:part.fingerprint,start,end:offset}});
 const duration=metadata.format.duration;
 if(Math.abs(duration-offset)>.15)throw Error(`Movement ${movement} duration mismatch: ${duration} / ${offset}`);
 continuous.push({id:`movement-${movement}-continuous`,recording:manifest.recording,movement,fingerprint:'sha256:'+await hash(output),duration,url:`/audio/movement-${movement}-continuous.flac`,parts:spans,file:output});
 console.log(`Continuous movement ${movement}: ${parts.length} source files, ${duration.toFixed(2)} sec`);
}
manifest.continuousTracks=continuous;
await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
await writeFile(resolve('content/real/continuous-recording.json'),JSON.stringify({version:1,recording:manifest.recording,tracks:continuous.map(({file,...track})=>track)},null,2)+'\n');
