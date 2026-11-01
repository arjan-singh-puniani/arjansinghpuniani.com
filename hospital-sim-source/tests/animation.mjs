import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/build/three.module.js';
import {samplePose,dangle,restoreBones} from '../dist/animation.mjs';
const model=new THREE.Object3D(),mixer=new THREE.AnimationMixer(model),idle=new THREE.AnimationClip('Idle',3,[new THREE.NumberKeyframeTrack('.position[x]',[0,3],[0,0])]),transfer=new THREE.AnimationClip('TransferIn',3,[new THREE.NumberKeyframeTrack('.position[x]',[0,3],[0,3])]),a=mixer.clipAction(idle),b=mixer.clipAction(transfer),person={mixer,actions:new Map([['Idle',a],['TransferIn',b]])};
a.play();mixer.update(.5);a.fadeOut(.2);b.reset().fadeIn(.2).play();b.time=1.5;mixer.update(0);assert.equal(model.position.x,0,'reproduces transfer hidden by an unadvanced fade');
samplePose(person,'TransferIn',1.5);assert.equal(model.position.x,1.5,'manual transfer is visible while mixer clock is held');samplePose(person,'TransferIn',3);assert.equal(model.position.x,3);assert.equal(mixer.time,.5,'sampling never advances the animation clock');
console.log('PASS: actual Three.js mixer regression for frozen transfer fades and deterministic clip endpoints');

const hangingModel=new THREE.Group(),thigh=new THREE.Bone();thigh.name='thigh.L';hangingModel.add(thigh);const rest=[{bone:thigh,position:thigh.position.clone(),quaternion:thigh.quaternion.clone(),scale:thigh.scale.clone()}],hanging={model:hangingModel,restBones:rest};dangle(hanging,1);const expected=thigh.quaternion.clone();for(let i=0;i<120;i++)dangle(hanging,1);assert(thigh.quaternion.angleTo(expected)<1e-7,'dangle pose never accumulates rotations');dangle(hanging,1,true);const still=thigh.quaternion.clone();dangle(hanging,8,true);assert(thigh.quaternion.angleTo(still)<1e-7,'reduced-motion hold remains still');restoreBones(rest);assert(thigh.quaternion.angleTo(rest[0].quaternion)<1e-7);
console.log('PASS: dangling joints stay bounded, reduced motion stays still, original pose restores');
