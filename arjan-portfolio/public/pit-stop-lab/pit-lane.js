import * as THREE from './vendor/three.module.js';
import {PIT_LANE} from './pit-lane-layout.js';

// Original schematic pit lane: garages open across the apron, not into the car's path.
export function createPitLane(renderer,parent,{box,cylinder,mat,wheel,batchStatic}){
    const group=new THREE.Group();parent.add(group);group.visible=false;group.name='Pit_lane_exterior';
    const cameraWalls=[],textures=[],floor=mat('#8b8d89',.03,.9),asphalt=mat('#3b454a',.02,.96),wall=mat('#c6c8c3',.1,.7),dark=mat('#252c32',.15,.65),steel=mat('#828f94',.6,.45),red=mat('#b62132',.1,.5),paint=mat('#e1ddd0',0,.9),yellow=mat('#e6bd4e',0,.85);
    box(group,0,-.085,0,52,.12,110,mat('#adb5b3',0,.95));
    box(group,-.3,-.013,0,6.8,.026,100,floor);box(group,PIT_LANE.fastLaneCenter,-.0125,0,3.4,.025,100,asphalt);
    for(const x of [3.1,6.5])box(group,x,.002,0,.055,.005,100,paint);
    for(const x of [-PIT_LANE.boxHalfWidth,PIT_LANE.boxHalfWidth])box(group,x,.004,0,.035,.005,9,paint);
    for(const z of [-4.5,4.5])box(group,0,.004,z,5.6,.005,.035,paint);
    for(const x of [-.8,.8]){box(group,x,.007,-1.65,.55,.006,.07,yellow);box(group,x,.007,-1.43,.055,.006,.43,yellow);}
    function graphic(width,height,draw){const c=document.createElement('canvas');c.width=width;c.height=height;draw(c.getContext('2d'),width,height);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;textures.push(t);return t;}
    const laneMap=graphic(512,128,c=>{c.fillStyle='#d9d7c8';c.font='600 51px monospace';c.textAlign='center';c.fillText('FAST LANE',256,52);c.font='500 43px monospace';c.fillText('↓ PIT EXIT',256,108);});
    for(const z of [-14,14]){const marking=new THREE.Mesh(new THREE.PlaneGeometry(2.3,.58),new THREE.MeshBasicMaterial({map:laneMap,transparent:true,depthWrite:false}));marking.rotation.x=-Math.PI/2;marking.rotation.z=-Math.PI/2;marking.position.set(4.8,.009,z);group.add(marking);}
    const pitWall=new THREE.Group();group.add(pitWall);
    box(pitWall,PIT_LANE.wall,.5,0,.4,1,104,wall);box(pitWall,PIT_LANE.wall,1.03,0,.48,.07,104,steel);
    for(let z=-50;z<=50;z+=3){box(pitWall,PIT_LANE.wall,1.65,z,.04,1.2,.04,steel);}
    for(const y of [1.25,1.55,1.85,2.15])box(pitWall,PIT_LANE.wall,y,0,.01,.008,104,steel);
    batchStatic(pitWall);cameraWalls.push({object:pitWall,axis:'x',sign:1,threshold:6.8});
    // An active open garage and neighboring bays all sit behind the service apron.
    for(const center of [-26,-13,0,13,26]){
        const garage=new THREE.Group();garage.name=`Garage_${center}`;group.add(garage);
        box(garage,-9.35,-.023,center,11.3,.035,12.5,mat('#626b70',.12,.65));
        box(garage,-15,2.1,center,.18,4.2,12.5,wall);
        for(const z of [center-6.2,center+6.2])box(garage,-9.35,2.1,z,11.3,4.2,.15,wall);
        const roof=box(garage,-9.35,4.25,center,11.5,.18,12.7,wall);cameraWalls.push({object:roof,axis:'x',sign:-1,threshold:4});
        for(const z of [center-6,center+6])box(garage,-3.7,2.1,z,.22,4.2,.22,steel);
        box(garage,-3.62,3.78,center,.25,.65,12.2,dark);box(garage,-3.47,3.42,center,.04,.06,12.2,red);
        if(center!==0){box(garage,-3.8,1.52,center,.06,3.0,11.6,mat('#737c82',.35,.65));for(let y=.25;y<3;y+=.27)box(garage,-3.75,y,center,.02,.018,11.4,steel);}
        else{
            for(const z of [-4.8,4.8]){box(garage,-8.5,.6,z,7,1.15,.75,dark);box(garage,-8.5,1.2,z,7.2,.06,.9,steel);for(let x=-11.2;x<-5.5;x+=1.05)for(let y=.25;y<1.1;y+=.22)box(garage,x,y,z+Math.sign(z)*-.39,.85,.02,.02,steel);}
            for(const z of [-3.8,3.8]){box(garage,-5.2,.62,z,.8,1.1,.8,red);box(garage,-5.2,1.2,z,.9,.06,.9,steel);}
            for(const z of [-3.7,3.7])for(const x of [-11,-10.4]){const tire=wheel();tire.position.set(x,.355,z);tire.rotation.y=Math.PI/2;garage.add(tire);}
        }
        garage.traverse(o=>{if(o.isMesh)o.castShadow=true;});batchStatic(garage,new Set([roof]));
    }
    const headerMap=graphic(1024,128,c=>{c.fillStyle='#222a30';c.fillRect(0,0,1024,128);c.fillStyle='#df443b';c.fillRect(22,23,8,82);c.fillStyle='#e6e6df';c.font='600 58px monospace';c.fillText('01 / PIT STOP LAB',62,84);});
    const header=new THREE.Mesh(new THREE.PlaneGeometry(6.6,.825),new THREE.MeshBasicMaterial({map:headerMap}));header.rotation.y=Math.PI/2;header.position.set(-3.465,3.81,0);group.add(header);
    // The gun feeds stay over the pit box, clear of the adjacent fast lane.
    for(const z of [-1.65,1.65]){box(group,-3.25,1.65,z,.11,3.3,.11,steel);box(group,-.3,3.25,z,6,.10,.12,steel);for(const x of [-2.65,2.65]){const reel=cylinder(.12,.08,red,20);reel.rotation.z=Math.PI/2;reel.position.set(x,3.14,z);group.add(reel);}}
    const boardCanvas=document.createElement('canvas');boardCanvas.width=768;boardCanvas.height=256;const ctx=boardCanvas.getContext('2d'),boardMap=new THREE.CanvasTexture(boardCanvas);boardMap.colorSpace=THREE.SRGBColorSpace;textures.push(boardMap);
    const board=new THREE.Mesh(new THREE.PlaneGeometry(2.5,.833),new THREE.MeshBasicMaterial({map:boardMap}));board.rotation.y=Math.PI/2;board.position.set(-3.43,2.75,3.9);group.add(board);
    box(group,-3.5,2.75,3.9,.12,1.0,2.7,dark);
    batchStatic(group,new Set(cameraWalls.map(w=>w.object)));
    const envScene=new THREE.Scene();envScene.background=new THREE.Color('#c3d1d6');const envGround=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshBasicMaterial({color:'#858d8c'}));envGround.rotation.x=-Math.PI/2;envGround.position.y=-1;envScene.add(envGround);const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(envScene,.05,.1,100);pmrem.dispose();envGround.geometry.dispose();envGround.material.dispose();let stamp='';
    function update(state,ops){const next=`${Math.floor(state.time*5)}/${ops.secured}/${ops.status}`;if(stamp===next)return;stamp=next;ctx.fillStyle='#17232a';ctx.fillRect(0,0,768,256);ctx.fillStyle='#d1d9d8';ctx.font='500 29px monospace';ctx.fillText('01 / PIT LANE SERVICE',28,45);ctx.fillStyle=ops.release.approved?'#70deb2':ops.status==='SAFETY HOLD'?'#ff987b':'#f0ce7c';ctx.font='600 48px monospace';ctx.fillText(ops.status.replaceAll('_',' '),28,125);ctx.font='500 31px monospace';ctx.fillText(`${state.time.toFixed(2)} s   ${ops.secured}/4 RETAINED`,28,207);boardMap.needsUpdate=true;}
    return {group,cameraWalls,environment:environment.texture,update,dispose(){environment.dispose();textures.forEach(t=>t.dispose());}};
}
