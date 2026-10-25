import assert from 'node:assert/strict';
import {simulation} from '../qa/sim-harness.mjs';
import {ChampionshipController} from '../dist/tennis/ChampionshipController.js';
import {CHAMPIONSHIP_OPPONENTS} from '../dist/tennis/ChampionshipOpponents.js';
import {MatchInput} from '../dist/tennis/MatchInput.js';
import {COURT} from '../dist/tennis/CourtGeometry.js';
import {Vec3} from '../dist/rendering/Math3D.js';
import {RACKET_FRAME} from '../dist/animation/RacketGeometry.js';
const hasRacket=character=>character.meshes().some(m=>m.skin===RACKET_FRAME);

const results=[];
for(const hz of [30,60,120])for(const winner of ['player','opponent'])for(const rallyLength of [2,6]){
 const g=simulation(),opponent=g.characters.find(c=>c.id==='leo'),controller=new ChampionshipController(),profile=CHAMPIONSHIP_OPPONENTS.leo;
 controller.beginChallenge(profile);controller.acceptChallenge();while(controller.phase!=='serving')controller.update(1/hz,true);
 Object.assign(g,{championship:controller,championshipOpponentId:opponent.id,championshipActivityId:'reaction-check',matchInput:new MatchInput()});
 const match=g.createInteractiveMatch(opponent,profile);g.interactiveMatch=match;
 const activity={id:'reaction-check',phase:'active',participants:['player',opponent.id]};g.routes.set(activity.id,[g.player.position.clone(),opponent.position.clone()]);
 g.player.position.set(COURT.centerX+3,0,5);opponent.position.set(COURT.centerX-2,0,-5);
 match.startPoint('player');g.matchInput.setEnabled(true);
 // A player who released steering just before losing a point leaves a tiny speed scale.
 g.player.setCourtSpeedScale(.08);const start=g.player.position.clone();
 match.rallyLength=rallyLength;match.resolvePoint(winner,'doubleBounce');
 const celebrated=rallyLength>=6,reaction=celebrated?'celebrate':'reactMiss',reacting=(winner==='player')===celebrated?g.player:opponent;
 assert.equal(reacting.state,reaction,'Point winner must retain the reaction instead of being overwritten by shuffle');
 assert(hasRacket(reacting),'A reaction must retain the racket already held at point end');
 assert.equal(controller.phase,'pointResult');assert.equal(g.matchInput.enabled,false);
 for(let i=0;i<Math.floor(hz*.25);i++){g.updateChampionshipActivity(activity,1/hz);g.player.update(1/hz);opponent.update(1/hz);assert.equal(reacting.state,reaction);assert.equal(match.ball.active,false);}
 assert(Vec3.sub(g.player.position,start).len()<1e-9,'Give the result a beat before baseline movement');
 let frames=Math.floor(hz*.25);
 while(controller.phase==='pointResult'){g.updateChampionshipActivity(activity,1/hz);g.player.update(1/hz);opponent.update(1/hz);assert(++frames<hz*1.2,'Reaction must not extend the next-point delay');}
 const travel=Math.abs(g.player.position.x-start.x);
 assert(travel>2.8,`${hz} Hz/${winner}: deliberate recovery must not inherit released steering speed (${travel})`);
 assert.deepEqual(controller.score,winner==='player'?{player:1,opponent:0}:{player:0,opponent:1},'Recovery cannot award another point');
 match.stop();assert.equal(g.player.getCourtSpeedScale(),1,'Exit restores the original court movement scale');
 // Final-result cleanup also releases match ownership while the visible reaction remains.
 reacting.trigger(reaction);match.stop();assert(hasRacket(reacting),'Releasing match ownership must not make the held racket disappear');
 reacting.setAnimation('idle');reacting.trigger('celebrate');assert.equal(hasRacket(reacting),false,'A club celebration cannot conjure a racket');
 const stopped=g.player.position.clone();match.update(1);assert.deepEqual(g.player.position,stopped,'A stopped match cannot schedule recovery');
 results.push({hz,winner,reaction,reactionFrames:Math.floor(hz*.25),travel});
}
const host=simulation().characters.find(c=>c.id==='nia');host.matchCompetitor=true;host.racketStowed=false;host.setAnimation('ready');host.trigger('celebrate');host.matchCompetitor=false;assert(hasRacket(host),'A host who played the match also retains their racket through its result');
console.log('Point sequence PASS: visible reaction, no input/ball activity during results, deliberate baseline recovery, unchanged next-point duration and exit cleanup.',JSON.stringify(results));
