import {chromium,expect} from '@playwright/test';
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
const maps=JSON.parse(await readFile('content/real/work-measure-sync.json','utf8')).movements;
const boxes=JSON.parse(await readFile('content/real/work-measure-boxes.json','utf8')).entries;
const third=JSON.parse(await readFile('content/real/measure-sync.json','utf8')).measures;
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','5200','--strictPort'],{stdio:'ignore',windowsHide:true});let browser;
try{
 await new Promise(r=>setTimeout(r,1000));browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5200');
 const audio=page.locator('audio'),input=page.getByLabel('小节号',{exact:true}),frame=page.locator('.current-score .measure-liquid-lens');
 const expectedRect=(locator,b)=>locator.evaluate((el,box)=>{
  const svg=el.parentElement.querySelector('svg'),m=svg.getScreenCTM(),p=el.parentElement.getBoundingClientRect();
  const a=new DOMPoint(box[0]*911,box[1]*1232).matrixTransform(m),z=new DOMPoint((box[0]+box[2])*911,(box[1]+box[3])*1232).matrixTransform(m);
  return {x:a.x-p.left-4,y:a.y-p.top-10,width:Math.max(16,z.x-a.x+8),height:z.y-a.y+20};
 },b.box);
 const pose=locator=>locator.evaluate(el=>{const m=new DOMMatrix(getComputedStyle(el).transform);return{x:m.m41,y:m.m42,width:parseFloat(el.style.width),height:parseFloat(el.style.height)}});
 const settledAt=async(locator,b)=>{
  await expect(locator).toHaveAttribute('data-page',String(b.page));await expect(locator.locator('..').locator('svg')).toHaveAttribute('data-camera-moving','false');await expect(locator).toHaveAttribute('data-moving','false');
  await expect.poll(async()=>{const target=await expectedRect(locator,b),actual=await pose(locator);return Math.max(...Object.keys(target).map(k=>Math.abs(actual[k]-target[k])))}).toBeLessThan(.6);
 };
 const ready=()=>page.waitForFunction(()=>document.querySelector('audio').readyState>=1);
 for(const d of maps){
  await page.locator('nav button').nth(d.movement-1).click();await ready();
  for(const n of [1,Math.floor(d.barCount/2),d.barCount]){
   await input.fill(String(n));const b=boxes.find(e=>e.movement===d.movement&&e.number===n);
   await expect(frame).toHaveAttribute('data-page',String(b.page));
   await settledAt(frame,b);
   await expect(audio).toHaveJSProperty('paused',true);
  }
  await expect(page.locator('.score-scene-outgoing')).toHaveCount(0);
  await page.locator('.current-score').screenshot({path:`docs/score-motion-m${d.movement}.png`});
 }
 // Same-page motion has real intermediate coordinates, including interruptions.
 await page.locator('nav button').nth(0).click();await ready();await input.fill('1');
 const b1=boxes.find(e=>e.movement===1&&e.number===1),b2=boxes.find(e=>e.movement===1&&e.number===2);
 await settledAt(frame,b1);const start=await pose(frame),target=await expectedRect(frame,b2);
 await input.fill('2');await page.waitForTimeout(50);
 const mid=await pose(frame),leftProgress=(mid.x-start.x)/(target.x-start.x),rightProgress=(mid.x+mid.width-start.x-start.width)/(target.x+target.width-start.x-start.width);
 expect(leftProgress).toBeGreaterThan(0);expect(rightProgress).toBeGreaterThan(leftProgress);
 expect(await frame.evaluate(el=>Number(el.style.getPropertyValue('--lens-velocity')))).toBeGreaterThan(0);
 await input.fill('3');await input.fill('1');await settledAt(frame,b1);
 // Row morph and live layout changes use the actual SVG screen transform.
 await page.locator('nav button').nth(1).click();await ready();await input.fill('7');await settledAt(frame,boxes.find(e=>e.movement===2&&e.number===7));
 await input.fill('8');await page.waitForTimeout(45);
 expect(await frame.evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).m22)).toBeLessThan(1);
 const row=boxes.find(e=>e.movement===2&&e.number===8);await settledAt(frame,row);
 await page.getByRole('button',{name:'放大谱面',exact:true}).click();await settledAt(frame,row);
 await page.getByRole('button',{name:'收起放大',exact:true}).click();await settledAt(frame,row);
 await page.setViewportSize({width:390,height:844});await settledAt(frame,row);
 await page.locator('.current-score').screenshot({path:'docs/liquid-lens-narrow.png'});await page.setViewportSize({width:1440,height:1000});
 await page.locator('nav button').nth(2).click();await ready();await input.fill('9');await settledAt(frame,third[8]);
 const optical=await frame.evaluate(el=>({border:getComputedStyle(el).borderWidth,radius:getComputedStyle(el).borderRadius,filter:getComputedStyle(el).backdropFilter,events:getComputedStyle(el).pointerEvents}));
 expect(optical.border).toBe('0px');expect(optical.radius).toBe('14px');expect(optical.filter).toContain('brightness');expect(optical.filter).not.toContain('blur');expect(optical.events).toBe('none');
 await page.locator('.current-score').screenshot({path:'docs/liquid-lens-m3.png'});
 await input.fill('465');await audio.evaluate(a=>{a.currentTime+=.02;a.dispatchEvent(new Event('timeupdate'))});await expect(page.locator('body')).toHaveAttribute('data-event','cry');await settledAt(frame,third[464]);
 expect(await frame.evaluate(el=>getComputedStyle(el).getPropertyValue('--accent-primary').trim())).toBe('#C84B31');
 await expect(page.locator('.score-scene-outgoing')).toHaveCount(0);
 await page.locator('.current-score').screenshot({path:'docs/liquid-lens-cry.png'});
 // A new page is held until decoded. Rapid later choices cancel obsolete loads.
 const isolated=await browser.newPage();let release;const hold=new Promise(r=>release=r);
 await isolated.route('**/assets/scores/work/page-56.webp',async route=>{await hold;await route.continue()});
 await isolated.goto('http://127.0.0.1:5200');await isolated.locator('nav button').nth(0).click();
 await expect(isolated.locator('.measure-liquid-lens')).toHaveAttribute('data-page','3');
 await isolated.getByLabel('小节号',{exact:true}).fill('445');
 await expect(isolated.locator('.score-viewport')).toHaveAttribute('aria-busy','true');
 await expect(isolated.locator('.measure-liquid-lens')).toHaveAttribute('data-page','3');
 release();await expect(isolated.locator('.measure-liquid-lens')).toHaveAttribute('data-page','56');
 await expect(isolated.locator('.score-scene-outgoing')).toHaveCount(1);
 await expect(isolated.locator('.score-scene-outgoing')).toHaveCount(0);
 await expect(isolated.getByRole('button',{name:'播放',exact:true})).toBeEnabled();await isolated.close();
 const racing=await browser.newPage();let resume;const waiting=new Promise(r=>resume=r);
 await racing.route('**/assets/scores/work/page-56.webp',async route=>{await waiting;await route.continue()});
 await racing.goto('http://127.0.0.1:5200');await racing.locator('nav button').nth(0).click();
 await expect(racing.locator('.measure-liquid-lens')).toHaveAttribute('data-page','3');
 await racing.getByLabel('小节号',{exact:true}).fill('445');await racing.getByLabel('小节号',{exact:true}).fill('1');resume();
 await racing.waitForTimeout(850);await expect(racing.locator('.measure-liquid-lens')).toHaveAttribute('data-page','3');await racing.close();
 // Actual audio position triggers a long gradual palette change; reduced motion snaps.
 await page.locator('nav button').nth(4).click();await ready();
 const fifth=maps.find(d=>d.movement===5);
 await audio.evaluate((a,t)=>{a.currentTime=t;a.dispatchEvent(new Event('timeupdate'))},fifth.tracks[0].intervals[471].start+.01);
 await expect(page.locator('body')).toHaveAttribute('data-phase','dawn');await page.waitForTimeout(1000);
 const progress=()=>page.evaluate(()=>Number(getComputedStyle(document.body).getPropertyValue('--dawn-progress')));
 expect(await progress()).toBeLessThan(.001);
 await audio.evaluate((a,t)=>{a.currentTime=t;a.dispatchEvent(new Event('timeupdate'))},fifth.tracks[0].intervals[761].start+.01);await page.waitForTimeout(150);
 expect(await progress()).toBeGreaterThan(0);expect(await progress()).toBeLessThan(1);
 const midStroke=await frame.evaluate(el=>getComputedStyle(el).boxShadow);
 await page.emulateMedia({reducedMotion:'reduce'});await expect.poll(progress).toBe(1);
 await expect(frame).toHaveAttribute('data-moving','false');
 await expect.poll(()=>frame.evaluate(el=>getComputedStyle(el).boxShadow)).not.toBe(midStroke);
 await page.locator('.listening-workspace').screenshot({path:'docs/score-motion-dawn.png'});
 for(const width of [390,320]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)}
 await page.locator('nav button').nth(2).click();await ready();await input.fill('2');
 await expect(page.locator('.measure-liquid-lens')).toHaveCount(1);
 await page.getByRole('button',{name:'下一小节',exact:true}).focus();await page.keyboard.press('Enter');await expect(input).toHaveValue('3');
 await expect(audio).toHaveCount(1);
 await page.emulateMedia({contrast:'more'});expect(await frame.evaluate(el=>getComputedStyle(el).backdropFilter)).toBe('none');await page.emulateMedia({contrast:'no-preference'});
 await page.emulateMedia({forcedColors:'active'});expect(await frame.evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');await page.emulateMedia({forcedColors:'none'});
 const broken=await browser.newPage();await broken.route('**/assets/scores/work/page-128.webp',r=>r.abort());
 await broken.goto('http://127.0.0.1:5200');await broken.locator('nav button').nth(3).click();
 await expect(broken.locator('.current-score')).toContainText('谱页加载失败');await expect(broken.getByRole('button',{name:'播放',exact:true})).toBeEnabled();await broken.close();
 expect(errors).toEqual([]);
 console.log('PASS all chapter lenses, asymmetric spring stretch, row morph, zoom/resize projection, sharp optics, cry tint, decoded page crossfade, stale-load cancellation, staged/damped palette, reduced motion/high contrast/forced colors, keyboard, narrow screens, single audio');
}finally{await browser?.close();server.kill()}
