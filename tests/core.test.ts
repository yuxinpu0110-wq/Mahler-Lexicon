import {describe,it,expect} from 'vitest';import{validate,candidates,mapped,transition}from '../src/model';import demo from '../content/demo/catalog.json';import real from '../content/real/catalog.json';
const d=validate(demo);const initial={playing:true,panel:false,dragging:false,resume:false};
describe('player invariants',()=>{
it('buffering does not explore; explicit pause does',()=>{expect(transition(initial,'waiting').panel).toBe(false);expect(transition(initial,'pause').panel).toBe(true)});
it('seek restores playing or paused intent without opening during drag',()=>{const dragging=transition(initial,'drag');expect(dragging.panel).toBe(false);expect(transition(dragging,'drop').playing).toBe(true);expect(transition(transition({...initial,playing:false},'drag'),'drop').panel).toBe(true)});
it('mode change does not reset player state',()=>expect(transition(initial,'mode')).toEqual(initial));
it('overlap candidates retained; active half-open interval ranks first',()=>{expect(candidates(d.events,12).map(e=>e.id)).toContain('harmony');expect(candidates(d.events,14)[0].id).toBe('harmony');expect(candidates(d.events,59)).toEqual([])});
it('isolates recording, track, file fingerprint and score edition',()=>{expect(mapped(d,3,'synth-v1','demo-track','generated-v1',d.edition)).toHaveLength(3);for(const args of [[3,'other','demo-track','generated-v1',d.edition],[3,'synth-v1','other','generated-v1',d.edition],[3,'synth-v1','demo-track','other',d.edition],[3,'synth-v1','demo-track','generated-v1','other']] as const)expect(mapped(d,args[0],args[1],args[2],args[3],args[4])).toEqual([])});
it('diagnoses broken references and duration',()=>{const bad=structuredClone(demo);bad.events[0].related=['missing'];expect(()=>validate(bad)).toThrow();const bad2=structuredClone(demo);bad2.events[0].end=99;expect(()=>validate(bad2)).toThrow()});
it('empty real catalog is valid and missing resources yield no events',()=>{expect(validate({kind:'real',edition:'empty',sources:[],tracks:[],events:[],cues:[]}).events).toEqual([]);expect(mapped(d,1,'','','',d.edition)).toEqual([])});
});
