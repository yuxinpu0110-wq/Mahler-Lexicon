import {chromium,expect} from '@playwright/test';
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
const data=JSON.parse(await readFile('content/real/lyrics-sync.json','utf8'));
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','5197','--strictPort'],{stdio:'ignore',windowsHide:true});let browser;
try{
 await new Promise(r=>setTimeout(r,1200));browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1280,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5197');const audio=page.locator('audio'),lyrics=page.getByRole('region',{name:'当前唱词',exact:true});
 await expect(page.locator('.intro .notice')).toContainText('102 段');await expect(lyrics).toHaveCount(0);await expect(audio).toHaveCount(1);
 async function seek(time){await audio.evaluate((a,t)=>{a.currentTime=t;a.dispatchEvent(new Event('timeupdate'))},time)}
 for(const track of data.tracks){
  await page.locator('nav button').nth(track.movement-1).click();await page.waitForFunction(()=>document.querySelector('audio').readyState>=1);await expect(audio).toHaveJSProperty('paused',true);
  const src=await audio.getAttribute('src');let end=0;
  for(const span of track.intervals){
   if(span.start>end+1){await seek((end+span.start)/2);await expect(lyrics).toHaveCount(0)}
   await seek(span.start+.1);await expect(lyrics).toHaveAttribute('data-lyric',span.lyricId);await expect(lyrics.locator('[lang=de]')).toHaveText(span.de);end=span.end;
  }
  await seek(end+.1);await expect(lyrics).toHaveCount(0);
  const first=track.intervals[0];await seek(first.start+.5);
  const lyricBox=await lyrics.boundingBox(),scoreBox=await page.locator('.score-page-follow').boundingBox();if(lyricBox.y+lyricBox.height>scoreBox.y+1)throw Error('lyrics not above score');
  const lang=lyrics.getByLabel('唱词语言');await expect(lang).toHaveValue(track.movement===4?'de-zh':'de-en');
  if(track.movement===4){await expect(lyrics.locator('[lang=zh-CN]')).toContainText('红玫瑰');await lang.selectOption('de');await expect(lyrics.locator('p')).toHaveCount(1);await expect(audio).toHaveJSProperty('paused',true);await lang.focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await expect(lang).toHaveValue('de-zh')}
  await lang.selectOption('de-en');await expect(lyrics.locator('[lang=en]')).toBeVisible();await expect(lyrics.locator('[lang=zh-CN]')).toHaveCount(0);expect(await audio.evaluate(a=>a.currentTime)).toBeCloseTo(first.start+.5,1);
  await page.getByRole('button',{name:'播放',exact:true}).click();await lang.selectOption('de-zh');await expect(audio).toHaveJSProperty('paused',false);await page.getByRole('button',{name:'暂停并探索'}).click();await expect(lyrics).toHaveCount(1);
  await page.getByRole('radio',{name:'启发探索',exact:true}).check();await expect(lyrics).toHaveCount(1);await page.getByRole('radio',{name:'自由检索',exact:true}).check();
  await lang.selectOption('de-en');await expect(audio).toHaveAttribute('src',src);
  await seek(track.intervals.at(-2).start+.5);await lang.selectOption('de-zh');
  for(const width of [390,320]){await page.setViewportSize({width,height:844});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('lyrics narrow overflow');if(track.movement===5){await seek(track.intervals.find(i=>i.from===618).start+.5);await expect(lyrics.locator('[lang=de]')).toContainText('In heißem Liebesstreben');if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('long lyrics narrow overflow')}}
  if(track.movement===5)await lyrics.screenshot({path:'docs/lyrics-narrow.png'});await page.setViewportSize({width:1280,height:1000});if(track.movement===5)await lyrics.screenshot({path:'docs/lyrics-desktop.png'});
  await lang.selectOption('de-en');
 }
 for(const movement of [1,2,3]){await page.locator('nav button').nth(movement-1).click();await expect(lyrics).toHaveCount(0)}
 await page.locator('nav button').nth(3).click();await page.waitForFunction(()=>document.querySelector('audio').readyState>=1);await expect(lyrics).toHaveCount(1);await page.locator('input[type=file]').first().setInputFiles('public/assets/demo.wav');await expect(lyrics).toHaveCount(0);
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS lyrics: 23 phrases, instrumental gaps/codas hidden, above score, default German/Chinese, all 3 languages and keyboard, playback/pause/mode isolation, 320/390px, unknown audio isolation, single audio; v2 102 guides loaded');
}finally{await browser?.close();server.kill()}
