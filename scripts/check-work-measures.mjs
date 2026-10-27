import {chromium,expect} from '@playwright/test';
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {parseGuideMarkdown} from '../src/guideMarkdown.ts';
import {authorGuideFiles} from '../src/authorFiles.ts';
const maps=JSON.parse(await readFile('content/real/work-measure-sync.json','utf8')).movements;
const labels=['第一','第二','第三','第四','第五'];
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','5198','--strictPort'],{stdio:'ignore',windowsHide:true});let browser;
try{
 await new Promise(r=>setTimeout(r,1200));browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5198');
 const audio=page.locator('audio');await expect(audio).toHaveCount(1);
 for(const d of maps){
  const doc=parseGuideMarkdown(await readFile('content/listen_guide/'+authorGuideFiles[d.movement],'utf8'));
  await page.locator('nav button').nth(d.movement-1).click();
  await page.waitForFunction(()=>document.querySelector('audio').readyState>=1);
  const score=page.getByRole('figure',{name:`第 ${d.movement} 乐章同步谱面`,exact:true});
  const panel=page.getByRole('region',{name:labels[d.movement-1]+'乐章导读',exact:true});
  await expect(score.getByLabel('小节号',{exact:true})).toBeVisible();await expect(audio).toHaveJSProperty('paused',true);
  for(const number of [1,Math.floor(d.barCount/2),d.barCount]){
   await score.getByLabel('小节号',{exact:true}).fill(String(number));
   await expect(score.getByLabel('小节号',{exact:true})).toHaveValue(String(number));
   expect(await audio.evaluate(a=>a.currentTime)).toBeCloseTo(d.tracks[0].intervals[number-1].start,3);
   await expect(audio).toHaveJSProperty('paused',true);
   await expect(score).toHaveAttribute('data-region',d.measures[number-1].regionId);
  }
  // A directory click pauses and selects the bar; a range link selects all
  // bars of that guide, without changing the only audio element or source.
  await score.getByLabel('小节号',{exact:true}).fill('1');
  const index=panel.locator('.guide-index');if(!await index.evaluate(e=>e.open))await index.locator('summary').click();
  const guide=doc.guides[1];await index.getByRole('button',{name:new RegExp(`^${guide.from}—${guide.to}`)}).click();
  await expect(panel.locator('.guide-heading')).toContainText(guide.title);
  await panel.getByRole('button',{name:`第 ${guide.from}—${guide.to} 小节 ↗`,exact:true}).click();
  const from=d.tracks[0].intervals[guide.from-1],to=d.tracks[0].intervals[guide.to-1];
  expect(Number(await page.getByLabel('试听起点（秒）',{exact:true}).inputValue())).toBeCloseTo(from.start,4);
  expect(Number(await page.getByLabel('试听终点（秒）',{exact:true}).inputValue())).toBeCloseTo(to.end,4);
  const origin=await audio.evaluate(a=>a.currentTime),src=await audio.getAttribute('src');
  await panel.getByRole('radio',{name:'和声',exact:true}).check();
  await page.getByRole('radio',{name:'启发探索',exact:true}).check();
  expect(await audio.evaluate(a=>a.currentTime)).toBeCloseTo(origin,2);
  await page.getByRole('button',{name:'播放',exact:true}).click();
  await expect(page.locator('.cue-inner > button')).toHaveText(guide.prompt+' ↗');
  await expect(audio).toHaveJSProperty('paused',false);
  const cueTime=await audio.evaluate(a=>a.currentTime);
  await page.locator('.cue-inner > button').click();await expect(audio).toHaveJSProperty('paused',true);
  expect(await audio.evaluate(a=>a.currentTime)).toBeCloseTo(cueTime,0);
  await expect(panel.getByRole('radio',{name:'赏析',exact:true})).toBeChecked();
  await page.getByRole('button',{name:'仅返回',exact:true}).click();
  await expect(panel.getByRole('radio',{name:'和声',exact:true})).toBeChecked();
  await expect(page.getByRole('radio',{name:'启发探索',exact:true})).toBeChecked();
  await expect(score.getByLabel('小节号',{exact:true})).toHaveValue(String(guide.from));
  await expect(audio).toHaveAttribute('src',src);
  // Follow the sound after manual browsing; a jump only shows the one guide
  // at the destination. Hiding prompts and changing modes keep playback.
  await score.getByRole('button',{name:'跟随播放',exact:true}).click();
  const another=doc.guides[3],span=d.tracks[0].intervals[another.from-1];
  await audio.evaluate((a,t)=>{a.currentTime=t;a.dispatchEvent(new Event('timeupdate'))},span.start+.05);
  await page.getByRole('button',{name:'播放',exact:true}).click();
  await expect(page.locator('.cue-inner > button')).toHaveText(another.prompt+' ↗');
  await expect(panel.locator('.guide-heading')).toContainText(another.title);
  await page.getByLabel('隐藏提示，连续聆听',{exact:true}).check();await expect(page.locator('.cue-inner > button')).toHaveCount(0);await expect(audio).toHaveJSProperty('paused',false);
  await page.getByLabel('隐藏提示，连续聆听',{exact:true}).uncheck();
  await page.getByRole('radio',{name:'自由检索',exact:true}).check();await expect(audio).toHaveJSProperty('paused',false);
  await page.getByRole('button',{name:'暂停并探索',exact:true}).click();
  await score.getByLabel('小节号',{exact:true}).fill('2');
  await score.getByRole('button',{name:'下一小节',exact:true}).focus();await page.keyboard.press('Enter');await expect(score.getByLabel('小节号',{exact:true})).toHaveValue('3');
  // Nested guide navigation returns one step at a time.
  await score.getByLabel('小节号',{exact:true}).fill('5');await score.getByLabel('小节号',{exact:true}).fill('10');
  await page.getByRole('button',{name:'仅返回',exact:true}).click();await expect(score.getByLabel('小节号',{exact:true})).toHaveValue('5');
  await page.getByRole('button',{name:'仅返回',exact:true}).click();await expect(score.getByLabel('小节号',{exact:true})).toHaveValue('3');
  for(const width of [390,320]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)}
  if(d.movement===4){await page.locator('.explore').screenshot({path:'docs/work-measures-narrow.png'});await page.setViewportSize({width:1280,height:1000});await page.locator('.explore').screenshot({path:'docs/work-measures-desktop.png'})}
  await page.setViewportSize({width:1280,height:1000});
  console.log(`PASS movement ${d.movement}: bar input/follow, guide/range seek, prompt/pause, nested return, keyboard and narrow`);
 }
 // g26 is intact and readable, but its manuscript-only numbers must not
 // clamp to bar 445 or start the following movement.
 await page.locator('nav button').first().click();await page.waitForFunction(()=>document.querySelector('audio').readyState>=1);
 const panel=page.getByRole('region',{name:'第一乐章导读',exact:true});if(!await panel.locator('.guide-index').evaluate(e=>e.open))await panel.locator('.guide-index summary').click();
 const before=await audio.evaluate(a=>a.currentTime);await panel.locator('.guide-index button').last().click();
 await expect(panel.locator('.guide-heading')).toContainText('坠入虚无的最后一步');await panel.getByRole('radio',{name:'赏析',exact:true}).check();await expect(panel.locator('.guide-body')).toContainText('两声');
 await expect(panel.locator('.guide-reading-status')).toContainText('编号尚未对应');expect(await audio.evaluate(a=>a.currentTime)).toBeCloseTo(before,3);
 await panel.getByRole('radio',{name:'结构',exact:true}).check();await panel.locator('.guide-body a').first().click();expect(await audio.evaluate(a=>a.currentTime)).toBeCloseTo(before,3);
 await page.locator('input[type=file]').first().setInputFiles('public/assets/demo.wav');await expect(page.locator('.score-page-follow')).toContainText('当前音频没有匹配的谱面映射');
 await expect(page.locator('.score-page-follow').getByLabel('小节号',{exact:true})).toHaveCount(0);
 await page.getByRole('radio',{name:'启发探索',exact:true}).check();await page.getByRole('button',{name:'播放',exact:true}).click();await expect(page.locator('.cue-inner > button')).toHaveCount(0);
 await expect(audio).toHaveCount(1);
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS manuscript-only bar isolation, intact g26, unknown audio isolation and one audio source');
}finally{await browser?.close();server.kill()}
