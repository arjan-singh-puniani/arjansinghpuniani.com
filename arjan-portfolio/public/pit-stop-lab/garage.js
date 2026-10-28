import * as THREE from './vendor/three.module.js';
// Original metric garage and reflection room; no remote images or HDR dependency.
export function createGarage(renderer,parent,{box,cylinder,mat,wheel,batchStatic}){
 const room=new THREE.Group();parent.add(room);const cameraWalls=[],textures=[];
 const wall=mat('#93989f',.35,.42),steel=mat('#6b7178',.8,.29),red=mat('#9f1020',.3,.28),dark=mat('#191c21',.35,.4),trim=mat('#32373e',.6,.32),white=mat('#c9ccd1',.3,.36),light=new THREE.MeshBasicMaterial({color:'#fff4df'});
 function texture(canvas){const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;textures.push(t);return t;}
 function graphic(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);return texture(c);}
 function sign(x,y,z,w,h,map){const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map,transparent:true}));p.position.set(x,y,z);p.rotation.y=Math.PI;room.add(p);return p;}
 const floorMap=graphic(512,512,(c,w,h)=>{c.fillStyle='#7b8086';c.fillRect(0,0,w,h);let seed=42;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<18000;i++){const v=90+random()*65;c.fillStyle=`rgba(${v},${v},${v},.18)`;c.fillRect(random()*w,random()*h,1,1);}for(let i=0;i<18;i++){c.strokeStyle='rgba(20,25,30,.07)';c.lineWidth=1+random()*2;c.beginPath();const x=random()*w,y=random()*h;c.moveTo(x,y);c.bezierCurveTo(x+20,y-4,x+40,y+4,x+60,y-8);c.stroke();}});
 floorMap.wrapS=floorMap.wrapT=THREE.RepeatWrapping;floorMap.repeat.set(14,24);
 box(room,0,-.065,0,42,.12,80,new THREE.MeshStandardMaterial({color:'#a5acb3',map:floorMap,roughness:.38,metalness:.32}));
 // Flush epoxy work zone, rather than a floating display plinth.
 box(room,0,-.001,0,5.7,.004,8.2,mat('#555d66',.28,.4));
 for(const x of [-2.86,2.86])box(room,x,.002,0,.035,.004,8.25,red);
 for(const x of [-1.26,1.26]){box(room,x,.004,0,.025,.004,6.2,white);box(room,x,.005,-3.1,.32,.005,.034,red);}
 const floorLabel=graphic(1024,128,c=>{c.fillStyle='#cdd2d7';c.font='600 64px Arial';c.fillText('01   /   SERVICE',35,88);c.fillRect(720,35,240,3);});
 const marking=sign(0,.007,-3.8,2.5,.3125,floorLabel);marking.rotation.set(-Math.PI/2,0,0);box(room,0,.001,-4.5,11,.003,.05,mat('#bda760'));
 for(const x of [-5.6,5.6]){const s=Math.sign(x),w=box(room,x,1.8,2.8,.16,3.6,15,wall);cameraWalls.push({object:w,axis:'x',sign:s,threshold:4.8});box(room,x-s*.09,.18,2.8,.018,.30,15,trim);box(room,x-s*.09,1.35,2.8,.025,.055,15,red);for(let z=-4;z<10;z+=1.4)box(room,x-s*.095,2.5,z,.02,1.6,.014,steel);}
 const back=box(room,0,1.8,7.8,11.2,3.6,.14,wall);cameraWalls.push({object:back,axis:'z',sign:1,threshold:6.8});box(room,0,3.15,7.63,11.1,.58,.12,dark);
 // The open bay connects to a pit-lane corridor, visible from the rear inspection camera.
 for(const x of [-5.5,5.5])box(room,x,1.9,-4.6,.22,3.8,.30,trim);
 box(room,0,3.75,-4.6,11.2,.22,.40,steel);
 box(room,0,-.025,-9,70,.035,8,mat('#565c63',.08,.74));
 for(const z of [-5.2,-11.7])box(room,0,.002,z,70,.004,.07,white);
 // Leave a passage around the modeled exit at x=4.8, including its turning envelope.
 for(const [left,right] of [[-35,2],[7.5,35]]){
  const x=(left+right)/2,w=right-left;box(room,x,.44,-13.2,w,.88,.42,mat('#abb1b8',.1,.67));box(room,x,.92,-13.2,w,.07,.5,steel);
  for(const y of [1.1,1.3,1.5,1.7,1.9])box(room,x,y,-13.2,w,.008,.008,steel);
 }
 for(let x=-30;x<=30;x+=2.5){
  if(x<=2||x>=7.5)box(room,x,1.52,-13.2,.035,1.2,.035,steel);
  if(x!==5){box(room,x,2.15,-20,2.35,3.1,.25,dark);box(room,x,2.15,-19.85,2.15,2.5,.02,mat('#4c6271',.65,.25));}
 }
 box(room,0,3.9,-20,70,.16,4,trim);
 const fascia=graphic(1536,128,(c,w,h)=>{c.fillStyle='#15181c';c.fillRect(0,0,w,h);c.fillStyle='#c12637';c.fillRect(32,25,9,78);c.fillStyle='#e3e6e9';c.font='600 61px Arial';c.fillText('01',70,86);c.font='500 24px Arial';c.fillStyle='#a7adb6';c.fillText('VEHICLE OPERATIONS',210,78);c.fillText('PIT STOP LAB',1180,78);});sign(0,3.15,7.55,10.6,.883,fascia);
 for(let x=-5;x<=5;x+=1.25){box(room,x,.58,7.32,1.16,1.10,.72,dark);box(room,x,1.15,7.27,1.21,.06,.88,steel);for(let y=.19;y<1.1;y+=.18){box(room,x,y,6.945,1.07,.013,.016,trim);box(room,x,y+.065,6.92,.70,.018,.032,steel);}box(room,x,.055,7.32,1.02,.08,.64,trim);}
 const peg=graphic(256,256,(c,w,h)=>{c.fillStyle='#373e46';c.fillRect(0,0,w,h);c.fillStyle='#1a2027';for(let x=12;x<w;x+=16)for(let y=12;y<h;y+=16){c.beginPath();c.arc(x,y,1.7,0,Math.PI*2);c.fill();}});sign(-3.7,2.03,7.68,2.25,1.43,peg);
 for(let i=0;i<7;i++){const x=-4.55+i*.26;box(room,x,1.92,7.61,.025,.32+i*.022,.025,steel);const end=cylinder(.037,.025,steel,12);end.rotation.x=Math.PI/2;end.position.set(x,2.08+i*.011,7.61);room.add(end);}
 for(const x of [-3.7,3.7]){box(room,x,.59,3.8,.90,.94,.65,red);box(room,x,1.08,3.8,.99,.055,.77,steel);box(room,x,.12,3.8,.85,.06,.62,trim);for(let y=.23;y<1;y+=.16){box(room,x,y,3.466,.78,.012,.019,dark);box(room,x,y+.055,3.44,.58,.025,.025,steel);}box(room,x+.50,.98,3.8,.04,.10,.54,steel);for(const dx of [-.32,.32])for(const dz of [-.23,.23]){const c=cylinder(.07,.045,dark);c.rotation.z=Math.PI/2;c.position.set(x+dx,.08,3.8+dz);room.add(c);}for(let i=0;i<5;i++){const c=cylinder(.022,.045,steel,12);c.position.set(x-.26+i*.09,1.135,3.72);room.add(c);}const tool=cylinder(.045,.25,dark);tool.rotation.z=Math.PI/2;tool.position.set(x+.10,1.15,3.97);room.add(tool);box(room,x+.18,1.14,3.9,.07,.05,.16,red);}
 const blanket=mat('#333942',.05,.87);
 for(const x of [-4.8,4.8]){const sx=Math.sign(x);for(const dx of [0,sx*.60])for(const z of [5,6])box(room,x+dx,1,z,.045,2,.045,steel);for(const y of [.40,1.25]){box(room,x+.3*sx,y,5.5,.72,.045,1.3,steel);for(const z of [5.22,5.78]){const w=wheel();w.position.set(x+.30*sx,y+.35,z);w.rotation.y=Math.PI/2;w.traverse(o=>{if(o.isMesh)o.material=blanket;});room.add(w);box(room,x+.30*sx,y+.70,z,.38,.014,.055,white);}}}
 // Physical screens receive actual simulation snapshots, never invented live telemetry.
 const monitorCanvas=document.createElement('canvas');monitorCanvas.width=1536;monitorCanvas.height=576;const monitorMap=texture(monitorCanvas),mc=monitorCanvas.getContext('2d');
 for(const x of [-.95,1.95]){box(room,x,2.12,7.52,2.66,1.10,.10,dark);sign(x,2.12,7.455,2.53,1.0,monitorMap);}
 for(const x of [-4.6,4.6]){box(room,x,2.85,0,.045,.055,8.5,steel);box(room,x,2.4,-3.4,.06,.9,.06,steel);for(const z of [-1.65,1.65]){const reel=cylinder(.13,.09,red,32);reel.rotation.z=Math.PI/2;reel.position.set(x,2.7,z);room.add(reel);}}
 for(const z of [-3.5,0,3.5,6.5]){box(room,0,3.65,z,11.2,.10,.12,trim);for(const x of [-3,0,3]){box(room,x,3.60,z,2.0,.07,.40,dark);box(room,x,3.55,z,1.90,.025,.30,light);}}
 // Open ceiling architecture must not project giant beam shadows across the car.
 room.traverse(o=>{if(o.isMesh)o.castShadow=false;});batchStatic(room,new Set(cameraWalls.map(w=>w.object)));
 const contactMap=graphic(128,128,c=>{const g=c.createRadialGradient(64,64,10,64,64,64);g.addColorStop(0,'rgba(0,0,0,.6)');g.addColorStop(.65,'rgba(0,0,0,.3)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,128,128);});
 const contact=new THREE.Mesh(new THREE.PlaneGeometry(2.7,5.7),new THREE.MeshBasicMaterial({map:contactMap,transparent:true,depthWrite:false,opacity:.6}));contact.rotation.x=-Math.PI/2;contact.position.y=.009;parent.add(contact);
 const environmentScene=new THREE.Scene();environmentScene.background=new THREE.Color('#41464e');const panelGeometry=new THREE.PlaneGeometry(1,1);
 for(const [pos,scale] of [[[0,4,0],[3,8]],[[4,2,1],[5,1.1]],[[-4,2,1],[5,1.1]],[[0,2,-7],[6,2]]]){const p=new THREE.Mesh(panelGeometry,light);p.position.set(...pos);p.scale.set(...scale,1);p.lookAt(0,.4,0);environmentScene.add(p);}
 const pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromScene(environmentScene,.025,.1,40);pmrem.dispose();panelGeometry.dispose();let stamp='';
 function update(state,ops){const next=`${Math.floor(state.time*5)}/${ops.status}`;if(stamp===next)return;stamp=next;mc.fillStyle='#111923';mc.fillRect(0,0,1536,576);mc.fillStyle='#a4aebc';mc.font='500 30px monospace';mc.fillText('01 / SIMULATED SERVICE',44,55);mc.fillText('SNAPSHOT → RELEASE GUARD',44,528);mc.fillStyle='#f0f3f5';mc.font='500 76px monospace';mc.fillText(`${state.time.toFixed(2)} s`,44,150);mc.font='500 32px monospace';mc.fillText(ops.status.replaceAll('_',' '),690,135);ops.corners.forEach((c,i)=>{const x=44+(i%2)*735,y=225+Math.floor(i/2)*117;mc.fillStyle=c.secured?'#69cbb4':'#e6b768';mc.fillRect(x,y,5,73);mc.font='600 31px monospace';mc.fillText(c.key,x+24,y+29);mc.fillStyle='#c1cbd5';mc.font='500 25px monospace';mc.fillText(c.state.replaceAll('_',' '),x+24,y+65);});monitorMap.needsUpdate=true;}
 return {room,cameraWalls,contact,environment:env.texture,update,dispose(){env.dispose();textures.forEach(t=>t.dispose());}};
}
