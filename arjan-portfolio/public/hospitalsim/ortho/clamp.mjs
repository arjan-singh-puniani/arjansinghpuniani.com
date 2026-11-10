import * as T from '../vendor/build/three.module.js';
import {mergeGeometries} from '../vendor/examples/jsm/utils/BufferGeometryUtils.js';

const V = (x,y,z) => new T.Vector3(x,y,z);
const hinge=V(.32,.025,.085);
const hingeAxis=V(0,.48,-.88).normalize();

export function contactRadius(radii, angle) {
  const n=radii.length, index=(((angle+Math.PI)/(2*Math.PI)*n)%n+n)%n;
  const i=Math.floor(index);
  return T.MathUtils.lerp(radii[i],radii[(i+1)%n],index-i);
}

export function addGownSleeve(hand) {
  const geometry=new T.CylinderGeometry(.27,.08,4.8,28,60,true);
  const vertices=geometry.attributes.position;
  for(let i=0;i<vertices.count;i++){
    const along=vertices.getY(i)+2.4;
    const angle=Math.atan2(vertices.getZ(i),vertices.getX(i));
    const cuff=.012*Math.exp(-((along-.055)**2)/.001);
    const folds=.012*Math.sin(angle*5+along*7)+.006*Math.sin(angle*9-along*18);
    const fullness=.042*T.MathUtils.smoothstep(along,.10,.48);
    const r=Math.hypot(vertices.getX(i),vertices.getZ(i))+cuff+fullness+folds*Math.min(1,along*4);
    vertices.setXYZ(i,1.76+along,-.036-r*Math.cos(angle),.188+r*.77*Math.sin(angle)-along*.06);
  }
  geometry.computeVertexNormals();
  const gown=new T.Mesh(geometry,new T.MeshStandardMaterial({color:0x216283,roughness:.87,side:T.DoubleSide}));
  hand.add(gown);
}

function handleOutline(sign) {
  const s=new T.Shape();
  s.moveTo(-.07,sign*-.047);
  s.bezierCurveTo(.18,sign*.04,.57,sign*.084,.81,sign*.10);
  s.quadraticCurveTo(.94,sign*.12,.94,sign*.19);
  s.quadraticCurveTo(.89,sign*.23,.80,sign*.21);
  s.bezierCurveTo(.50,sign*.166,.14,sign*.095,-.07,sign*.071);
  s.closePath();
  const g=new T.ExtrudeGeometry(s,{depth:.037,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:2,curveSegments:12});
  const positions=g.attributes.position;
  for(let i=0;i<positions.count;i++){
    const lift=.66*T.MathUtils.smoothstep(positions.getX(i),.015,.27);
    positions.setZ(i,positions.getZ(i)+lift-.018);
  }
  g.computeVertexNormals();
  return g;
}

function curvedJaw(profile, quarter, sign) {
  const corners=[[.023,.029],[.047,.029],[.059,.018],[.059,-.018],[.047,-.029],[.023,-.029],[.011,-.016],[.011,.016]];
  const vertices=[],indices=[];
  const samples=28, ring=corners.length;
  for(let i=0;i<=samples;i++){
    const t=i/samples, a=sign*(.16+t*2.27);
    const edge=contactRadius(profile,a+quarter);
    for(const [width,height] of corners){
      const flare=(1-t)**4;
      const r=edge+width*(1-.25*t);
      const z=Math.sin(a)*r;
      vertices.push(
        T.MathUtils.lerp(Math.cos(a)*r,hinge.x,flare)-hinge.x,
        z*.56+sign*.025+height-hinge.y,
        T.MathUtils.lerp(z,hinge.z,flare)-hinge.z
      );
    }
    if(i===samples)continue;
    for(let j=0;j<ring;j++){
      const k=i*ring+j,next=i*ring+(j+1)%ring;
      indices.push(k,next,k+ring,next,next+ring,k+ring);
    }
  }
  for(let i=1;i<ring-1;i++){
    const end=samples*ring;
    indices.push(0,i+1,i,end,end+i,end+i+1);
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

export function fitClamp(data, view, steel, darkSteel, hand) {
  const tool=new T.Group();
  tool.position.fromArray(data.gripCenter);
  const quarter=view==='side'?Math.PI/2:0;
  tool.rotation.y=-quarter;
  const jaws=[-1,1].map(sign=>{
    const jaw=new T.Group();
    jaw.position.copy(hinge);
    const metal=new T.Mesh(curvedJaw(data.gripRadii,quarter,sign),steel);
    jaw.add(metal,new T.Mesh(handleOutline(-sign),steel));
    const teeth=[];
    for(let i=0;i<9;i++){
      const a=sign*(.64+i*.19);
      const r=contactRadius(data.gripRadii,a+quarter);
      const tooth=new T.BoxGeometry(.024,.036,.017);
      tooth.rotateY(-a);
      const x=Math.cos(a)*(r+.011),z=Math.sin(a)*(r+.011);
      tooth.translate(x-hinge.x,z*.56+sign*.025-hinge.y,z-hinge.z);
      teeth.push(tooth);
    }
    jaw.add(new T.Mesh(mergeGeometries(teeth),darkSteel));
    for(const tooth of teeth)tooth.dispose();
    tool.add(jaw);
    return {jaw,sign};
  });
  const rivet=new T.Mesh(new T.CylinderGeometry(.063,.057,.098,24),darkSteel);
  rivet.rotateX(Math.PI/2);
  rivet.position.copy(hinge);
  tool.add(rivet);
  const socket=new T.Mesh(new T.CylinderGeometry(.021,.021,.011,6),steel);
  socket.rotateX(Math.PI/2);
  socket.position.copy(hinge).z+=.053;
  tool.add(socket);
  const glove=hand.clone();
  tool.add(glove);
  addGownSleeve(glove);
  const handle=V(1.11,0,.745);
  return {
    tool,handle,
    setClosure(amount){
      glove.visible=amount>.08;
      glove.position.x=(1-amount)*.15;
      glove.position.z=.63+(1-amount)*.12;
      for(const {jaw,sign} of jaws)jaw.quaternion.setFromAxisAngle(hingeAxis,sign*.40*(1-amount));
    }
  };
}

export function steelReflections() {
  const width=128,height=64, data=new Uint8Array(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const square=(u,v,rx,ry) => Math.max(0,1-Math.max(Math.abs(x-u)/rx,Math.abs(y-v)/ry));
    const light=.065+.8*square(28,17,25,9)+.87*square(93,28,12,16)+.24*square(61,48,21,8);
    const at=(y*width+x)*4;
    data[at]=Math.round(light*215);data[at+1]=Math.round(light*235);data[at+2]=Math.round(light*255);data[at+3]=255;
  }
  const texture=new T.DataTexture(data,width,height);
  texture.mapping=T.EquirectangularReflectionMapping;
  texture.needsUpdate=true;
  return texture;
}
