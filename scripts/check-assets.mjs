import{readFile,stat}from'node:fs/promises';import{createReadStream}from'node:fs';import{createHash}from'node:crypto';import{resolve}from'node:path';
import{readdir}from'node:fs/promises';
const manifest=JSON.parse(await readFile('content/real/continuous-recording.json','utf8'));let total=0;
if((await readdir('dist/audio')).length!==manifest.tracks.length)throw Error('Build contains unexpected audio files');
for(const t of manifest.tracks){const path=resolve('dist',t.url.slice(1));const info=await stat(path);const hash=createHash('sha256');for await(const b of createReadStream(path))hash.update(b);if('sha256:'+hash.digest('hex')!==t.fingerprint)throw Error('Build audio fingerprint mismatch: '+t.id);total+=info.size;}
console.log(`PASS: ${manifest.tracks.length} production audio assets, ${total} bytes, all SHA-256 match`);
