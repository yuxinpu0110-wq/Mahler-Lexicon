import first from '../content/listen_guide/v2.0/m1.md?raw';
import second from '../content/listen_guide/v2.0/m2.md?raw';
import third from '../content/listen_guide/v1.0/code_artifact.md?raw';
import fourth from '../content/listen_guide/v1.0/code_artifact (1).md?raw';
import fifth from '../content/listen_guide/v2.0/m5.md?raw';
import {parseGuideMarkdown} from './guideMarkdown';
import {validateGuideDocument,type GuideData} from './guideContent';

export {authorGuideFiles,authorGuideRevisions} from './authorFiles.ts';
export function buildGuideLibrary(documents:string[]){
 const library:Record<number,GuideData>={};const ids=new Set<string>();let edition='';
 for(const text of documents){const data=validateGuideDocument(parseGuideMarkdown(text));if(library[data.movement])throw Error('重复的乐章导读');if(edition&&edition!==data.edition)throw Error('五乐章导读谱本不一致');edition=data.edition;for(const guide of data.guides){if(ids.has(guide.id))throw Error(`跨乐章重复导读 ID：${guide.id}`);ids.add(guide.id)}library[data.movement]=data}
 if(Object.keys(library).length!==5)throw Error('需要五个乐章的导读文件');return library;
}
export const authorGuideLibrary=buildGuideLibrary([first,second,third,fourth,fifth]);
