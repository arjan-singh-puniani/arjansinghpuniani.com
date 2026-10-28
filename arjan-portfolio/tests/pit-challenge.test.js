import {describe,it,expect} from 'vitest';
import {newChallenge,challengeAction,replayChallenge,challengeFrame} from '../public/pit-stop-lab/challenge.js';
import {simulate,configuration} from '../public/pit-stop-lab/simulation.js';
describe('manual pit stop',()=>{
 it('blocks unsafe order and ignores attempts to pull a retained wheel',()=>{let s=newChallenge();s=challengeAction(s,'release',0);expect(s.phase).toBe('prepare');expect(s.errors).toBe(1);s=challengeAction(s,'drag',0,1);expect(s.phase).toBe('prepare');expect(s.errors).toBe(2);});
 it('requires arrival, all service dependencies, and replays exact input',()=>{
  let s=newChallenge(),t=0;s.teamReady=Math.max(...['FR','RL','RR'].map(c=>simulate(configuration()).stops[0].corners[c].events.at(-1).end));const act=(type,value)=>s=challengeAction(s,type,t,value);const hold=seconds=>{act('hold');t+=seconds;act('tick');act('end');};
  act('prepare');hold(.7);expect(s.phase).toBe('jack');hold(.5);expect(s.phase).toBe('jack');t=1.7;hold(.5);expect(s.phase).toBe('align');act('align');hold(.7);expect(s.phase).toBe('remove');
  act('drag',.5);expect(challengeFrame(s,simulate(configuration())).state.cars[0].corners.FL.removal).toBe(.5);
  act('drag',1);act('drag',1);hold(.8);expect(s.phase).toBe('clear');hold(.5);hold(.5);expect(s.phase).toBe('release');act('release');expect(s.phase).toBe('complete');expect(s.completedAt).toBe(t);
  expect(replayChallenge(s.actions,t,{teamReady:s.teamReady})).toEqual(s);const f=challengeFrame(s,simulate(configuration()));expect(f.state.cars[0].guard).toBe(true);expect(f.state.cars[0].corners.FL.secured).toBe(true);
 });
 it('keeps jacks up for an unfinished team corner',()=>{let s={...newChallenge({teamReady:100}),phase:'lower',started:true};s=challengeAction(s,'hold',1);s=challengeAction(s,'tick',2);expect(s.phase).toBe('lower');expect(s.progress).toBe(0);});
 it('never renders a departure with an unsecured team corner',()=>{const sim=simulate(configuration({scenario:'unsecured'}));const s={...newChallenge(),phase:'complete',elapsed:10,completedAt:9,teamReady:9};expect(challengeFrame(s,sim).state.cars[0].released).toBe(false);});
 it('uses press-to-release duration even with no animation tick',()=>{let s={...newChallenge(),phase:'position',started:true};s=challengeAction(s,'hold',0);s=challengeAction(s,'end',.8);expect(s.phase).toBe('jack');expect(s.holding).toBe(false);});
 it('keeps idle traces bounded and reconstructs a partial hold',()=>{let s=newChallenge();s=challengeAction(s,'prepare',0);s=challengeAction(s,'hold',0);s=challengeAction(s,'tick',.3);expect(replayChallenge(s.actions,.3).progress).toBeCloseTo(s.progress);s=challengeAction(s,'end',.3);for(let i=1;i<2000;i++)s=challengeAction(s,'tick',.3+i);expect(s.actions.length).toBe(3);});
 it('rejects time travel and malformed inputs',()=>{expect(()=>challengeAction(newChallenge(),'tick',NaN)).toThrow();expect(()=>challengeAction({...newChallenge(),elapsed:2},'tick',1)).toThrow();});
});
