import fourth from '../content/listen_guide/script/m4.md?raw';
import fifth from '../content/listen_guide/script/m5.md?raw';
import {parseLyricsMarkdown,type LyricsDocument} from './lyricsModel';
export const lyricsLibrary:Record<number,LyricsDocument>={4:parseLyricsMarkdown(fourth),5:parseLyricsMarkdown(fifth)};
