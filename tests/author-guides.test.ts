import {describe,it,expect} from 'vitest';
import {authorGuideLibrary,buildGuideLibrary} from '../src/guideLibrary';
import {parseGuideMarkdown,serializeGuideMarkdown,validateGuideLinks} from '../src/guideMarkdown';
import {validateGuides} from '../src/guideContent';
import {validate} from '../src/model';
import {validateSync} from '../src/scoreSyncModel';
import {validateMeasures,validateMeasureResearch} from '../src/measureSyncModel';
import catalogRaw from '../content/real/catalog.json';
import syncRaw from '../content/real/score-sync.json';
import measuresRaw from '../content/real/measure-sync.json';
import researchRaw from '../content/real/measure-research.json';
const catalog=validate(catalogRaw),sync=validateSync(syncRaw,catalog),measures=validateMeasures(measuresRaw,catalog,sync),research=validateMeasureResearch(researchRaw,measures);
describe('five-movement author manuscripts',()=>{
 it('loads all 102 author entries with five intact fields and round-trippable metadata',()=>{expect(Object.values(authorGuideLibrary).map(d=>d.guides.length)).toEqual([26,13,23,5,35]);for(const document of Object.values(authorGuideLibrary)){expect(validateGuides(document,measures,research,document)).toEqual(document);expect(parseGuideMarkdown(serializeGuideMarkdown(document))).toEqual(document);for(const guide of document.guides)expect([guide.appreciation,guide.structure,guide.harmony,guide.orchestration,guide.prompt].every(Boolean)).toBe(true)}expect(authorGuideLibrary[3].guides[0].appreciation).toContain('从第二乐章温情的旧日梦境醒来')});
 it('keeps bar links within the current movement and rejects importing a different chapter',()=>{expect(()=>validateGuideLinks('[尾声](bar:672-712)',5)).not.toThrow();expect(()=>validateGuideLinks('[尾声](bar:672-712)',3)).toThrow();expect(()=>validateGuides(authorGuideLibrary[5],measures,research,authorGuideLibrary[1])).toThrow(/请先切换/);const bad=structuredClone(authorGuideLibrary[1]);bad.guides[0].researchId='invented-source';expect(()=>validateGuides(bad,measures,research,authorGuideLibrary[1])).toThrow(/引用无效/)});
 it('rejects missing or duplicate chapter documents rather than overwriting another movement',()=>{const docs=Object.values(authorGuideLibrary).map(serializeGuideMarkdown);expect(()=>buildGuideLibrary(docs.slice(0,4))).toThrow();expect(()=>buildGuideLibrary([...docs,docs[0]])).toThrow(/重复/) });
});

