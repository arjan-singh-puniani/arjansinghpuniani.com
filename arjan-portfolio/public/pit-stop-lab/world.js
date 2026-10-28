import * as THREE from './vendor/three.module.js';
import { OrbitControls } from './vendor/OrbitControls.js';
import { createMechanics } from './mechanics.js';
import { createGarage } from './garage.js';
import { crewPosture, jointBetween, stationCrewPose, planFootContacts, feetAt } from './crew.js';
import { loadHero, wheelTrack, setWheelRotation, alignmentTilt, CAR_IDENTITY } from './hero-car.js';
import { createFacility } from './facility.js';
import { operations } from './operations.js';
import { CORNERS, progress, snapshot } from './simulation.js';
export function createWorld(canvas, onSelect, onStatus) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'default' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    const gl=renderer.getContext(),debugRenderer=gl.getExtension('WEBGL_debug_renderer_info');
    const rendererName=debugRenderer?gl.getParameter(debugRenderer.UNMASKED_RENDERER_WEBGL):'';
    const software=/SwiftShader|llvmpipe|software/i.test(rendererName);
    if(software)renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = !software;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.localClippingEnabled = true;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#ced8d6');
    scene.fog = new THREE.Fog('#ced8d6', 65, 150);
    const camera = new THREE.PerspectiveCamera(36, 1, .04, 130);
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.minDistance = .35;
    controls.maxDistance = 55;
    controls.maxPolarAngle = Math.PI * .48;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const world = new THREE.Group(), mechanical = new THREE.Group();
    scene.add(world, mechanical);
    mechanical.visible = false;
    const ambient = new THREE.HemisphereLight(0xe5f3ff, 0x71604b, 2.2);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xfff0d9, 3.4);
    sun.position.set(9, 18, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1536, 1536);
    Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 17, bottom: -17, near: .5, far: 55 });
    sun.shadow.bias = -.0005;
    sun.shadow.normalBias = .008;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xb9d6f0, 1.2);
    fill.position.set(-10, 8, -10);
    scene.add(fill);
    const materials = {}, geometries = new Map();
    const mat = (color, metalness = 0, roughness = .65) => materials[color] ??= new THREE.MeshStandardMaterial({ color, metalness, roughness });
    const M = { white: mat('#edece1'), red: mat('#c51e32', .15, .35), carbon: mat('#202c31', .3, .45), metal: mat('#7c9297', .7, .35), rubber: mat('#222727'), glass: mat('#23404a', .6, .15), teal: mat('#2f8278'), concrete: mat('#b8c3bf'), road: mat('#566367'), yellow: mat('#f7c751') };
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cylinder = (radius, depth, material = M.rubber, segments = 20) => {
        const key = `c${radius}/${depth}/${segments}`;
        if (!geometries.has(key))
            geometries.set(key, new THREE.CylinderGeometry(radius, radius, depth, segments));
        return make(geometries.get(key), material);
    };
    function make(geometry, material) { const object = new THREE.Mesh(geometry, material); object.castShadow = true; object.receiveShadow = true; return object; }
    function box(parent, x, y, z, w, h, d, material = M.white) { const object = make(boxGeometry, material); object.position.set(x, y, z); object.scale.set(w, h, d); parent.add(object); return object; }
    const sphereGeometry = new THREE.SphereGeometry(1, 16, 10);
    function sphere(parent, x, y, z, sx, sy, sz, material) { const object = make(sphereGeometry, material); object.position.set(x, y, z); object.scale.set(sx, sy, sz); parent.add(object); return object; }
    const limbGeometry = new THREE.CylinderGeometry(.048, .055, 1, 8);
    const axis = new THREE.Vector3(0, 1, 0);
    function align(object, a, b, radius = 1) {
        const delta = b.clone().sub(a);
        object.position.copy(a).add(b).multiplyScalar(.5);
        object.scale.set(radius, delta.length(), radius);
        object.quaternion.setFromUnitVectors(axis, delta.normalize());
    }
    function rod(parent, a, b, material = M.metal, radius = .5) { const object = make(limbGeometry, material); align(object, new THREE.Vector3(...a), new THREE.Vector3(...b), radius); parent.add(object); return object; }
    function batchStatic(parent, excluded = new Set()) {
        parent.updateMatrixWorld(true);
        const inverse = parent.matrixWorld.clone().invert(), groups = new Map();
        parent.traverse(object => {
            if (object.isMesh && !object.isInstancedMesh && !excluded.has(object) && !Array.isArray(object.material)) {
                const key = object.geometry.uuid + object.material.uuid;
                if (!groups.has(key))
                    groups.set(key, []);
                groups.get(key).push(object);
            }
        });
        for (const objects of groups.values())
            if (objects.length > 1) {
                const first = objects[0], instances = new THREE.InstancedMesh(first.geometry, first.material, objects.length);
                instances.castShadow = objects.some(object=>object.castShadow);
                instances.receiveShadow = objects.some(object=>object.receiveShadow);
                objects.forEach((object, index) => { instances.setMatrixAt(index, inverse.clone().multiply(object.matrixWorld)); object.removeFromParent(); });
                parent.add(instances);
            }
    }
    function label(parent, text, position, width, color = '#edece1', background = '#26383b') {
        const source = document.createElement('canvas');
        source.width = 768;
        source.height = 160;
        const ctx = source.getContext('2d');
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, 768, 160);
        ctx.fillStyle = color;
        ctx.font = '600 66px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 384, 82);
        const texture = new THREE.CanvasTexture(source);
        texture.colorSpace = THREE.SRGBColorSpace;
        const object = make(new THREE.PlaneGeometry(width, width * 160 / 768), new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }));
        object.position.set(...position);
        object.rotation.y = Math.PI / 2;
        parent.add(object);
        return object;
    }
    const legacyFacility=new THREE.Group();world.add(legacyFacility);
    const facility = createFacility(legacyFacility, { box, sphere, cylinder, rod, label, mat, make, M, batchStatic, vehicle, wheel });
    const garage=createGarage(renderer,world,{box,cylinder,mat,wheel,batchStatic});
    scene.environment=garage.environment;
    const lightMat = facility.lightMat;
    let experience='explore', legacy=false, heroLoaded=false, heroError=null, hiddenBody=false, isolation=false;
    const panelNames=/Nose|Cockpit_survival|Engine_cover|White_engine|Sidepod|Floor|shark_fin/;
    function wheel(compound = M.yellow) {
        const group = new THREE.Group();
        if (!geometries.has('slick-profile'))
            geometries.set('slick-profile', new THREE.LatheGeometry([new THREE.Vector2(.226, -.152), new THREE.Vector2(.30, -.152), new THREE.Vector2(.344, -.12), new THREE.Vector2(.355, -.06), new THREE.Vector2(.355, .06), new THREE.Vector2(.344, .12), new THREE.Vector2(.30, .152), new THREE.Vector2(.226, .152)], 48));
        const tire = make(geometries.get('slick-profile'), M.rubber);
        tire.rotation.z = Math.PI / 2;
        group.add(tire);
        const rim = cylinder(.225, .312, M.metal);
        rim.rotation.z = Math.PI / 2;
        group.add(rim);
        const inner = cylinder(.17, .32, M.carbon);
        inner.rotation.z = Math.PI / 2;
        group.add(inner);
        const ring = make(new THREE.TorusGeometry(.293, .009, 6, 32), compound);
        ring.rotation.y = Math.PI / 2;
        ring.position.x = .158;
        group.add(ring);
        for (let i = 0; i < 5; i++) {
            const a = i * Math.PI * 2 / 5;
            const spoke = box(group, .165, 0, 0, .025, .038, .38, M.metal);
            spoke.rotation.x = a;
        }
        const nut = cylinder(.047, .35, M.metal, 8);
        nut.rotation.z = Math.PI / 2;
        group.add(nut);
        batchStatic(group);
        return group;
    }
    function vehicle(color = M.red) {
        const group = new THREE.Group(), body = new THREE.Group();
        group.add(body);
        // Longitudinal lofts make the monocoque, undercut sidepods and narrow nose one coherent volume.
        function shell(sections, material, offset = 0) {
            const positions = [], indices = [], segments = 16;
            sections.forEach(([z, width, bottom, height]) => { for (let i = 0; i < segments; i++) {
                const a = i / segments * Math.PI * 2;
                positions.push(offset + Math.cos(a) * width, bottom + (Math.sin(a) + 1) * height / 2, z);
            } });
            for (let j = 0; j < sections.length - 1; j++)
                for (let i = 0; i < segments; i++) {
                    const a = j * segments + i, b = j * segments + (i + 1) % segments, c = a + segments, d = b + segments;
                    indices.push(a, c, b, b, c, d);
                }
            for (let i = 1; i < segments - 1; i++) {
                indices.push(0, i + 1, i);
                const last = (sections.length - 1) * segments;
                indices.push(last, last + i, last + i + 1);
            }
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geometry.setIndex(indices);
            geometry.computeVertexNormals();
            body.add(make(geometry, material));
        }
        box(body, 0, .15, .10, 1.62, .055, 3.86, M.carbon);
        shell([[-2.37, .09, .26, .11], [-1.72, .16, .32, .17], [-1.0, .24, .30, .32], [-.58, .34, .26, .42], [.12, .37, .26, .45], [.65, .30, .25, .55], [1.2, .21, .26, .46], [1.82, .10, .30, .21]], color);
        for (const side of [-1, 1]) {
            shell([[-.65, .10, .28, .20], [-.32, .24, .25, .30], [.25, .27, .24, .31], [.95, .20, .24, .28], [1.52, .06, .25, .12]], color, side * .49);
            box(body, side * .56, .51, -.20, .28, .05, .35, M.carbon);
            for (let i = 0; i < 6; i++) {
                const vent = box(body, side * .55, .56, .25 + i * .13, .31, .012, .035, M.carbon);
                vent.rotation.z = side * .06;
            }
            box(body, side * .77, .20, .25, .045, .12, 2.5, M.carbon);
            for (const z of [-1.65, 1.65]) {
                rod(body, [side * .20, .23, z - .36], [side * .84, .35, z], M.carbon, .25);
                rod(body, [side * .21, .54, z + .28], [side * .84, .41, z], M.carbon, .25);
                rod(body, [side * .20, .53, z - .22], [side * .84, .41, z], M.carbon, .23);
                rod(body, [side * .27, .33, z + .30], [side * .84, .37, z], M.metal, .14);
                const brake = cylinder(.21, .035, M.metal);
                brake.rotation.z = Math.PI / 2;
                brake.position.set(side * .82, .355, z);
                body.add(brake);
                box(body, side * .82, .36, z + .16, .05, .18, .1, color);
            }
        }
        sphere(body, 0, .67, -.12, .26, .10, .42, M.carbon);
        sphere(body, 0, .74, .08, .135, .16, .155, M.white);
        sphere(body, 0, .77, -.05, .12, .045, .035, M.glass);
        box(body, 0, .898, .08, .035, .008, .18, color);
        const haloCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(-.28, .65, .36), new THREE.Vector3(-.29, .89, -.15), new THREE.Vector3(0, .94, -.48), new THREE.Vector3(.29, .89, -.15), new THREE.Vector3(.28, .65, .36)]);
        body.add(make(new THREE.TubeGeometry(haloCurve, 24, .027, 8, false), M.carbon));
        rod(body, [0, .58, -.6], [0, .93, -.48], M.carbon, .4);
        shell([[.38, .12, .54, .18], [.68, .16, .48, .57], [1.02, .13, .40, .54], [1.65, .07, .30, .30]], color);
        box(body, 0, .92, 1.02, .022, .35, .84, color);
        const airbox = cylinder(.075, .13, M.carbon, 20);
        airbox.rotation.x = Math.PI / 2;
        airbox.position.set(0, .91, .58);
        body.add(airbox);
        for (let i = 0; i < 4; i++) {
            const front = box(body, 0, .20 + i * .045, -2.38 + i * .105, 1.94 - i * .06, .027, .16, i === 0 ? color : M.carbon);
            front.rotation.x = -.09;
            const rear = box(body, 0, .93 + i * .06, 2.04 + i * .085, 1.36, .032, .20, i === 0 ? color : M.carbon);
            rear.rotation.x = .14;
        }
        for (const side of [-1, 1]) {
            box(body, side * .96, .31, -2.27, .035, .25, .56, color);
            box(body, side * .68, 1.02, 2.16, .035, .46, .59, color);
            for (let i = 0; i < 3; i++)
                box(body, side * (.45 + i * .12), .28, -2.14, .018, .13, .19, M.carbon);
            rod(body, [side * .2, .25, 1.6], [side * .24, .93, 2.08], M.carbon, .26);
            box(body, side * .54, .21, 1.54, .035, .18, .60, M.carbon);
        }
        for (const x of [-.48, -.24, 0, .24, .48]) {
            const strake = box(body, x, .22, 1.72, .018, .19, .64, M.carbon);
            strake.rotation.x = -.12;
        }
        box(body, 0, .502, -1.53, .12, .014, .67, M.white);
        const number = label(body, '01 / PIT LAB', [0, .604, -.94], .44, '#192c2e', '#ef432c');
        number.rotation.set(-Math.PI / 2, 0, 0);
        const rain = box(body, 0, .44, 2.02, .13, .06, .035, M.red);
        rain.material = M.red;
        batchStatic(body);
        group.userData.body = body;
        return group;
    }
    const car = vehicle(), second = vehicle(M.teal), trafficCar = vehicle(M.carbon);
    world.add(car, second, trafficCar);
    const carWheels = [[], [], []];
    [car, second, trafficCar].forEach((vehicle, i) => {
        CORNERS.forEach((corner) => {
            const object = wheel();
            object.position.set((corner.endsWith('L') ? 1 : -1)*wheelTrack(corner), .355, corner.startsWith('F') ? -1.65 : 1.65);
            if (corner.endsWith('R'))
                object.rotation.y = Math.PI;
            vehicle.add(object);
            carWheels[i].push(object);
            object.userData.corner = corner;
        });
    });
    const referenceCar = vehicle(M.teal), referenceMaterial = new THREE.MeshBasicMaterial({ color: '#79e6cf', transparent: true, opacity: .20, depthWrite: false });
    for (const c of CORNERS) {
        const w = wheel();
        w.position.set((c.endsWith('L') ? 1 : -1)*wheelTrack(c), .355, c.startsWith('F') ? -1.65 : 1.65);
        referenceCar.add(w);
    }
    referenceCar.traverse(object => { if (object.isMesh) {
        if (object.material.map) {
            object.material.map.dispose();
            object.material.dispose();
        }
        object.material = referenceMaterial;
        object.castShadow = false;
    } });
    referenceCar.visible = false;
    world.add(referenceCar);
    let reference = null, ghostEnabled = true;
    const suit=mat('#981627',.03,.8),crewBlack=mat('#242930',.03,.9),visor=mat('#121b23',.7,.13);
    const trimSole=mat('#72777c',.05,.8);
    const crewTorsoGeometry=new THREE.LatheGeometry([new THREE.Vector2(.11,0),new THREE.Vector2(.14,.04),new THREE.Vector2(.145,.15),new THREE.Vector2(.19,.30),new THREE.Vector2(.17,.36),new THREE.Vector2(.065,.40)],24);
    const crewLimbGeometry=new THREE.CapsuleGeometry(.055,.89,4,12);
    const jointPose=new THREE.Object3D();
    const footPlans=new WeakMap();
    function contactPlan(key,id,poseAt,start,end,heading){
        if(!footPlans.has(key))footPlans.set(key,new Map());
        const plans=footPlans.get(key);if(!plans.has(id))plans.set(id,planFootContacts(poseAt,start,end,heading));return plans.get(id);
    }
    const mechanics = createMechanics(renderer);
    const supplyOperator = person('supply', M.teal);
    world.add(supplyOperator);
    const stations = {};
    function person(role, color = M.red) {
        const group = new THREE.Group(),upper=new THREE.Group();group.add(upper);
        const fabric=color===M.red?suit:color===M.carbon?crewBlack:color;
        const torso=make(crewTorsoGeometry,fabric);torso.position.set(0,.45,.02);torso.scale.z=.66;upper.add(torso);
        sphere(upper,0,.48,.01,.145,.11,.10,fabric);
        sphere(upper,0,.87,-.015,.063,.065,.060,crewBlack);
        sphere(upper,0,.99,-.04,.108,.132,.125,color);
        sphere(upper,0,1.005,-.143,.096,.041,.036,visor);
        sphere(upper,0,.947,-.141,.090,.025,.033,color);
        box(upper,0,1.112,-.048,.022,.006,.13,M.white);
        for(const side of [-1,1]){
            sphere(upper,side*.107,.988,-.018,.015,.042,.042,crewBlack);
            box(upper,side*.12,.79,-.085,.085,.025,.012,M.white);
        }
        box(upper,0,.67,-.087,.007,.30,.008,crewBlack);
        box(upper,0,.49,-.086,.24,.025,.022,crewBlack);
        upper.children.forEach(o=>o.position.y-=.5);upper.scale.setScalar(1.2);batchStatic(upper);
        const bones = Array.from({ length: 8 }, () => new THREE.Object3D());
        const skeleton = new THREE.InstancedMesh(crewLimbGeometry, fabric, 8);
        skeleton.castShadow = true;
        skeleton.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        group.add(skeleton);
        const joints=new THREE.InstancedMesh(sphereGeometry,fabric,4);joints.castShadow=true;joints.instanceMatrix.setUsage(THREE.DynamicDrawUsage);group.add(joints);
        const feet = [-1, 1].map(side => { const foot = sphere(group,side*.18,.06,.08,.065,.06,.14,crewBlack);const sole=make(boxGeometry,trimSole);sole.position.set(0,-.62,.05);sole.scale.set(1.55,.18,1.6);foot.add(sole);return foot; });
        const hands = [sphere(group, 0, 0, 0, .043, .038, .068, crewBlack), sphere(group, 0, 0, 0, .043, .038, .068, crewBlack)];
        group.userData = { role, upper, bones, skeleton, joints, feet, hands };
        return group;
    }
    function pose(person, hand1, hand2, movement = {}) {
        const { upper, bones, skeleton, joints, feet, hands } = person.userData;
        person.updateMatrixWorld(true);
        const feetLocal=movement.contacts?.map(point=>person.worldToLocal(new THREE.Vector3().fromArray(point)).toArray());
        const posture=crewPosture({...movement,feet:feetLocal}),joint=jointPose;
        upper.position.fromArray(posture.pelvis);upper.rotation.x=-posture.lean;person.updateMatrixWorld(true);
        [hand1, hand2].forEach((hand, i) => {
            const side=i===0?-1:1,target=person.worldToLocal(hand.clone());
            const shoulder=person.worldToLocal(upper.localToWorld(new THREE.Vector3(side*.16,.30,0)));
            const elbow=new THREE.Vector3().fromArray(jointBetween(shoulder.toArray(),target.toArray(),.31,.30,[side,.1,.2]));
            align(bones[i * 2], shoulder, elbow,1.15);
            align(bones[i * 2 + 1], elbow, target);
            joint.position.copy(elbow);joint.scale.setScalar(.061);joint.updateMatrix();joints.setMatrixAt(i,joint.matrix);
            hands[i].position.copy(target);
            const leg=posture.legs[i],hip=new THREE.Vector3().fromArray(leg.hip),knee=new THREE.Vector3().fromArray(leg.knee),ankle=new THREE.Vector3().fromArray(leg.ankle);
            align(bones[4 + i * 2], hip, knee, 1.45);
            align(bones[5 + i * 2], knee, ankle, 1.2);
            joint.position.copy(knee);joint.scale.set(.078,.078,.073);joint.updateMatrix();joints.setMatrixAt(i+2,joint.matrix);
            feet[i].position.fromArray(leg.foot);feet[i].rotation.x=leg.pitch;
        });
        bones.forEach((bone, i) => { bone.updateMatrix(); skeleton.setMatrixAt(i, bone.matrix); });
        skeleton.instanceMatrix.needsUpdate = true;
        skeleton.computeBoundingSphere();
        joints.instanceMatrix.needsUpdate=true;joints.computeBoundingSphere();
    }
    CORNERS.forEach(corner => {
        const side = corner.endsWith('L') ? 1 : -1, z = corner.startsWith('F') ? -1.65 : 1.65;
        const group = new THREE.Group();
        group.position.set(side * wheelTrack(corner), 0, z);
        world.add(group);
        const old = wheel(), incoming = wheel();
        group.add(old, incoming);
        if (side < 0) {
            old.rotation.y = Math.PI;
            incoming.rotation.y = Math.PI;
        }
        const disc = cylinder(.215, .06, M.metal);
        disc.rotation.z = Math.PI / 2;
        group.add(disc);
        const caliper=box(group, -side * .12, .35, .16, .1, .18, .1, M.red);
        const gun = mechanics.makeWheelGun();gun.rotation.y=side<0?Math.PI:0;
        group.add(gun);
        const people = [person('gun'), person('wheel off', M.carbon), person('wheel on')];
        people.forEach(p => world.add(p));
        const hosePoints = new Float32Array(24 * 3), hoseGeometry = new THREE.BufferGeometry();
        hoseGeometry.setAttribute('position', new THREE.BufferAttribute(hosePoints, 3));
        const hose = new THREE.Line(hoseGeometry, new THREE.LineBasicMaterial({ color: '#4e4a43' }));
        world.add(hose);
        const indicator = make(new THREE.TorusGeometry(.48, .015, 5, 40), new THREE.MeshBasicMaterial({ color: '#f1b543' }));
        indicator.rotation.x = -Math.PI / 2;
        indicator.position.y = .025;
        group.add(indicator);
        group.traverse(obj => obj.userData.corner = corner);
        people.forEach(p => p.traverse(obj => obj.userData.corner = corner));
        stations[corner] = { group, old, incoming, disc, gun, people, hose, side, z, indicator, caliper };
    });
    const assetStorage=new THREE.Group();assetStorage.visible=false;scene.add(assetStorage);
    loadHero().then(asset=>{
        if(disposed){asset.scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const v of Object.values(o.material))if(v?.isTexture)v.dispose();o.material.dispose();}});return;}
        assetStorage.add(asset.scene);car.userData.body.visible=false;car.add(asset.body);car.userData.body=asset.body;
        for(const corner of CORNERS){const s=stations[corner];for(const target of [s.old,s.incoming,carWheels[0][CORNERS.indexOf(corner)]]){target.clear();const w=asset.wheels[corner].clone(true);w.traverse(o=>{o.userData.corner=corner;});target.add(w);}s.disc.visible=false;s.caliper.visible=false;}
        heroLoaded=true;optionsRevision++;dirty=true;
    }).catch(error=>{heroError=error.message;onStatus('Car asset failed to load. Generic teaching geometry is shown; timing remains usable.');});
    const jacks = [];
    for (const sign of [-1, 1]) {
        const group = new THREE.Group();
        world.add(group);
        box(group, 0, .09, 0, .5, .08, .6, M.carbon);
        const arm = rod(group, [0, .12, 0], [0, .25, -sign * .55], M.red, 1.2);
        rod(group, [0, .1, 0], [0, .9, sign * .7], M.metal, .7);
        const operator = person('jack', M.carbon);
        world.add(operator);
        jacks.push({ group, arm, operator, sign });
    }
    // Original high-detail assembly: preserved geometry, driven by the selected corner's exact events.
    const rig = new THREE.Group();
    mechanical.add(rig);
    const hub = mechanics.makeHubAndBrake(), old = mechanics.makeWheel({ name: 'Outgoing wheel' }), incoming = mechanics.makeWheel({ name: 'Incoming wheel' }), gun = mechanics.makeWheelGun(), jack = mechanics.makeJack(), body = mechanics.makeCarBody();
    rig.add(hub, old, incoming, gun, jack, body);
    const operator = person('inspection');
    operator.position.set(1.7, 0, .12);
    operator.rotation.y = Math.PI / 2;
    mechanical.add(operator);
    box(mechanical, 0, -.09, 0, 10, .1, 10, mat('#263638'));
    const hoseGeo = new THREE.BufferGeometry();
    hoseGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(72), 3));
    const mechHose = new THREE.Line(hoseGeo, new THREE.LineBasicMaterial({ color: '#4e4a43' }));
    mechanical.add(mechHose);
    const labelLayer = document.querySelector('#labelsLayer');
    const spatialLayer = document.querySelector('#spatialLayer');
    const stationPins = CORNERS.map(key => ({ id: key, corner: key, title: key, position: new THREE.Vector3() }));
    const spatialPins = [...stationPins, ...facility.hotspots].map(pin => { const el = document.createElement('button'); el.className = `spatial-pin ${pin.corner ? 'station-pin' : 'facility-pin'}`; el.dataset.spatial = pin.id; el.innerHTML = `<span class=pin-dot></span><span><b>${pin.title}</b><small></small></span>`; el.setAttribute('aria-label', pin.corner ? `Select ${pin.corner} station` : `Inspect ${pin.title}`); el.addEventListener('click', () => { if (pin.corner)
        onSelect({ corner: pin.corner });
    else {
        onSelect({ facility: pin.id });
        setCamera(pin.camera);
    } }); spatialLayer.append(el); return { ...pin, el }; });
    const partLabels = [['RETAINED NUT', incoming.userData.parts.nut], ['PNEUMATIC GUN', gun], ['CARBON DISC', hub.userData.disc], ['FIXED CALIPER', hub.userData.caliper], ['DRIVE SPLINES', hub.userData.hub]].map(([text, object], index) => { const el = document.createElement('span'); el.className = 'part-label'; el.textContent = text; labelLayer.append(el); return { el, object, index }; });
    const mechTargets = { assembly: rig, wheel: old, nut: old.userData.parts.nut, gun, brake: hub.userData.disc, hub: hub.userData.hub, newWheel: incoming };
    let lighting = 'day', showSpatial = true;
    let view = 'world', selectedCorner = 'FL', lastSnapshot = null, lastSim = null, dirty = true, optionsRevision = 0, lastOptions = -1, cameraMode = 'overview', tween = null, cutaway = false, exploded = false, labels = true, trails = false, disposed = false, contextLost = false;
    const presets = { carHero:[[4.4,1.85,-5.6],[0,.44,-.15]], front:[[.05,.85,-7],[0,.40,-.25]], side:[[6.5,1.15,0],[0,.45,0]], rear:[[3.8,1.6,5.4],[0,.5,.25]], ground:[[3,.37,-5],[0,.32,-.5]], cockpit:[[1.05,1.55,-1.1],[0,.52,-.05]], wing:[[1.8,.62,-3.8],[0,.23,-2.3]], wheel:[[2.15,.78,-2.75],[.8,.36,-1.65]], bay:[[4.8,3.1,-7],[0,.65,1.6]], serviceWheel:[[3.6,1.4,-4],[1,.4,-1.35]], challenge:[[3.8,1.8,-4.3],[.5,.4,-.7]], overview: [[23, 23, 29], [-1.4, 0, 2]], box: [[10, 10, 13], [-.6, .2, 0]], facility: [[28, 29, 35], [-1, 0, 0]], garage: [[3, 9, 8], [-6, 1, 0]], tires: [[1, 6, 13], [-6.4, .7, 8.2]], command: [[16, 8, 8], [9, .8, 0]], follow: [[5, 3, 6], [0, .4, 0]], top: [[0, 27, .01], [0, 0, 0]], release: [[11, 7, -13], [1, 0, 0]], hero: [[3.7, 2.25, 3.7], [.6, .48, 0]], wide: [[4.2, 2.5, 4.2], [0, .4, 0]], detailTop: [[.4, 3.8, .02], [.4, .4, 0]], gun: [[1.85, .8, .8], [.85, .43, 0]], hub: [[1.22, .72, .6], [.43, .43, 0]], brake: [[1.1, .88, .9], [.29, .43, .08]] };
    function setCamera(name = 'overview', immediate = false) {
        cameraMode = name;onSelect({camera:name});
        legacy=['overview','facility','garage','tires','command'].includes(name);legacyFacility.visible=legacy;garage.room.visible=!legacy;applyLighting();
        dirty = true;
        let preset = presets[name];
        if (CORNERS.includes(name)) {
            const s = stations[name];
            preset = [[s.side * 3.5, 2.1, s.z + 3], [s.side * .6, .45, s.z]];
        }
        if (!preset)
            return;
        let position = new THREE.Vector3(...preset[0]), target = new THREE.Vector3(...preset[1]);
        if (!legacy && view!=='mechanics' && canvas.clientWidth<700) position.sub(target).multiplyScalar(['carHero','side','rear','ground','bay','challenge'].includes(name)?2.1:1.5).add(target);
        if (name === 'overview' && canvas.clientWidth < 700) {
            position.multiplyScalar(1.45);
            target.set(-1, 0, 3);
        }
        if (view === 'mechanics' && canvas.clientWidth < 700)
            position.sub(target).multiplyScalar(1.8).add(target);
        if (immediate || reduced) {
            camera.position.copy(position);
            controls.target.copy(target);
            tween = null;
            controls.update();
        }
        else
            tween = { start: performance.now(), from: camera.position.clone(), to: position, old: controls.target.clone(), target };
    }
    function applyLighting() {
        const studio=view==='mechanics', automotive=!legacy&&!studio;
        ambient.intensity=automotive?.65:lighting==='night'?.65:2.2;
        sun.intensity=automotive?3.1:lighting==='night'?.5:3.4;sun.color.set(automotive?'#fff5e8':'#fff0d9');
        sun.position.set(automotive?-3:9,automotive?8:18,automotive?-3:8);fill.intensity=automotive?1.6:1.2;
        Object.assign(sun.shadow.camera,automotive?{left:-6,right:6,top:7,bottom:-7}:{left:-15,right:15,top:17,bottom:-17});sun.shadow.camera.updateProjectionMatrix();sun.shadow.radius=automotive?3:1;
        renderer.toneMappingExposure=automotive?1.02:1.15;
        for(const light of facility.workLights)light.visible=legacy&&lighting==='night';
        scene.background.set(studio?'#23363a':automotive?'#25272b':lighting==='night'?'#263e4e':lighting==='golden'?'#d9cbb8':'#ced8d6');scene.fog.color.copy(scene.background);
    }
    function setView(next, corner = selectedCorner) {
        selectedCorner = corner;
        view = next;
        dirty = true;
        scene.background.set(next === 'mechanics' ? '#23363a' : lighting === 'night' ? '#263e4e' : lighting === 'golden' ? '#d9cbb8' : '#ced8d6');
        scene.fog.color.copy(scene.background);
        applyLighting();
        world.visible = next !== 'mechanics';
        mechanical.visible = next === 'mechanics';
        controls.minDistance = next === 'mechanics' ? .18 : 2;
        setCamera(next === 'mechanics' ? 'hero' : experience==='challenge'?'challenge':experience==='explore'?'carHero':'box');
    }
    const pathLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: '#cf8937', dashSize: .3, gapSize: .15 }));
    world.add(pathLine);
    let pathConfig = null,previousWidth=0,lastDraw=-Infinity,renderCount=0,pendingFrame=null;
    const laneOffset = car => car.phase === 'DEPARTURE' ? 4.8 * THREE.MathUtils.smoothstep(-car.position, 7, 15) : 0;
    function update(state, sim, corner = selectedCorner) {
        if (lastSnapshot?.time === state.time && lastSim === sim && selectedCorner === corner && lastOptions === optionsRevision)
            return;
        dirty = true;
        lastSnapshot = state;
        lastSim = sim;
        lastOptions = optionsRevision;
        selectedCorner = corner;
        pathLine.visible = trails;
        if (pathConfig !== sim) {
            pathConfig = sim;
            pathLine.geometry.dispose();
            pathLine.geometry = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 100 }, (_, i) => { const z = sim.approachDistance - (sim.approachDistance + sim.exitDistance) * i / 99; return new THREE.Vector3(4.8 * THREE.MathUtils.smoothstep(-z, 7, 15), .025, z); }));
            pathLine.computeLineDistances();
        }
        const active = state.cars[state.activeCar - 1];
        const ops = operations(sim, state);
        if(!legacy)garage.update(state,ops);
        const preparation = sim.events.find(event => event.id === 'preparation');
        const delivery = progress(state.time, preparation.start, preparation.end);
        facility.deliveryCart.position.set(-7.3 + 3.3 * delivery, 0, 5.4);
        const supplyPose=t=>({root:[-7.85+3.3*progress(t,preparation.start,preparation.end),0,5.4],kneel:0});
        supplyOperator.position.fromArray(supplyPose(state.time).root);
        supplyOperator.rotation.y = -Math.PI/2;
        supplyOperator.updateMatrixWorld(true);
        const supplyFeet=contactPlan(preparation,'supply',supplyPose,preparation.start,preparation.end+.5,-Math.PI/2);
        pose(supplyOperator, facility.deliveryCart.localToWorld(new THREE.Vector3(-.40,.95,-.2)), facility.deliveryCart.localToWorld(new THREE.Vector3(-.40,.95,.2)),{contacts:feetAt(supplyFeet,state.time).map(f=>f.position)});
        referenceCar.visible = Boolean(reference) && ghostEnabled;
        if (reference) {
            const ref = snapshot(reference, state.time).cars[0];
            referenceCar.position.set(laneOffset(ref), ref.lift, ref.position);
            referenceCar.rotation.y = ref.phase === 'DEPARTURE' ? -Math.sin(progress(-ref.position, 7, 15) * Math.PI) * .6 : 0;
        }
        for (const pin of spatialPins) {
            if (pin.corner) {
                const info = ops.corners.find(c => c.key === pin.corner);
                pin.el.querySelector('b').textContent = `${pin.corner} / ${info.secured ? 'SECURED' : info.critical ? 'CRITICAL' : 'SERVICE'}`;
                pin.el.querySelector('small').textContent = info.state.replaceAll('_', ' ');
                pin.el.classList.toggle('is-critical', info.critical && !info.secured);
                pin.el.classList.toggle('is-secured', info.secured);
            }
            else
                pin.el.querySelector('small').textContent = pin.id === 'tires' ? `${ops.inventory.replacementsRemaining} allocated / ${ops.inventory.removed} removed` : pin.id === 'command' ? ops.status.replaceAll('_', ' ') : `${ops.activeStations} / 4 stations working`;
        }
        garage.contact.position.set(laneOffset(active),.006,active.position);garage.contact.visible=!legacy;garage.contact.material.opacity=.6-active.lift;
        facility.contact.position.set(laneOffset(active), .018, active.position);
        facility.contact.visible = active.position < 20 && active.position > -20;
        [car, second].forEach((object, i) => {
            const s = state.cars[i];
            object.visible = Boolean(s);
            if (!s)
                return;
            object.position.set(laneOffset(s), s.lift, s.position);
            object.rotation.y = s.phase === 'DEPARTURE' ? -Math.sin(progress(-s.position, 7, 15) * Math.PI) * .6 : 0;
            object.userData.body.rotation.x = (s.frontLift - s.rearLift) / 3.3;
            carWheels[i].forEach(w => { w.visible = false; });
        });
        garage.contact.rotation.set(-Math.PI/2,(active.number===1?car:second).rotation.y,0,'YXZ');
        trafficCar.visible = state.traffic.visible;
        trafficCar.position.set(4.8, 0, state.traffic.position);
        const stop = sim.stops[active.number - 1];
        for (const corner of CORNERS) {
            const s = stations[corner], c = active.corners[corner];
            s.group.position.z = s.z - stop.error;
            s.group.position.x = s.side * wheelTrack(corner);
            stationPins.find(p => p.corner === corner).position.set(s.side * 1.5, 1.35, s.z - stop.error);
            const moving = state.time < stop.stopAt ? active.position + stop.error : active.released ? active.position + stop.error : 0;
            const height = (corner.startsWith('F') ? active.frontLift : active.rearLift) + .355;
            s.disc.position.set(-s.side * .12, height, moving);
            const axial=Math.min(1,c.removal/.65),carried=progress(c.removal,.65,1);
            s.old.position.set(s.side*axial*.85,height-(height-.355)*carried,-carried*.72+(c.removal===0?moving:0));
            s.old.visible = true;
            const correction=alignmentTilt(c),replacementHeight=.355+(height-.355)*progress(c.alignment,.35,.9);
            s.incoming.position.set(s.side * (1.1 * (1 - c.alignment) + .25 * (1 - c.installation)), replacementHeight, .80 * (1 - c.alignment) + correction + (c.incomingInstalled ? moving : 0));
            s.incoming.visible = state.time >= stop.stopAt;
            const activeObject = active.number === 1 ? car : second;
            const wheelPoint = activeObject.userData.body.localToWorld(new THREE.Vector3(s.side * wheelTrack(corner), .355, s.z));
            if (c.removal === 0)
                s.old.position.copy(s.group.worldToLocal(wheelPoint.clone()));
            if (c.incomingInstalled)
                s.incoming.position.copy(s.group.worldToLocal(wheelPoint.clone()));
            setWheelRotation(s.old,c.removal===0?activeObject.rotation.y:0,c.removal===0?active.position/.355:-stop.error/.355,s.side);
            setWheelRotation(s.incoming,c.incomingInstalled?activeObject.rotation.y:0,c.incomingInstalled?(active.position+stop.error)/.355:0,s.side,c.incomingInstalled?0:correction);
            const discPoint = activeObject.userData.body.localToWorld(new THREE.Vector3(s.side * (wheelTrack(corner)-.12), .355, s.z));
            s.disc.position.copy(s.group.worldToLocal(discPoint));
            s.disc.rotation.y = activeObject.rotation.y;
            const ready = progress(state.time, Math.max(0, stop.stopAt - .65), stop.ready.end), clear = c.toolClear;
            const work = ready * (1 - clear);
            s.gun.position.set(THREE.MathUtils.lerp(s.side*(1.85-wheelTrack(corner)),s.side*(.342+.60*(1-c.gun)),work),THREE.MathUtils.lerp(1.1,height,work),0);
            s.gun.rotation.x = c.gunActive ? Math.sin(state.time * 110) * .03 : 0;
            s.gun.userData.rotor.rotation.x=(c.loosen-c.tighten)*45;
            s.gun.userData.led.material.color.set(c.secured?'#30e59a':'#ffa227');
            s.indicator.visible = labels && state.time >= stop.stopAt && !active.released;
            s.indicator.material.color.set(c.state === 'UNSECURED' ? '#cc2830' : c.secured ? '#267c68' : stop.criticalCorner === corner ? '#ce702c' : '#7c9692');
            const wheelPositions = [s.gun.getWorldPosition(new THREE.Vector3()), s.old.getWorldPosition(new THREE.Vector3()), s.incoming.getWorldPosition(new THREE.Vector3())];
            s.people.forEach((p, i) => {
                const target = wheelPositions[i];
                const poseAt=t=>stationCrewPose(stop,corner,i,t,wheelTrack(corner)),motion=poseAt(state.time);
                p.position.fromArray(motion.root);
                p.rotation.y = s.side * Math.PI / 2;
                p.updateMatrixWorld(true);
                const hand1 = target.clone().add(new THREE.Vector3(s.side*(i===0?.12:.17), i === 0 ? -.1 : .19+.12*(1-motion.kneel), i === 0 ? .04 : s.side*.16));
                const hand2 = target.clone().add(new THREE.Vector3(s.side*(i===0?0:.17), i === 0 ? -.03 : .12+.16*(1-motion.kneel), i === 0 ? -.06 : -s.side*.16));
                hand1.lerp(p.localToWorld(new THREE.Vector3(-.18,.70,-.07)),1-work);
                hand2.lerp(p.localToWorld(new THREE.Vector3(.18,.70,-.07)),1-work);
                if(i===0){hand1.copy(s.gun.localToWorld(new THREE.Vector3(.15,-.16,.025)));hand2.copy(s.gun.localToWorld(new THREE.Vector3(.04,-.02,-.04)));}
                const plan=contactPlan(stop,`${corner}/${i}`,poseAt,Math.max(0,stop.stopAt-.7),stop.corners[corner].events.at(-1).end+.9,p.rotation.y);
                pose(p,hand1,hand2,{...motion,contacts:feetAt(plan,state.time).map(f=>f.position)});
            });
            const start = s.gun.getWorldPosition(new THREE.Vector3());
            const end = new THREE.Vector3(legacy?-4:s.side*4.9,2.7,s.z);
            const positions = s.hose.geometry.attributes.position;
            for (let i = 0; i < 24; i++) {
                const u = i / 23;
                positions.setXYZ(i, THREE.MathUtils.lerp(start.x, end.x, u), THREE.MathUtils.lerp(start.y, end.y, u) + Math.sin(u * Math.PI) * .45, THREE.MathUtils.lerp(start.z, end.z, u));
            }
            positions.needsUpdate = true;
            s.hose.geometry.computeBoundingSphere();
        }
        // Non-serviced cars keep four attached wheels, including the queued car.
        state.cars.forEach((s, i) => {
            if (s.number !== active.number)
                carWheels[i].forEach((w,j)=>{w.visible=true;setWheelRotation(w,0,s.position/.355,CORNERS[j].endsWith('L')?1:-1);});
        });
        jacks.forEach(({ group, operator, sign, arm }, i) => {
            const lift = i === 0 ? active.frontLift : active.rearLift;
            const up = i === 0 ? stop.front : stop.rear, down = i === 0 ? stop.frontDown : stop.rearDown;
            const engagement = progress(state.time, up.start, up.end) * (1 - (down ? progress(state.time, down.start, down.end) : 0));
            group.position.set(0, 0, sign * (2.65 + (1 - engagement) * .7) - stop.error);
            arm.rotation.x = sign * lift * 2;
            operator.position.set(0, 0, sign * 3.6 - stop.error);
            operator.rotation.y = sign < 0 ? Math.PI : 0;
            operator.updateMatrixWorld(true);
            const handle = group.localToWorld(new THREE.Vector3(0, .9, sign * .7));
            pose(operator, handle.clone().add(new THREE.Vector3(-.1, 0, 0)), handle.clone().add(new THREE.Vector3(.1, 0, 0)));
        });
        lightMat.color.set(active.released ? '#41bc87' : active.phase === 'SAFETY HOLD' ? '#e03d35' : '#ffb83e');
        lightMat.emissive.copy(lightMat.color);
        const c = active.corners[selectedCorner];
        rig.position.y = active.lift - .075;
        old.position.set(.69 + c.removal * .85, .43, -c.removal * .65);
        old.visible = true;
        incoming.position.set(.69 + (1 - c.alignment) * 1.35 + (1 - c.installation) * .25, .43, (1 - c.alignment) * .58);
        incoming.visible = state.time >= stop.stopAt;
        incoming.rotation.z = alignmentTilt(c);
        gun.position.set(.995 + (1 - c.gun) * .7, .43, 0);
        gun.userData.rotor.rotation.x = (c.loosen - c.tighten) * 45;
        gun.userData.led.material.color.set(c.secured ? '#30e59a' : '#ffa227');
        for (const wheel of [old, incoming]) {
            mechanics.applyExploded(wheel, exploded ? 1 : 0);
            mechanics.applyCutaway(wheel, cutaway);
        }
        old.userData.parts.nut.position.x += c.loosen * .035;
        old.userData.parts.nutCap.position.x += c.loosen * .035;
        incoming.userData.parts.nut.position.x += (1 - c.tighten) * .035;
        incoming.userData.parts.nutCap.position.x += (1 - c.tighten) * .035;
        jack.position.y = active.lift - .1;
        mechanical.updateMatrixWorld(true);
        pose(operator, gun.localToWorld(new THREE.Vector3(.12, -.14, .04)), gun.localToWorld(new THREE.Vector3(.12, -.05, -.055)),{kneel:1});
        const hp = mechHose.geometry.attributes.position, start = gun.getWorldPosition(new THREE.Vector3());
        for (let i = 0; i < 24; i++) {
            const u = i / 23;
            hp.setXYZ(i, THREE.MathUtils.lerp(start.x, 2.3, u), THREE.MathUtils.lerp(start.y, 2.7, u) + Math.sin(u * Math.PI) * .3, THREE.MathUtils.lerp(start.z, -.6, u));
        }
        hp.needsUpdate = true;
        mechHose.geometry.computeBoundingSphere();
        const explore=experience==='explore';
        supplyOperator.visible=legacy&&!explore;
        for(const [key,s] of Object.entries(stations)){
            s.people.forEach(p=>p.visible=!explore&&!(experience==='challenge'&&key==='FL'));
            s.hose.visible=!explore;s.gun.visible=!explore;s.incoming.visible=!explore&&state.time>=stop.stopAt;
            s.indicator.visible=!explore&&legacy&&labels;
            if(heroLoaded)s.disc.visible=false;
        }
        jacks.forEach(j=>{j.group.visible=!explore;j.operator.visible=!explore;});
        referenceCar.visible=referenceCar.visible&&!explore;
        pathLine.visible=trails&&!explore;
        if(heroLoaded)car.userData.body.traverse(o=>{if(o.isMesh)o.visible=!(hiddenBody&&panelNames.test(o.name))&&(!isolation||/Brake|disc|Caliper|Suspension|upper|lower|pushrod|steering/.test(o.name));});
    }
    function render(now) {
        if (disposed || contextLost||(software&&now-lastDraw<1000/15))
            return;
        if(pendingFrame){const status=gl.clientWaitSync(pendingFrame,0,0);if(status===gl.TIMEOUT_EXPIRED)return;gl.deleteSync(pendingFrame);pendingFrame=null;}
        if (tween) {
            const t = Math.min(1, (now - tween.start) / 650), u = t * t * (3 - 2 * t);
            camera.position.lerpVectors(tween.from, tween.to, u);
            controls.target.lerpVectors(tween.old, tween.target, u);
            if (t === 1)
                tween = null;
        }
        if (cameraMode === 'follow' && view !== 'mechanics' && lastSnapshot && !tween) {
            const s = lastSnapshot.cars[lastSnapshot.activeCar - 1];
            camera.position.set(laneOffset(s) + 5, 3, s.position + 6);
            controls.target.set(laneOffset(s), .4, s.position);
        }
        const changed = controls.update();
        if (dirty || changed || tween || cameraMode === 'follow') {
            for(const wall of garage.cameraWalls)wall.object.visible=camera.position[wall.axis]*wall.sign<wall.threshold;
            renderer.render(scene, camera);lastDraw=now;renderCount++;pendingFrame=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);gl.flush();
            dirty = false;
            labelLayer.hidden = view !== 'mechanics' || !labels;
            spatialLayer.hidden = view === 'mechanics' || !showSpatial || !labels;
            const placed = [];
            for (const pin of spatialPins) {
                const point = pin.position.clone().project(camera), x = (point.x * .5 + .5) * canvas.clientWidth, y = (-point.y * .5 + .5) * canvas.clientHeight;
                const mobile = canvas.clientWidth < 700;
                const show = point.z > -1 && point.z < 1 && x > 20 && x < canvas.clientWidth - 30 && y > 60 && y < canvas.clientHeight - 70 && (!mobile || pin.corner === selectedCorner) && !placed.some(p => Math.abs(p.x - x) < 105 && Math.abs(p.y - y) < 35);
                pin.el.hidden = !show;
                if (show) {
                    pin.el.style.left = `${x}px`;
                    pin.el.style.top = `${y}px`;
                    placed.push({ x, y });
                }
            }
            for (const def of partLabels) {
                const p = def.object.getWorldPosition(new THREE.Vector3()).project(camera);
                def.el.hidden = p.z > 1 || p.z < -1;
                def.el.style.left = `${(p.x * .5 + .5) * canvas.clientWidth}px`;
                def.el.style.top = `${(-p.y * .5 + .5) * canvas.clientHeight - 25 - def.index % 3 * 18}px`;
            }
        }
    }
    function resize() {
        dirty = true;
        const w = canvas.clientWidth, h = canvas.clientHeight;
        if (w && h) {
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            if(previousWidth&&(previousWidth<700)!==(w<700)&&presets[cameraMode])setCamera(cameraMode,true);
            previousWidth=w;
        }
    }
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    setCamera('carHero', true);
    const raycaster = new THREE.Raycaster();
    let down = null;
    const pointerDown = e => down = { x: e.clientX, y: e.clientY };
    const pointerUp = e => {
        if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 7)
            return;
        const rect = canvas.getBoundingClientRect();
        raycaster.setFromCamera(new THREE.Vector2((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1), camera);
        const hits = raycaster.intersectObject(view === 'mechanics' ? mechanical : world, true);
        const hit = hits.find(h => {
            let p = h.object;
            while (p) {
                if (!p.visible)
                    return false;
                p = p.parent;
            }
            return true;
        });
        if(hit?.object.userData.part){const [title,description]=hit.object.userData.part;onSelect({part:true,title,description});}
        else if (hit?.object.userData.corner)
            onSelect({ corner: hit.object.userData.corner });
        else if (hit?.object.userData.selectRoot) {
            const root = hit.object.userData.selectRoot;
            onSelect({ title: root.userData.inspectTitle, description: root.userData.inspectDescription });
        }
    };
    const pointerMove=e=>{
        if(experience!=='explore'||e.buttons)return;
        const r=canvas.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);
        const hit=raycaster.intersectObject(car,true).find(h=>{let p=h.object;while(p){if(!p.visible)return false;p=p.parent;}return true;});
        onSelect({hover:hit?.object.userData.part?.[0]||'',x:e.clientX-r.left,y:e.clientY-r.top});
    };
    canvas.addEventListener('pointermove',pointerMove);
    canvas.addEventListener('pointerdown', pointerDown);
    canvas.addEventListener('pointerup', pointerUp);
    const lose = e => { e.preventDefault(); contextLost = true; onStatus('WebGL context lost. Timing and analysis remain available.'); };
    const restore = () => { contextLost = false; dirty = true; onStatus('3D context restored.'); };
    canvas.addEventListener('webglcontextlost', lose);
    canvas.addEventListener('webglcontextrestored', restore);
    const cancelTween = () => {
        tween = null;
        if (cameraMode === 'follow')
            cameraMode = 'orbit';
    };
    controls.addEventListener('start', cancelTween);
    return { update, render, setView, setCamera, resize,
        setExperience(next){experience=next;optionsRevision++;dirty=true;controls.enabled=true;},
        inspectBody(hide,isolate){hiddenBody=hide;isolation=isolate;optionsRevision++;dirty=true;},
        projectContact(){const p=stations.FL.group.localToWorld(new THREE.Vector3(.22,.355+(lastSnapshot?.cars[0].frontLift||0),0)).project(camera);return {x:(p.x*.5+.5)*canvas.clientWidth,y:(-p.y*.5+.5)*canvas.clientHeight};},
        interactionLock(locked){controls.enabled=!locked;},
        setOptions(options) {
            optionsRevision++;
            dirty = true;
            if (options.lighting)
                lighting = options.lighting;
            applyLighting();
            facility.section.visible = Boolean(options.roof);
            showSpatial = options.spatial !== false;
            ghostEnabled = options.ghost !== false;
            cutaway = options.cutaway;
            exploded = options.exploded;
            labels = options.labels;
            trails = options.trails;
            camera.fov = options.fov;
            camera.updateProjectionMatrix();
        },
        focus(part) {
            dirty = true;
            const object = mechTargets[part];
            if (!object)
                return;
            const title = object.userData.inspectTitle || object.name;
            onSelect({ title, description: object.userData.inspectDescription || 'Generic educational wheel assembly.' });
            const center = new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3());
            const distance = part === 'nut' ? .32 : part === 'assembly' ? 3 : 1.2;
            camera.position.copy(center).add(new THREE.Vector3(distance, .4, distance));
            controls.target.copy(center);
            tween = null;
        },
        adapt(fps) {
            if (fps < 28 && renderer.getPixelRatio() > 1) {
                renderer.setPixelRatio(1);
                dirty = true;
            }
            if (fps < 18 && renderer.shadowMap.enabled) {
                renderer.shadowMap.enabled = false;
                dirty = true;
            }
        },
        setReference(sim) { reference = sim; optionsRevision++; dirty = true; },
        stats() { return { calls: renderer.info.render.calls, renderCount, software, rendererName, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures, camera: cameraMode, heroLoaded, heroError, shadows:renderer.shadowMap.enabled, pixelRatio:renderer.getPixelRatio(), asset:CAR_IDENTITY.name, experience, lighting, roof: facility.section.visible, spatial: showSpatial, reference: reference ? { visible: referenceCar.visible && world.visible, position: referenceCar.position.z } : null }; },
        dispose() {
            disposed = true;
            if(pendingFrame)gl.deleteSync(pendingFrame);
            observer.disconnect();garage.dispose();
            canvas.removeEventListener('pointermove',pointerMove);
            canvas.removeEventListener('pointerdown', pointerDown);
            canvas.removeEventListener('pointerup', pointerUp);
            canvas.removeEventListener('webglcontextlost', lose);
            canvas.removeEventListener('webglcontextrestored', restore);
            controls.dispose();
            labelLayer.replaceChildren();
            spatialLayer.replaceChildren();
            const gs = new Set(), ms = new Set(), ts = new Set();
            scene.traverse(o => {
                if (o.geometry)
                    gs.add(o.geometry);
                for (const m of o.material ? Array.isArray(o.material) ? o.material : [o.material] : []) {
                    ms.add(m);
                    for (const value of Object.values(m))
                        if (value?.isTexture)
                            ts.add(value);
                }
            });
            gs.forEach(g => g.dispose());
            ms.forEach(m => m.dispose());
            ts.forEach(t => t.dispose());
            renderer.dispose();
        },
    };
}
