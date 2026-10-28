import * as THREE from './vendor/three.module.js';
export function createMechanics(renderer) {
    const C = {
        carbon: 0x12161c,
        carbon2: 0x202630,
        rubber: 0x141414,
        rubberEdge: 0x252525,
        metal: 0xb4bcc5,
        darkMetal: 0x343a43,
        brake: 0x9b1b24,
        red: 0xe3172f,
        amber: 0xffa227,
        green: 0x30e59a,
        blue: 0x4ca5ff,
    };
    const mats = {
        carbon: new THREE.MeshPhysicalMaterial({ color: C.carbon, roughness: 0.34, metalness: 0.25, clearcoat: 0.35, clearcoatRoughness: 0.3 }),
        carbon2: new THREE.MeshStandardMaterial({ color: C.carbon2, roughness: 0.48, metalness: 0.22 }),
        rubber: new THREE.MeshPhysicalMaterial({ color: C.rubber, roughness: 0.88, metalness: 0.0, clearcoat: 0.03 }),
        rubberEdge: new THREE.MeshStandardMaterial({ color: C.rubberEdge, roughness: 0.72 }),
        magnesium: new THREE.MeshPhysicalMaterial({ color: 0x4d535b, roughness: 0.28, metalness: 0.92, clearcoat: 0.22 }),
        magnesiumDark: new THREE.MeshStandardMaterial({ color: 0x242930, roughness: 0.34, metalness: 0.86 }),
        steel: new THREE.MeshStandardMaterial({ color: C.metal, roughness: 0.22, metalness: 0.95 }),
        darkSteel: new THREE.MeshStandardMaterial({ color: C.darkMetal, roughness: 0.3, metalness: 0.9 }),
        brake: new THREE.MeshPhysicalMaterial({ color: C.brake, roughness: 0.26, metalness: 0.5, clearcoat: 0.5 }),
        gun: new THREE.MeshPhysicalMaterial({ color: 0x1d232b, roughness: 0.28, metalness: 0.68, clearcoat: 0.2 }),
        gunAccent: new THREE.MeshStandardMaterial({ color: C.red, roughness: 0.3, metalness: 0.4 }),
        glove: new THREE.MeshStandardMaterial({ color: 0x171b22, roughness: 0.75, metalness: 0.05 }),
        suit: new THREE.MeshStandardMaterial({ color: 0x262d37, roughness: 0.72 }),
        white: new THREE.MeshStandardMaterial({ color: 0xe9edf1, roughness: 0.42 }),
        floor: new THREE.MeshStandardMaterial({ color: 0x1b2027, roughness: 0.93, metalness: 0.03 }),
    };
    function mesh(geometry, material, name = '') {
        const m = new THREE.Mesh(geometry, material);
        m.name = name;
        m.castShadow = true;
        m.receiveShadow = true;
        return m;
    }
    function axisCylinder(radius, length, material, radialSegments = 32) {
        const m = mesh(new THREE.CylinderGeometry(radius, radius, length, radialSegments), material);
        m.rotation.z = Math.PI / 2;
        return m;
    }
    function alignBetween(object, a, b) {
        const mid = a.clone().add(b).multiplyScalar(0.5);
        const dir = b.clone().sub(a);
        object.position.copy(mid);
        object.scale.set(1, dir.length(), 1);
        object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    }
    function rodBetween(a, b, radius, material, segments = 18) {
        const rod = mesh(new THREE.CylinderGeometry(radius, radius, 1, segments), material);
        alignBetween(rod, a, b);
        return rod;
    }
    function roundedBox(w, h, d, radius, material) {
        const shape = new THREE.Shape();
        const x = -w / 2, y = -h / 2;
        shape.moveTo(x + radius, y);
        shape.lineTo(x + w - radius, y);
        shape.quadraticCurveTo(x + w, y, x + w, y + radius);
        shape.lineTo(x + w, y + h - radius);
        shape.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        shape.lineTo(x + radius, y + h);
        shape.quadraticCurveTo(x, y + h, x, y + h - radius);
        shape.lineTo(x, y + radius);
        shape.quadraticCurveTo(x, y, x + radius, y);
        const g = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: radius * 0.32, bevelThickness: radius * 0.32 });
        g.center();
        return mesh(g, material);
    }
    function makeCanvasSidewall(color = '#ffd447', text = 'FORMULA RACE') {
        const cvs = document.createElement('canvas');
        cvs.width = 1024;
        cvs.height = 1024;
        const ctx = cvs.getContext('2d');
        ctx.clearRect(0, 0, cvs.width, cvs.height);
        ctx.translate(512, 512);
        ctx.strokeStyle = color;
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.arc(0, 0, 448, 0.20, Math.PI - 0.20);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 448, Math.PI + 0.20, Math.PI * 2 - 0.20);
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.font = 'bold 44px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 0, -420);
        ctx.fillText('18 IN  RACE', 0, 420);
        const tex = new THREE.CanvasTexture(cvs);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        return tex;
    }
    function registerSelectable(root, title, description) {
        root.userData.inspectTitle = title;
        root.userData.inspectDescription = description;
        root.traverse((obj) => {
            if (obj.isMesh && !obj.userData.selectRoot)
                obj.userData.selectRoot = root;
        });
        return root;
    }
    const cutPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.01);
    function makeWheel({ compoundColor = '#ffd447', label = 'MEDIUM', name = 'Wheel' } = {}) {
        const wheel = new THREE.Group();
        wheel.name = name;
        const tireWidth = 0.305;
        const tireRadius = 0.355;
        const rimRadius = 0.229;
        const profile = [
            new THREE.Vector2(rimRadius + 0.006, -tireWidth * 0.5),
            new THREE.Vector2(0.285, -tireWidth * 0.5),
            new THREE.Vector2(0.335, -tireWidth * 0.42),
            new THREE.Vector2(tireRadius - 0.004, -tireWidth * 0.22),
            new THREE.Vector2(tireRadius, 0),
            new THREE.Vector2(tireRadius - 0.004, tireWidth * 0.22),
            new THREE.Vector2(0.335, tireWidth * 0.42),
            new THREE.Vector2(0.285, tireWidth * 0.5),
            new THREE.Vector2(rimRadius + 0.006, tireWidth * 0.5),
        ];
        const tireMaterial = mats.rubber.clone();
        const tire = mesh(new THREE.LatheGeometry(profile, 128), tireMaterial, `${name} tire`);
        tire.rotation.z = -Math.PI / 2;
        wheel.add(tire);
        const tread = new THREE.Group();
        tread.name = `${name} slick mold lines`;
        for (const x of [-0.085, 0, 0.085]) {
            const seam = mesh(new THREE.TorusGeometry(tireRadius + 0.0008, 0.0014, 6, 128), mats.rubberEdge, 'Slick mold line');
            seam.rotation.y = Math.PI / 2;
            seam.position.x = x;
            tread.add(seam);
        }
        wheel.add(tread);
        const barrel = axisCylinder(rimRadius, tireWidth * 0.9, mats.magnesium, 96);
        barrel.material = mats.magnesium.clone();
        barrel.geometry = new THREE.CylinderGeometry(rimRadius, rimRadius, tireWidth * 0.9, 96, 1, true);
        barrel.rotation.z = Math.PI / 2;
        barrel.name = `${name} rim barrel`;
        wheel.add(barrel);
        const innerBarrel = axisCylinder(rimRadius - 0.025, tireWidth * 0.91, mats.magnesiumDark, 96);
        innerBarrel.name = `${name} inner barrel`;
        wheel.add(innerBarrel);
        const flangeIn = mesh(new THREE.TorusGeometry(rimRadius, 0.009, 10, 96), mats.magnesium, 'Inner rim flange');
        flangeIn.rotation.y = Math.PI / 2;
        flangeIn.position.x = -tireWidth * 0.46;
        wheel.add(flangeIn);
        const flangeOut = flangeIn.clone();
        flangeOut.position.x = tireWidth * 0.46;
        flangeOut.name = 'Outer rim flange';
        wheel.add(flangeOut);
        const spokeGroup = new THREE.Group();
        spokeGroup.name = `${name} spokes`;
        const spokeMat = mats.magnesium.clone();
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            const r1 = 0.072;
            const r2 = 0.205;
            const p1 = new THREE.Vector3(tireWidth * 0.43, Math.sin(a) * r1, Math.cos(a) * r1);
            const p2 = new THREE.Vector3(tireWidth * 0.43, Math.sin(a + 0.035) * r2, Math.cos(a + 0.035) * r2);
            const spoke = rodBetween(p1, p2, 0.009, spokeMat, 10);
            spoke.scale.x = 0.75;
            spokeGroup.add(spoke);
        }
        wheel.add(spokeGroup);
        const centerBoss = axisCylinder(0.078, 0.054, mats.magnesium, 64);
        centerBoss.position.x = tireWidth * 0.42;
        centerBoss.name = `${name} center boss`;
        wheel.add(centerBoss);
        const splineHole = axisCylinder(0.047, 0.062, mats.darkSteel, 48);
        splineHole.position.x = tireWidth * 0.445;
        splineHole.name = `${name} center bore`;
        wheel.add(splineHole);
        const nut = axisCylinder(0.056, 0.042, mats.steel, 8);
        nut.position.x = tireWidth * 0.53;
        nut.rotation.x = Math.PI / 8;
        nut.name = `${name} retained center nut`;
        wheel.add(nut);
        const nutCap = axisCylinder(0.032, 0.046, mats.darkSteel, 32);
        nutCap.position.x = tireWidth * 0.56;
        nutCap.name = 'Nut drive face';
        wheel.add(nutCap);
        const retentionCollar = mesh(new THREE.TorusGeometry(0.064, 0.006, 10, 64), mats.gunAccent, 'Nut retention collar');
        retentionCollar.rotation.y = Math.PI / 2;
        retentionCollar.position.x = tireWidth * 0.505;
        wheel.add(retentionCollar);
        const sidewallMat = new THREE.MeshBasicMaterial({ map: makeCanvasSidewall(compoundColor, label), transparent: true, depthWrite: false, side: THREE.DoubleSide });
        const sidewall = mesh(new THREE.RingGeometry(0.243, 0.35, 128), sidewallMat, `${name} sidewall markings`);
        sidewall.rotation.y = Math.PI / 2;
        sidewall.position.x = tireWidth * 0.505;
        sidewall.renderOrder = 3;
        wheel.add(sidewall);
        const valve = axisCylinder(0.005, 0.038, mats.darkSteel, 12);
        valve.position.set(tireWidth * 0.51, 0.185, 0.07);
        valve.rotation.z = Math.PI / 2;
        wheel.add(valve);
        tire.userData.basePosition = tire.position.clone();
        tread.userData.basePosition = tread.position.clone();
        barrel.userData.basePosition = barrel.position.clone();
        innerBarrel.userData.basePosition = innerBarrel.position.clone();
        flangeIn.userData.basePosition = flangeIn.position.clone();
        flangeOut.userData.basePosition = flangeOut.position.clone();
        spokeGroup.userData.basePosition = spokeGroup.position.clone();
        centerBoss.userData.basePosition = centerBoss.position.clone();
        splineHole.userData.basePosition = splineHole.position.clone();
        nut.userData.basePosition = nut.position.clone();
        nutCap.userData.basePosition = nutCap.position.clone();
        retentionCollar.userData.basePosition = retentionCollar.position.clone();
        sidewall.userData.basePosition = sidewall.position.clone();
        valve.userData.basePosition = valve.position.clone();
        wheel.userData.parts = { tire, tread, barrel, innerBarrel, flangeIn, flangeOut, spokeGroup, centerBoss, splineHole, nut, nutCap, retentionCollar, sidewall, valve };
        wheel.userData.tireWidth = tireWidth;
        registerSelectable(tire, 'Slick racing tire', 'A low-profile 18-inch slick. The rounded shoulders and broad contact surface support high lateral load.');
        registerSelectable(spokeGroup, 'Magnesium wheel', 'A lightweight center-lock wheel with a deep barrel and radial spokes.');
        registerSelectable(nut, 'Retained center nut', 'The center nut moves along the axle thread but remains captured by the wheel retention collar.');
        registerSelectable(sidewall, 'Compound markings', 'The colored ring identifies the tire compound. This simulator uses a generic race-tire marking.');
        registerSelectable(wheel, `${name}`, 'A complete wheel assembly with slick tire, magnesium rim, center bore, retained nut, valve and sidewall markings.');
        return wheel;
    }
    function makeHubAndBrake() {
        const group = new THREE.Group();
        group.name = 'Hub and brake system';
        const upright = roundedBox(0.13, 0.28, 0.18, 0.025, mats.darkSteel);
        upright.position.set(0.275, 0.43, 0);
        upright.rotation.y = Math.PI / 2;
        upright.name = 'Wheel upright';
        group.add(upright);
        const axle = axisCylinder(0.036, 0.46, mats.steel, 48);
        axle.position.set(0.48, 0.43, 0);
        axle.name = 'Threaded axle';
        group.add(axle);
        const threaded = new THREE.Group();
        threaded.name = 'Axle thread';
        for (let i = 0; i < 13; i++) {
            const ring = mesh(new THREE.TorusGeometry(0.039, 0.0022, 6, 32), mats.darkSteel, 'Thread ridge');
            ring.rotation.y = Math.PI / 2;
            ring.position.set(0.60 + i * 0.009, 0.43, 0);
            threaded.add(ring);
        }
        group.add(threaded);
        const hub = axisCylinder(0.095, 0.115, mats.darkSteel, 64);
        hub.position.set(0.43, 0.43, 0);
        hub.name = 'Center-lock hub';
        group.add(hub);
        const splines = new THREE.Group();
        splines.name = 'Drive splines';
        for (let i = 0; i < 18; i++) {
            const a = i / 18 * Math.PI * 2;
            const tooth = mesh(new THREE.BoxGeometry(0.11, 0.009, 0.018), mats.steel, 'Drive spline');
            tooth.position.set(0.49, 0.43 + Math.sin(a) * 0.078, Math.cos(a) * 0.078);
            tooth.rotation.x = a;
            splines.add(tooth);
        }
        group.add(splines);
        const disc = axisCylinder(0.218, 0.026, mats.darkSteel, 96);
        disc.position.set(0.285, 0.43, 0);
        disc.name = 'Carbon brake disc';
        group.add(disc);
        const discFace = mesh(new THREE.TorusGeometry(0.163, 0.051, 16, 96), new THREE.MeshStandardMaterial({ color: 0x2e3339, roughness: 0.55, metalness: 0.52 }), 'Brake friction ring');
        discFace.rotation.y = Math.PI / 2;
        discFace.position.set(0.301, 0.43, 0);
        group.add(discFace);
        const holes = new THREE.Group();
        holes.name = 'Disc ventilation holes';
        for (let r = 0; r < 2; r++) {
            const rr = r ? 0.185 : 0.142;
            const count = r ? 30 : 22;
            for (let i = 0; i < count; i++) {
                const a = i / count * Math.PI * 2 + r * 0.08;
                const dot = axisCylinder(0.0035, 0.029, new THREE.MeshBasicMaterial({ color: 0x08090a }), 10);
                dot.position.set(0.304, 0.43 + Math.sin(a) * rr, Math.cos(a) * rr);
                holes.add(dot);
            }
        }
        group.add(holes);
        const bell = axisCylinder(0.105, 0.034, mats.magnesiumDark, 48);
        bell.position.set(0.304, 0.43, 0);
        bell.name = 'Brake bell';
        group.add(bell);
        const caliper = new THREE.Group();
        caliper.name = 'Brake caliper';
        const caliperBody = roundedBox(0.09, 0.19, 0.08, 0.022, mats.brake);
        caliperBody.position.set(0.285, 0.43, 0.168);
        caliperBody.rotation.y = Math.PI / 2;
        caliper.add(caliperBody);
        const bridge = roundedBox(0.085, 0.055, 0.12, 0.016, mats.brake);
        bridge.position.set(0.285, 0.43, 0.15);
        bridge.rotation.y = Math.PI / 2;
        caliper.add(bridge);
        group.add(caliper);
        const lowerA = rodBetween(new THREE.Vector3(-0.48, 0.16, -0.32), new THREE.Vector3(0.25, 0.35, -0.08), 0.018, mats.carbon, 18);
        const lowerB = rodBetween(new THREE.Vector3(-0.48, 0.16, 0.32), new THREE.Vector3(0.25, 0.35, 0.08), 0.018, mats.carbon, 18);
        const upperA = rodBetween(new THREE.Vector3(-0.42, 0.72, -0.26), new THREE.Vector3(0.25, 0.52, -0.07), 0.015, mats.carbon, 18);
        const upperB = rodBetween(new THREE.Vector3(-0.42, 0.72, 0.26), new THREE.Vector3(0.25, 0.52, 0.07), 0.015, mats.carbon, 18);
        const steering = rodBetween(new THREE.Vector3(-0.38, 0.44, -0.34), new THREE.Vector3(0.25, 0.45, -0.10), 0.012, mats.steel, 16);
        group.add(lowerA, lowerB, upperA, upperB, steering);
        registerSelectable(axle, 'Threaded axle', 'The center-lock nut runs along this single axle thread. Splines transmit drive torque through the hub.');
        registerSelectable(hub, 'Hub and drive splines', 'The hub centers the wheel and transmits braking and drive loads through its splined interface.');
        registerSelectable(disc, 'Carbon brake disc', 'A ventilated carbon friction ring sits inboard of the wheel and rotates with the hub.');
        registerSelectable(caliper, 'Brake caliper', 'The fixed caliper clamps the rotating disc. Its position remains fixed while the wheel and disc rotate.');
        registerSelectable(group, 'Hub, brake and suspension', 'The corner assembly includes the axle, drive splines, carbon disc, fixed caliper, upright and suspension links.');
        group.userData.axle = axle;
        group.userData.hub = hub;
        group.userData.disc = disc;
        group.userData.caliper = caliper;
        return group;
    }
    function makeCarBody() {
        const car = new THREE.Group();
        car.name = 'Car chassis corner';
        const monocoque = roundedBox(1.45, 0.34, 0.64, 0.08, mats.carbon);
        monocoque.position.set(-0.82, 0.55, 0);
        monocoque.rotation.y = Math.PI / 2;
        car.add(monocoque);
        const nose = roundedBox(0.88, 0.16, 0.24, 0.05, mats.carbon2);
        nose.position.set(-0.82, 0.45, -0.62);
        car.add(nose);
        const bodyPanel = roundedBox(0.7, 0.23, 0.6, 0.06, mats.gunAccent);
        bodyPanel.position.set(-0.66, 0.65, 0);
        bodyPanel.rotation.y = Math.PI / 2;
        car.add(bodyPanel);
        const floor = mesh(new THREE.BoxGeometry(1.6, 0.035, 0.86), mats.carbon, 'Floor plank');
        floor.position.set(-0.62, 0.23, 0);
        car.add(floor);
        const wingMain = mesh(new THREE.BoxGeometry(1.2, 0.035, 0.18), mats.carbon2, 'Front wing plane');
        wingMain.position.set(-0.85, 0.25, -0.92);
        car.add(wingMain);
        const endplateL = mesh(new THREE.BoxGeometry(0.035, 0.25, 0.25), mats.carbon2, 'Wing endplate');
        endplateL.position.set(-0.25, 0.31, -0.92);
        car.add(endplateL);
        registerSelectable(car, 'Formula car corner', 'A generic carbon-fiber single-seater chassis corner provides spatial context for the suspension and wheel system.');
        return car;
    }
    function makeJack() {
        const jack = new THREE.Group();
        jack.name = 'Side lifting jack';
        const base = mesh(new THREE.BoxGeometry(0.55, 0.04, 0.34), mats.darkSteel, 'Jack base');
        base.position.set(-0.18, 0.045, 0);
        jack.add(base);
        const arm1 = rodBetween(new THREE.Vector3(-0.32, 0.08, -0.1), new THREE.Vector3(-0.08, 0.34, -0.1), 0.018, mats.steel, 16);
        const arm2 = rodBetween(new THREE.Vector3(-0.32, 0.08, 0.1), new THREE.Vector3(-0.08, 0.34, 0.1), 0.018, mats.steel, 16);
        jack.add(arm1, arm2);
        const pad = roundedBox(0.18, 0.035, 0.18, 0.012, mats.gunAccent);
        pad.position.set(-0.08, 0.36, 0);
        jack.add(pad);
        jack.userData.pad = pad;
        registerSelectable(jack, 'Lifting jack', 'The car remains raised while the nut is loose and either wheel is off the hub.');
        return jack;
    }
    function makeWheelGun() {
        const gun = new THREE.Group();
        gun.name = 'Pneumatic wheel gun';
        const barrel = axisCylinder(0.052, 0.27, mats.gun, 48);
        barrel.position.x = -0.03;
        barrel.name = 'Impact barrel';
        gun.add(barrel);
        const motor = axisCylinder(0.085, 0.18, mats.gun, 48);
        motor.position.x = 0.17;
        motor.name = 'Pneumatic motor';
        gun.add(motor);
        const rotor = new THREE.Group();
        rotor.name = 'Gun rotor and socket';
        const socket = axisCylinder(0.061, 0.105, mats.darkSteel, 12);
        socket.position.x = -0.205;
        socket.name = 'Center-nut socket';
        rotor.add(socket);
        const collar = mesh(new THREE.TorusGeometry(0.067, 0.007, 8, 32), mats.gunAccent, 'Socket collar');
        collar.rotation.y = Math.PI / 2;
        collar.position.x = -0.255;
        rotor.add(collar);
        gun.add(rotor);
        const handle = roundedBox(0.08, 0.24, 0.09, 0.02, mats.gun);
        handle.position.set(0.15, -0.16, 0);
        handle.rotation.z = -0.12;
        handle.name = 'Wheel-gun handle';
        gun.add(handle);
        const trigger = roundedBox(0.025, 0.045, 0.05, 0.007, mats.gunAccent);
        trigger.position.set(0.105, -0.11, 0.045);
        gun.add(trigger);
        const controller = roundedBox(0.11, 0.075, 0.105, 0.016, mats.gun);
        controller.position.set(0.21, 0.095, 0);
        controller.name = 'Gun control module';
        gun.add(controller);
        const screen = mesh(new THREE.PlaneGeometry(0.064, 0.034), new THREE.MeshBasicMaterial({ color: 0x18d889, toneMapped: false }), 'Torque-status display');
        screen.position.set(0.21, 0.10, 0.054);
        screen.rotation.y = 0;
        gun.add(screen);
        const led = mesh(new THREE.SphereGeometry(0.008, 16, 10), new THREE.MeshBasicMaterial({ color: C.green, toneMapped: false }), 'Gun status LED');
        led.position.set(0.255, 0.13, 0.055);
        gun.add(led);
        const inlet = axisCylinder(0.02, 0.08, mats.darkSteel, 20);
        inlet.rotation.z = 0;
        inlet.position.set(0.17, -0.31, 0);
        gun.add(inlet);
        gun.userData.rotor = rotor;
        gun.userData.led = led;
        gun.userData.screen = screen;
        registerSelectable(gun, 'Pneumatic wheel gun', 'The socket engages the retained center nut. The gun reverses to loosen, then tightens until its controller confirms lock.');
        return gun;
    }
    function applyExploded(wheel, amount) {
        const p = wheel.userData.parts;
        const setX = (obj, offset) => obj.position.x = obj.userData.basePosition.x + offset * amount;
        setX(p.tire, 0.20);
        setX(p.tread, 0.20);
        setX(p.barrel, 0.03);
        setX(p.innerBarrel, 0.01);
        setX(p.flangeIn, -0.03);
        setX(p.flangeOut, 0.08);
        setX(p.spokeGroup, 0.10);
        setX(p.centerBoss, 0.15);
        setX(p.splineHole, 0.16);
        setX(p.nut, 0.28);
        setX(p.nutCap, 0.28);
        setX(p.retentionCollar, 0.23);
        setX(p.sidewall, 0.22);
        setX(p.valve, 0.22);
    }
    function applyCutaway(wheel, enabled) {
        const p = wheel.userData.parts;
        [p.tire, p.barrel, p.innerBarrel, p.flangeIn, p.flangeOut].forEach((obj) => {
            if (!obj.material)
                return;
            obj.material.clippingPlanes = enabled ? [cutPlane] : [];
            obj.material.needsUpdate = true;
        });
        p.tread.children.forEach((block) => { block.visible = !enabled || block.position.z <= 0.015; });
        p.sidewall.visible = !enabled;
    }
    return { makeWheel, makeHubAndBrake, makeCarBody, makeJack, makeWheelGun, applyExploded, applyCutaway, mats, alignBetween, rodBetween, registerSelectable };
}
