import assert from 'node:assert/strict';
import {Game} from '../dist/Game.js';
import {simulation} from '../qa/sim-harness.mjs';
import {ChampionshipController} from '../dist/tennis/ChampionshipController.js';
import {CHAMPIONSHIP_OPPONENTS} from '../dist/tennis/ChampionshipOpponents.js';

function club(){
 const g=Object.create(Game.prototype),started=[],toasts=[];
 Object.assign(g,{playerAvatar:'arjan',championship:{active:false},characters:['leo','mika','coach','nia'].map(id=>({id,spec:{id}})),clock:{paused:false},activities:{active:[],busy:()=>false,reserved:()=>false},ui:{toast:s=>toasts.push(s),setTennisQueued(){}},camera:{nudgeFocus(){}},startChampionship:c=>started.push(c.id)});
 return {g,started,toasts};
}
{
 const {g,started}=club();g.playTennis();assert.deepEqual(started,['leo']);
}
{
 const {g,started}=club();g.activities.busy=id=>id==='leo';g.playTennis();assert.equal(started.length,1);assert.notEqual(started[0],'leo');
}
{
 const {g,started,toasts}=club();g.activities.reserved=()=>true;g.playTennis();assert.equal(started.length,0);assert.equal(toasts.length,1,'Occupied court remains owned by its existing activity');
}
{
 const {g,started}=club();g.playerAvatar=null;let choices=0;g.openAvatarPicker=()=>{choices++;};g.playTennis();assert.equal(started.length,0);assert.equal(choices,1,'New visitors choose their character before committing to play');
}
{
 const {g,started}=club();g.activities.reserved=()=>true;g.clock.paused=true;
 g.playTennis();assert(g.queuedChampionship,'A busy-court invitation must remember the requested match');assert.equal(g.clock.paused,false,'Play must let the occupied court finish even if the club was paused');
 g.playTennis();assert.equal(g.queuedChampionship,null,'A second tap cancels the queued match');assert.equal(started.length,0);
}
{
 const {g}=club();g.activities.reserved=()=>true;g.activities.active=[{id:'arriving',kind:'match',phase:'traveling'}];g.socialRally={score:{leo:3,mika:1}};
 g.playTennis();assert.equal(g.queuedChampionship.points,0,'An arriving booking must not inherit the previous match score');
}
for(const mode of ['championship','performanceLab','phoneCapture']){
 const {g,started}=club();g[mode]={active:true};g.playTennis();assert.equal(started.length,0,`Invitation cannot interrupt ${mode}`);
}
for(const arriving of [true,false]){
 const g=Object.create(Game.prototype);let framed=0,focused=0;
 Object.assign(g,{player:{spec:{},position:{x:0,z:0}},arrivalPaused:arriving,clock:{paused:true},ui:{closeContext(){},toast(){}},camera:{frameAcademy(){framed++;},focus(){focused++;}},save:async()=>{}});
 g.choosePlayerAvatar('arjan');assert.equal(g.clock.paused,!arriving,'Settings preserve an intentional pause');assert.equal(framed,Number(arriving));assert.equal(focused,Number(!arriving));
}
{
 const g=Object.create(Game.prototype),player={speed:3.4},opponent={speed:2.89};
 g.championshipApproachSpeeds=new Map([[player,2],[opponent,1.7]]);
 g.restoreChampionshipApproach();assert.equal(player.speed,2);assert.equal(opponent.speed,1.7);assert.equal(g.championshipApproachSpeeds.size,0);
 g.restoreChampionshipApproach();assert.equal(player.speed,2,'Repeated cleanup cannot compound the approach scale');
}
for(const cancelled of [false,true]){
 const g=simulation(),started=[];g.playerAvatar='taylor';g.championship=new ChampionshipController();
 g.schedule.update=()=>{};g.quietLife=()=>{};g.observationStarted=true;g.everyday.next=g.history.nextSocial=g.history.nextObject=1e12;
 g.startChampionship=opponent=>{started.push(opponent.id);g.championship.beginChallenge(CHAMPIONSHIP_OPPONENTS[opponent.id]);};
 const court=g.activities.begin('match',['leo','mika'],'court');g.routes.set(court.id,[g.actor('leo').position.clone(),g.actor('mika').position.clone()]);court.phase='active';
 g.socialRally.enabled=true;g.socialRally.score={leo:0,mika:0};g.socialRally.update=()=>{};
 g.playTennis();assert(g.queuedChampionship);g.updateFixed(1/60);assert.equal(court.phase,'active','The current point must not be cut short');
 if(cancelled)g.playTennis();
 g.socialRally.score.leo=1;g.updateFixed(1/60);
 assert.equal(court.phase,cancelled?'active':'resolving','Only an outstanding invitation concludes the friendly match at its next point');
 if(cancelled){g.activities.cancel(court,'Finished normally');g.releaseActivity(court);}
 for(let i=0;i<150;i++)g.updateFixed(1/60);
 assert.equal(started.length,cancelled?0:1,'A queued match starts once as the court becomes free; a cancelled request cannot start');
}
console.log('Arrival: opponent availability, court preservation, mode ownership, first framing, saved pause and exact approach-speed restoration pass.');
