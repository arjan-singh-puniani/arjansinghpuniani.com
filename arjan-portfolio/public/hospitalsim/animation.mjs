// Manually sampled clips cannot rely on mixer-time fades: their clock is held still.
export function samplePose(person,name,time){
 const action=person.actions.get(name);
 for(const other of person.actions.values()){other.stopFading();other.enabled=other===action;other.setEffectiveWeight(other===action?1:0)}
 action.enabled=true;action.time=time;person.mixer.update(0);
}
