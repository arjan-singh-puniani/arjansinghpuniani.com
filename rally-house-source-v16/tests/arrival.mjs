import assert from 'node:assert/strict';
import {Game} from '../dist/Game.js';

function club(){
 const g=Object.create(Game.prototype),started=[],toasts=[];
 Object.assign(g,{playerAvatar:'arjan',championship:{active:false},characters:['leo','mika','coach','nia'].map(id=>({id,spec:{id}})),activities:{busy:()=>false,reserved:()=>false},ui:{toast:s=>toasts.push(s)},camera:{nudgeFocus(){}},startChampionship:c=>started.push(c.id)});
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
console.log('Arrival: opponent availability, court preservation, mode ownership, first framing, saved pause and exact approach-speed restoration pass.');
