import {z} from 'zod';
import type {Catalog} from './model';
import type {ScoreSyncData} from './scoreSyncModel';

const lyric=z.object({id:z.string().min(1),from:z.number().int().positive(),to:z.number().int().positive(),de:z.string().min(1),zh:z.string().min(1),en:z.string().min(1)});
const document=z.object({edition:z.string().min(1),movement:z.union([z.literal(4),z.literal(5)]),title:z.string().min(1),source:z.string().min(1),lyrics:z.array(lyric).min(1)});
export type LyricsDocument=z.infer<typeof document>;
export type Lyric=LyricsDocument['lyrics'][number];
export function parseLyricsMarkdown(raw:string):LyricsDocument{
 const lines=raw.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').split('\n');
 if(lines[0]!=='---')throw Error('唱词文件缺少元信息');
 const meta:Record<string,string>={};let at=1;
 for(;at<lines.length&&lines[at]!=='---';at++){const m=/^(format|edition|movement|title|source):\s*(.+)$/.exec(lines[at]);if(!m||meta[m[1]])throw Error('唱词元信息无效');meta[m[1]]=m[2].trim()}
 if(at===lines.length||meta.format!=='mahler-lexicon-lyrics/1'||!['4','5'].includes(meta.movement))throw Error('唱词格式或乐章无效');
 const lyrics:Lyric[]=[];let current:Partial<Lyric>|null=null;
 function finish(){if(!current)return;const entry=lyric.parse(current);if(entry.from>entry.to||entry.to>(meta.movement==='4'?67:762)||lyrics.some(l=>l.id===entry.id))throw Error('唱词小节范围或编号无效');lyrics.push(entry)}
 for(at++;at<lines.length;at++){
  const line=lines[at];const range=/^\*\*小节:\s*(\d+)-(\d+)\*\*/.exec(line);
  if(range){finish();current={id:`lyrics-${meta.movement}-${range[1]}-${range[2]}`,from:+range[1],to:+range[2]};continue}
  const row=/^\|\s*\*\*(Deutsch|English|中文)\*\*\s*\|\s*(.*?)\s*\|$/.exec(line);
  if(row){if(!current)throw Error('唱词表格缺少小节范围');const key=row[1]==='Deutsch'?'de':row[1]==='English'?'en':'zh';if(current[key])throw Error('唱词语言重复');const text=row[2].replace(/<br\s*\/?\s*>/gi,'\n');if(/<[^>]*>/.test(text))throw Error('唱词只支持 <br> 换行');current[key]=text}
 }
 finish();return document.parse({...meta,movement:+meta.movement,lyrics});
}
const hash=z.string().regex(/^sha256:[a-f0-9]{64}$/);
const syncSchema=z.object({version:z.literal(1),edition:z.string(),scoreFingerprint:hash,method:z.string(),tracks:z.array(z.object({id:z.string(),movement:z.union([z.literal(4),z.literal(5)]),fingerprint:hash,duration:z.number().positive(),intervals:z.array(z.object({lyricId:z.string(),from:z.number().int(),to:z.number().int(),de:z.string(),start:z.number().nonnegative(),end:z.number().positive(),status:z.literal('needs_review'),sourceStart:z.number().nonnegative(),sourceEnd:z.number().positive(),scorePages:z.array(z.number().int()).min(1)})).min(1)})).length(2)});
export type LyricsSync=z.infer<typeof syncSchema>;
export function validateLyricsSync(raw:unknown,library:Record<number,LyricsDocument>,catalog:Catalog,scores:Record<number,ScoreSyncData>):LyricsSync{
 const data=syncSchema.parse(raw);const movements=new Set<number>();
 for(const track of data.tracks){
  const doc=library[track.movement],score=scores[track.movement],original=catalog.tracks.find(t=>t.id===track.id);
  if(movements.has(track.movement)||!doc||!score||!original||data.edition!==doc.edition||data.edition!==score.edition||data.scoreFingerprint!==score.scoreFingerprint||original.movement!==track.movement||track.fingerprint!==original.fingerprint||Math.abs(track.duration-original.duration)>.001)throw Error('唱词同步的乐章、谱本或录音不匹配');movements.add(track.movement);
  let end=0;const ids=new Set<string>();const pages=new Set(score.regions.flatMap(r=>r.pages.map(p=>p.page)));
  for(const span of track.intervals){const entry=doc.lyrics.find(l=>l.id===span.lyricId);if(!entry||entry.from!==span.from||entry.to!==span.to||entry.de!==span.de||ids.has(span.lyricId)||span.start<end||span.end<=span.start||span.end>track.duration||span.sourceEnd<=span.sourceStart||span.scorePages.some(p=>!pages.has(p)))throw Error('唱词引用或时间范围无效');ids.add(span.lyricId);end=span.end}
  if(ids.size!==doc.lyrics.length)throw Error('唱词存在未配置的片段');
 }
 return data;
}
export function lyricAt(data:LyricsSync,library:Record<number,LyricsDocument>,movement:number,trackId:string,fingerprint:string,time:number){
 const track=data.tracks.find(t=>t.movement===movement&&t.id===trackId&&t.fingerprint===fingerprint);
 const interval=track?.intervals.find(i=>i.start<=time&&time<i.end);
 return interval?library[movement]?.lyrics.find(l=>l.id===interval.lyricId)||null:null;
}
