import {Character} from '../dist/entities/Character.js';
import {playerSpec} from '../dist/content/PlayerAvatars.js';
import {Navigation} from '../dist/world/Navigation.js';
import {Vec3} from '../dist/rendering/Math3D.js';
import {captureFrame} from '../dist/analysis/MotionCapture.js';
export const scenarios=['footwork','forehand','backhand','running','serve','volley'];
export function scenario(name,avatar='arjan',record=captureFrame){
 const c=new Character(playerSpec(avatar),new Vec3(0,0,4),new Navigation([]),{});c.matchCompetitor=true;c.setAnimation('ready');for(let i=0;i<60;i++)c.update(1/60);
 const frames=[],facing=new Vec3(0,0,9);let duration=name==='footwork'?4:name==='running'?3:2;
 for(let i=0;i<=duration*60;i++){
  if(name==='footwork'){
   if(i===20)c.moveOnCourt(new Vec3(1.2,0,4.0),facing,true);
   if(i===65)c.steerOnCourt(new Vec3(-1.2,0,4.0),facing);
   if(i===110){c.clearCourtMove();c.setAnimation('ready');}
   if(i===140)c.steerOnCourt(new Vec3(1,0,4.6),facing);
   if(i===153)c.steerOnCourt(new Vec3(-1,0,3.7),facing);
   if(i===175){c.clearCourtMove();c.setAnimation('ready');}
  }else if(name==='stop'){
   if(i===10)c.steerOnCourt(new Vec3(3,0,4),facing);
   if(i===25){c.setIncomingContact(c.position.clone().add(new Vec3(.8,1.02,.75)));c.triggerShot('swingForehand',facing);}
   if(i>=25&&i<33)c.steerOnCourt(new Vec3(3,0,4),facing);
   if(i===33)c.clearCourtMove();
   if(i===65)c.setAnimation('ready');
  }else if(name==='running'){
   if(i===10)c.steerOnCourt(new Vec3(2,0,4.0),facing);
   if(i===25){c.setIncomingContact(c.position.clone().add(new Vec3(1,.80,.75)));c.triggerShot('swingForehand',facing);}
   if(i>=25&&i<70)c.steerOnCourt(new Vec3(2,0,4.0),facing);
   if(i===70){c.clearCourtMove();c.setAnimation('ready');}
   if(i===90)c.steerOnCourt(new Vec3(-1,0,4.0),facing);
   if(i===105){c.setIncomingContact(c.position.clone().add(new Vec3(-1,.9,.75)));c.triggerShot('swingBackhand',facing);}
   if(i>=105&&i<150)c.steerOnCourt(new Vec3(-1,0,4.0),facing);
   if(i===150){c.clearCourtMove();c.setAnimation('ready');}
  }else if(i===20){const state=name==='serve'?'serve':name==='volley'?'volley':name==='forehand'?'swingForehand':'swingBackhand';if(state!=='serve')c.setIncomingContact(new Vec3(name==='volley'?.4:name==='forehand'?.7:-.7,1.02,4.75));c.triggerShot(state,facing);}
  if(!['footwork','running','stop'].includes(name)&&i>20&&c.animTime>c.shotDuration()+.02)c.setAnimation('ready');
  c.update(1/60);frames.push(record(c,i/60,null));
 }
 return {spec:c.spec,frames};
}
