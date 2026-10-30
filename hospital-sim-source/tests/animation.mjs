import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/build/three.module.js';
import {samplePose} from '../dist/animation.mjs';
const model=new THREE.Object3D(),mixer=new THREE.AnimationMixer(model),idle=new THREE.AnimationClip('Idle',3,[new THREE.NumberKeyframeTrack('.position[x]',[0,3],[0,0])]),transfer=new THREE.AnimationClip('TransferIn',3,[new THREE.NumberKeyframeTrack('.position[x]',[0,3],[0,3])]),a=mixer.clipAction(idle),b=mixer.clipAction(transfer),person={mixer,actions:new Map([['Idle',a],['TransferIn',b]])};
a.play();mixer.update(.5);a.fadeOut(.2);b.reset().fadeIn(.2).play();b.time=1.5;mixer.update(0);assert.equal(model.position.x,0,'reproduces transfer hidden by an unadvanced fade');
samplePose(person,'TransferIn',1.5);assert.equal(model.position.x,1.5,'manual transfer is visible while mixer clock is held');samplePose(person,'TransferIn',3);assert.equal(model.position.x,3);assert.equal(mixer.time,.5,'sampling never advances the animation clock');
console.log('PASS: actual Three.js mixer regression for frozen transfer fades and deterministic clip endpoints');
