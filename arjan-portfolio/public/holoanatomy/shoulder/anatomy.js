// Curriculum describes anatomy. Simulation support regions are source-derived approximations.
export const MUSCLE_DEFINITIONS = {
  ZA_infra: {curriculum:'FJ1500', name:'Infraspinatus', insertionRegion:'ZA_infra_insertion', coupled:['ZA_infra_tendon'], originBone:'ZA_scapula', insertionBone:'ZA_humerus', deep:['ZA_capsule','ZA_scapula'], note:'Compare the posterior cuff with the capsule and scapula beneath it.'},
  ZA_supra: {curriculum:'FJ1506', name:'Supraspinatus', insertionRegion:'ZA_supra_insertion', coupled:[], originBone:'ZA_scapula', insertionBone:'ZA_humerus', deep:['ZA_capsule','ZA_scapula'], note:'Inspect the supplied muscle as it approaches the humerus beneath the acromial region.'},
  ZA_teres: {curriculum:'FJ1508', name:'Teres minor', insertionRegion:'ZA_teres_insertion', coupled:[], originBone:'ZA_scapula', insertionBone:'ZA_humerus', deep:['ZA_capsule'], note:'Compare this smaller posterior cuff muscle with infraspinatus.'},
  ZA_subscap: {curriculum:'FJ1504', name:'Subscapularis', insertionRegion:'ZA_subscap_insertion', coupled:[], originBone:'ZA_scapula', insertionBone:'ZA_humerus', deep:['ZA_capsule','ZA_scapula'], note:'Inspect the anterior cuff from the costal side of the scapula.'},
};
export function deformationOwner(id) {
  return MUSCLE_DEFINITIONS[id] ? id : Object.keys(MUSCLE_DEFINITIONS).find(key=>MUSCLE_DEFINITIONS[key].coupled.includes(id));
}
export const MECHANICS_NOTICE = 'Illustrative surface mechanics. Fixed support patches are derived from source insertion annotations and the scapula-facing medial surface; they are not measured origin/insertion footprints. The support-to-insertion axis is derived from shape, not verified fiber orientation. No calibrated tissue constants, connective-tissue coupling outside a source object, volumetric anatomy or surgical validation.';
export function anatomicalDefinition(part, curriculum={}) {
  const owner=deformationOwner(part.id), d=MUSCLE_DEFINITIONS[part.id], c=d?curriculum[d.curriculum]:curriculum[part.id];
  return {structureId:part.id,name:c?.name||part.name,category:part.tissue||part.layer,region:'Right shoulder',laterality:'right',
    origin:c?.origin||null,insertion:c?.insertion||null,function:c?.action||null,innervation:c?.innervation||null,
    relationships:c?.relationship||part.note||null,parent:'right-shoulder',deep:d?.deep||[],
    superficial:[],adjacencyStatus:'Only explicitly listed curriculum/source relationships; other adjacency is unreviewed.',
    attachments:d?[d.originBone,d.insertionBone]:[],source:part.source,sourceVersion:part.sourceVersion,license:part.license,
    provenance:part.id.startsWith('ZA_')?'./assets/atlas/provenance.json':'./assets/provenance.json',
    visibility:'Source-coherent specimen groups',retraction:d?'Elastic held exposure':part.tissue==='BONE'||part.layer==='skeleton'?'Fixed bone context':'Whole-source-mesh exposure; no separation plane inferred',mechanics:d?'illustrative-xpbd-surface':owner?'coupled-source-tendon-surface':'rigid-exposure-only',simulationLimitations:owner?MECHANICS_NOTICE:'No verified deformable attachment definition. Probe and source-mesh exposure remain available.',reviewStatus:part.reviewStatus};
}
export function supportRegions(rest, insertion, boneDistances) {
  if(!insertion.length || !boneDistances || boneDistances.length!==rest.length/3)throw Error('Source support data unavailable');
  const center=[0,0,0];for(let i=0;i<insertion.length;i++)center[i%3]+=insertion[i]/(insertion.length/3);
  const distances=Array.from({length:rest.length/3},(_,i)=>Math.hypot(rest[i*3]-center[0],rest[i*3+1]-center[1],rest[i*3+2]-center[2]));
  const far=[...distances].sort((a,b)=>a-b)[Math.floor(distances.length*.8)];
  const origin=[0,0,0];let n=0;
  distances.forEach((d,i)=>{if(d>=far){n++;for(let k=0;k<3;k++)origin[k]+=rest[i*3+k];}});
  for(let k=0;k<3;k++)origin[k]/=n;
  const axis=origin.map((v,k)=>center[k]-v),L=Math.hypot(...axis);for(let k=0;k<3;k++)axis[k]/=L||1;
  const pin=new Uint8Array(distances.length),regions=new Uint8Array(distances.length);
  const near=[...distances].sort((a,b)=>a-b)[Math.max(3,Math.floor(distances.length*.035))];
  distances.forEach((d,i)=>{
    if(d<=near){pin[i]=1;regions[i]=2;}
    else if(d>=far && boneDistances[i]<=.09){pin[i]=1;regions[i]=1;}
  });
  // If the medial source surface is separated from its source bone, keep the far tip fixed and flag the approximation.
  const fallback=!regions.includes(1);
  if(fallback)distances.forEach((d,i)=>{if(d>=far){pin[i]=1;regions[i]=1;}});
  return {pins:pin,regions,axis,origin,center,report:{method:'Source-insertion-adjacent 3.5% and medial 20% within 0.09 normalized units of source scapula; illustrative supports',originCount:regions.filter(v=>v===1).length,insertionCount:regions.filter(v=>v===2).length,insertionRadius:near,originFallback:fallback,reviewStatus:'Derived geometric support regions; independent anatomical landmark review required'}};
}
