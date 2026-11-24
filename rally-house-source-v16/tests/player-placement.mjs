import assert from 'node:assert/strict';
import {Character} from '../dist/entities/Character.js';
import {Navigation} from '../dist/world/Navigation.js';
import {Vec3} from '../dist/rendering/Math3D.js';
import {InteractiveMatchSystem} from '../dist/tennis/InteractiveMatchSystem.js';
import {MatchInput} from '../dist/tennis/MatchInput.js';
import {CHAMPIONSHIP_OPPONENTS} from '../dist/tennis/ChampionshipOpponents.js';

const actor=(id,z)=>new Character({id,name:id,role:'member',shirt:'#888888',skin:'#c99977',hair:'#333333',playStyle:'test',goal:'test'},new Vec3(1,0,z),new Navigation(),{});
const matches=Object.values(CHAMPIONSHIP_OPPONENTS).map(profile=>new InteractiveMatchSystem(actor('player',6.65),actor(profile.id,-6.65),profile,new MatchInput()));
// Hold all inputs and geometry fixed: changing an opponent must not change our racket accuracy.
for(const aim of [-1,-.18,0,.18,1])for(const quality of ['perfect','clean','defensive'])for(let sequence=0;sequence<20;sequence++){
 const targets=matches.map(match=>{
  match.rallyLength=8;match.shotSequence=sequence;
  return match.targetFor('player',quality,aim);
 });
 for(const target of targets)assert.deepEqual(target,targets[0],'Opponent profile must not perturb player placement');
}
console.log('Player placement is independent of opponent profile: 300 matched scenarios PASS');
