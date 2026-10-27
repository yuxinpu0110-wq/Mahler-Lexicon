import {chromium,expect} from '@playwright/test';
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {parseGuideMarkdown} from '../src/guideMarkdown.ts';
const {authorGuideFiles}=await import('../src/authorFiles.ts');const paths=Object.values(authorGuideFiles);
const documents=await Promise.all(paths.map(file=>readFile('content/listen_guide/'+file,'utf8').then(parseGuideMarkdown)));
const labels=['第一','第二','第三','第四','第五'];
const plain=text=>text.replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replaceAll('**','');
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','5195','--strictPort'],{stdio:'ignore',windowsHide:true});let browser;
try{
 await new Promise(r=>setTimeout(r,1300));browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1280,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5195');await expect(page.locator('.intro .notice')).toContainText('102 段');const audio=page.locator('audio');await expect(audio).toHaveJSProperty('paused',true);
 for(const document of documents){
  const m=document.movement;await page.locator('nav button').nth(m-1).click();const panel=page.getByRole('region',{name:labels[m-1]+'乐章导读',exact:true});await expect(panel).toBeVisible();await expect(panel.locator('.guide-heading')).toContainText(document.guides[0].title);await expect(page.locator('nav button').nth(m-1)).toContainText(document.guides.length+' 段导读');
  for(const [layer,key]of [['赏析','appreciation'],['结构','structure'],['和声','harmony'],['配器','orchestration']]){await panel.getByRole('radio',{name:layer,exact:true}).check();await expect(panel.locator('.guide-body')).toContainText(plain(document.guides[0][key]).slice(0,35))}
  const index=panel.locator('.guide-index');if(!await index.evaluate(el=>el.open))await index.locator('summary').click();await expect(index.locator('button')).toHaveCount(document.guides.length);await index.locator('button').last().click();await expect(panel.locator('.guide-heading')).toContainText(document.guides.at(-1).title);await panel.getByRole('button',{name:'上一段',exact:true}).click();await expect(panel.locator('.guide-heading')).toContainText(document.guides.at(-2).title);
  if(m!==3){
   await page.waitForFunction(()=>document.querySelector('audio').readyState>=1);
   await expect(page.locator('.score-page-follow')).toHaveCount(1);
   const g=document.guides.find(g=>g.structure.includes('](bar:'));
   await index.getByRole('button',{name:new RegExp(g.from+'—'+g.to)}).click();
   await panel.getByRole('radio',{name:'结构',exact:true}).check();
   await audio.evaluate(a=>{a.currentTime=10;a.dispatchEvent(new Event('timeupdate'))});
   const src=await audio.getAttribute('src'),link=panel.locator('.guide-body a').first();
   const target=Number((await link.getAttribute('href')).replace('#bar-',''));
   await link.focus();await page.keyboard.press('Enter');
   await expect(audio).toHaveJSProperty('paused',true);
   await expect(page.locator('.score-page-follow').getByLabel('小节号',{exact:true})).toHaveValue(String(target));
   await expect(audio).toHaveAttribute('src',src);
   await page.getByRole('button',{name:'仅返回',exact:true}).click();
   expect(await audio.evaluate(a=>a.currentTime)).toBeCloseTo(10,1);
   await expect(panel.locator('.guide-heading')).toContainText(g.title);
   await page.getByRole('radio',{name:'启发探索',exact:true}).check();
   await page.getByRole('button',{name:'播放',exact:true}).click();
   await expect(page.locator('.cue-inner > button')).toHaveCount(1);
   await page.getByRole('button',{name:'暂停并探索'}).click();
   await page.getByRole('radio',{name:'自由检索',exact:true}).check();
  }else{await page.locator('.current-score').getByLabel('小节号',{exact:true}).fill('465');await expect(panel.locator('.guide-heading')).toContainText('转轮被撕开');if(await audio.evaluate(a=>a.currentTime)<388)throw Error('third movement score mapping lost')}
  await page.setViewportSize({width:390,height:844});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error(`movement ${m} narrow overflow`);await page.setViewportSize({width:1280,height:900});
 }
 if(errors.length)throw Error(errors.join('\n'));console.log('PASS author guides: 102 entries / 5 movements, four layers, catalogs, current-movement links, mapped bar links and automatic prompts, third-movement sync, keyboard and narrow');
}finally{await browser?.close();server.kill()}

