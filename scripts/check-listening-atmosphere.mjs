import {chromium,expect} from '@playwright/test';
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {computeMovement5DawnProgress} from '../src/dawnProgress.ts';
const fifth=JSON.parse(await readFile('content/real/work-measure-sync.json','utf8')).movements.find(d=>d.movement===5);
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','5203','--strictPort'],{stdio:'ignore',windowsHide:true});let browser;
try{
 await new Promise(r=>setTimeout(r,1000));browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1100},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.__sources=0;const Base=window.AudioContext;window.AudioContext=class extends Base {createMediaElementSource(el){window.__sources++;return super.createMediaElementSource(el)}}});
 await page.goto('http://127.0.0.1:5203');await page.locator('nav button').nth(4).click();await page.waitForFunction(()=>document.querySelector('audio').readyState>=1);
 const audio=page.locator('audio'),progress=()=>page.evaluate(()=>Number(getComputedStyle(document.documentElement).getPropertyValue('--dawn-progress')));
 const position=async bar=>{const span=fifth.tracks[0].intervals[bar-1];await audio.evaluate((a,t)=>{a.currentTime=t;a.dispatchEvent(new Event('timeupdate'))},span.start+.001);await expect.poll(progress).toBeCloseTo(computeMovement5DawnProgress(bar),3)};
 const canvasColor=()=>page.locator('.ambient-canvas').evaluate(el=>{const c=document.createElement('canvas');c.width=c.height=1;const ctx=c.getContext('2d');ctx.fillStyle=getComputedStyle(el).backgroundColor;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3)});
 for(const bar of [471,472,511,512]){await position(bar);const rgb=await canvasColor();expect(Math.max(...rgb)).toBeLessThan(30)}
 await position(511);expect(Number(await page.locator('.ambient-horizon-dawn').evaluate(el=>getComputedStyle(el).opacity))).toBeCloseTo(.45,2);
 for(const [bar,name]of [[500,'whisper'],[550,'mist'],[620,'daybreak'],[740,'gold']]){await position(bar);await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`docs/dawn-${name}.png`})}
 await position(579);expect(Math.max(...await canvasColor())).toBeLessThan(130);
 await position(639);expect(Math.min(...await canvasColor())).toBeGreaterThan(200);
 await position(762);const final=await canvasColor();for(const [i,n]of [250,247,240].entries())expect(final[i]).toBeCloseTo(n,0);
 // A seek crosses the palette through damping, rather than instantly repainting.
 await page.emulateMedia({reducedMotion:'no-preference'});
 const early=fifth.tracks[0].intervals[499];await audio.evaluate((a,t)=>{a.currentTime=t;a.dispatchEvent(new Event('timeupdate'))},early.start+.001);await page.waitForTimeout(150);
 expect(await progress()).toBeGreaterThan(computeMovement5DawnProgress(500));expect(await progress()).toBeLessThan(1);
 await page.emulateMedia({reducedMotion:'reduce'});await expect.poll(progress).toBeCloseTo(computeMovement5DawnProgress(500),3);await page.emulateMedia({reducedMotion:'no-preference'});
 await page.getByRole('radio',{name:'启发探索',exact:true}).check();await page.getByRole('button',{name:'播放',exact:true}).click();
 await expect(page.locator('main')).toHaveAttribute('data-concert','true');await expect(page.locator('html')).toHaveAttribute('data-audio-reactive','analysed');
 await expect.poll(()=>page.evaluate(()=>Number(getComputedStyle(document.documentElement).getPropertyValue('--audio-mid')))).toBeGreaterThan(.001);
 expect(await page.evaluate(()=>window.__sources)).toBe(1);await expect(audio).toHaveCount(1);await expect(audio).toHaveJSProperty('paused',false);
 const dock=page.locator('.floating-player-dock'),stage=page.locator('.focus-stage-container'),clue=page.locator('.focus-clue-button');
 expect((await dock.boundingBox()).width).toBeLessThanOrEqual(720.1);expect(await dock.evaluate(el=>getComputedStyle(el).borderRadius)).toBe('999px');
 expect(await stage.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');expect(await stage.evaluate(el=>getComputedStyle(el).boxShadow)).toBe('none');
 await expect(clue).toBeVisible();await expect(page.locator('.guide-depth')).toBeHidden();
 await page.mouse.move(0,0);await expect.poll(()=>page.locator('.player-prelude').evaluate(el=>Number(getComputedStyle(el).opacity))).toBeCloseTo(.2,2);
 await page.locator('.player-prelude').hover();await expect.poll(()=>page.locator('.player-prelude').evaluate(el=>Number(getComputedStyle(el).opacity))).toBeCloseTo(.9,2);await page.mouse.move(0,0);await expect.poll(()=>page.locator('.player-prelude').evaluate(el=>Number(getComputedStyle(el).opacity))).toBeCloseTo(.2,2);
 await page.locator('.player').screenshot({path:'docs/poetic-stage.png'});
 // Only the words animate when the clue changes; keyboard focus stays put.
 await clue.focus();const before=await clue.getAttribute('aria-label');const next=fifth.tracks[0].intervals[511];await audio.evaluate((a,t)=>{a.currentTime=t;a.dispatchEvent(new Event('timeupdate'))},next.start+.02);
 await expect(clue).not.toHaveAttribute('aria-label',before);expect(await clue.evaluate(el=>el===document.activeElement)).toBe(true);
 await clue.click();await expect(audio).toHaveJSProperty('paused',true);await expect(page.locator('.guide-depth')).toBeVisible();
 await page.getByRole('button',{name:'播放',exact:true}).click();await expect(audio).toHaveJSProperty('paused',false);expect(await page.evaluate(()=>window.__sources)).toBe(1);
 for(const width of [390,320]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.locator('.player').screenshot({path:`docs/poetic-stage-${width}.png`})}
 await page.getByRole('switch',{name:'隐藏提示，连续聆听',exact:true}).focus();await page.keyboard.press('Space');await expect(page.getByRole('switch',{name:'隐藏提示，连续聆听',exact:true})).toBeChecked();await expect(audio).toHaveJSProperty('paused',false);
 await page.getByRole('button',{name:'暂停并探索',exact:true}).click();await expect(page.locator('main')).toHaveAttribute('data-concert','false');
 await page.emulateMedia({reducedMotion:'reduce'});await expect.poll(()=>page.evaluate(()=>Number(getComputedStyle(document.documentElement).getPropertyValue('--audio-mid')))).toBe(0);
 await page.locator('nav button').nth(1).click();await page.waitForFunction(()=>document.querySelector('audio').readyState>=1);await page.getByRole('button',{name:'播放',exact:true}).click();expect(await page.evaluate(()=>window.__sources)).toBe(1);await page.getByRole('button',{name:'暂停并探索',exact:true}).click();
 // Unsupported analysis keeps native playback usable and uses a slow visual fallback.
 const fallback=await browser.newPage();await fallback.addInitScript(()=>{Object.defineProperty(window,'AudioContext',{value:undefined,configurable:true});Object.defineProperty(window,'webkitAudioContext',{value:undefined,configurable:true})});
 await fallback.goto('http://127.0.0.1:5203');await fallback.waitForFunction(()=>document.querySelector('audio').readyState>=1);await fallback.getByRole('button',{name:'播放',exact:true}).click();await expect(fallback.locator('html')).toHaveAttribute('data-audio-reactive','fallback');await expect.poll(()=>fallback.locator('audio').evaluate(a=>a.currentTime)).toBeGreaterThan(.1);await fallback.close();
 expect(errors).toEqual([]);console.log('PASS four staged dawn palettes, dark ppp entry, horizon, damped seeks, real FFT, one reusable audio graph, poetic stage/dock, dim/hover, focus-preserving cue, pause/explore, keyboard switches, narrow, reduced motion and native fallback');
}finally{await browser?.close();server.kill()}
