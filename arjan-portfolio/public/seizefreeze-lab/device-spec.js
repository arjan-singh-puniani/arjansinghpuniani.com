// Display assumptions in millimeters, independent of the uncalibrated lumped solver.
export const deviceSpec = Object.freeze({
  units: 'mm', status: 'Assumed explanatory construction, not validated implant CAD',
  contact: { width:10, depth:10 }, body: { width:12, depth:12, bottom:-.2, wallTop:2.65, lidTop:2.95, wall:.35 },
  fit: { span:12.4, minimumRigidClearance:.3 },
  coldplate: { width:10.4, depth:10.4, bottom:0, top:.25 },
  tec: { width:8.8, depth:8.8, ceramic:.18, copper:.04, legHeight:.60, legWidth:.5, pitch:1.25, rows:6, columns:6,
    bottom:.25, lowerCopperBottom:.43, legBottom:.47, legTop:1.07, upperCopperTop:1.11, top:1.29 },
  heatpath: { width:10.4, depth:10.4, bottom:1.29, top:1.57 },
  electronics: { width:10.6, depth:10.6, boardBottom:1.82, boardTop:2.04, componentTop:2.34 },
});
export const componentIds=['interface','coldplate','tec','heatpath','sensing','electronics','package'];
export const anchors={
  interface:{label:'UNRESOLVED CONTACT',point:[0,-.12,4.8],color:'#a7c1c6',side:-1},
  coldplate:{label:'COLD SPREADER',point:[-4.9,.125,3],color:'#8bd4e3',side:-1},
  tec:{label:'THERMOELECTRIC ARRAY',point:[-3.125,.77,-3.125],color:'#b8c7d4',side:-1},
  heatpath:{label:'HOT SPREADER',point:[5.4,1.43,3],color:'#dbb37d',side:1},
  sensing:{label:'SURFACE SENSOR + ECoG',point:[6.7,-.3,2.7],color:'#c4ace4',side:1},
  electronics:{label:'CONTROL / DRIVER',point:[-1.6,2.34,-1.5],color:'#92b9e6',side:1},
  package:{label:'CANDIDATE ENCLOSURE',point:[0,2.98,0],color:'#c9d4dd',side:1},
};
export const explodedOffsets={interface:0,coldplate:2,tec:4.5,heatpath:8,sensing:0,electronics:11,package:15};
export function tecLayout(){
  const t=deviceSpec.tec,legs=[];
  for(let row=0;row<t.rows;row++)for(let column=0;column<t.columns;column++){
    const col=row%2?t.columns-1-column:column,index=legs.length;
    legs.push({index,type:index%2?'P':'N',x:(col-(t.columns-1)/2)*t.pitch,z:(row-(t.rows-1)/2)*t.pitch});
  }
  const bridges=legs.slice(0,-1).map((leg,i)=>({from:i,to:i+1,face:i%2?'hot':'cold',a:[leg.x,leg.z],b:[legs[i+1].x,legs[i+1].z]}));
  const edges=legs.map(l=>({from:'h'+l.index,to:'c'+l.index,kind:'leg',type:l.type}));
  bridges.forEach(b=>edges.push({from:(b.face==='hot'?'h':'c')+b.from,to:(b.face==='hot'?'h':'c')+b.to,kind:'bridge'}));
  edges.push({from:'plus',to:'h0',kind:'terminal'},{from:'h'+(legs.length-1),to:'minus',kind:'terminal'});
  return{legs,bridges,edges,terminals:[{name:'plus',leg:legs[0]},{name:'minus',leg:legs.at(-1)}],couples:legs.length/2};
}
