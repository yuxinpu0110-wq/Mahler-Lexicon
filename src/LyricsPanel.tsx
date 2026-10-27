import {useState} from 'react';
import type {Lyric} from './lyricsModel';

export function LyricsPanel({lyric}:{lyric:Lyric|null}){
 const [language,Language]=useState('de-zh');
 if(!lyric)return null;
 return <section className="lyrics-panel" aria-label="当前唱词" data-lyric={lyric.id}>
  <select className="lyrics-language" aria-label="唱词语言" value={language} onChange={e=>Language(e.target.value)}><option value="de">德</option><option value="de-zh">德中</option><option value="de-en">德英</option></select>
  <div className="lyrics-text"><p lang="de" className="lyrics-original">{lyric.de}</p>{language!=='de'&&<p lang={language==='de-zh'?'zh-CN':'en'} className="lyrics-translation">{language==='de-zh'?lyric.zh:lyric.en}</p>}</div>
 </section>
}
