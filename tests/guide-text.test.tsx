import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {GuideText} from '../src/GuideText';
import {authorGuideLibrary} from '../src/guideLibrary';

describe('listener score references',()=>{
 it('keeps a clickable bar range inside bold text, without exposing raw Markdown',()=>{
  const html=renderToStaticMarkup(<GuideText text="这是**终极圣咏（[第640—655小节](bar:640-655)）**。" onReference={()=>{}}/>);
  expect(html).toContain('<strong>');expect(html).toContain('data-bar-from="640"');expect(html).toContain('data-bar-to="655"');
  expect(html).not.toContain('](bar:');expect(html).not.toContain('**');
 });
 it('renders every declared bar reference in all current author manuscripts, including nested emphasis',()=>{
  for(const doc of Object.values(authorGuideLibrary))for(const g of doc.guides)for(const text of [g.appreciation,g.structure,g.harmony,g.orchestration]){
   if(!text)continue;
   const expected=[...text.matchAll(/\]\(bar:(\d+)(?:-(\d+))?\)/g)];
   const html=renderToStaticMarkup(<GuideText text={text} onReference={()=>{}}/>);
   expect((html.match(/data-bar-from=/g)||[]).length,`${doc.movement} / ${g.id}`).toBe(expected.length);
   expect(html).not.toContain('](bar:');
  }
 });
});
