import {readdir,readFile,writeFile,mkdir,copyFile,rm,stat} from 'node:fs/promises';
import {resolve,relative,isAbsolute,dirname,basename} from 'node:path';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),release=resolve(root,'release');
const pkg=JSON.parse(await readFile(resolve(root,'package.json'),'utf8')),version=pkg.version;
if(!/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(version))throw Error('Invalid release version');
if(process.platform!=='win32'||process.arch!=='x64')throw Error('Build this Windows x64 portable package with Windows x64 Node.js.');
const name=`Mahler-Lexicon-v${version}-windows-x64`,bundle=resolve(release,name),archive=resolve(release,name+'.zip');
const inside=relative(release,bundle);if(isAbsolute(inside)||inside.startsWith('..')||bundle===release)throw Error('Unsafe output directory');
let present=false;try{await stat(bundle);present=true}catch(error){if(error.code!=='ENOENT')throw error}
if(present){const old=JSON.parse(await readFile(resolve(bundle,'version.json'),'utf8'));if(old.application!=='Mahler Lexicon')throw Error('Refusing to replace an unknown directory');await rm(bundle,{recursive:true})}
await mkdir(resolve(bundle,'runtime'),{recursive:true});
await writeFile(resolve(bundle,'version.json'),JSON.stringify({application:'Mahler Lexicon',version:'v'+version,build:'packaging'}));
const forbidden=/(^|\/)(?:agents?\.md|webui_agent[^/]*|context[^/]*|\.claude|\.codex|\.agents|\.aws|\.git|\.env[^/]*)(\/|$)/i;
async function copyTree(from,to){await mkdir(to,{recursive:true});for(const e of await readdir(from,{withFileTypes:true})){if(e.isSymbolicLink())throw Error('Symlinks are not allowed in release');const source=resolve(from,e.name),target=resolve(to,e.name);if(e.isDirectory())await copyTree(source,target);else if(e.isFile())await copyFile(source,target)}}
await copyTree(resolve(root,'dist'),resolve(bundle,'app'));
await copyFile(process.execPath,resolve(bundle,'runtime/node.exe'));
await copyFile(resolve(release,'launcher/START.cmd'),resolve(bundle,'START.cmd'));
await copyFile(resolve(release,'launcher/server.mjs'),resolve(bundle,'server.mjs'));
await copyFile(resolve(root,'scripts/audio-range.mjs'),resolve(bundle,'audio-range.mjs'));
const guide=await readFile(resolve(release,'使用指南.md'),'utf8');await writeFile(resolve(bundle,'README.md'),guide);await writeFile(resolve(bundle,'使用指南.txt'),'\uFEFF'+guide);
const cache=resolve(release,'cache');await mkdir(cache,{recursive:true});const licenseCache=resolve(cache,`node-${process.version}-LICENSE.txt`);
let license;try{license=await readFile(licenseCache,'utf8')}catch{
 const response=await fetch(`https://raw.githubusercontent.com/nodejs/node/${process.version}/LICENSE`);if(!response.ok)throw Error('Cannot obtain the matching Node.js license: '+response.status);license=await response.text();await writeFile(licenseCache,license);
}
if(!license.includes('Node.js')||!license.includes('Copyright'))throw Error('Unexpected runtime license');await writeFile(resolve(bundle,'runtime/LICENSE.txt'),license);
await writeFile(resolve(bundle,'THIRD_PARTY_NOTICES.txt'),`Node.js ${process.version}: bundled Windows x64 runtime. License and third-party notices: runtime/LICENSE.txt.\nRecording: Leonard Bernstein / New York Philharmonic / 1987, supplied as project resources. Score and content sources: https://github.com/yuxinpu0110-wq/Mahler-Lexicon/blob/main/docs/SOURCES.md\n`);
const hashFile=async path=>{const hash=createHash('sha256');for await(const chunk of createReadStream(path))hash.update(chunk);return hash.digest('hex')};
const appIndex=await readFile(resolve(bundle,'app/index.html'));const build=createHash('sha256').update(appIndex).digest('hex').slice(0,16);
const metadata={application:'Mahler Lexicon',version:'v'+version,build,platform:'windows-x64',runtime:process.version};
await writeFile(resolve(bundle,'version.json'),JSON.stringify(metadata,null,2)+'\n');
const entries=[];
async function inventory(directory){for(const e of await readdir(directory,{withFileTypes:true})){const file=resolve(directory,e.name),name=relative(bundle,file).replaceAll('\\','/');if(forbidden.test(name))throw Error('Excluded working file in release: '+name);if(e.isDirectory())await inventory(file);else{const info=await stat(file);entries.push({path:name,bytes:info.size,sha256:await hashFile(file)})}}}
await inventory(bundle);entries.sort((a,b)=>a.path.localeCompare(b.path,'en'));
await writeFile(resolve(bundle,'manifest.json'),JSON.stringify({...metadata,files:entries},null,2)+'\n');
try{await rm(archive)}catch(error){if(error.code!=='ENOENT')throw error}
const quote=s=>"'"+s.replaceAll("'","''")+"'";
execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-WindowStyle','Hidden','-Command',`Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory(${quote(bundle)},${quote(archive)},[System.IO.Compression.CompressionLevel]::Optimal,$true)`],{stdio:'inherit',windowsHide:true});
const checksum=await hashFile(archive);await writeFile(archive+'.sha256',`${checksum}  ${basename(archive)}\n`);
console.log(JSON.stringify({folder:relative(root,bundle),archive:relative(root,archive),files:entries.length+1,bytes:(await stat(archive)).size,sha256:checksum},null,2));
