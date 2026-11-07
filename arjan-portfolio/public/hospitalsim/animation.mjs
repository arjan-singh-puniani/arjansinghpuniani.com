import {WALK_SPEED} from './motion.mjs?v=158';
// Manually sampled clips cannot rely on mixer-time fades: their clock is held still.
export function samplePose(person,name,time){
 const action=person.actions.get(name);
 for(const other of person.actions.values()){other.stopFading();other.enabled=other===action;other.setEffectiveWeight(other===action?1:0)}
 action.enabled=true;action.time=time;person.mixer.update(0);
}

export function sampleSeatedWork(person,time,weight){
 const sit=person.actions.get('Sit'),work=person.actions.get('SeatedWork');
 if(!work)return;
 for(const action of person.actions.values()){action.stopFading();action.enabled=action===sit||action===work;action.setEffectiveWeight(action===work?weight:action===sit?1-weight:0)}
 sit.play();work.play();sit.time=time%sit.getClip().duration;work.time=time%work.getClip().duration;person.mixer.update(0);person.blended=true;
}

export function restoreBones(pose){for(const b of pose){b.bone.position.copy(b.position);b.bone.quaternion.copy(b.quaternion);b.bone.scale.copy(b.scale)}}
export function landingGesture(person,time,reduced=false,cancelled=false){
 if(reduced||time<0||time>=.9)return [];
 const pulse=Math.sin(Math.PI*time/.9)**2*(cancelled ? .6 : 1),pose=person.restBones.filter(b=>['head','forearmR','handR'].includes(b.bone.name.replace(/[._]/g,''))).map(({bone})=>({bone,position:bone.position.clone(),quaternion:bone.quaternion.clone(),scale:bone.scale.clone()}));
 for(const {bone}of pose){if(bone.name==='head')bone.rotateX(.14*pulse);if(bone.name.replace(/[._]/g,'')==='forearmR')bone.rotateX(-.28*pulse);if(bone.name.replace(/[._]/g,'')==='handR')bone.rotateZ(.10*pulse)}
 return pose;
}
export function dangle(person,time,reduced=false,sway={x:0,z:0}){
 const phase=(time+(person.id||0)*.173)%3.6,squirm=reduced?0:Math.sin(Math.PI*Math.min(1,phase/1.25))**2;
 const twist=Math.sin(time*7.3)*squirm,roll=reduced?0:sway.x+Math.sin(time*2.8)*.025+twist*.035,pitch=reduced?0:sway.z+Math.sin(time*6.1)*squirm*.025;
 restoreBones(person.restBones);person.model.rotation.set(pitch,.2,roll);
 for(const {bone:b}of person.restBones){
  const side=b.name.endsWith('L')?1:-1,kick=Math.sin(time*9.5+side*1.5)*squirm;
  if(b.name.startsWith('upper_arm')){b.rotateZ(side*(.12+.18*squirm)-roll*.4);b.rotateX(-.22*squirm)}
  if(b.name.startsWith('forearm'))b.rotateX(-.22-pitch*.3-.48*squirm);
  if(b.name.startsWith('hand')){b.rotateX(.18*squirm);b.rotateY(side*twist*.16)}
  if(b.name.startsWith('thigh')){b.rotateX(.10+.32*kick-pitch*.7);b.rotateZ(side*.08*squirm)}
  if(b.name.startsWith('shin'))b.rotateX(.21+squirm*.25+Math.max(0,kick)*.42);
  if(b.name==='spine')b.rotateY(twist*.075);
  if(b.name==='head'){b.rotateZ(-roll*.8);b.rotateX(-pitch*.8);b.rotateY(-twist*.10)}
 }
}

export function playClip(p,name){if(p.current===name)return;const next=p.actions.get(name)||p.actions.get('Idle')||[...p.actions.values()][0];if(!next)return;for(const a of p.actions.values())if(a.isRunning())a.fadeOut(.2);next.reset().setEffectiveWeight(1).setEffectiveTimeScale(1).fadeIn(.2).play();p.current=name}
export function advanceLocomotion(p,clip,simDt){
  const distance=p.lastWalkPosition?p.group.position.distanceTo(p.lastWalkPosition):0;
  if(clip==='Walk'){
   if(p.previousClip==='Walk'&&distance<.6)p.walkDistance=(p.walkDistance||0)+distance;
   else if(p.previousClip!=='Walk')p.walkDistance=0;
   const action=p.actions.get('Walk');action.setEffectiveTimeScale(0);action.time=(p.walkDistance/WALK_SPEED)%action.getClip().duration;
  }
  p.mixer.update(simDt);p.lastWalkPosition=p.group.position.clone();p.previousClip=clip;
 }

export function consultationGesture(person,seconds,speaker=false){
 const phase=(seconds+(speaker?0:1.5))%3,pulse=phase<1.1?Math.sin(Math.PI*phase/1.1)**2:0;
 if(!pulse)return[];
 const pose=person.restBones.filter(b=>['head','spine','forearmR','handR'].includes(b.bone.name.replace(/[._]/g,''))).map(({bone})=>({bone,position:bone.position.clone(),quaternion:bone.quaternion.clone(),scale:bone.scale.clone()}));
 for(const {bone}of pose){if(bone.name==='head')bone.rotateX(.07*pulse);if(bone.name==='spine')bone.rotateX(-.025*pulse);if(speaker&&bone.name.replace(/[._]/g,'')==='forearmR')bone.rotateX(-.12*pulse);if(speaker&&bone.name.replace(/[._]/g,'')==='handR')bone.rotateZ(.10*pulse)}return pose;
}
