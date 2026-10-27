import http from 'node:http';
import {createReadStream} from 'node:fs';
import {stat,readFile} from 'node:fs/promises';
import {resolve,relative,isAbsolute,extname,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {parseByteRange} from './audio-range.mjs';

const directory=dirname(fileURLToPath(import.meta.url)),root=resolve(directory,'app');
const info=JSON.parse(await readFile(resolve(directory,'version.json'),'utf8'));
const portArg=process.argv.find(a=>a.startsWith('--port='));
const requested=portArg?Number(portArg.slice(7)):47823;
if(!Number.isInteger(requested)||requested<0||requested>65535)throw Error('Invalid port');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.wav':'audio/wav','.flac':'audio/flac','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return}
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(pathname==='/__mahler_health'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:JSON.stringify({application:'Mahler Lexicon',version:info.version,build:info.build}));return}
  const name=pathname==='/'?'index.html':pathname.replace(/^\/+/,''),target=resolve(root,name),inside=relative(root,target);
  if(isAbsolute(inside)||inside==='..'||inside.startsWith('..\\')||inside.startsWith('../')||name.includes(':')||name.split(/[\\/]/).some(part=>part.startsWith('.'))){res.writeHead(404);res.end();return}
  const file=await stat(target);if(!file.isFile()){res.writeHead(404);res.end();return}
  const range=parseByteRange(req.headers.range,file.size);
  if(!range){res.writeHead(416,{'Content-Range':`bytes */${file.size}`});res.end();return}
  const {start,end}=range,headers={'Content-Type':mime[extname(target).toLowerCase()]||'application/octet-stream','Content-Length':end-start+1,'Accept-Ranges':'bytes','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'};
  if(req.headers.range)headers['Content-Range']=`bytes ${start}-${end}/${file.size}`;
  res.writeHead(req.headers.range?206:200,headers);if(req.method==='HEAD'){res.end();return}
  const stream=createReadStream(target,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
 }catch(error){res.writeHead(error instanceof URIError?400:404);res.end()}
});
function openBrowser(url){
 if(process.argv.includes('--no-open'))return;
 const [cmd,args]=process.platform==='win32'?['rundll32.exe',['url.dll,FileProtocolHandler',url]]:process.platform==='darwin'?['open',[url]]:['xdg-open',[url]];
 const child=spawn(cmd,args,{windowsHide:true,stdio:'ignore'});child.on('error',()=>console.log('Open the address above in your browser.'));child.unref();
}
async function isExisting(port){try{const response=await fetch(`http://127.0.0.1:${port}/__mahler_health`,{signal:AbortSignal.timeout(1000)});const body=await response.json();return body.application==='Mahler Lexicon'&&body.version===info.version&&body.build===info.build}catch{return false}}
async function listen(port){return new Promise((accept,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',()=>{server.removeListener('error',reject);accept(server.address().port)})})}
let opened=false;
for(let attempt=0;attempt<6;attempt++){
 const candidate=requested===0?0:requested+attempt;
 try{
  const port=await listen(candidate),url=`http://127.0.0.1:${port}/`;console.log(`Mahler Lexicon ${info.version}\n${url}\nKeep this window open while listening. Close it or press Ctrl+C to stop.`);openBrowser(url);opened=true;break;
 }catch(error){
  if(error.code!=='EADDRINUSE')throw error;
  if(await isExisting(candidate)){const url=`http://127.0.0.1:${candidate}/`;console.log(`Already running: ${url}`);openBrowser(url);opened=true;break}
 }
}
if(!opened)throw Error('No free local port. Close previous listening windows and try again.');
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{server.closeAllConnections();server.close(()=>process.exit(0))});
