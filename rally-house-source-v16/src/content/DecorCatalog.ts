export type DecorCategory='tennis'|'clubhouse'|'greenery'|'ambience';
export type DecorCulture='training'|'social'|'care'|'calm';
export type DecorType=
  'racketRack'|'ballHopper'|'basket'|'coneSet'|'tennisBag'|'scoreboard'|
  'bench'|'cafeTable'|'stool'|'sideTable'|'trophy'|'towelRack'|
  'plant'|'planter'|'lamp'|'lantern';

export interface DecorDefinition {
  id:DecorType;
  label:string;
  icon:string;
  category:DecorCategory;
  cost:number;
  footprintX:number;
  footprintZ:number;
  blocksNavigation:boolean;
  rotationStep:number;
  culture:DecorCulture;
}

const d=(n:number)=>n*Math.PI/180;

export const DECOR_CATALOG:DecorDefinition[]=[
  {id:'racketRack',label:'Racket rack',icon:'🎾',category:'tennis',cost:50,footprintX:1.55,footprintZ:.58,blocksNavigation:true,rotationStep:d(22.5),culture:'training'},
  {id:'ballHopper',label:'Ball hopper',icon:'🟢',category:'tennis',cost:38,footprintX:.86,footprintZ:.72,blocksNavigation:true,rotationStep:d(22.5),culture:'training'},
  {id:'basket',label:'Ball basket',icon:'🎾',category:'tennis',cost:25,footprintX:.78,footprintZ:.78,blocksNavigation:false,rotationStep:d(22.5),culture:'training'},
  {id:'coneSet',label:'Coaching cones',icon:'🔶',category:'tennis',cost:18,footprintX:1.28,footprintZ:.68,blocksNavigation:false,rotationStep:d(22.5),culture:'training'},
  {id:'tennisBag',label:'Tennis bag',icon:'🎒',category:'tennis',cost:28,footprintX:1.18,footprintZ:.52,blocksNavigation:false,rotationStep:d(22.5),culture:'training'},
  {id:'scoreboard',label:'Scoreboard',icon:'🔢',category:'tennis',cost:44,footprintX:1.42,footprintZ:.46,blocksNavigation:true,rotationStep:d(22.5),culture:'training'},

  {id:'bench',label:'Court bench',icon:'🪑',category:'clubhouse',cost:45,footprintX:1.90,footprintZ:.90,blocksNavigation:true,rotationStep:d(22.5),culture:'social'},
  {id:'cafeTable',label:'Café table',icon:'☕',category:'clubhouse',cost:40,footprintX:1.05,footprintZ:1.05,blocksNavigation:true,rotationStep:d(22.5),culture:'social'},
  {id:'stool',label:'Club stool',icon:'🪑',category:'clubhouse',cost:20,footprintX:.62,footprintZ:.62,blocksNavigation:true,rotationStep:d(22.5),culture:'social'},
  {id:'sideTable',label:'Side table',icon:'▣',category:'clubhouse',cost:30,footprintX:.86,footprintZ:.72,blocksNavigation:true,rotationStep:d(22.5),culture:'social'},
  {id:'trophy',label:'Club trophy',icon:'🏆',category:'clubhouse',cost:35,footprintX:.54,footprintZ:.54,blocksNavigation:false,rotationStep:d(22.5),culture:'calm'},
  {id:'towelRack',label:'Towel rack',icon:'🧺',category:'clubhouse',cost:32,footprintX:1.18,footprintZ:.48,blocksNavigation:true,rotationStep:d(22.5),culture:'care'},

  {id:'plant',label:'Floor plant',icon:'🪴',category:'greenery',cost:30,footprintX:.82,footprintZ:.82,blocksNavigation:false,rotationStep:d(22.5),culture:'care'},
  {id:'planter',label:'Planter box',icon:'🌿',category:'greenery',cost:24,footprintX:1.35,footprintZ:.58,blocksNavigation:false,rotationStep:d(22.5),culture:'care'},

  {id:'lamp',label:'Floor lamp',icon:'💡',category:'ambience',cost:35,footprintX:.42,footprintZ:.42,blocksNavigation:false,rotationStep:d(22.5),culture:'calm'},
  {id:'lantern',label:'Club lantern',icon:'🏮',category:'ambience',cost:18,footprintX:.46,footprintZ:.46,blocksNavigation:false,rotationStep:d(22.5),culture:'calm'},
];

export const DECOR_BY_ID=Object.fromEntries(DECOR_CATALOG.map(v=>[v.id,v])) as Record<DecorType,DecorDefinition>;

export function rotatedFootprint(type:DecorType,rotation=0){
  const d=DECOR_BY_ID[type],c=Math.abs(Math.cos(rotation)),s=Math.abs(Math.sin(rotation));
  return {w:d.footprintX*c+d.footprintZ*s,d:d.footprintX*s+d.footprintZ*c};
}
