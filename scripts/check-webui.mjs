import {chromium,expect} from '@playwright/test';
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
const maps=JSON.parse(await readFile('content/real/work-measure-sync.json','utf8')).movements;
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','5199','--strictPort'],{stdio:'ignore',windowsHide:true});let browser;
try{
 await new Promise(r=>setTimeout(r,1000));browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5199');await page.waitForFunction(()=>document.querySelector('audio').readyState>=1);
 const audio=page.locator('audio');
 for(const movement of [1,2,3,4,5]){
  await page.locator('nav button').nth(movement-1).click();await page.waitForFunction(()=>document.querySelector('audio').readyState>=1);
  await expect(page.locator('body')).toHaveAttribute('data-movement',String(movement));await expect(audio).toHaveJSProperty('paused',true);
  await expect(page.locator('.score-toolbar')).toBeVisible();
  await expect(page.locator('.current-score .score-viewport [role=img]').first()).toBeVisible();
  const filter=await page.locator('.score-raster-transparent').first().evaluate(el=>getComputedStyle(el).filter);
  expect(filter.includes('url(')).toBe(true);
  expect(await page.locator('.current-score svg').first().evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  await expect(page.locator('.current-score .score-paper')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.waitForTimeout(1250);await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:`docs/webui-m${movement}.png`});
 }
 await page.locator('nav button').nth(2).click();await page.waitForFunction(()=>document.querySelector('audio').readyState>=1);
 await page.getByLabel('小节号',{exact:true}).fill('465');await audio.evaluate(a=>{a.currentTime+=.02;a.dispatchEvent(new Event('timeupdate'))});await expect(page.locator('body')).toHaveAttribute('data-event','cry');
 await page.waitForTimeout(1250);await page.locator('.listening-workspace').screenshot({path:'docs/webui-cry-reading.png'});
 await page.getByLabel('小节号',{exact:true}).fill('473');await audio.evaluate(a=>{a.currentTime+=.02;a.dispatchEvent(new Event('timeupdate'))});await expect(page.locator('body')).toHaveAttribute('data-event','none');
 await page.locator('nav button').nth(4).click();await page.waitForFunction(()=>document.querySelector('audio').readyState>=1);
 const fifth=maps.find(d=>d.movement===5);
 const position=async n=>audio.evaluate((a,t)=>{a.currentTime=t;a.dispatchEvent(new Event('timeupdate'))},fifth.tracks[0].intervals[n-1].start+.01);
 await position(471);await expect(page.locator('body')).toHaveAttribute('data-phase','storm');
 await position(472);await expect(page.locator('body')).toHaveAttribute('data-phase','dawn');
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect.poll(()=>page.evaluate(()=>Number(getComputedStyle(document.body).getPropertyValue('--dawn-progress')))).toBeLessThan(.001);
 await position(762);
 await expect.poll(()=>page.evaluate(()=>Number(getComputedStyle(document.body).getPropertyValue('--dawn-progress')))).toBe(1);
 expect(await page.locator('.score-raster-transparent').first().evaluate(el=>getComputedStyle(el).filter)).toContain('url(');
 await page.waitForTimeout(1250);await page.locator('.listening-workspace').screenshot({path:'docs/webui-dawn-reading.png'});await page.emulateMedia({reducedMotion:'no-preference'});
 // Browsing text never changes the palette; the matched audio position does.
 await page.getByLabel('小节号',{exact:true}).fill('40');await expect(page.locator('body')).toHaveAttribute('data-phase','storm');
 const t=await audio.evaluate(a=>a.currentTime);await page.getByRole('radio',{name:'启发探索',exact:true}).check();
 await page.getByRole('button',{name:'播放',exact:true}).click();
 await expect(page.locator('.guide-depth')).toBeHidden();await expect(page.getByRole('button',{name:'暂停并展开深度解析'})).toBeVisible();
 await expect(page.locator('.cue-inner > button')).toHaveCount(1);await expect(audio).toHaveJSProperty('paused',false);
 await page.getByRole('button',{name:'暂停并展开深度解析',exact:true}).click();await expect(audio).toHaveJSProperty('paused',true);await expect(page.locator('.guide-depth')).toBeVisible();
 expect(await audio.evaluate(a=>a.currentTime)).toBeGreaterThanOrEqual(t);
 await page.getByRole('radio',{name:'自由检索',exact:true}).check();
 // The fifth-movement g32 range is inside bold Markdown. It must remain
 // an actual link and select the complete target range.
 const index=page.locator('.guide-index');if(!await index.evaluate(el=>el.open))await index.locator('summary').click();
 await index.locator('button').nth(31).click();await page.locator('.guide-panel').getByRole('radio',{name:'结构',exact:true}).check();
 await page.locator('.guide-body strong a[data-bar-from="640"]').click();
 expect(await audio.evaluate(a=>a.currentTime)).toBeCloseTo(fifth.tracks[0].intervals[639].start,2);
 expect(Number(await page.getByLabel('试听终点（秒）',{exact:true}).inputValue())).toBeCloseTo(fifth.tracks[0].intervals[654].end,3);
 for(const width of [390,320]){
  await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('.score-toolbar').screenshot({path:`docs/webui-toolbar-${width}.png`});
  await page.locator('.listening-workspace').screenshot({path:`docs/webui-reading-${width}.png`});
 }
 await page.emulateMedia({reducedMotion:'reduce'});expect(await page.locator('.movement-highlight').evaluate(el=>getComputedStyle(el).transitionDuration)).toBe('0s');
 await page.getByLabel('小节号',{exact:true}).focus();await page.keyboard.press('ArrowUp');
 await expect(audio).toHaveCount(1);
 // Reproduce clicks while a file is waiting for metadata, for all four new
 // movements. Each link must actually seek, not just change the guide text.
 for(const movement of [1,2,4,5]){
  const isolated=await browser.newPage();let release;const hold=new Promise(r=>release=r);
  await isolated.route(`**/audio/movement-${movement}-continuous.flac`,async route=>{await hold;await route.continue()});
  await isolated.goto('http://127.0.0.1:5199');await isolated.locator('nav button').nth(movement-1).click();
  const panel=isolated.locator('.guide-panel');await panel.locator('.guide-index summary').click();await panel.locator('.guide-index button').nth(1).click();
  await panel.getByRole('radio',{name:'结构',exact:true}).check();
  const link=panel.locator('.guide-body a').first(),from=Number(await link.getAttribute('data-bar-from')),to=Number(await link.getAttribute('data-bar-to'));
  await link.click();await expect(isolated.getByRole('alert')).toContainText('正在载入录音');release();
  await isolated.waitForFunction(()=>document.querySelector('audio').readyState>=1);
  const d=maps.find(d=>d.movement===movement),a=isolated.locator('audio');
  await expect.poll(()=>a.evaluate(el=>el.currentTime)).toBeCloseTo(d.tracks[0].intervals[from-1].start,2);
  expect(Number(await isolated.getByLabel('试听终点（秒）',{exact:true}).inputValue())).toBeCloseTo(d.tracks[0].intervals[to-1].end,3);
  await expect(a).toHaveJSProperty('paused',true);await expect(isolated.locator('[role=alert]')).toHaveCount(0);await isolated.close();
 }
 // A later movement choice cancels a waiting link from an old recording.
 const cancelled=await browser.newPage();let releaseOld;const holdOld=new Promise(r=>releaseOld=r);
 await cancelled.route('**/audio/movement-2-continuous.flac',async route=>{await holdOld;await route.continue()});
 await cancelled.goto('http://127.0.0.1:5199');await cancelled.locator('nav button').nth(1).click();
 await cancelled.locator('.guide-panel').getByRole('radio',{name:'结构',exact:true}).check();await cancelled.locator('.guide-body a').first().click();await cancelled.locator('nav button').nth(3).click();releaseOld();
 await cancelled.waitForFunction(()=>document.querySelector('audio').readyState>=1);expect(await cancelled.locator('audio').evaluate(a=>a.currentTime)).toBe(0);await expect(cancelled.locator('body')).toHaveAttribute('data-movement','4');await cancelled.close();
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS web UI: five palettes, score blending, audio-driven dawn, guided depth toggle, single cue/audio, 320/390px, keyboard, reduced motion; bold-nested link, four delayed-metadata links and cancelled stale request');
}finally{await browser?.close();server.kill()}
