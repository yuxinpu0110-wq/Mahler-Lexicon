import {chromium,expect} from '@playwright/test';
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
const production=process.argv.includes('--production'),port=production?'5189':'5188',base='http://127.0.0.1:'+port;
const library=JSON.parse(await readFile('content/real/continuous-recording.json','utf8'));
const server=spawn('node',['node_modules/vite/bin/vite.js',...(production?['preview']:[]),'--host','127.0.0.1','--port',port,'--strictPort'],{stdio:'ignore',windowsHide:true});let browser;
try{
 await new Promise(r=>setTimeout(r,1400));browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);const audio=page.locator('audio');await expect(audio).toHaveCount(1);await expect(audio).toHaveJSProperty('paused',true);await expect(page.getByLabel('乐章内分轨')).toHaveCount(0);
 for(const track of library.tracks){
  await page.locator('nav button').nth(track.movement-1).click();await page.waitForFunction(duration=>Math.abs(document.querySelector('audio').duration-duration)<.15,track.duration);expect(Math.abs(Number(await page.getByLabel('播放位置',{exact:true}).getAttribute('max'))-track.duration)).toBeLessThan(.001);await page.getByRole('button',{name:'播放',exact:true}).click();await expect(audio).toHaveJSProperty('paused',false);
  if(track.parts.length>1){const boundary=track.parts[0].end;const source=await audio.getAttribute('src');await audio.evaluate((a,t)=>a.currentTime=t,boundary-.08);await page.waitForFunction(boundary=>{const a=document.querySelector('audio');return a.currentTime>boundary&&!a.paused},boundary);await expect(audio).toHaveAttribute('src',source)}
  await page.getByRole('button',{name:'暂停并探索'}).click();
 }
 await page.locator('nav button').nth(2).click();await page.waitForFunction(()=>document.querySelector('audio').duration>684&&document.querySelector('audio').duration<685);await page.getByLabel('连续播放',{exact:true}).check();await page.getByRole('button',{name:'播放',exact:true}).click();await audio.evaluate(a=>a.currentTime=a.duration-.1);await page.waitForFunction(()=>document.querySelector('nav button[aria-pressed=true] small').textContent==='04'&&!document.querySelector('audio').paused);await page.getByRole('button',{name:'暂停并探索'}).click();
 const response=await page.request.get(base+library.tracks[0].url,{headers:{Range:'bytes=100-199'}});if(response.status()!==206||(await response.body()).length!==100)throw Error('range delivery failed');if(production)await expect(page.getByRole('button',{name:'导入解读 Markdown'})).toHaveCount(0);
 await page.setViewportSize({width:390,height:844});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('narrow overflow');if(errors.length)throw Error(errors.join('\n'));console.log(`PASS ${production?'production':'development'} recording: 5 whole movements, continuous file boundaries, next movement, range delivery, single audio, no track picker, narrow`);
}finally{await browser?.close();server.kill()}
