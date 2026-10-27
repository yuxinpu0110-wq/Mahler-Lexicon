import {describe,it,expect} from 'vitest';
import text from '../content/real/listening-guides.md?raw';
import catalogRaw from '../content/real/catalog.json';
import syncRaw from '../content/real/score-sync.json';
import measuresRaw from '../content/real/measure-sync.json';
import researchRaw from '../content/real/measure-research.json';
import {validate} from '../src/model';
import {validateSync} from '../src/scoreSyncModel';
import {validateMeasures,validateMeasureResearch} from '../src/measureSyncModel';
import {parseGuideMarkdown,serializeGuideMarkdown} from '../src/guideMarkdown';
import {validateGuides} from '../src/guideContent';
const catalog=validate(catalogRaw),sync=validateSync(syncRaw,catalog),measures=validateMeasures(measuresRaw,catalog,sync),research=validateMeasureResearch(researchRaw,measures);
const load=(input:string)=>validateGuides(parseGuideMarkdown(input),measures,research);
describe('editable listening Markdown',()=>{
 it('round-trips all five fields, metadata, paragraphs and score links',()=>{const parsed=load(text);expect(parsed.guides).toHaveLength(23);expect(load(serializeGuideMarkdown(parsed))).toEqual(parsed);expect(load('\uFEFF'+text.replace(/\r\n?/g,'\n').replaceAll('\n','\r\n'))).toEqual(parsed);expect(parsed.guides.some(g=>g.structure.includes('](bar:'))).toBe(true)});
 it('rejects missing or duplicate sections and reports a line',()=>{expect(()=>load(text.replace('### 结构','### 赏析'))).toThrow(/第 \d+ 行/);expect(()=>load(text.replace('### 配器','### 其他'))).toThrow();expect(()=>load(text.replace('### 配器','### __proto__'))).toThrow();expect(()=>load(text.replace('依据: iii-introduction','依据: missing'))).toThrow(/引用无效/)});
 it('rejects stale editions, duplicate ids, invalid ranges, unsafe or broken links',()=>{for(const bad of [text.replace('edition: mahler2-imslp415748-ue-scan','edition: other'),text.replace('## g02 |','## g01 |'),text.replace('小节: 1-5','小节: 5-1'),text.replace('](bar:13)','](bar:999)'),text.replace('](bar:13)','](javascript:alert)'),text.replace('第13小节','<script>')])expect(()=>load(bad)).toThrow()});
});
