// Manually sampled clips cannot rely on mixer-time fades: their clock is held still.
export function samplePose(person,name,time){
 const action=person.actions.get(name);
 for(const other of person.actions.values()){other.stopFading();other.enabled=other===action;other.setEffectiveWeight(other===action?1:0)}
 action.enabled=true;action.time=time;person.mixer.update(0);
}

export function restoreBones(pose){for(const b of pose){b.bone.position.copy(b.position);b.bone.quaternion.copy(b.quaternion);b.bone.scale.copy(b.scale)}}
export function dangle(person,time,reduced=false,sway={x:0,z:0}){
 const roll=reduced?0:sway.x+Math.sin(time*2.8)*.025,pitch=reduced?0:sway.z;
 restoreBones(person.restBones);person.model.rotation.set(pitch,.2,roll);
 for(const {bone:b}of person.restBones){const side=b.name.endsWith('L')?1:-1;if(b.name.startsWith('upper_arm'))b.rotateZ(side*.12-roll*.4);if(b.name.startsWith('forearm'))b.rotateX(-.22-pitch*.3);if(b.name.startsWith('thigh'))b.rotateX(.10+(reduced?0:Math.sin(time*3+side)*.08)-pitch*.7);if(b.name.startsWith('shin'))b.rotateX(.21);if(b.name==='head'){b.rotateZ(-roll*.8);b.rotateX(-pitch*.8)}}
}
