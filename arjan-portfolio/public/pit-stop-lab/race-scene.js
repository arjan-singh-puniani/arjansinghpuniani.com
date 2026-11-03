import * as THREE from './vendor/three.module.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {cinematicFrame,raceCamera} from './cinema.js';
import {seededRandom} from './simulation.js';
import {renderScale} from './render-scale.js';

// An original condensed circuit stage. Only the centerline and car inputs are observed.
export function createRaceScene(canvas,tracks,{onReady,onError,onOrbit}){
    const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'default'});
    const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info'),gpu=debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):'',software=/SwiftShader|llvmpipe|software/i.test(gpu);
    renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.06;
    renderer.shadowMap.enabled=!software;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    const scene=new THREE.Scene();scene.background=new THREE.Color('#b4ccd4');scene.fog=new THREE.Fog('#b4ccd4',160,600);
    const camera=new THREE.PerspectiveCamera(40,1,.025,700),controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.minDistance=2;controls.maxDistance=230;controls.maxPolarAngle=Math.PI*.47;controls.enabled=false;
    controls.addEventListener('start',onOrbit);
    const hemi=new THREE.HemisphereLight('#dceeff','#716555',1.65);scene.add(hemi);
    const sun=new THREE.DirectionalLight('#ffead0',3.8);sun.position.set(30,55,20);sun.castShadow=!software;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:1,far:150});sun.shadow.normalBias=.015;sun.shadow.bias=-.0002;sun.shadow.radius=3;scene.add(sun,sun.target);
    const fill=new THREE.DirectionalLight('#a8ceef',1.2);fill.position.set(-40,25,-30);scene.add(fill);
    const geometries=new Set(),materials=new Set(),textures=new Set(),instances=new Map(),unitBox=new THREE.BoxGeometry(1,1,1),unitCylinder=new THREE.CylinderGeometry(1,1,1,8);
    geometries.add(unitBox);geometries.add(unitCylinder);
    const material=(color,metalness=0,roughness=.7)=>{const m=new THREE.MeshStandardMaterial({color,metalness,roughness});materials.add(m);return m;};
    const headGeometry=new THREE.SphereGeometry(1,7,5),torsoGeometry=new THREE.CapsuleGeometry(1,1,2,6);geometries.add(headGeometry);geometries.add(torsoGeometry);
    const M={ivory:material('#e0ddd2',.1,.56),red:material('#b92c2b',.15,.39),dark:material('#23313a',.4,.43),steel:material('#7e8e94',.8,.33),glass:material('#517c88',.75,.22),sand:material('#ada78d',0,.94),leaf:material('#456a52',0,.85),trunk:material('#797260',0,.83),mint:material('#a0bdb6',.2,.48),seat:material('#b9c6c0',0,.7),crowdRed:material('#a44835',0,.9),crowdBlue:material('#31566c',0,.9),skin:material('#aa8c74',0,.9)};
    function instance(g,m,position,scale,rotation=[0,0,0]){const key=g.uuid+m.uuid;if(!instances.has(key))instances.set(key,{g,m,rows:[]});instances.get(key).rows.push({position,scale,rotation});}
    const box=(m,x,y,z,w,h,d,angle=0)=>instance(unitBox,m,[x,y,z],[w,h,d],[0,angle,0]);
    const cylinder=(m,x,y,z,r,h)=>instance(unitCylinder,m,[x,y,z],[r,h,r]);
    function mesh(g,m){geometries.add(g);const o=new THREE.Mesh(g,m);o.receiveShadow=true;scene.add(o);return o;}
    const bounds=tracks[0].bounds,bx=bounds[0]+12,bz=bounds[1]+12;
    const shape=new THREE.Shape(),r=5;shape.moveTo(-bx+r,-bz);shape.lineTo(bx-r,-bz);shape.quadraticCurveTo(bx,-bz,bx,-bz+r);shape.lineTo(bx,bz-r);shape.quadraticCurveTo(bx,bz,bx-r,bz);shape.lineTo(-bx+r,bz);shape.quadraticCurveTo(-bx,bz,-bx,bz-r);shape.lineTo(-bx,-bz+r);shape.quadraticCurveTo(-bx,-bz,-bx+r,-bz);
    const platform=mesh(new THREE.ExtrudeGeometry(shape,{depth:.8,bevelEnabled:true,bevelSize:.22,bevelThickness:.2,bevelSegments:3,steps:1}),M.sand);platform.rotation.x=-Math.PI/2;platform.position.y=-1.01;
    const ground=mesh(new THREE.PlaneGeometry(1800,1800),material('#b6c2c2',0,.9));ground.rotation.x=-Math.PI/2;ground.position.y=-1.23;
    const points=tracks[0].path.map(p=>new THREE.Vector3(p.x,.015,p.z)),curve=new THREE.CatmullRomCurve3(points,true,'centripetal');
    const roadPoints=curve.getSpacedPoints(1600),normals=roadPoints.map((p,i)=>{const a=roadPoints[Math.max(0,i-1)],b=roadPoints[Math.min(roadPoints.length-1,i+1)],v=new THREE.Vector3(b.z-a.z,0,-(b.x-a.x)).normalize();return v;});
    function ribbon(inner,outer,y,color,vertexColors=false){
        const count=roadPoints.length,positions=new Float32Array(count*6),colors=new Float32Array(count*6),uvs=new Float32Array(count*4),indices=[];
        roadPoints.forEach((p,i)=>{for(let side=0;side<2;side++){const q=p.clone().addScaledVector(normals[i],side?outer:inner);positions.set([q.x,y,q.z],i*6+side*3);uvs.set([q.x*.5,q.z*.5],i*4+side*2);const c=new THREE.Color(vertexColors?(Math.floor(i/4)%2?'#e4e2d9':'#bf4236'):color);colors.set([c.r,c.g,c.b],i*6+side*3);}if(i<count-1){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}});
        const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(positions,3));g.setAttribute('color',new THREE.BufferAttribute(colors,3));g.setAttribute('uv',new THREE.BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();const m=material(color,.02,.83);m.vertexColors=vertexColors;return mesh(g,m);
    }
    ribbon(-2.3,2.3,-.035,'#7c8379');const road=ribbon(-1.65,1.65,.025,'#303b40');
    ribbon(-1.98,-1.65,.04,'#ffffff',true);ribbon(1.65,1.98,.04,'#ffffff',true);ribbon(-1.62,-1.59,.045,'#ddd9c8');ribbon(1.59,1.62,.045,'#ddd9c8');
    // Original asphalt microtexture stays local and repeatable.
    const noiseCanvas=document.createElement('canvas');noiseCanvas.width=noiseCanvas.height=256;const nc=noiseCanvas.getContext('2d'),pixels=nc.createImageData(256,256),random=seededRandom(91);
    for(let i=0;i<pixels.data.length;i+=4){const n=225+Math.floor(random()*30);pixels.data.set([n,n,n,255],i);}nc.putImageData(pixels,0,0);const asphalt=new THREE.CanvasTexture(noiseCanvas);asphalt.wrapS=asphalt.wrapT=THREE.RepeatWrapping;asphalt.repeat.set(1,1);textures.add(asphalt);road.material.roughnessMap=asphalt;
    function trackPoint(index,offset=0){const i=(index+roadPoints.length-1)%(roadPoints.length-1),p=roadPoints[i],n=normals[i],next=roadPoints[(i+1)%(roadPoints.length-1)];return {x:p.x+n.x*offset,z:p.z+n.z*offset,yaw:Math.atan2(next.x-p.x,next.z-p.z),n};}
    const clearance=p=>Math.min(...tracks[0].points.map(r=>Math.hypot(r.x-p.x,r.z-p.z)));
    function relative(origin,x,y,z){return [origin.x+Math.cos(origin.yaw)*x+Math.sin(origin.yaw)*z,y,origin.z-Math.sin(origin.yaw)*x+Math.cos(origin.yaw)*z];}
    const localBox=(origin,m,x,y,z,w,h,d)=>{const p=relative(origin,x,y,z);box(m,...p,w,h,d,origin.yaw);};
    // Distinct original grandstands, open pit buildings and sculpted service furniture.
    for(const index of [30,260,560,850,1120,1380]){
        let o=trackPoint(index,8);if(clearance(o)<6)o=trackPoint(index,-8);if(clearance(o)<6)continue;
        for(let tier=0;tier<5;tier++){
            localBox(o,M.ivory,0,.3+tier*.35,tier*.65,12,.36,1.2);
            for(let seat=0;seat<26;seat++){
                const x=-5.6+seat*.44,y=.57+tier*.35,z=tier*.65;localBox(o,seat%6===0?M.red:M.seat,x,y,z,.33,.20,.36);
                if((seat+tier)%5!==0){const body=relative(o,x,y+.17,z-.08),head=relative(o,x,y+.36,z-.08);instance(torsoGeometry,(seat+tier)%3?M.crowdBlue:M.crowdRed,body,[.065,.067,.06],[0,o.yaw,0]);instance(headGeometry,M.skin,head,[.075,.083,.075]);}
            }
        }
        localBox(o,M.dark,0,3.3,1.3,13,.16,5.5);localBox(o,M.ivory,0,3.46,1.3,13.3,.12,5.7);
        for(const x of [-5.8,5.8])for(const z of [-.7,3.4])localBox(o,M.steel,x,1.7,z,.12,3.3,.12);
    }
    const pit=trackPoint(65,-8);
    for(let bay=0;bay<7;bay++){
        const z=(bay-3)*4.1;localBox(pit,M.ivory,0,1.5,z,6,3,3.9);localBox(pit,M.dark,3.02,1.1,z,.04,2.2,3.3);localBox(pit,M.glass,3.05,2.55,z,.05,.55,3.3);localBox(pit,M.red,3.12,.18,z,.18,.36,3.65);
        localBox(pit,M.dark,0,3.12,z,6.8,.14,4.12);localBox(pit,M.glass,2,3.55,z,2.6,.7,3.5);localBox(pit,M.ivory,0,4,z,6.6,.15,4.12);
        localBox(pit,M.steel,4.3,.26,z,.6,.5,1.2);
    }
    // Infield objects are admitted only when they clear the condensed racing surface.
    const leafGeometry=new THREE.BufferGeometry(),leafPositions=[],leafIndices=[];
    for(let i=0;i<=7;i++){const t=i/7,width=Math.sin(t*Math.PI)*.26,y=Math.sin(t*Math.PI)*.33-t*t*.4;leafPositions.push(-width,y,t*1.9,width,y,t*1.9);if(i<7){const a=i*2;leafIndices.push(a,a+2,a+1,a+1,a+2,a+3);}}
    leafGeometry.setAttribute('position',new THREE.Float32BufferAttribute(leafPositions,3));leafGeometry.setIndex(leafIndices);leafGeometry.computeVertexNormals();geometries.add(leafGeometry);M.leaf.side=THREE.DoubleSide;
    for(let i=0;i<140;i++){
        const x=(random()*2-1)*bounds[0],z=(random()*2-1)*bounds[1];if(clearance({x,z})<6)continue;
        if(i%4===0){box(M.mint,x,.28,z,1.2,.55,2.4,random()*Math.PI);continue;}
        const height=2+random()*2.5;cylinder(M.trunk,x,height/2,z,.11,height);
        for(let leaf=0;leaf<7;leaf++){const angle=leaf*Math.PI*2/7+random()*.12;instance(leafGeometry,M.leaf,[x,height,z],[1,.8,1],[.07,angle,0]);}
        cylinder(M.ivory,x,.16,z,.55,.3);
    }
    // Guardrails and the start-line checkerboard give the original stage a clear racing scale.
    for(let i=0;i<roadPoints.length-1;i+=8){
        const p=trackPoint(i,3.4);if(clearance(p)<2.8)continue;
        box(M.steel,p.x,.25,p.z,.07,.07,2.75,p.yaw);box(M.steel,p.x,.42,p.z,.07,.06,2.75,p.yaw);
        if(i%24===0)cylinder(M.steel,p.x,.25,p.z,.035,.5);
    }
    const start=trackPoint(0);for(let row=0;row<2;row++)for(let col=0;col<8;col++)localBox(start,(row+col)%2?M.ivory:M.dark,(col-3.5)*.4,.048,row*.3,.4,.006,.3);
    for(const x of [-2.6,2.6])localBox(start,M.steel,x,2.2,-1,.12,4.4,.12);
    localBox(start,M.dark,0,4.4,-1,5.5,.5,.25);localBox(start,M.red,0,4.67,-1,5.5,.035,.3);
    const bulb=new THREE.MeshBasicMaterial({color:'#fff1cc'});materials.add(bulb);
    for(let i=0;i<roadPoints.length-1;i+=65){let p=trackPoint(i,4.7);if(clearance(p)<3.6)continue;cylinder(M.steel,p.x,2.5,p.z,.045,5);box(M.dark,p.x,5,p.z,.9,.12,.45,p.yaw);box(bulb,p.x,4.92,p.z,.7,.035,.3,p.yaw);}
    const occluders=[],masked=[],unitBounds=new THREE.Box3(new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5)),cylinderBounds=new THREE.Box3(new THREE.Vector3(-1,-.5,-1),new THREE.Vector3(1,.5,1));
    for(const batch of instances.values()){
        const object=new THREE.InstancedMesh(batch.g,batch.m,batch.rows.length),matrix=new THREE.Matrix4(),q=new THREE.Quaternion();
        batch.rows.forEach((r,i)=>{q.setFromEuler(new THREE.Euler(...r.rotation));matrix.compose(new THREE.Vector3(...r.position),q,new THREE.Vector3(...r.scale));object.setMatrixAt(i,matrix);if((batch.g===unitBox&&(r.scale[1]>1.3||r.scale[0]>5))||(batch.g===unitCylinder&&r.scale[1]>1.3))occluders.push({object,index:i,matrix:matrix.clone(),inverse:matrix.clone().invert(),bounds:batch.g===unitBox?unitBounds:cylinderBounds});});object.receiveShadow=true;object.castShadow=true;object.computeBoundingSphere();scene.add(object);
    }
    const envScene=new THREE.Scene();envScene.background=new THREE.Color('#6d7c87');const panelGeometry=new THREE.PlaneGeometry(1,1),panelMat=new THREE.MeshBasicMaterial({color:'#fff1dc'});materials.add(panelMat);geometries.add(panelGeometry);
    for(const [position,scale] of [[[0,7,0],[8,4]],[[5,3,0],[4,7]],[[-5,2,0],[4,7]],[[0,3,-7],[9,2]]]){const panel=new THREE.Mesh(panelGeometry,panelMat);panel.position.set(...position);panel.scale.set(...scale,1);panel.lookAt(0,.5,0);envScene.add(panel);}
    const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(envScene,.04,.1,35);pmrem.dispose();scene.environment=environment.texture;
    let ghost=false,alive=true,ready=false,mode='director',lastShot='',lastDraw=-Infinity,draws=0,lost=false,dirty=true,lastTime=null,pendingFrame=null,lastCameraTime=null;
    const cars=[],wheelSets=[],trails=[];
    function trail(color){const count=100,g=new THREE.BufferGeometry(),positions=new Float32Array(count*6),indices=[];g.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));for(let i=0;i<count-1;i++){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}g.setIndex(indices);const m=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.4,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});materials.add(m);const o=mesh(g,m);o.frustumCulled=false;return {o,g,positions,count};}
    const assetTimeout=setTimeout(()=>{if(alive&&!ready)onError('The car asset is taking too long to load.');},25000);
    new GLTFLoader().loadAsync(new URL('./assets/sf26-runtime.glb',import.meta.url).href).then(asset=>{
        clearTimeout(assetTimeout);
        if(!alive){asset.scene.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of [].concat(o.material))m.dispose();});return;}
        const driver=new THREE.Group(),helmetGeometry=new THREE.SphereGeometry(1,24,16),shieldGeometry=new THREE.SphereGeometry(1,24,8,Math.PI+.07,Math.PI-.14,Math.PI*.36,Math.PI*.27);
        const driverPart=(geometry,mat,position,scale)=>{const part=new THREE.Mesh(geometry,mat);part.position.set(...position);part.scale.set(...scale);driver.add(part);};
        driverPart(helmetGeometry,M.red,[0,.565,.12],[.17,.09,.15]);driverPart(helmetGeometry,M.ivory,[0,.727,.07],[.108,.125,.13]);driverPart(shieldGeometry,M.dark,[0,.727,.07],[.111,.128,.133]);asset.scene.add(driver);
        for(let i=0;i<2;i++){
            const car=asset.scene.clone(true);car.scale.setScalar(.38);car.visible=i===0||ghost;scene.add(car);cars.push(car);const wheels={};
            if(i===1){const clones=new Map();car.traverse(o=>{if(o.isMesh){o.material=[].concat(o.material).map(m=>{if(!clones.has(m.uuid)){const copy=m.clone();copy.transparent=true;copy.opacity=.28;copy.depthWrite=false;copy.color.set('#57bfb6');if(copy.emissive)copy.emissive.set('#122f2e');clones.set(m.uuid,copy);}return clones.get(m.uuid);});if(o.material.length===1)o.material=o.material[0];}});}
            for(const key of ['FL','FR','RL','RR'])wheels[key]=car.getObjectByName('Wheel_'+key);
            if(Object.values(wheels).some(w=>!w))throw new Error('The car is missing a wheel assembly.');wheelSets.push(wheels);
            car.traverse(o=>{if(o.isMesh){o.castShadow=i===0;o.receiveShadow=true;geometries.add(o.geometry);for(const m of [].concat(o.material)){materials.add(m);for(const t of Object.values(m))if(t?.isTexture)textures.add(t);}}});
            if(i===1){const markerMaterial=new THREE.MeshBasicMaterial({color:'#51d9c7',transparent:true,opacity:.3,depthWrite:false});materials.add(markerMaterial);const marker=mesh(new THREE.RingGeometry(.42,.47,48),markerMaterial);marker.visible=ghost;marker.rotation.x=-Math.PI/2;car.userData.marker=marker;trails[i]=trail('#4fc7bd');trails[i].o.visible=ghost;}

        }
        ready=true;dirty=true;lastShot='';onReady();
    }).catch(error=>{clearTimeout(assetTimeout);if(alive)onError(error.message);});
    const resize=()=>{const width=canvas.clientWidth,height=canvas.clientHeight;if(!width||!height)return;renderer.setPixelRatio(renderScale(width,height,devicePixelRatio,software));renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();dirty=true;};
    const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
    const lostContext=e=>{e.preventDefault();lost=true;pendingFrame=null;onError('3D context interrupted. Telemetry remains available.');},restore=()=>{lost=false;dirty=true;};canvas.addEventListener('webglcontextlost',lostContext);canvas.addEventListener('webglcontextrestored',restore);
    const target=new THREE.Vector3(),desired=new THREE.Vector3(),followOffset=new THREE.Vector3(),lookOffset=new THREE.Vector3(),carPosition=new THREE.Vector3(),desiredOffset=new THREE.Vector3(),desiredLook=new THREE.Vector3(),localRay=new THREE.Ray(),hit=new THREE.Vector3(),zeroMatrix=new THREE.Matrix4().makeScale(0,0,0);
    const focusPoints=[[0,.45,0],[0,.45,-2.1],[0,.45,2.1],[-.9,.45,0],[.9,.45,0]].map(p=>new THREE.Vector3(...p)),focusRays=focusPoints.map(()=>new THREE.Ray()),focusDistances=new Float64Array(focusPoints.length);
    function cameraCutaway(){
        const changed=new Set();for(const row of masked){row.object.setMatrixAt(row.index,row.matrix);changed.add(row.object);}masked.length=0;
        if(cars[0]&&mode!=='orbit'&&lastShot!=='overview'){
            cars[0].updateWorldMatrix(true,false);
            focusRays.forEach((ray,i)=>{ray.origin.copy(focusPoints[i]).applyMatrix4(cars[0].matrixWorld);ray.direction.subVectors(camera.position,ray.origin);focusDistances[i]=ray.direction.length();ray.direction.normalize();});
            for(const row of occluders)for(let i=0;i<focusRays.length;i++){const ray=focusRays[i];localRay.copy(ray).applyMatrix4(row.inverse);if(!localRay.intersectBox(row.bounds,hit))continue;const d=hit.applyMatrix4(row.matrix).distanceTo(ray.origin);if(d>.25&&d<focusDistances[i]+.2){row.object.setMatrixAt(row.index,zeroMatrix);masked.push(row);changed.add(row.object);break;}}
        }
        for(const object of changed)object.instanceMatrix.needsUpdate=true;
    }

    function render(time,now){
        if(!alive||lost||(software&&now-lastDraw<50))return;
        if(pendingFrame){const status=gl.clientWaitSync(pendingFrame,0,0);if(status===gl.TIMEOUT_EXPIRED)return;gl.deleteSync(pendingFrame);pendingFrame=null;}
        const moved=time!==lastTime;
        if(ready&&(moved||dirty)){
            tracks.forEach((track,i)=>{
                if(i===1&&!ghost)return;
                const f=cinematicFrame(track,Math.min(time,track.driver.duration)),car=cars[i];const offset=i?.8:0,cx=f.x+Math.cos(f.heading)*offset,cz=f.z-Math.sin(f.heading)*offset;car.position.set(cx,.027,cz);car.rotation.y=f.heading;
                for(const [key,wheel] of Object.entries(wheelSets[i]))wheel.rotation.set(f.roll,key.startsWith('F')?f.steer:0,0,'YXZ');
                if(i===1){car.userData.marker.position.set(cx,.075,cz);car.userData.marker.scale.setScalar(.8);const t=trails[i];for(let j=0;j<t.count;j++){const back=cinematicFrame(track,Math.max(0,time-(t.count-1-j)*.025)),w=.045*(j/t.count),side=[Math.cos(back.heading),-Math.sin(back.heading)],x=back.x+side[0]*offset,z=back.z+side[1]*offset;t.positions.set([x-side[0]*w,.085,z-side[1]*w,x+side[0]*w,.085,z+side[1]*w],j*6);}t.g.attributes.position.needsUpdate=true;}

            });
            const f=cinematicFrame(tracks[0],time);sun.position.set(f.x+28,54,f.z+22);sun.target.position.set(f.x,0,f.z);
        }
        let cameraMoving=false;
        if(mode!=='orbit'){
            const shot=raceCamera(tracks[0],time,mode),cut=shot.shot!==lastShot;controls.maxPolarAngle=shot.shot==='oncar'?Math.PI*.5:Math.PI*.47;desired.fromArray(shot.position);target.fromArray(shot.target);
            const mobile=canvas.clientWidth<700;if(mobile&&shot.shot!=='overview'&&shot.shot!=='oncar'){desired.sub(target).multiplyScalar(1.28).add(target);target.y-=.55;}
            if(mobile&&shot.shot==='overview')desired.sub(target).multiplyScalar(1.8).add(target);scene.fog.near=shot.shot==='overview'?400:160;scene.fog.far=shot.shot==='overview'?900:600;
            const dt=lastCameraTime===null?1/60:Math.min(.05,Math.max(0,(now-lastCameraTime)/1000));lastCameraTime=now;const follow=1-Math.exp(-15*dt),look=1-Math.exp(-20*dt);if(cars[0])carPosition.copy(cars[0].position);else carPosition.set(0,0,0);
            if(cut||shot.shot==='oncar'){camera.position.copy(desired);controls.target.copy(target);followOffset.subVectors(desired,carPosition);lookOffset.subVectors(target,carPosition);}
            else if(shot.shot==='overview'){camera.position.lerp(desired,follow);controls.target.lerp(target,look);}
            else{followOffset.lerp(desiredOffset.subVectors(desired,carPosition),follow);lookOffset.lerp(desiredLook.subVectors(target,carPosition),look);camera.position.copy(carPosition).add(followOffset);controls.target.copy(carPosition).add(lookOffset);}

            cameraMoving=camera.position.distanceToSquared(desired)>.000001||controls.target.distanceToSquared(target)>.000001;camera.fov=mobile&&shot.shot==='oncar'?100:shot.fov;camera.near=shot.shot==='overview'?.5:shot.shot==='oncar'?.02:.08;camera.updateProjectionMatrix();controls.enabled=false;lastShot=shot.shot;
        }
        const changed=controls.update();if(!dirty&&!moved&&!changed&&!cameraMoving)return;camera.lookAt(controls.target);cameraCutaway();renderer.render(scene,camera);draws++;lastDraw=now;lastTime=time;dirty=false;pendingFrame=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);gl.flush();
    }
    return {render,setGhost(value){ghost=!!value;dirty=true;cars.forEach((c,i)=>{c.visible=i===0||ghost;if(i===1){c.userData.marker.visible=ghost;trails[i].o.visible=ghost;}});},setCamera(value){mode=value;lastShot='';dirty=true;controls.enabled=value==='orbit';},get ready(){return ready;},get stats(){return {ready,camera:mode,shot:lastShot,cutaways:masked.length,draws,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,software,gpu};},dispose(){alive=false;clearTimeout(assetTimeout);if(pendingFrame)gl.deleteSync(pendingFrame);observer.disconnect();controls.removeEventListener('start',onOrbit);controls.dispose();canvas.removeEventListener('webglcontextlost',lostContext);canvas.removeEventListener('webglcontextrestored',restore);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());environment.dispose();renderer.dispose();}};
}
