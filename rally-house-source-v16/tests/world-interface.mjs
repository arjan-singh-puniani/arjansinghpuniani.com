import assert from 'node:assert/strict';
import {placeWorldCard} from '../dist/ui/WorldAnchor.js';
import {characterContext,objectContext,furnitureContext,canChallenge} from '../dist/ui/ClubContextPresenter.js';
import {CameraController} from '../dist/rendering/CameraController.js';
import {Vec3} from '../dist/rendering/Math3D.js';
import {CharacterMind} from '../dist/simulation/CharacterMind.js';
import {RelationshipSystem} from '../dist/simulation/RelationshipSystem.js';
import {ActivitySystem} from '../dist/simulation/ActivitySystem.js';
import {ClubHistory} from '../dist/simulation/ClubHistory.js';
import {ObjectAffordances} from '../dist/simulation/ObjectAffordances.js';
const mind=new CharacterMind(),relations=new RelationshipSystem(),activities=new ActivitySystem(),history=new ClubHistory(),affordances=new ObjectAffordances();
const c={id:'leo',spec:{name:'Leo',role:'Member',playStyle:'Counterpuncher',goal:'Improve'},activity:'Resting'};
const state={mind,relations,activities,history,affordances,placements:[],characters:[c],progress:28};
mind.states.leo.energy=.42;
let model=characterContext(c,state);assert(model.status.includes('42%'));assert(model.actions.some(a=>a.id==='challenge'));
activities.begin('lesson',['coach','mika'],'court','A real lesson');
assert(!canChallenge(activities,'leo'));assert(!characterContext(c,state).actions.some(a=>a.id==='challenge'));
activities.begin('greeting',['leo','player'],'conversation');assert(!characterContext(c,state).actions.some(a=>a.id==='talk'||a.id==='tea'));
assert(!objectContext({id:'machine',kind:'training',label:'Machine',description:'Real machine'},activities,{frame:'Cedar',string:'Poly',tension:52},[]).actions.some(a=>a.id==='drill'||a.id==='touch'));
const p={id:'bench-test',type:'bench',x:0,z:0};affordances.sync([p],1);affordances.visit(p.id,['player'],1);affordances.visit(p.id,['player'],1);
const furniture=furnitureContext(p,affordances,new ActivitySystem(),id=>id);assert(furniture.facts.some(f=>f.text==='2 completed visits'));assert(furniture.actions.some(a=>a.id==='touch'&&a.title==='Settle in'));
for(const [width,height] of [[1280,800],[1024,768],[390,844],[844,390]]){
 const b={width,height,top:74,bottom:88,left:14,right:14};
 for(const point of [{x:width/2,y:height/2,visible:true},{x:-800,y:height*2,visible:true},{x:NaN,y:Infinity,visible:false}]){
  const l=placeWorldCard(point,274,Math.min(340,height-162),b);
  assert(Number.isFinite(l.x)&&Number.isFinite(l.y));assert(l.x>=14&&l.x+274<=width-14);assert(l.y>=74&&l.y+Math.min(340,height-162)<=height-88);
 }
 const camera=new CameraController({getBoundingClientRect:()=>({width,height,left:24,top:18})});camera.setAspect(width/height);camera.update(0);
 const q=camera.project(new Vec3());assert(Number.isFinite(q.x)&&Number.isFinite(q.y));assert(Math.abs(q.x-(width/2+24))<.001);
}
console.log('World interface anchor, responsive bounds, authoritative card state, reservations and object history pass.');
