import {chromium,expect} from '@playwright/test';
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
const maps=JSON.parse(await readFile('content/real/work-score-sync.json','utf8')).movements;
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','5196','--strictPort'],{stdio:'ignore',windowsHide:true});let browser;
try{
 await new Promise(r=>setTimeout(r,1200));browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5196');const audio=page.locator('audio');await expect(audio).toHaveCount(1);
 for(const d of maps){
  await page.locator('nav button').nth(d.movement-1).click();
  const score=page.getByRole('figure',{name:`第 ${d.movement} 乐章同步谱面`,exact:true});
  await page.waitForFunction(()=>document.querySelector('audio').readyState>=1);
  await expect(score.getByLabel('选择附近谱段')).toBeVisible();await expect(audio).toHaveJSProperty('paused',true);
  for(const index of [0,Math.floor(d.regions.length/2),d.regions.length-1]){
   const span=d.tracks[0].intervals[index];await audio.evaluate((a,t)=>{a.currentTime=t;a.dispatchEvent(new Event('timeupdate'))},(span.start+span.end)/2);
   await expect(score).toHaveAttribute('data-region',span.regionId);
   await expect(score.getByRole('img')).toHaveCount(d.regions[index].pages.length);
  }
  await page.getByRole('button',{name:'播放',exact:true}).click();
  const target=d.tracks[0].intervals[2];await score.getByLabel('选择附近谱段').selectOption(target.regionId);
  await expect(audio).toHaveJSProperty('paused',true);expect(await audio.evaluate(a=>a.currentTime)).toBeCloseTo(target.start,2);
  const later=d.tracks[0].intervals[3];await audio.evaluate((a,t)=>{a.currentTime=t;a.dispatchEvent(new Event('timeupdate'))},later.start+1);
  await expect(score).toHaveAttribute('data-region',target.regionId);await score.getByRole('button',{name:'跟随播放',exact:true}).click();
  await expect(score).toHaveAttribute('data-region',later.regionId);
  const origin=await audio.evaluate(a=>a.currentTime);await page.getByRole('radio',{name:'启发探索',exact:true}).check();expect(await audio.evaluate(a=>a.currentTime)).toBeCloseTo(origin,2);
  await score.getByRole('button',{name:'回听此谱段',exact:true}).click();await expect(audio).toHaveJSProperty('paused',false);
  await page.getByRole('button',{name:'仅返回',exact:true}).click();await expect(audio).toHaveJSProperty('paused',true);expect(await audio.evaluate(a=>a.currentTime)).toBeCloseTo(origin,2);
  await expect(page.getByRole('radio',{name:'启发探索',exact:true})).toBeChecked();await page.getByRole('radio',{name:'自由检索',exact:true}).check();
  await score.getByRole('button',{name:'上一谱段',exact:true}).focus();await page.keyboard.press('Enter');await expect(score).toHaveAttribute('data-region',target.regionId);
  for(const width of [390,320]){await page.setViewportSize({width,height:844});await score.getByRole('button',{name:'放大谱面',exact:true}).click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await score.getByRole('button',{name:'收起放大',exact:true}).click();}
  if(d.movement===5){await score.screenshot({path:'docs/work-score-sync-narrow.png'});await page.setViewportSize({width:1280,height:1000});await score.screenshot({path:'docs/work-score-sync-desktop.png'})}
  await page.setViewportSize({width:1280,height:1000});
 }
 await page.locator('nav button').nth(0).click();await page.locator('input[type=file]').first().setInputFiles('public/assets/demo.wav');
 await expect(page.locator('.score-page-follow')).toContainText('当前音频没有匹配的谱面映射');await expect(page.locator('.score-page-follow select')).toHaveCount(0);
 const broken=await browser.newPage();await broken.route('**/assets/scores/work/page-128.webp',r=>r.abort());await broken.goto('http://127.0.0.1:5196');await broken.locator('nav button').nth(3).click();
 await expect(broken.locator('.score-page-follow')).toContainText('谱页加载失败');await expect(broken.getByRole('button',{name:'播放',exact:true})).toBeEnabled();await broken.close();
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS movements I/II/IV/V: automatic beginning/middle/end follow, page seek, replay/return, mode position, single audio, keyboard, 320/390px zoom, unknown audio isolation, missing page fallback');
}finally{await browser?.close();server.kill()}
