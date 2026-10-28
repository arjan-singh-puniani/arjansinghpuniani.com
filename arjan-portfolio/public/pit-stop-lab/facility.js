import * as THREE from './vendor/three.module.js';
/** Procedural facility assets; operational counters come from simulation snapshots. */
export function createFacility(world, kit) {
    const { box, sphere, cylinder, rod, label, mat, M, batchStatic, vehicle, wheel } = kit;
    const staticWorld = new THREE.Group();
    world.add(staticWorld);
    const ivory = mat('#e7e6da'), enamel = mat('#cfddd5', .15, .4), orange = mat('#db663c'), slate = mat('#536e73'), grass = mat('#798f71');
    const strip = new THREE.MeshStandardMaterial({ color: '#e6f2de', emissive: '#d6efc8', emissiveIntensity: .3 });
    const architecture = new THREE.Group();
    staticWorld.add(architecture);
    const section = new THREE.Group();
    world.add(section);
    section.visible = false;
    box(staticWorld, -1.9, -.55, 0, 25, .9, 40, M.carbon);
    box(staticWorld, -1.9, -.075, 0, 25, .08, 40, ivory);
    box(staticWorld, 4.7, -.025, 0, 5.8, .035, 40, mat('#6a7c7e'));
    box(staticWorld, 11.15, -.04, 0, 3, .06, 40, mat('#8c9d92'));
    box(staticWorld, -1.15, -.014, 0, 5.9, .025, 11.4, mat('#b0bcb2'));
    for (const x of [-3.85, 1.55])
        box(staticWorld, x, .003, 0, .04, .012, 12.8, M.yellow);
    for (const z of [-6.4, 6.4])
        box(staticWorld, -1.15, .003, z, 5.45, .012, .045, M.yellow);
    for (let z = -19; z < 20; z += 1.65) {
        box(staticWorld, 2, .006, z, .055, .015, .9, ivory);
        box(staticWorld, 7.4, .005, z, .09, .012, 1.65, M.yellow);
    }
    for (const z of [-1.65, 1.65])
        for (const x of [-.96, .96]) {
            box(staticWorld, x, .012, z, .65, .018, .055, M.white);
            box(staticWorld, x + .32, .012, z + .22, .05, .018, .46, M.white);
        }
    for (const z of [-10.6, 10.6])
        for (let i = 0; i < 10; i++)
            for (let j = 0; j < 2; j++)
                box(staticWorld, -3.4 + i * .48, .01, z + j * .22, .48, .016, .22, (i + j) % 2 ? M.carbon : ivory);
    const bayData = [{ z: -8.2, title: 'AERO / ASSEMBLY', number: '02', color: M.teal }, { z: 0, title: 'RACE OPERATIONS', number: '01', color: M.red }, { z: 8.2, title: 'TIRE / PREPARATION', number: '03', color: orange }];
    box(architecture, -10.5, 1.85, 0, .22, 3.8, 25, ivory);
    box(architecture, -7.5, .025, 0, 6.2, .08, 25, mat('#94a9a1'));
    for (const z of [-12.4, -4.1, 4.1, 12.4]) {
        box(architecture, -7.5, 1.5, z, 6, 3.1, .17, ivory);
        box(architecture, -4.45, 1.7, z, .2, 3.5, .25, M.carbon);
        box(architecture, -4.34, 1.7, z, .04, 2.9, .055, M.red);
    }
    // Partial roof exposes working interiors while retaining the architecture's depth.
    box(architecture, -9.85, 3.5, 0, 1.3, .16, 25, ivory);
    box(section, -6.8, 3.5, 0, 4.8, .16, 25, ivory);
    for (const bay of bayData) {
        const z = bay.z;
        box(architecture, -4.45, 3.3, z, .25, .38, 7.9, M.carbon);
        box(architecture, -4.29, 3.09, z, .025, .04, 7.6, strip);
        label(architecture, `${bay.number}  /  ${bay.title}`, [-4.29, 3.35, z], 5.7, '#e8e5d7', '#233b3e');
        for (let dz = -3.5; dz <= 3.6; dz += .32)
            box(architecture, -10.36, 1.6, z + dz, .035, 2.9, .018, enamel);
        box(architecture, -10.25, .45, z, .25, .85, 7.4, M.carbon);
        box(architecture, -10.08, .95, z, .15, .1, 7.5, M.metal);
        label(architecture, 'PIT / SYSTEMS', [-10.19, 2.6, z], 3.3, '#263f3d', '#cfddd5');
        for (const dz of [-2.55, 2.55]) {
            // Cabinets, trays, drawers, caster wheels and tools on a real work surface.
            box(staticWorld, -9.35, .47, z + dz, 1.1, .86, 1.55, bay.color);
            box(staticWorld, -9.3, .94, z + dz, 1.28, .08, 1.7, M.metal);
            for (let k = 0; k < 4; k++) {
                box(staticWorld, -8.77, .22 + k * .19, z + dz, .02, .15, 1.42, slate);
                box(staticWorld, -8.75, .27 + k * .19, z + dz, .04, .025, .5, M.metal);
            }
            for (let k = 0; k < 5; k++) {
                box(staticWorld, -9.35 + k * .16, 1.02, z + dz + .25, .045, .025, .35, M.carbon);
            }
            const bottle = cylinder(.055, .25, bay.color, 10);
            bottle.position.set(-9.55, 1.12, z + dz - .4);
            staticWorld.add(bottle);
            for (const dx of [-.4, .4])
                for (const zz of [-.55, .55]) {
                    const caster = cylinder(.07, .08, M.carbon, 10);
                    caster.rotation.z = Math.PI / 2;
                    caster.position.set(-9.35 + dx, .08, z + dz + zz);
                    staticWorld.add(caster);
                }
            box(staticWorld, -8.95, 1.55, z + dz, .09, .68, 1.05, M.carbon);
            box(staticWorld, -8.89, 1.55, z + dz, .025, .54, .91, M.teal);
            for (let k = 0; k < 4; k++)
                box(staticWorld, -8.867, 1.39 + k * .09, z + dz - .17, .009, .014, .36, strip);
        }
        for (const dz of [-3.2, 3.2]) {
            box(architecture, -7.6, 3.2, z + dz, 4.7, .07, .06, M.metal);
            box(architecture, -7.6, 3.15, z + dz, 3.8, .025, .09, strip);
        }
        // Repeated overhead hose drops and cable reels.
        for (const dz of [-1.7, 1.7]) {
            const reel = cylinder(.20, .12, M.yellow);
            reel.rotation.z = Math.PI / 2;
            reel.position.set(-4.65, 2.95, z + dz);
            staticWorld.add(reel);
            rod(staticWorld, [-4.5, 2.8, z + dz], [-4.5, .45, z + dz], M.carbon, .19);
        }
        const zone = label(staticWorld, bay.number === '01' ? 'STOP / TARGET' : bay.title, [-6.6, .09, z], 3.3, '#e9eadb', '#94a9a1');
        zone.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
    }
    // Tires are visibly organized by compound; these display stocks are distinct from the service inventory.
    let displayTires = 0;
    for (const [index, compound] of [M.red, M.yellow, M.white].entries()) {
        const z = 6.1 + index * 1.7;
        for (const dx of [-8, -5.4])
            for (const dz of [-.55, .55])
                rod(staticWorld, [dx, .08, z + dz], [dx, 1.65, z + dz], M.metal, .42);
        for (const y of [.50, 1.30]) {
            rod(staticWorld, [-8, y - .1, z - .5], [-5.4, y - .1, z - .5], M.metal, .4);
            rod(staticWorld, [-8, y - .1, z + .5], [-5.4, y - .1, z + .5], M.metal, .4);
            for (let n = 0; n < 6; n++) {
                const tire = cylinder(.35, .31, M.rubber, 24);
                tire.rotation.z = Math.PI / 2;
                tire.position.set(-7.65 + n * .37, y, z);
                staticWorld.add(tire);
                const ring = cylinder(.18, .315, compound, 20);
                ring.rotation.z = Math.PI / 2;
                ring.position.copy(tire.position);
                staticWorld.add(ring);
                displayTires++;
            }
        }
        label(staticWorld, ['SOFT / DISPLAY', 'MEDIUM / DISPLAY', 'HARD / DISPLAY'][index], [-5.31, 1.73, z], 1.4, '#e9eadb', '#233b3e');
    }
    // An adjacent assembly bay has a complete parked car and detached aero elements.
    const displayCar = vehicle(M.teal);
    displayCar.position.set(-6.7, .10, -8.2);
    displayCar.rotation.y = Math.PI / 2;
    for (const c of ['FL', 'FR', 'RL', 'RR']) {
        const w = wheel();
        w.position.set(c.endsWith('L') ? .96 : -.96, .355, c.startsWith('F') ? -1.65 : 1.65);
        if (c.endsWith('R'))
            w.rotation.y = Math.PI;
        displayCar.add(w);
    }
    world.add(displayCar);
    for (const z of [-10.6, -5.9]) {
        box(staticWorld, -6.7, .5, z, .6, .06, 1.7, M.carbon);
        rod(staticWorld, [-7, .06, z - .6], [-6.7, .5, z], M.metal, .45);
        rod(staticWorld, [-6.4, .06, z + .6], [-6.7, .5, z], M.metal, .45);
        for (let i = 0; i < 3; i++)
            box(staticWorld, -6.7, .58 + i * .05, z, .16, .028, 1.8, i === 0 ? M.teal : M.carbon);
    }
    // Shared pit equipment on each flank of the active service box.
    for (const z of [-3.9, 3.9]) {
        box(staticWorld, -3.7, .37, z, .7, .67, .85, M.red);
        box(staticWorld, -3.7, .75, z, .8, .06, .9, M.carbon);
        for (let n = 0; n < 4; n++) {
            box(staticWorld, -3.32, .2 + n * .13, z, .018, .10, .72, slate);
            box(staticWorld, -3.30, .24 + n * .13, z, .02, .016, .25, M.metal);
        }
        for (const x of [-3.94, -3.46])
            for (const zz of [z - .29, z + .29]) {
                const caster = cylinder(.07, .065, M.carbon, 8);
                caster.rotation.z = Math.PI / 2;
                caster.position.set(x, .07, zz);
                staticWorld.add(caster);
            }
        const tank = cylinder(.15, .65, M.metal);
        tank.position.set(-4.0, .38, z + .6);
        staticWorld.add(tank);
        rod(staticWorld, [-4, .72, z + .6], [-4, .83, z + .6], M.yellow, .4);
    }
    const deliveryCart = new THREE.Group();
    world.add(deliveryCart);
    box(deliveryCart, 0, .18, 0, 1.6, .10, .85, M.carbon);
    box(deliveryCart, 0, .62, -.37, 1.6, .06, .06, M.metal);
    for (const x of [-.68, .68]) {
        rod(deliveryCart, [x, .12, -.37], [x, .95, -.37], M.metal, .45);
        for (const z of [-.30, .30]) {
            const caster = cylinder(.10, .08, M.carbon, 12);
            caster.rotation.z = Math.PI / 2;
            caster.position.set(x, .10, z);
            deliveryCart.add(caster);
        }
    }
    for (let n = 0; n < 4; n++) {
        const tire = cylinder(.35, .31, M.rubber, 24);
        tire.rotation.z = Math.PI / 2;
        tire.position.set(-.56 + n * .37, .56, 0);
        deliveryCart.add(tire);
        const ring = cylinder(.16, .315, M.yellow, 16);
        ring.rotation.z = Math.PI / 2;
        ring.position.copy(tire.position);
        deliveryCart.add(ring);
    }
    batchStatic(deliveryCart);
    const gantry = new THREE.Group();
    world.add(gantry);
    rod(gantry, [-3.25, 0, -3.4], [-3.25, 2.65, -3.4], M.carbon, 1.1);
    rod(gantry, [-3.25, 2.65, -3.4], [0, 2.65, -3.4], M.carbon, .9);
    box(gantry, 0, 2.4, -3.4, .65, .4, .18, M.carbon);
    const lightMat = new THREE.MeshStandardMaterial({ color: '#ffb83e', emissive: '#ff9b20', emissiveIntensity: .5 });
    for (const x of [-.19, 0, .19])
        sphere(gantry, x, 2.4, -3.29, .06, .06, .03, lightMat);
    // Pit wall, command desks, a transparent safety fence and grandstand tiers.
    box(staticWorld, 8.15, .47, 0, .36, .95, 39, M.white);
    box(staticWorld, 8.15, .98, 0, .4, .08, 39, M.teal);
    const glass = new THREE.MeshPhysicalMaterial({ color: '#adc8c4', transparent: true, opacity: .17, roughness: .2, depthWrite: false });
    box(staticWorld, 8.2, 1.7, 0, .035, 1.4, 38, glass);
    for (let z = -18; z <= 18; z += 2) {
        rod(staticWorld, [8.2, 1, z], [8.2, 2.45, z], M.metal, .35);
    }
    for (const z of [-5, -2, 1, 4]) {
        box(staticWorld, 9.1, .48, z, 1.1, .9, 2.3, M.carbon);
        box(staticWorld, 9.0, 1.0, z, 1.4, .08, 2.5, slate);
        for (const zz of [-.7, .7]) {
            box(staticWorld, 8.9, 1.4, z + zz, .07, .6, .95, M.carbon);
            box(staticWorld, 8.85, 1.4, z + zz, .015, .48, .81, M.teal);
            for (let n = 0; n < 3; n++)
                box(staticWorld, 8.83, 1.25 + n * .1, z + zz, .01, .012, .55, strip);
        }
        box(staticWorld, 9.8, .47, z, .43, .08, .48, M.carbon);
        rod(staticWorld, [9.8, .08, z], [9.8, .46, z], M.metal, .45);
        box(staticWorld, 10, .81, z, .08, .55, .49, M.carbon);
    }
    const commandSign = label(staticWorld, 'PIT WALL / ENGINEERING', [8.38, 2.85, 0], 5.8);
    commandSign.rotation.y = Math.PI / 2;
    for (let tier = 0; tier < 3; tier++) {
        box(staticWorld, 11.5 + tier * .55, .25 + tier * .30, -9, .55, .5 + tier * .6, 10, slate);
        for (let seat = 0; seat < 14; seat++)
            box(staticWorld, 11.5 + tier * .55, .57 + tier * .6, -13.5 + seat * .68, .35, .07, .4, (seat + tier) % 3 === 0 ? M.red : M.white);
    }
    // Sculpted planting, bollards, flag towers and perimeter details frame the miniature campus.
    for (const z of [-16, 15]) {
        box(staticWorld, -8, -.01, z, 5, .06, 2.5, grass);
        for (const x of [-9.5, -6.7]) {
            rod(staticWorld, [x, 0, z], [x, 1.4, z], mat('#756148'), .9);
            sphere(staticWorld, x, 1.9, z, .65, .8, .65, mat('#728e68'));
            sphere(staticWorld, x + .3, 2, z - .15, .45, .55, .45, mat('#8fa77b'));
        }
        for (let i = 0; i < 6; i++)
            box(staticWorld, -10 + i * .7, .17, z + 1.45, .08, .34, .08, M.carbon);
    }
    for (const z of [-17.3, 17.3]) {
        rod(staticWorld, [-3, 0, z], [-3, 5.1, z], M.metal, .45);
        box(staticWorld, -3, 4.3, z + .55, .028, 1.15, 1.1, M.red);
        label(staticWorld, 'P / L', [-2.98, 4.3, z + .55], .9);
        box(staticWorld, -2.9, .08, z, .4, .16, .4, M.carbon);
    }
    for (let z = -17; z <= 17; z += 2.3) {
        box(staticWorld, -11.8, .09, z, .09, .18, 1.25, M.carbon);
        box(staticWorld, -11.8, .19, z, .025, .02, .95, strip);
    }
    const entry = label(staticWorld, 'PIT ENTRY  →', [.2, .04, 15], 3.1, '#eee9d9', '#b0bcb2');
    entry.rotation.set(-Math.PI / 2, 0, 0);
    const exit = label(staticWorld, 'RELEASE  →', [4.8, .02, -12], 2.5, '#eee9d9', '#6a7c7e');
    exit.rotation.set(-Math.PI / 2, 0, 0);
    const targetLabel = label(staticWorld, '01 / STOP TARGET', [-1, .04, -4.5], 2.8, '#e7e4cf', '#b0bcb2');
    targetLabel.rotation.set(-Math.PI / 2, 0, 0);
    batchStatic(staticWorld);
    batchStatic(section);
    batchStatic(displayCar);
    const hotspots = [
        { id: 'garage', title: 'Race garage', position: new THREE.Vector3(-6.3, 1.8, 0), camera: 'garage' },
        { id: 'tires', title: 'Tire preparation', position: new THREE.Vector3(-6.4, 1.6, 8.2), camera: 'tires' },
        { id: 'command', title: 'Pit-wall command', position: new THREE.Vector3(9.1, 1.8, 0), camera: 'command' },
    ];
    const contact = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 7.5), new THREE.MeshBasicMaterial({ map: contactTexture(), transparent: true, opacity: .32, depthWrite: false }));
    contact.rotation.x = -Math.PI / 2;
    contact.position.y = .018;
    world.add(contact);
    function contactTexture() { const c = document.createElement('canvas'); c.width = 128; c.height = 256; const ctx = c.getContext('2d'); const gradient = ctx.createRadialGradient(64, 128, 10, 64, 128, 100); gradient.addColorStop(0, 'rgba(10,27,27,.7)'); gradient.addColorStop(1, 'rgba(10,27,27,0)'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 256); return new THREE.CanvasTexture(c); }
    const workLights = [-8.2, 0, 8.2].map(z => { const light = new THREE.PointLight('#ffdfac', 24, 9, 2); light.position.set(-6.5, 2.9, z); light.visible = false; world.add(light); return light; });
    const serviceLight = new THREE.PointLight('#d9e9ff', 65, 13, 2);
    serviceLight.position.set(-.8, 5, 0);
    serviceLight.visible = false;
    world.add(serviceLight);
    workLights.push(serviceLight);
    return { lightMat, hotspots, section, displayTires, strip, contact, deliveryCart, workLights };
}
