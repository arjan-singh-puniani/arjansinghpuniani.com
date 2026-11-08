import assert from 'node:assert/strict';
import {simulation,advance} from '../qa/sim-harness.mjs';
import {ChampionshipController} from '../dist/tennis/ChampionshipController.js';
import {Vec3} from '../dist/rendering/Math3D.js';

function conversation(phase){
 const g=simulation();g.championship=new ChampionshipController();g.playerAvatar='arjan';
 g.spatial={dismiss(){}};g.pickWorld=()=>null;
 g.camera={focus(){},nudgeFocus(){},groundPoint:()=>new Vec3(-6,0,4)};
 g.visitMember(g.actor('nia'),false);
 const a=g.activities.active.find(a=>a.participants.includes('player'));assert(a);
 for(const next of ['starting','active','resolving']){
  if(a.phase===phase)break;g.activities.transition(a,next);
 }
 g.player.setConversationPartner(g.actor('nia').position);g.actor('nia').setConversationPartner(g.player.position);
 return {g,a};
}

for(const phase of ['traveling','starting','active','resolving']){
 for(const intent of ['avatar','walk','tennis','escape']){
  const {g,a}=conversation(phase),coins=g.coins;
  const court=g.activities.begin('match',['coach','mika'],'court');assert(court);
  let started=false;g.startChampionship=()=>{started=true;};
  if(intent==='avatar')g.choosePlayerAvatar('taylor');
  if(intent==='walk')g.handleTap(10,10);
  if(intent==='tennis')g.playTennis();
  if(intent==='escape')g.leavePlayerActivity();
  assert.equal(g.activities.busy('player'),false,`${phase}: ${intent} frees the player immediately`);
  assert.equal(g.activities.busy('nia'),false,`${phase}: the conversation partner is released too`);
  assert.equal(g.routes.has(a.id),false);
  assert.equal(g.player.conversationTarget,undefined);
  assert.equal(g.actor('nia').conversationTarget,undefined);
  assert.equal(g.activities.active.includes(court),true,'An unrelated NPC match keeps its reservation');
  assert.equal(g.coins,coins,'Interrupted conversations earn no completion reward');
  assert.equal(g.activities.history.find(r=>r.id===a.id)?.phase,'interrupted');
  if(intent==='avatar')assert.equal(g.player.spec.avatar,'taylor');
  if(intent==='walk')assert(g.player.path.length,'The new floor destination must replace conversation travel');
  if(intent==='tennis')assert(g.queuedChampionship&&!started,'Only the occupied court should delay tennis');
 }
}
{
 const {g}=conversation('active');let opponent;
 g.startChampionship=c=>{opponent=c;};g.playTennis();
 assert(opponent,'A conversation cannot delay an otherwise available match');
}
for(const mode of ['championship','performanceLab','phoneCapture']){
 const {g,a}=conversation('active');g[mode]={active:true,pickJoint(){}};
 g.choosePlayerAvatar('taylor');g.playTennis();g.handleTap(10,10);
 assert.equal(g.playerAvatar,'arjan',`${mode} retains character ownership`);
 assert(g.activities.active.includes(a),`${mode} cannot be interrupted by club controls`);
}
{
 const {g}=conversation('active');g.choosePlayerAvatar('taylor');
 g.schedule.update=()=>{};g.quietLife=()=>{};g.observationStarted=true;
 g.everyday.next=g.history.nextSocial=g.history.nextObject=1e12;
 const c=g.actor('nia');g.visitMember(c,false);advance(g,90);
 assert.equal(g.activities.busy('player'),false,'New social interactions still finish after switching');
 assert(g.activities.history.some(a=>a.kind==='greeting'&&a.phase==='completed'));
}
console.log('Avatar lockout: 16 phase/intent cases, partner cleanup, court ownership, protected modes and subsequent conversation pass.');
