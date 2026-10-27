import {chromium,expect} from '@playwright/test';
import {readFile,readdir,stat,mkdir,writeFile,rm} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawn,execFileSync} from 'node:child_process';
import {resolve,relative,isAbsolute,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),pkg=JSON.parse(await readFile(resolve(root,'package.json'),'utf8'));
const name=`Mahler-Lexicon-v${pkg.version}-windows-x64`,archive=resolve(root,'release',name+'.zip');
const target=resolve(root,'tmp','portable-smoke-unpacked'),inside=relative(resolve(root,'tmp'),target);
if(isAbsolute(inside)||inside.startsWith('..')||!inside)throw Error('Unsafe extraction directory');
try{await stat(target);await readFile(resolve(target,'.portable-test-marker'));await rm(target,{recursive:true})}catch(error){if(error.code!=='ENOENT')throw error}
await mkdir(target,{recursive:true});await writeFile(resolve(target,'.portable-test-marker'),'Generated portable smoke test\n');
const unicode=resolve(target,'中文 路径');await mkdir(unicode);
const quote=s=>"'"+s.replaceAll("'","''")+"'";
execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-WindowStyle','Hidden','-Command',`Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory(${quote(archive)},${quote(unicode)})`],{windowsHide:true,stdio:'inherit'});
const folder=resolve(unicode,name),manifest=JSON.parse(await readFile(resolve(folder,'manifest.json'),'utf8'));
const forbidden=/(^|\/)(?:agents?\.md|webui_agent[^/]*|context[^/]*|\.claude|\.codex|\.agents|\.aws|\.git|\.env[^/]*)(\/|$)/i;
const hashFile=async file=>{const hash=createHash('sha256');for await(const chunk of createReadStream(file))hash.update(chunk);return hash.digest('hex')};
for(const entry of manifest.files){if(forbidden.test(entry.path))throw Error('Private working file in package: '+entry.path);const file=resolve(folder,entry.path);expect((await stat(file)).size).toBe(entry.bytes);expect(await hashFile(file)).toBe(entry.sha256)}
async function list(directory){let found=[];for(const e of await readdir(directory,{withFileTypes:true})){const file=resolve(directory,e.name);found.push(...e.isDirectory()?await list(file):[relative(folder,file).replaceAll('\\','/')])}return found}
const actual=await list(folder);expect(actual.sort()).toEqual([...manifest.files.map(f=>f.path),'manifest.json'].sort());
expect(await hashFile(archive)).toBe((await readFile(archive+'.sha256','utf8')).split(/\s/)[0]);
const server=spawn(resolve(folder,'runtime/node.exe'),[resolve(folder,'server.mjs'),'--port=0','--no-open'],{cwd:folder,windowsHide:true,stdio:['ignore','pipe','pipe']});let browser;
try{
 const base=await new Promise((accept,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Portable startup timeout')),15000);server.on('exit',code=>{clearTimeout(timer);reject(Error('Portable startup exited: '+code))});server.stderr.on('data',c=>{output+=c});server.stdout.on('data',c=>{output+=c;const m=/http:\/\/127\.0\.0\.1:\d+\//.exec(output);if(m){clearTimeout(timer);accept(m[0])}})});
 browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://**/*',route=>route.abort());await page.goto(base);await page.waitForFunction(()=>document.querySelector('audio').readyState>=1);
 for(let movement=1;movement<=5;movement++){const response=await page.request.head(base+`audio/movement-${movement}-continuous.flac`);expect(response.status()).toBe(200);expect(Number(response.headers()['content-length'])).toBeGreaterThan(1000000)}
 const response=await page.request.get(base+'audio/movement-5-continuous.flac',{headers:{Range:'bytes=100-199'}});expect(response.status()).toBe(206);expect((await response.body()).length).toBe(100);expect(response.headers()['content-range']).toMatch(/^bytes 100-199\//);
 expect((await page.request.get(base+'audio/movement-5-continuous.flac',{headers:{Range:'bytes=999999999999-'}})).status()).toBe(416);
 expect((await page.request.get(base+'%2e%2e%5cserver.mjs')).status()).toBe(404);expect((await page.request.get(base+'.git/config')).status()).toBe(404);expect((await page.request.post(base)).status()).toBe(405);
 await page.locator('nav button').nth(4).click();await page.waitForFunction(()=>document.querySelector('audio').readyState>=1);await page.getByRole('button',{name:'播放',exact:true}).click();await expect.poll(()=>page.locator('audio').evaluate(a=>a.currentTime)).toBeGreaterThan(.1);await expect(page.locator('html')).toHaveAttribute('data-audio-reactive','analysed');await page.getByRole('button',{name:'暂停并探索',exact:true}).click();
 await page.getByLabel('小节号',{exact:true}).fill('472');await expect(page.locator('.measure-liquid-lens')).toHaveCount(1);await expect(page.locator('.lyrics-panel')).toBeVisible();
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('radio',{name:'启发探索',exact:true}).check();await page.getByRole('button',{name:'播放',exact:true}).click();await expect(page.locator('.focus-clue-button')).toBeVisible();await page.getByRole('button',{name:'暂停并探索',exact:true}).click();
 await expect(page.getByRole('button',{name:'导入解读 Markdown'})).toHaveCount(0);await expect(page.locator('audio')).toHaveCount(1);expect(errors).toEqual([]);
 console.log(`PASS portable ZIP: ${actual.length} verified files; excluded working records absent; bundled runtime in Unicode path; offline-font fallback; 5 audio files, range/HEAD/416, path isolation, playback/FFT, bar/lyrics/lens, guided stage and narrow screen`);
}finally{await browser?.close();server.kill()}
