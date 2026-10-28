import { GLTFLoader } from './vendor/GLTFLoader.js';
export const CAR_IDENTITY={name:'SF-26 launch-reference study',asset:'./assets/sf26-runtime.glb',official:false};
export const wheelTrack=corner=>corner.startsWith('F')?.8:.7625;
// Turn around vertical first, then roll around the axle; XYZ makes a turning wheel precess.
export function setWheelRotation(wheel,heading,spin,side,tilt=0){wheel.rotation.set(side*spin,heading+(side<0?Math.PI:0),tilt,'YXZ');}
export const alignmentTilt=c=>c.correction>0?Math.sin(Math.PI*c.alignment)*.06:0;
export const partDescription=name=>{
 if(/Wheel_|Tire_|Rim_|Spoke|Captive/.test(name))return ['Wheel & captive nut','The nut stays with the wheel. Fastening confirmation is required before release.'];
 if(/Halo|Cockpit|Seat|Steering|Harness/.test(name))return ['Cockpit & halo','Open cockpit, steering and a central halo support. Visual dimensions are reference estimates.'];
 if(/Brake|disc|Caliper/.test(name))return ['Brake assembly','The disc and fixed caliper remain on the car when the wheel is removed.'];
 if(/wing|endplate/i.test(name))return ['Wing assembly','Curved multi-element surfaces. This visual model does not calculate aerodynamic forces.'];
 if(/Sidepod|Intake|Cooling/.test(name))return ['Sidepod & inlet','Sculpted inlet lip, recessed throat and a tapering rear body.'];
 if(/Suspension|pushrod|steering|upper|lower/.test(name))return ['Suspension linkage','The links connect chassis and upright. Compliance and loads are not simulated.'];
 return [name.replaceAll('_',' '),'Original Blender geometry from public launch references; not official Ferrari CAD.'];
};
export async function loadHero(){
 const {scene}=await new GLTFLoader().loadAsync(CAR_IDENTITY.asset);
 const body=scene.getObjectByName('Bodywork');
 if(!body)throw new Error('Car asset is missing Bodywork');
 const wheels={};for(const corner of ['FL','FR','RL','RR']){const w=scene.getObjectByName(`Wheel_${corner}`);if(!w)throw new Error(`Car asset is missing ${corner}`);w.position.set(0,0,0);wheels[corner]=w;}
 scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.part=partDescription(o.name);}});
 return {scene,body,wheels};
}
