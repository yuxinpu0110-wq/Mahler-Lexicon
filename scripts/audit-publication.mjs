import {execFileSync} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=execFileSync('git',['ls-files','--stage','-z'],{cwd:root,encoding:'utf8'});
const entries=output.split('\0').filter(Boolean).map(row=>{const i=row.indexOf('\t'),[mode,hash,stage]=row.slice(0,i).split(' ');return {mode,hash,stage,path:row.slice(i+1)}});
if(!entries.length)throw Error('No staged project files');
const forbidden=/(^|\/)(?:agents?\.md|webui_agent[^/]*|context[^/]*|PROJECT_OVERVIEW\.md|\.claude|\.codex|\.agents|\.aws|\.git|\.env(?:\.[^/]*)?|node_modules|tmp|dist)(\/|$)|^docs\/(?:PROGRESS|DECISIONS|WEBUI_DESIGN)\.md$|^release\/(?:Mahler-Lexicon-[^/]*|cache)(\/|$)/i;
for(const e of entries){if(e.stage!=='0'||e.mode==='120000')throw Error('Unresolved index or symlink: '+e.path);if(forbidden.test(e.path))throw Error('Excluded local file staged: '+e.path)}
const sizes=execFileSync('git',['cat-file','--batch-check=%(objectname) %(objectsize)'],{cwd:root,input:entries.map(e=>e.hash).join('\n')+'\n',encoding:'utf8'}).trim().split('\n').map(line=>Number(line.split(' ')[1]));
for(const [i,size]of sizes.entries())if(size>=100*1024*1024)throw Error('GitHub oversized blob: '+entries[i].path);
try{
 const hits=execFileSync('git',['grep','--cached','-I','-l','-E','(ghp_|gho_|github_pat_)[A-Za-z0-9_]{20,}|AKIA[A-Z0-9]{16}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----'],{cwd:root,encoding:'utf8'});
 if(hits.trim())throw Error('Review possible credential material in: '+hits.trim());
}catch(error){if(error.status!==1)throw error}
const paths=entries.map(e=>e.path).sort((a,b)=>a.localeCompare(b,'en'));
if(process.argv.includes('--write-list'))await writeFile(resolve(root,'release/SOURCE_FILES.txt'),paths.join('\n')+'\n');
const categories={};for(const path of paths){const category=path.includes('/')?path.split('/')[0]:'root';categories[category]=(categories[category]||0)+1}
console.log(JSON.stringify({files:entries.length,bytes:sizes.reduce((a,b)=>a+b,0),largestBlob:Math.max(...sizes),categories,excludedFilesPresent:0,credentialMatches:0},null,2));
