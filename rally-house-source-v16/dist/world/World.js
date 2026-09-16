import { Vec3, smoothstep } from '../rendering/Math3D.js';
import { palette } from '../content/content.js';
import { Navigation } from './Navigation.js';
import { rotatedFootprint } from '../content/DecorCatalog.js';
export class World {
    meshes = [];
    objects = [];
    nav;
    weather = 'clear';
    placements = [];
    rainSeed = Array.from({ length: 78 }, (_, i) => ({ x: ((i * 47) % 250) / 10 - 12.5, z: -9.78 - ((i * 13) % 8) / 20, y: 1 + ((i * 59) % 60) / 10 }));
    wallHeights = { west: 4.55, east: .48 };
    interactionFx = new Map();
    constructor() { const obstacles = [{ x: -9, z: 4.8, w: 3.5, d: 1.2 }, { x: -9, z: -5.8, w: 4.4, d: 1.35 }, { x: 8.6, z: 5.6, w: 3.8, d: 1.8 }, { x: 9.2, z: -4.6, w: 3.8, d: 1.7 }, { x: -7.5, z: .2, w: 1.7, d: 1.4 }, { x: 10.2, z: 3.9, w: 1.7, d: 1.3 }, { x: 6.7, z: -6.3, w: 1.7, d: 1.0 }, { x: -8.05, z: 1.6, w: 1.0, d: 2.7 }, { x: -11.2, z: -2.2, w: 1.1, d: 1.1 }, { x: -11.5, z: -.95, w: 1.0, d: 1.1 }, { x: -10.35, z: 6.35, w: 1.9, d: 1.25 }, { x: -10.35, z: 8.05, w: 1.9, d: 1.25 }, { x: -9.0, z: 7.2, w: 1.0, d: 1.0 }, { x: 11.35, z: .3, w: 1.2, d: 3.5 }, { x: 10.42, z: .05, w: 1.0, d: 3.2 }, { x: -2.6, z: 8.35, w: 3.2, d: 1.2 }, { x: 1.0, z: 8.35, w: 3.2, d: 1.2 }, { x: 4.6, z: 8.35, w: 3.2, d: 1.2 }, { x: -4.8, z: 7.9, w: .9, d: .9 }, { x: 5.6, z: 7.9, w: .9, d: .9 }, { x: -1.4, z: -8.3, w: 2.5, d: 1.0 }]; this.nav = new Navigation(obstacles); this.build(); }
    triggerInteraction(kind, duration = 1.35) { this.interactionFx.set(kind, performance.now() / 1000 + duration); }
    add(kind, x, y, z, sx, sy, sz, color, rotY = 0, alpha = 1, unlit = false, id, material) { this.meshes.push({ kind, position: new Vec3(x, y, z), rotation: new Vec3(0, rotY, 0), scale: new Vec3(sx, sy, sz), color, alpha, unlit, id, material }); }
    rb(x, y, z, sx, sy, sz, color, rotY = 0, alpha = 1, unlit = false, id, material) { this.add('roundBox', x, y, z, sx, sy, sz, color, rotY, alpha, unlit, id, material); }
    shadow(_x, _z, _sx, _sz, _a = .055) { }
    shelf(x, y, z, w, color = palette.woodDark) { this.rb(x, y, z, w, .10, .55, color); }
    book(x, y, z, c, rot = 0) { this.rb(x, y, z, .18, .58, .36, c, rot); }
    build() {
        // Layered architectural plinth and cutaway walls.
        this.add('box', 0, -.22, 0, 26, .44, 20, '#fff0dd');
        this.add('box', 0, -.48, 0, 26.7, .22, 20.7, '#dec5a8');
        this.add('box', 0, -.61, 0, 27.25, .11, 21.15, '#c9ad8b');
        this.rb(0, 2.22, -9.75, 26, 4.55, .34, '#dbe7d1');
        this.rb(0, .22, -9.45, 25.2, .24, .20, '#7fa28a');
        // Side walls are camera-aware cutaways and are emitted dynamically.
        // Floor zones. Court remains crisp; social areas get tiny tile seams.
        this.add('box', 1, .035, 0, 9.3, .07, 12.8, palette.court, 0, 1, false, undefined, 'court');
        this.add('box', -8.8, .02, 0, 6.3, .05, 18.5, '#f8ead6');
        this.add('box', 8.9, .02, 0, 6.0, .05, 18.5, '#f5e6d2');
        for (let z = -8; z <= 8; z += 2)
            this.add('box', -8.8, .051, z, 6.0, .012, .025, '#dfc8ae', 0, .30, true);
        for (let x = -11; x <= -6; x += 1.5)
            this.add('box', x, .052, 0, .022, .012, 18.1, '#e4ceb7', 0, .22, true);
        // Court lines.
        const line = (x, z, w, d) => this.add('box', x, .085, z, w, .026, d, palette.line);
        line(1, 0, 8.5, .07);
        line(-3.25, 0, .07, 12);
        line(5.25, 0, .07, 12);
        line(1, -6, 8.5, .07);
        line(1, 6, 8.5, .07);
        line(1, -3.7, 8.5, .06);
        line(1, 3.7, 8.5, .06);
        line(1, 0, .055, 7.4);
        // Net: frame + mesh. Kept fine enough to read without becoming visual noise.
        this.add('cylinder', -3.35, .62, 0, .09, 1.25, .09, '#56655b');
        this.add('cylinder', 5.35, .62, 0, .09, 1.25, .09, '#56655b');
        this.rb(1, .93, 0, 8.72, .055, .055, '#f4eddf');
        for (let i = 0; i < 15; i++)
            this.add('box', -3.05 + i * .58, .48, 0, .014, .84, .014, '#e3ded1', 0, .48, true);
        for (let j = 1; j < 4; j++)
            this.add('box', 1, .17 + j * .2, 0, 8.25, .014, .014, '#e3ded1', 0, .42, true);
        // Statement window: layered panes, trim, soft curtains and a rounded top hint.
        this.rb(-1.3, 2.42, -9.50, 5.1, 2.55, .06, '#a9d8d7', 0, .78, true, undefined, 'glass');
        this.add('sphere', -1.3, 3.38, -9.47, 5.0, 1.75, .09, '#c0e0dc', 0, .58, true, undefined, 'glass');
        for (const x of [-3.76, -1.3, 1.16])
            this.rb(x, 2.58, -9.43, .075, 2.75, .07, '#f4ecdc');
        this.rb(-1.3, 2.58, -9.42, 5.18, .075, .07, '#f4ecdc');
        this.rb(-4.16, 2.45, -9.28, .55, 2.65, .12, '#e7bca0', 0, .56, true);
        this.rb(1.56, 2.45, -9.28, .55, 2.65, .12, '#e7bca0', 0, .56, true);
        // Wall art, framed snapshots and a little club clock.
        const art = [[-9.8, 2.85, '#d8a37c'], [-8.45, 2.28, '#79937c'], [7.15, 2.78, '#c98572'], [8.55, 2.28, '#d9bd73']];
        for (const [x, y, c] of art) {
            this.rb(x, y, -9.40, .86, 1.04, .09, '#f6edde');
            this.rb(x, y, -9.33, .58, .75, .06, c);
        }
        this.add('torus', 5.7, 2.75, -9.32, .75, .75, .30, '#8b7761');
        this.add('sphere', 5.7, 2.75, -9.30, .58, .58, .09, '#f5eedf');
        this.rb(5.7, 2.93, -9.20, .03, .35, .03, '#59645c', -.35);
        this.rb(5.7, 2.75, -9.20, .28, .025, .03, '#59645c', .22);
        // Warm string lights, deliberately sparse.
        for (let i = 0; i < 10; i++) {
            const x = -10.7 + i * 2.25, y = 3.76 - Math.sin(i * .72) * .18;
            this.add('sphere', x, y, -9.12, .13, .13, .13, '#e9ca88', 0, 1, true);
            if (i < 9)
                this.rb(x + 1.12, y + .03, -9.12, 2.22, .018, .018, '#6a756c', 0, .42, true);
        }
        // Lounge rug and shadow anchors.
        this.rb(8.5, .065, 5.65, 4.65, .055, 3.05, '#ead7c2');
        for (let i = 0; i < 7; i++)
            this.rb(6.45 + i * .70, .09, 5.65, .10, .022, 2.72, i % 2 ? '#dfa990' : '#a8c5a4', 0, .30, true);
        this.shadow(-9, 4.8, 3.1, 1.15);
        this.shadow(-9.1, -5.8, 3.8, 1.2);
        this.shadow(8.5, 5.8, 3.6, 1.45);
        this.shadow(9.2, -4.5, 3.3, 1.35);
        this.shadow(-7.5, .2, 1.5, 1.0);
        this.shadow(10.2, 3.9, 1.45, 1.0);
        // Reception: softened desk, monitor, ledger, tiny bell and pin board.
        this.rb(-9.0, .55, 4.8, 3.4, 1.1, 1.12, palette.wood, 0, 1, false, undefined, 'wood');
        this.rb(-9.0, 1.13, 4.8, 3.55, .11, 1.25, '#c99c72', 0, 1, false, undefined, 'wood');
        this.rb(-9.70, 1.38, 4.55, .82, .50, .09, '#f7f0e2', -.08);
        this.rb(-8.25, 1.22, 4.55, .52, .08, .72, '#f0e5d3');
        this.add('sphere', -8.45, 1.30, 4.35, .12, .08, .12, '#d8ba6c', 0, 1, true);
        this.rb(-10.85, 2.36, -9.30, 1.85, 1.25, .10, '#8b9b84');
        for (let i = 0; i < 5; i++)
            this.add('sphere', -11.45 + (i % 3) * .52, 2.56 - Math.floor(i / 3) * .46, -9.18, .12, .12, .12, [palette.peach, palette.gold, palette.blue][i % 3], 0, 1, true);
        this.objects.push({ id: 'reception', label: 'Front desk', kind: 'reception', position: new Vec3(-9, 0, 4.8), radius: 2.2, description: 'Bookings, greetings, and the club’s calm command center.' });
        // Matcha bar: cups, stools, shelf, tea tins, hanging menu.
        this.rb(-9.1, .55, -5.8, 4.35, 1.1, 1.28, palette.woodDark, 0, 1, false, undefined, 'wood');
        this.rb(-9.1, 1.14, -5.8, 4.45, .11, 1.38, '#d0a47b', 0, 1, false, undefined, 'wood');
        this.rb(-9.82, 1.48, -5.64, .88, .56, .68, '#78a28a');
        for (const x of [-8.62, -8.08, -7.54]) {
            this.add('cylinder', x, 1.33, -5.57, .16, .28, .16, '#fff5e7', 0, 1, false, undefined, 'ceramic');
            this.add('torus', x + .12, 1.34, -5.57, .16, .16, .12, '#fff5e7', 0, 1, false, undefined, 'ceramic');
        }
        for (const x of [-10.15, -9.15, -8.15]) {
            this.add('cylinder', x, .45, -4.70, .62, .12, .62, '#ac7d59');
            this.add('cylinder', x, .23, -4.70, .14, .47, .14, '#705744');
        }
        this.shelf(-9.2, 2.15, -9.20, 4.1);
        for (let i = 0; i < 5; i++) {
            this.add('cylinder', -10.55 + i * .65, 2.47, -9.02, .34, .44, .34, [palette.sage, palette.gold, palette.peach, '#91a8a0', '#c68a6e'][i]);
        }
        this.rb(-6.62, 2.58, -9.33, 2.65, 1.15, .08, '#f2e6d4');
        this.rb(-6.62, 2.58, -9.26, 2.30, .82, .06, '#7e957f');
        this.objects.push({ id: 'cafe', label: 'Matcha nook', kind: 'cafe', position: new Vec3(-9.1, 0, -5.8), radius: 2.5, description: 'Warm cups, little rituals, and half the club’s best conversations.' });
        // Training nook: a rounder ball machine, cones and floor ladder.
        this.add('sphere', -7.5, .72, .2, 1.02, .92, .92, '#6f9477');
        this.add('sphere', -7.45, .84, -.02, .62, .48, .48, '#96b19b');
        this.add('cylinder', -7.8, .25, .50, .16, .5, .16, '#56685a');
        this.add('cylinder', -7.2, .25, .50, .16, .5, .16, '#56685a');
        this.add('sphere', -7.1, .82, -.12, .11, .11, .11, '#e7c568', 0, 1, true);
        for (let i = 0; i < 4; i++)
            this.add('cone', -6.9 + i * .55, .18, 1.45, .28, .36, .28, i % 2 ? palette.peach : palette.gold);
        for (let i = 0; i < 5; i++) {
            this.rb(-10.6 + i * .62, .07, .8, .05, .02, 1.1, '#d3bd91', 0, .65, true);
        }
        this.objects.push({ id: 'machine', label: 'Ball machine', kind: 'training', position: new Vec3(-7.5, 0, .2), radius: 1.3, description: 'A quiet rhythm machine for finding timing without pressure.' });
        // Water station and towel rail.
        this.rb(-5.5, .60, 5.9, 1.22, 1.2, .76, '#eee7d9');
        this.add('cylinder', -5.5, 1.35, 5.9, .28, .42, .28, palette.blue);
        this.add('torus', -5.5, 1.43, 5.68, .23, .23, .10, '#eef1e7');
        this.rb(-4.82, .96, 6.0, .08, 1.25, .06, '#638270');
        for (let i = 0; i < 3; i++)
            this.rb(-4.52, .75 + i * .24, 6.0, .52, .13, .12, [palette.paper, palette.peach, palette.sageLight][i]);
        this.objects.push({ id: 'water', label: 'Water station', kind: 'water', position: new Vec3(-5.5, 0, 5.9), radius: 1.0, description: 'Cold water, clean towels, no hydration mini-game required.' });
        // Lounge: rounded sectional, cushions, low table, bookcase and magazine stack.
        this.rb(8.5, .48, 5.8, 3.75, .78, 1.48, '#8fb292', 0, 1, false, undefined, 'fabric');
        this.rb(8.5, .96, 6.35, 3.75, .88, .38, '#7fa285', 0, 1, false, undefined, 'fabric');
        this.rb(7.7, .92, 5.58, .82, .45, .28, palette.peach, .10, 1, false, undefined, 'fabric');
        this.rb(9.0, .92, 5.58, .82, .45, .28, palette.gold, -.08, 1, false, undefined, 'fabric');
        this.add('cylinder', 6.9, .38, 4.55, 1.38, .28, 1.38, '#aa7c5c', 0, 1, false, undefined, 'wood');
        this.add('cylinder', 6.9, .62, 4.55, .12, .5, .12, '#6f5948', 0, 1, false, undefined, 'wood');
        this.book(6.72, .59, 4.56, '#7b9990', .16);
        this.book(6.95, .62, 4.52, '#d39a78', -.08);
        this.rb(10.8, .96, 6.7, 1.85, 1.92, .58, '#9b7559', 0, 1, false, undefined, 'wood');
        for (let y = .46; y < 1.56; y += .52)
            this.shelf(10.8, y, 6.36, 1.58, '#c99a75');
        for (let i = 0; i < 8; i++)
            this.book(10.28 + (i % 4) * .34, .72 + Math.floor(i / 4) * .54, 6.06, [palette.peach, palette.sage, palette.blue, palette.gold][i % 4], (i % 2) * .04 - .02);
        this.objects.push({ id: 'lounge', label: 'Player lounge', kind: 'lounge', position: new Vec3(8.5, 0, 5.8), radius: 2.7, description: 'A soft place to watch, talk, recover, or simply let the club happen around you.' });
        // Signature bonsai corner: a windswept miniature tree on a low crafted cabinet.
        this.rb(10.2, .55, 3.9, 1.72, 1.1, 1.24, palette.woodDark, 0, 1, false, undefined, 'wood');
        this.addBonsai(10.2, 3.9, 1.05, 'windswept', 1.08, '#8f6657');
        this.add('cylinder', 11.35, .36, 4.35, .75, .20, .75, '#ac7f5f', 0, 1, false, undefined, 'wood');
        this.objects.push({ id: 'bonsai', label: 'Bonsai corner', kind: 'bonsai', position: new Vec3(10.2, 0, 3.9), radius: 1.6, description: 'The quietest coach in the academy. Somehow Leo takes it seriously.' });
        // Pro shop + stringing: rounded shelving, real torus racket heads and equipment boxes.
        this.rb(9.2, 1.10, -7.6, 4.45, 2.05, .46, '#caa17d', 0, 1, false, undefined, 'wood');
        this.shelf(9.2, 2.18, -7.33, 4.03, '#8a654d');
        this.shelf(9.2, 1.16, -7.33, 4.03, '#8a654d');
        for (let i = 0; i < 5; i++) {
            const x = 7.7 + i * .72;
            this.add('cylinder', x, 1.82, -7.02, .07, .62, .07, i % 2 ? palette.gold : palette.sage);
            this.add('torus', x, 2.43, -7.02, .68, .82, .34, i % 2 ? palette.gold : palette.sage, 0, 1, false, undefined, 'metal');
        }
        this.rb(9.2, .78, -3.4, 2.25, 1.52, 1.28, '#9d765b', 0, 1, false, undefined, 'wood');
        this.add('sphere', 9.2, 1.66, -3.4, .82, .12, .82, '#667a6c');
        this.add('torus', 9.2, 1.72, -3.25, .92, .92, .22, '#ddd5c4', 0, 1, false, undefined, 'metal');
        for (let i = 0; i < 3; i++) {
            this.rb(7.4 + i * .72, .34, -5.8, .54, .26, .90, [palette.peach, '#879e88', palette.gold][i]);
            this.add('sphere', 7.4 + i * .72, .57, -5.8, .36, .18, .48, '#eee7d9');
        }
        for (let i = 0; i < 4; i++) {
            this.rb(11.3, 1.0, -7.7 + i * 1.15, .92, 2.0, .97, '#a9b4a1');
            this.add('sphere', 10.82, 1.0, -7.7 + i * 1.15, .08, .08, .08, '#6a756b', 0, 1, true);
        }
        this.objects.push({ id: 'proshop', label: 'Pro shop & stringing', kind: 'equipment', position: new Vec3(9.2, 0, -4.5), radius: 2.6, description: 'Frames, grips, fresh strings, and a satisfyingly mechanical stringing bench.' });
        // Court benches, baskets, towel and score flip cards.
        this.rb(6.5, .40, 4.8, 2.22, .30, .68, palette.wood, 0, 1, false, undefined, 'wood');
        this.rb(6.5, .76, 5.08, 2.22, .67, .20, palette.woodDark, 0, 1, false, undefined, 'wood');
        this.add('cylinder', 5.9, .36, 3.8, .70, .58, .70, '#85725d');
        for (let i = 0; i < 8; i++)
            this.add('sphere', 5.68 + (i % 3) * .22, .72 + Math.floor(i / 3) * .16, 3.8, .17, .17, .17, '#d6c35f', 0, 1, true);
        this.rb(6.72, 1.05, 5.02, .72, .50, .09, '#f0e8d8');
        this.rb(6.42, 1.05, 4.94, .21, .27, .04, '#6f8d74');
        this.rb(6.75, 1.05, 4.94, .21, .27, .04, '#d49a78');
        this.objects.push({ id: 'court', label: 'Main court', kind: 'court', position: new Vec3(1, 0, 0), radius: 6.8, description: 'The heart of Rally House: one court, long rallies, and enough room to notice the details.' });
        // Plants, lamps and little crafted clutter.
        this.addPlant(-11.1, -7.2, 1.1);
        this.addPlant(11.2, -1.5, .9);
        this.addPlant(7.0, 7.3, 1.0);
        this.addPlant(-5.75, -7.5, .72);
        this.addLamp(-6.4, -7.0);
        this.addLamp(10.7, 7.1);
        // Rally House's bonsai motif repeats at different scales instead of becoming generic houseplant spam.
        this.addBonsai(-8.22, 4.48, .34, 'pine', 1.18, '#d7b4a0'); // reception desk
        this.addBonsai(-10.58, -8.91, .31, 'cascade', 2.22, '#8ca5a0'); // matcha shelf
        this.addBonsai(7.06, 4.58, .30, 'maple', .70, '#d5a08a'); // lounge table
        this.addBonsai(10.62, -7.04, .27, 'flower', 2.23, '#c8b08d'); // pro-shop shelf
        // Cozy floor islands and small storytelling clusters reduce the unused perimeter floor without touching playable court space.
        this.rb(-9.05, .066, 2.70, 3.45, .045, 1.65, '#d9c6ad', -.02, .92, false, undefined, 'fabric');
        for (let i = 0; i < 5; i++)
            this.rb(-10.48 + i * .72, .087, 2.70, .32, .016, 1.43, i % 2 ? '#c89279' : '#829a87', 0, .20, true);
        this.rb(-8.82, .065, -3.35, 3.60, .045, 1.42, '#c7b49d', .015, .78, false, undefined, 'fabric');
        this.rb(9.35, .066, -1.05, 3.10, .045, 1.25, '#d9c9b4', -.01, .75, false, undefined, 'fabric');
        // Reception shoe-and-bag cubbies, a tiny domestic detail borrowed from real clubs.
        this.rb(-11.08, .48, 6.52, 1.32, .96, .72, '#b88966', 0, 1, false, undefined, 'wood');
        for (let y = .28; y < .78; y += .25)
            this.rb(-11.08, y, 6.12, 1.10, .055, .50, '#80604a', 0, 1, false, undefined, 'wood');
        for (let i = 0; i < 3; i++) {
            this.rb(-11.42 + i * .34, .30, 6.12, .26, .14, .42, [palette.blue, palette.peach, palette.sage][i], .08 * (i - 1), 1, false, undefined, 'fabric');
        }
        // A court-side rack-and-towel vignette gives the clean court a human edge without intruding into play.
        this.rb(6.54, .24, 2.85, 1.62, .12, .48, '#a97b5b', 0, 1, false, undefined, 'wood');
        for (let i = 0; i < 3; i++) {
            const x = 6.05 + i * .48;
            this.add('cylinder', x, .68, 2.83, .055, .78, .055, '#6c5647', 0, 1, false, undefined, 'wood');
            this.add('torus', x, .99, 2.83, .54, .66, .25, [palette.sage, palette.gold, palette.peach][i], 0, 1, false, undefined, 'metal');
        }
        this.rb(7.35, .34, 3.02, .55, .16, .62, palette.paper, .08, 1, false, undefined, 'fabric');
        // Club board with sticky-note rhythm.
        this.rb(2.8, 2.58, -9.42, 4.15, 1.18, .10, palette.sageDark);
        this.rb(2.8, 2.58, -9.34, 3.78, .87, .055, '#6f8a73');
        for (let i = 0; i < 5; i++)
            this.rb(1.45 + (i % 3) * 1.02, 2.76 - Math.floor(i / 3) * .44, -9.23, .63, .27, .025, [palette.paper, palette.gold, palette.peach][i % 3], (i - 2) * .025, 1, true);
        this.objects.push({ id: 'clubBoard', label: 'Club board', kind: 'board', position: new Vec3(2.8, 0, -7.8), radius: 1.6, description: 'Bookings, tiny victories, and one useful cue from each lesson.' });
        this.buildFloorProgram();
    }
    buildFloorProgram() {
        const t = palette.terracotta, pe = palette.peach, bl = palette.blue, pk = palette.pink, mi = palette.mint, gd = palette.gold;
        for (const px of [-1.3, 3.7]) {
            const noCast = () => { this.meshes[this.meshes.length - 1].noShadow = true; };
            for (const rz of [-1.15, 1.15]) {
                this.add('cylinder', px, 4.33, rz, .04, .66, .04, '#8d968c', 0, 1, false, undefined, 'metal');
                noCast();
            }
            this.rb(px, 4.03, 0, 3.5, .20, .62, '#b9ad96', 0, 1, false, undefined, 'metal');
            noCast();
            this.rb(px, 3.93, 0, 3.34, .07, .50, '#8f8570', 0, 1, false, undefined, 'metal');
            noCast();
            this.rb(px, 3.86, 0, 3.16, .11, .34, '#f0c98a', 0, 1, true, undefined, 'glass');
            this.rb(px, 3.83, 0, 3.24, .05, .42, '#e8b877', 0, .45, true, undefined, 'glass');
        }
        this.add('box', -9.3, .055, 1.6, 3.5, .06, 4.3, '#8fb0b3', 0, 1, false, undefined, 'fabric');
        this.add('box', -9.3, .075, 1.6, 3.1, .05, 3.9, '#9dbcbd', 0, 1, false, undefined, 'fabric');
        for (let i = 0; i < 3; i++)
            this.add('cylinder', -10.55, .19 + i * .001, .15 + i * .62, .34, 1.5, .34, [t, pe, pk][i], Math.PI / 2, 1, false, undefined, 'fabric');
        this.rb(-8.05, .30, 1.6, .62, .52, 2.5, palette.wood, 0, 1, false, undefined, 'wood');
        for (let i = 0; i < 3; i++)
            this.rb(-8.05, .62, .75 + i * .85, .56, .14, .52, [palette.paper, mi, pe][i], 0, 1, false, undefined, 'fabric');
        this.add('cylinder', -9.9, .33, 3.35, .46, .62, .46, '#7d8a7e', 0, 1, false, undefined, 'ceramic');
        this.rb(-11.82, 1.75, 1.6, .10, 2.3, 3.2, '#cfdcdb', 0, .92, false, undefined, 'glass');
        this.rb(-11.74, 1.75, 1.6, .06, 2.0, 2.9, '#e6eeec', 0, .55, true, undefined, 'glass');
        this.objects.push({ id: 'warmup', label: 'Warm-up bay', kind: 'training', position: new Vec3(-9.3, 0, 1.6), radius: 2.3, description: 'Mats, a mirror, and the five quiet minutes that decide how the next hour goes.' });
        this.add('cylinder', -11.2, .55, -2.2, .62, 1.1, .62, '#b8c6c2', 0, 1, false, undefined, 'ceramic');
        this.add('cylinder', -11.2, 1.30, -2.2, .54, .52, .54, '#8fa8b0', 0, .85, false, undefined, 'glass');
        this.rb(-11.2, .12, -2.2, .95, .22, .95, '#6f7c75', 0, 1, false, undefined, 'metal');
        this.rb(-11.5, .78, -.95, .62, 1.55, .72, palette.woodDark, 0, 1, false, undefined, 'wood');
        for (let i = 0; i < 3; i++)
            this.rb(-11.5, .38 + i * .42, -.95, .54, .20, .62, [palette.paper, '#eae2d2', palette.paper][i], 0, 1, false, undefined, 'fabric');
        for (let i = 0; i < 5; i++)
            this.add('cylinder', -10.72, .95, -2.75 + i * .055, .13, .16, .13, '#f3ece0', 0, 1, false, undefined, 'fabric');
        this.rb(-10.75, .30, -3.5, .55, .60, .55, '#7f8c84', 0, 1, false, undefined, 'metal');
        this.objects.push({ id: 'westWater', label: 'Water & towels', kind: 'water', position: new Vec3(-10.2, 0, -2.2), radius: 1.5, description: 'Cold water, folded towels, and a bin that somebody quietly empties every evening.' });
        this.add('box', -9.6, .055, 7.2, 3.6, .06, 3.3, '#c9907a', 0, 1, false, undefined, 'fabric');
        this.add('box', -9.6, .075, 7.2, 3.15, .05, 2.9, '#d69c85', 0, 1, false, undefined, 'fabric');
        for (const [cz, col] of [[6.35, t], [8.05, pe]]) {
            this.rb(-10.35, .42, cz, 1.15, .60, 1.15, col, 0, 1, false, undefined, 'fabric');
            this.rb(-10.88, .80, cz, .20, .86, 1.15, col, 0, 1, false, undefined, 'fabric');
            this.rb(-10.35, .70, cz, .98, .20, .98, '#f0e3d2', 0, 1, false, undefined, 'fabric');
        }
        this.add('cylinder', -9.0, .33, 7.2, .72, .62, .72, palette.woodDark, 0, 1, false, undefined, 'wood');
        this.add('cylinder', -9.0, .70, 7.2, .80, .12, .80, palette.wood, 0, 1, false, undefined, 'wood');
        this.add('cylinder', -9.05, .83, 7.15, .22, .22, .22, mi, 0, 1, false, undefined, 'ceramic');
        this.add('cylinder', -8.35, 1.05, 8.45, .09, 2.1, .09, '#5e6b61', 0, 1, false, undefined, 'metal');
        this.add('cone', -8.35, 2.20, 8.45, .86, .66, .86, pe, 0, 1, true, undefined, 'fabric');
        this.add('cylinder', -11.15, .55, 8.6, .42, 1.1, .42, '#8d9a90', 0, 1, false, undefined, 'ceramic');
        for (let i = 0; i < 3; i++)
            this.add('cylinder', -11.15, 1.15, 8.6, .10, 1.3, .10, [bl, t, gd][i], 0, 1, false, undefined, 'wood');
        this.objects.push({ id: 'lobby', label: 'Entrance lounge', kind: 'lounge', position: new Vec3(-9.6, 0, 7.2), radius: 2.4, description: 'Where people land before they become players, and linger after they stop being one.' });
        this.rb(11.35, .95, .3, .72, 1.90, 3.3, palette.woodDark, 0, 1, false, undefined, 'wood');
        for (let i = 0; i < 4; i++)
            this.rb(11.30, .40 + i * .48, .3, .62, .09, 3.1, palette.wood, 0, 1, false, undefined, 'wood');
        for (let i = 0; i < 8; i++)
            this.rb(11.24, .53 + Math.floor(i / 2) * .48, -.85 + (i % 2) * 1.35, .52, .22, .62, [palette.paper, mi, pe, '#d9d2c2'][i % 4], 0, 1, false, undefined, 'fabric');
        for (let i = 0; i < 3; i++)
            this.rb(10.42, .72, -1.05 + i * 1.15, .52, .80, .86, [bl, t, gd][i], 0, 1, false, undefined, 'fabric');
        this.rb(10.42, 1.18, -1.05, .10, .30, .70, '#5e6b61', 0, 1, false, undefined, 'metal');
        this.add('cylinder', 10.15, .30, 2.05, .62, .60, .62, '#8d7b64', 0, 1, false, undefined, 'ceramic');
        this.rb(11.80, 1.70, 2.6, .08, 2.2, 1.5, '#d8e0dd', 0, .92, false, undefined, 'glass');
        this.objects.push({ id: 'gearWall', label: 'Gear wall', kind: 'equipment', position: new Vec3(10.1, 0, .3), radius: 2.2, description: 'Shoes, bags, and the shelf Leo pretends he is not looking at again.' });
        // E. Spectator row. Three distinct seating objects instead of cloned benches.
        this.rb(-3.9, .40, 8.22, 3.35, .30, .78, palette.wood, 0, 1, false, undefined, 'wood');
        this.rb(-3.9, .78, 8.56, 3.35, .68, .20, palette.woodDark, 0, 1, false, undefined, 'wood');
        this.rb(-3.9, .60, 8.22, 3.00, .14, .62, pe, 0, 1, false, undefined, 'fabric');
        for (const ex of [-5.42, -2.38])
            this.rb(ex, .20, 8.22, .16, .42, .72, palette.woodDark, 0, 1, false, undefined, 'wood');
        this.add('cylinder', 1.32, .34, 7.55, .20, .64, .20, '#6d7a70', 0, 1, false, undefined, 'metal');
        this.add('cylinder', 1.32, .68, 7.55, .86, .09, .86, palette.wood, 0, 1, false, undefined, 'wood');
        this.add('cylinder', 1.20, .80, 7.50, .21, .20, .21, pk, 0, 1, false, undefined, 'ceramic');
        this.rb(1.48, .76, 7.62, .34, .06, .26, palette.paper, .3, 1, false, undefined, 'matte');
        this.rb(4.55, .34, 8.00, 2.35, .58, .86, palette.wood, 0, 1, false, undefined, 'wood');
        this.rb(4.55, .76, 8.00, 2.10, .12, .62, mi, 0, 1, false, undefined, 'fabric');
        this.rb(4.05, .98, 8.00, .16, .64, .72, palette.woodDark, 0, 1, false, undefined, 'wood');
        for (const hx of [-4.8, 5.6]) {
            this.add('cylinder', hx, .34, 7.9, .72, .62, .72, '#8a765f', 0, 1, false, undefined, 'wood');
            for (let i = 0; i < 6; i++)
                this.add('sphere', hx + ((i % 2) - .5) * .28, .72 + Math.floor(i / 2) * .13, 7.9, .18, .18, .18, '#d9c661', 0, 1, true);
        }
        this.rb(6.9, .95, 8.5, .10, 1.85, .10, '#59645c', 0, 1, false, undefined, 'metal');
        this.rb(7.55, .95, 8.5, .10, 1.85, .10, '#59645c', 0, 1, false, undefined, 'metal');
        this.rb(7.22, 1.62, 8.5, .95, .70, .09, palette.paper, 0, 1, false, undefined, 'matte');
        this.rb(7.22, 1.62, 8.44, .78, .52, .05, palette.sageDark, 0, 1, false, undefined, 'matte');
        this.addPlant(-6.3, 8.5, .92);
        this.addPlant(9.0, 8.4, .86);
        this.objects.push({ id: 'spectatorRow', label: 'Spectator row', kind: 'court', position: new Vec3(1, 0, 7.6), radius: 3.4, description: 'A long backed bench, a low side perch, two ball hoppers, and the best seat in the club for a long rally.' });
        this.rb(-1.4, .52, -8.3, 2.3, .92, .78, palette.wood, 0, 1, false, undefined, 'wood');
        this.rb(-1.4, 1.02, -8.3, 2.4, .10, .88, palette.woodDark, 0, 1, false, undefined, 'wood');
        for (let i = 0; i < 5; i++) {
            this.rb(-2.2 + i * .40, 1.32, -8.3, .11, .52, .30, [bl, pe, t, mi, gd][i], (i - 2) * .07, 1, false, undefined, 'metal');
            this.add('torus', -2.2 + i * .40, 1.72, -8.3, .44, .44, .20, '#e6dccb', (i - 2) * .07, 1, false, undefined, 'metal');
        }
        for (const wx of [-2.25, -.55])
            this.add('cylinder', wx, .09, -8.6, .20, .18, .20, '#4e5a52', Math.PI / 2, 1, false, undefined, 'metal');
        for (let i = 0; i < 4; i++)
            this.add('cone', .35 + i * .34, .16, -8.45, .30, .32, .30, [pe, gd, t, pe][i], 0, 1, false, undefined, 'fabric');
        this.objects.push({ id: 'equipment', label: 'Equipment trolley', kind: 'training', position: new Vec3(-1.4, 0, -7.5), radius: 1.9, description: 'Spare frames, a cone stack, and whatever the last session forgot to put back.' });
    }
    addBonsai(x, z, s = 1, style = 'pine', baseY = 0, potColor = '#aa7863') {
        const M = (kind, px, py, pz, sx, sy, sz, color, rot = new Vec3(), material = 'matte', alpha = 1) => this.meshes.push({ kind, position: new Vec3(px, py, pz), rotation: rot, scale: new Vec3(sx, sy, sz), color, material, alpha });
        const potY = baseY + .13 * s;
        M('roundBox', x, potY, z, .64 * s, .26 * s, .50 * s, potColor, new Vec3(), 'ceramic');
        M('roundBox', x, baseY + .025 * s, z, .78 * s, .07 * s, .62 * s, mixColor(potColor, '#5f554d', .16), new Vec3(), 'ceramic');
        M('roundBox', x, baseY + .26 * s, z, .56 * s, .05 * s, .42 * s, '#57483d', new Vec3(), 'matte');
        const bark = '#664d3a', dark = '#526f58', mid = '#69876b', light = '#809a78', maple = '#8a9a65';
        const branch = (dx, dy, dz, len, tilt, rotY, r = .095) => { const by = baseY + .28 * s + dy * s; M('cylinder', x + dx * s, by, z + dz * s, r * s, len * s, r * s, bark, new Vec3(0, rotY, tilt), 'wood'); };
        const cloud = (dx, dy, dz, rx, ry, rz, c = mid) => M('sphere', x + dx * s, baseY + dy * s, z + dz * s, rx * s, ry * s, rz * s, c, new Vec3(), 'leaf');
        branch(0, .32, 0, .84, .06, 0, .105);
        if (style === 'windswept') {
            branch(.12, .74, 0, .72, -.78, -.12, .082);
            branch(.42, .98, .02, .60, -1.05, .18, .068);
            branch(-.04, 1.05, .02, .47, .56, -.15, .060);
            cloud(.53, 1.18, .02, .52, .22, .40, dark);
            cloud(.88, 1.34, .03, .48, .20, .34, mid);
            cloud(.22, 1.49, -.01, .43, .20, .35, light);
            cloud(.66, 1.59, -.02, .37, .18, .31, dark);
        }
        else if (style === 'cascade') {
            branch(.06, .76, .02, .58, -.86, .05, .072);
            branch(.30, .98, .02, .72, -1.58, .10, .060);
            cloud(.24, 1.10, 0, .38, .18, .30, dark);
            cloud(.47, .86, .02, .34, .17, .28, mid);
            cloud(.54, .60, .03, .28, .15, .24, light);
            cloud(-.12, 1.36, 0, .32, .18, .27, mid);
        }
        else if (style === 'maple') {
            branch(-.03, .78, 0, .52, .52, -.55, .065);
            branch(.05, .82, 0, .55, -.55, .55, .065);
            cloud(-.34, 1.22, 0, .43, .24, .36, maple);
            cloud(.34, 1.23, .02, .44, .24, .36, light);
            cloud(0, 1.47, 0, .46, .24, .38, mid);
            cloud(.02, 1.29, .20, .35, .18, .30, '#7d9469');
        }
        else {
            branch(-.02, .78, 0, .44, .50, -.28, .060);
            branch(.03, .90, 0, .48, -.52, .31, .060);
            cloud(0, 1.12, 0, .47, .19, .36, dark);
            cloud(-.18, 1.36, .01, .42, .18, .34, mid);
            cloud(.20, 1.54, -.01, .36, .17, .30, light);
            if (style === 'flower') {
                for (const [dx, dy, dz] of [[-.12, 1.47, .20], [.26, 1.55, .08], [.04, 1.30, -.19], [-.28, 1.28, -.05]])
                    M('sphere', x + dx * s, baseY + dy * s, z + dz * s, .065 * s, .052 * s, .065 * s, '#dba1a0', new Vec3(), 'leaf');
            }
        }
    }
    addPlant(x, z, s = 1) { this.add('cone', x, .38 * s, z, .66 * s, .76 * s, .66 * s, palette.terracotta, 0, 1, false, undefined, 'ceramic'); this.add('cylinder', x, .94 * s, z, .12 * s, 1.0 * s, .12 * s, '#5d725e', 0, 1, false, undefined, 'wood'); for (const [dx, dy, dz, c] of [[-.28, .0, 0, '#6d896f'], [.28, .08, 0, '#78aa82'], [0, .16, .18, '#7b987b'], [0, .08, -.2, '#668268']])
        this.add('sphere', x + dx * s, 1.28 * s + dy * s, z + dz * s, .56 * s, .28 * s, .31 * s, c, 0, 1, false, undefined, 'leaf'); }
    addLamp(x, z) { this.add('cylinder', x, 1.1, z, .07, 2.2, .07, '#56665b', 0, 1, false, undefined, 'metal'); this.add('cone', x, 2.18, z, .80, .68, .80, palette.peach, 0, 1, true, undefined, 'fabric'); this.add('sphere', x, 1.9, z, .22, .22, .22, '#f3d99b', 0, 1, true); }
    lighting(minutes) {
        const h = minutes / 60;
        const daylight = smoothstep(5.45, 7.9, h) * (1 - smoothstep(18.15, 20.65, h));
        const golden = Math.exp(-Math.pow((h - 17.15) / 1.65, 2));
        const over = this.weather === 'cloudy', rain = this.weather === 'rain';
        const ambient = rain ? (.19 + .53 * daylight) : over ? (.17 + .60 * daylight) : (.145 + .675 * daylight);
        const t = clamp01((h - 6) / 13);
        const az = -1.0 + t * 1.6;
        const elevation = .34 + Math.sin(Math.PI * t) * .80;
        const sunDir = new Vec3(-Math.sin(az) * Math.cos(elevation), -Math.sin(elevation), -Math.cos(az) * Math.cos(elevation));
        const dayBg = rain ? [.70, .75, .74] : over ? [.83, .84, .80] : [.89 + .04 * daylight, .87 + .06 * daylight, .82 + .09 * daylight];
        const nightBg = [.121, .137, .168];
        const mixBg = (a, b) => a + (b - a) * daylight;
        const bg = [mixBg(nightBg[0], dayBg[0]), mixBg(nightBg[1], dayBg[1]), mixBg(nightBg[2], dayBg[2]), 1];
        const lamps = clamp01((1 - daylight) * 1.45 + (rain ? .24 : 0)), courtLamps = Math.max(lamps, .22);
        const warm = (r, g, b) => [r, g, b];
        const pointLights = [
            { position: new Vec3(-1.3, 3.85, 0), color: warm(1, .88, .68), intensity: 2.15 * courtLamps, radius: 10.5 },
            { position: new Vec3(3.7, 3.85, 0), color: warm(1, .88, .68), intensity: 2.15 * courtLamps, radius: 10.5 },
            { position: new Vec3(-8.8, 2.45, -5.4), color: warm(1, .79, .50), intensity: 1.55 * lamps, radius: 6.6 },
            { position: new Vec3(8.5, 2.5, 5.8), color: warm(1, .78, .51), intensity: 1.48 * lamps, radius: 6.4 },
            { position: new Vec3(-8.8, 2.5, 4.8), color: warm(1, .81, .57), intensity: 1.36 * lamps, radius: 6.2 },
            { position: new Vec3(9.2, 2.45, -4.6), color: warm(1, .74, .47), intensity: 1.40 * lamps, radius: 6.2 },
            { position: new Vec3(-9.4, 2.40, 1.6), color: warm(1, .80, .55), intensity: 1.12 * lamps, radius: 5.8 },
            { position: new Vec3(-9.5, 2.40, 7.2), color: warm(1, .82, .59), intensity: 1.20 * lamps, radius: 5.8 }
        ];
        const shadowStrength = (rain ? .22 : over ? .44 : .62 + .38 * daylight) * (.25 + .75 * daylight);
        const warmMix = Math.min(1, golden * .95);
        const sunColor = [1.0 + .06 * warmMix, .965 - .085 * warmMix - (rain ? .02 : 0), .905 - .225 * warmMix + (rain ? .03 : 0)];
        const lerp3 = (a, b) => [a[0] + (b[0] - a[0]) * daylight, a[1] + (b[1] - a[1]) * daylight, a[2] + (b[2] - a[2]) * daylight];
        const skyDay = rain ? [.83, .87, .93] : [.86 + .02 * daylight, .905, .99];
        const skyColor = lerp3([.50, .60, .90], skyDay);
        const bounceColor = lerp3([.40, .45, .62], [.86, .805, .725]);
        const castingLight = { centre: new Vec3(1.2, .75, 0), radius: 8.2, direction: new Vec3(.16, -1, .18).normalize(), position: pointLights[0].position.clone(), strength: Math.max(0, pointLights[0].intensity * .32) };
        return { sunDir, ambient, background: bg, warmth: warmMix, pointLights, shadowStrength, sunColor, skyColor, bounceColor, castingLight };
    }
    dynamicMeshes(time, minutes, cameraPosition, dt = 1 / 60) {
        const m = [];
        // Camera-aware dollhouse cutaway. The far side wall stays tall; the near wall sinks smoothly to a low architectural lip.
        const camX = cameraPosition?.x ?? 20, targetWest = camX >= 0 ? 4.55 : .48, targetEast = camX >= 0 ? .48 : 4.55, k = 1 - Math.exp(-dt * 7.5);
        this.wallHeights.west += (targetWest - this.wallHeights.west) * k;
        this.wallHeights.east += (targetEast - this.wallHeights.east) * k;
        for (const [x, h, c] of [[-12.85, this.wallHeights.west, '#f2eadc'], [12.85, this.wallHeights.east, '#f5ecdd']]) {
            m.push({ kind: 'roundBox', position: new Vec3(x, h / 2, 0), scale: new Vec3(.34, h, 19.7), color: c, alpha: h < 1 ? .82 : 1 });
            m.push({ kind: 'roundBox', position: new Vec3(x > 0 ? 12.55 : -12.55, .22, 0), scale: new Vec3(.20, .24, 19), color: '#b8aa92', alpha: .88 });
        }
        m.push({ kind: 'roundBox', position: new Vec3(0, .24, 9.77), scale: new Vec3(26, .48, .30), color: '#f3e7d6', alpha: .82 });
        if (this.weather === 'rain') {
            for (let i = 0; i < this.rainSeed.length; i++) {
                const r = this.rainSeed[i], y = ((r.y - time * 5.3) % 6 + 6) % 6 + .3;
                m.push({ kind: 'roundBox', position: new Vec3(r.x, y, r.z), rotation: new Vec3(.18, 0, 0), scale: new Vec3(.022, .46, .022), color: '#a6c0c0', alpha: .34, unlit: true });
            }
        }
        if (this.weather === 'cloudy') {
            for (let i = 0; i < 4; i++) {
                const x = -8 + ((time * .42 + i * 6.1) % 22), z = -5 + i * 3.1;
                m.push({ kind: 'sphere', position: new Vec3(x, .042, z), scale: new Vec3(4.8, .018, 2.2), color: '#718077', alpha: .035, unlit: true });
            }
        }
        // Dust motes in the window beam. They are tiny, slow, and disappear in rain.
        if (this.weather !== 'rain') {
            const h = minutes / 60, beam = smoothstep(7.4, 9.2, h) * (1 - smoothstep(16.8, 18.3, h));
            for (let i = 0; i < 16; i++) {
                const phase = time * .10 + i * .71, x = -4.0 + ((i * 1.37) % 5.0) + Math.sin(phase) * .09, y = .65 + ((phase + i * .33) % 1) * 2.55, z = -7.85 + ((i * 2.11) % 4.8);
                m.push({ kind: 'sphere', position: new Vec3(x, y, z), scale: new Vec3(.025, .025, .025), color: '#fff3cf', alpha: .11 * beam, unlit: true });
            }
        }
        // Steam curls above the matcha cups.
        for (let i = 0; i < 7; i++) {
            const phase = time * .55 + i * .9, y = 1.58 + ((phase * .33) % 1) * .62, x = -8.62 + (i % 3) * .54 + Math.sin(phase) * .06, z = -5.57 + Math.cos(phase * .7) * .05;
            m.push({ kind: 'sphere', position: new Vec3(x, y, z), scale: new Vec3(.12, .18, .09), color: '#f5efe6', alpha: .18 * (1 - ((phase * .33) % 1)), unlit: true });
        }
        // Ceiling fan / kinetic detail near the lounge.
        const a = time * .65;
        for (let i = 0; i < 3; i++) {
            const aa = a + i * Math.PI * 2 / 3;
            m.push({ kind: 'roundBox', position: new Vec3(8.4 + Math.cos(aa) * .72, 3.65, 1.95 + Math.sin(aa) * .72), rotation: new Vec3(0, -aa, 0), scale: new Vec3(1.25, .045, .18), color: '#8d9d8c', alpha: .80 });
        }
        m.push({ kind: 'cylinder', position: new Vec3(8.4, 3.55, 1.95), scale: new Vec3(.18, .35, .18), color: '#68766c' });
        // Tiny leaf sway on one foreground plant.
        for (let i = 0; i < 3; i++) {
            const ph = time * .7 + i * 1.9;
            m.push({ kind: 'sphere', position: new Vec3(7.0 + Math.sin(ph) * .07, 1.33 + i * .12, 7.3 + Math.cos(ph * .8) * .05), scale: new Vec3(.48, .20, .28), color: i % 2 ? '#78aa82' : '#689a73', alpha: .74 });
        }
        // Signature bonsai micro-motion: only a few leaf pads move, keeping the tree sculptural rather than wobbly.
        for (let i = 0; i < 5; i++) {
            const ph = time * .46 + i * 1.37, dx = Math.sin(ph) * .026, dz = Math.cos(ph * .83) * .018;
            m.push({ kind: 'sphere', position: new Vec3(10.43 + i * .11 + dx, 2.34 + (i % 3) * .12, 3.90 + dz), scale: new Vec3(.23, .075, .18), color: i % 2 ? '#67986e' : '#7baa79', material: 'leaf', alpha: .20 });
        }
        // Evening pools of light and string-light halos.
        const h = minutes / 60, night = h > 18.2 || h < 6.2;
        if (night) {
            for (const [x, z] of [[-6.4, -7], [10.7, 7.1]])
                m.push({ kind: 'sphere', position: new Vec3(x, 1.72, z), scale: new Vec3(1.35, .08, 1.35), color: '#e7c987', alpha: .16, unlit: true });
            for (let i = 0; i < 10; i++) {
                const x = -10.7 + i * 2.25, y = 3.76 - Math.sin(i * .72) * .18;
                m.push({ kind: 'sphere', position: new Vec3(x, y, -9.02), scale: new Vec3(.34, .34, .18), color: '#f0d08b', alpha: .09, unlit: true });
            }
        }
        // Secondary motion: curtains, towels and a loose court ball move at different rhythms so the room never breathes in unison.
        const curtain = Math.sin(time * .72) * .035;
        m.push({ kind: 'roundBox', position: new Vec3(-4.15 + curtain, 2.46, -9.24), rotation: new Vec3(0, 0, -curtain * .35), scale: new Vec3(.48, 2.54, .055), color: '#d7b6a1', alpha: .20, unlit: true }, { kind: 'roundBox', position: new Vec3(1.55 - curtain, 2.46, -9.24), rotation: new Vec3(0, 0, curtain * .35), scale: new Vec3(.48, 2.54, .055), color: '#d7b6a1', alpha: .20, unlit: true });
        for (let i = 0; i < 3; i++) {
            const sway = Math.sin(time * 1.05 + i * .7) * .035;
            m.push({ kind: 'roundBox', position: new Vec3(-4.50 + sway, .75 + i * .24, 5.94), rotation: new Vec3(0, .06 * sway, 0), scale: new Vec3(.48, .12, .08), color: [palette.paper, palette.peach, palette.sageLight][i], alpha: .55 });
        }
        const roll = (time * .20) % 1, ballX = 5.58 + roll * .55;
        m.push({ kind: 'sphere', position: new Vec3(ballX, .105, 3.32 + Math.sin(time * .7) * .035), scale: new Vec3(.15, .15, .15), color: '#d9c65f', alpha: .72, unlit: true });
        const active = (k) => (this.interactionFx.get(k) ?? -1) > time;
        if (active('cafe')) {
            for (let i = 0; i < 5; i++) {
                const ph = ((time * 1.4 + i * .17) % 1), x = -8.2 + Math.sin(time * 4 + i) * .08;
                m.push({ kind: 'sphere', position: new Vec3(x, 1.55 + ph * .72, -5.52), scale: new Vec3(.055 + .04 * ph, .10 + .05 * ph, .055), color: '#fff4e8', alpha: .26 * (1 - ph), unlit: true });
            }
        }
        if (active('bonsai')) {
            for (let i = 0; i < 7; i++) {
                const ph = ((time * 1.9 + i * .13) % 1);
                m.push({ kind: 'sphere', position: new Vec3(10.0 + (i % 3) * .10, 2.35 - ph * 1.05, 3.72 + Math.sin(i) * .08), scale: new Vec3(.035, .055, .035), color: '#8fb8bd', alpha: .42 * (1 - ph), unlit: true });
            }
        }
        if (active('water')) {
            for (let i = 0; i < 5; i++) {
                const ph = ((time * 2 + i * .14) % 1);
                m.push({ kind: 'sphere', position: new Vec3(-5.48, 1.28 - ph * .75, 5.68), scale: new Vec3(.028, .07, .028), color: '#a9c8ca', alpha: .50 * (1 - ph), unlit: true });
            }
        }
        if (active('stringing')) {
            const pulse = Math.sin(time * 14) * .035;
            m.push({ kind: 'torus', position: new Vec3(9.2, 1.74 + pulse, -3.24), rotation: new Vec3(0, 0, time * .9), scale: new Vec3(.95, .95, .22), color: '#eadfca', alpha: .78 }, { kind: 'roundBox', position: new Vec3(9.2, 1.74, -3.20), rotation: new Vec3(0, time * 1.6, 0), scale: new Vec3(1.25, .025, .025), color: '#d2b778', alpha: .65, unlit: true });
        }
        if (active('training')) {
            for (let i = 0; i < 3; i++) {
                const ph = ((time * 1.2 + i * .27) % 1);
                m.push({ kind: 'sphere', position: new Vec3(-7.15 + ph * 1.6, .78 + Math.sin(ph * Math.PI) * .5, .05 + i * .08), scale: new Vec3(.13, .13, .13), color: '#d9c65f', alpha: .74, unlit: true });
            }
        }
        return m;
    }
    decorMeshes(p, override, alphaScale = 1) {
        const out = [], rot = p.rotation ?? 0, c = Math.cos(rot), s = Math.sin(rot);
        const pos = (dx, y, dz) => new Vec3(p.x + dx * c + dz * s, y, p.z - dx * s + dz * c);
        const add = (kind, dx, y, dz, sx, sy, sz, color, ry = 0, unlit = false, material, alpha = 1) => {
            out.push({ kind, position: pos(dx, y, dz), rotation: new Vec3(0, rot + ry, 0), scale: new Vec3(sx, sy, sz), color: override ?? color, alpha: alpha * alphaScale, unlit, material, noShadow: alphaScale < .99 });
        };
        const fp = rotatedFootprint(p.type, rot);
        out.push({ kind: 'sphere', position: new Vec3(p.x, .025, p.z), scale: new Vec3(fp.w * .47, .03, fp.d * .47), color: override ?? '#4a584e', alpha: .10 * alphaScale, unlit: true, noShadow: true });
        if (p.type === 'plant') {
            add('cone', 0, .30, 0, .50, .60, .50, palette.terracotta);
            add('sphere', 0, 1.00, 0, .82, .55, .68, palette.sage, 0, false, 'leaf');
        }
        else if (p.type === 'planter') {
            add('roundBox', 0, .27, 0, 1.28, .46, .52, '#b87958', 0, false, 'ceramic');
            for (const x of [-.42, 0, .42]) {
                add('sphere', x, .72, 0, .46, .45, .42, x === 0 ? palette.sageLight : palette.sage, 0, false, 'leaf');
            }
        }
        else if (p.type === 'bench') {
            add('roundBox', 0, .40, 0, 1.72, .28, .67, palette.wood, 0, false, 'wood');
            add('roundBox', 0, .77, .25, 1.72, .66, .18, palette.woodDark, 0, false, 'wood');
            add('cylinder', -.68, .20, 0, .10, .40, .10, '#6f6254');
            add('cylinder', .68, .20, 0, .10, .40, .10, '#6f6254');
        }
        else if (p.type === 'lamp') {
            add('cylinder', 0, 1.00, 0, .06, 2.00, .06, '#5e6b61', 0, false, 'metal');
            add('cone', 0, 2.05, 0, .66, .56, .66, palette.gold, 0, true);
        }
        else if (p.type === 'lantern') {
            add('cylinder', 0, .12, 0, .34, .12, .34, '#675f54', 0, false, 'metal');
            add('roundBox', 0, .46, 0, .40, .58, .40, '#e9ce8f', 0, true, 'glass', .80);
            add('torus', 0, .86, 0, .34, .34, .15, '#675f54', 0, false, 'metal');
        }
        else if (p.type === 'basket') {
            add('cylinder', 0, .32, 0, .64, .55, .64, '#88745d', 0, false, 'fabric');
            const balls = [[-.18, .66, -.15], [.16, .67, -.13], [-.04, .72, .10], [.20, .78, .12], [-.22, .79, .14], [.02, .87, -.02]];
            for (const [x, y, z] of balls)
                add('sphere', x, y, z, .16, .16, .16, '#d6c35f', 0, true);
        }
        else if (p.type === 'ballHopper') {
            for (const x of [-.30, .30])
                for (const z of [-.22, .22])
                    add('cylinder', x, .38, z, .035, .76, .035, '#59655d', 0, false, 'metal');
            add('roundBox', 0, .79, 0, .72, .38, .58, '#8c806d', 0, false, 'metal');
            for (let i = 0; i < 8; i++) {
                const x = ((i % 4) - 1.5) * .15, z = (Math.floor(i / 4) - .5) * .18;
                add('sphere', x, 1.03 + (i % 2) * .04, z, .13, .13, .13, '#d3cb52', 0, true);
            }
            add('cylinder', .32, 1.28, 0, .035, .66, .035, '#59655d', 0, false, 'metal');
        }
        else if (p.type === 'coneSet') {
            const cones = [[-.45, -.16], [-.15, .16], [.15, -.16], [.45, .16]];
            for (let i = 0; i < cones.length; i++)
                add('cone', cones[i][0], .16, cones[i][1], .25, .33, .25, i % 2 ? palette.gold : palette.peach);
        }
        else if (p.type === 'tennisBag') {
            add('roundBox', 0, .34, 0, 1.06, .58, .46, '#48695f', 0, false, 'fabric');
            add('roundBox', -.23, .65, 0, .48, .24, .40, '#5e8175', -.08, false, 'fabric');
            add('torus', .28, .69, 0, .26, .26, .12, '#344c45', 0, false, 'fabric');
        }
        else if (p.type === 'racketRack') {
            add('roundBox', 0, .10, 0, 1.48, .16, .50, palette.woodDark, 0, false, 'wood');
            add('roundBox', 0, .72, 0, 1.35, .10, .16, palette.wood, 0, false, 'wood');
            for (const [i, x] of [-.48, 0, .48].entries()) {
                const color = [palette.sage, palette.gold, palette.peach][i];
                add('cylinder', x, .70, 0, .055, .72, .055, color, 0, false, 'metal');
                add('torus', x, 1.34, 0, .38, .48, .19, color, 0, false, 'metal');
            }
        }
        else if (p.type === 'scoreboard') {
            add('cylinder', -.52, .64, 0, .055, 1.28, .055, '#5f695f', 0, false, 'metal');
            add('cylinder', .52, .64, 0, .055, 1.28, .055, '#5f695f', 0, false, 'metal');
            add('roundBox', 0, 1.28, 0, 1.34, .72, .16, '#385b50', 0, false, 'wood');
            for (const x of [-.36, 0, .36])
                add('roundBox', x, 1.30, -.10, .22, .30, .035, x === 0 ? '#e9d480' : '#f0eadc', 0, true);
        }
        else if (p.type === 'cafeTable') {
            add('cylinder', 0, .42, 0, .16, .80, .16, '#735f50', 0, false, 'metal');
            add('cylinder', 0, .86, 0, .94, .12, .94, '#c99d72', 0, false, 'wood');
            add('cylinder', 0, .08, 0, .62, .08, .62, '#735f50', 0, false, 'metal');
        }
        else if (p.type === 'stool') {
            add('cylinder', 0, .46, 0, .11, .84, .11, '#6b5c50', 0, false, 'metal');
            add('cylinder', 0, .87, 0, .56, .18, .56, '#b98262', 0, false, 'fabric');
            add('cylinder', 0, .08, 0, .42, .08, .42, '#6b5c50', 0, false, 'metal');
        }
        else if (p.type === 'sideTable') {
            add('roundBox', 0, .62, 0, .82, .14, .68, '#bc8e69', 0, false, 'wood');
            for (const x of [-.31, .31])
                for (const z of [-.24, .24])
                    add('cylinder', x, .30, z, .055, .58, .055, '#755c49', 0, false, 'wood');
        }
        else if (p.type === 'trophy') {
            add('roundBox', 0, .13, 0, .44, .20, .38, palette.woodDark, 0, false, 'wood');
            add('cylinder', 0, .42, 0, .08, .42, .08, '#b59142', 0, false, 'metal');
            add('sphere', 0, .72, 0, .34, .26, .34, '#e2c45b', 0, false, 'metal');
            add('torus', -.27, .72, 0, .20, .25, .10, '#e2c45b', 0, false, 'metal');
            add('torus', .27, .72, 0, .20, .25, .10, '#e2c45b', 0, false, 'metal');
        }
        else if (p.type === 'towelRack') {
            add('cylinder', -.46, .55, 0, .055, 1.10, .055, '#65736b', 0, false, 'metal');
            add('cylinder', .46, .55, 0, .055, 1.10, .055, '#65736b', 0, false, 'metal');
            add('roundBox', 0, 1.03, 0, 1.00, .055, .055, '#65736b', 0, false, 'metal');
            add('roundBox', -.23, .70, .05, .36, .62, .10, palette.paper, 0, false, 'fabric');
            add('roundBox', .23, .68, .05, .36, .58, .10, palette.peach, 0, false, 'fabric');
        }
        return out;
    }
    placementMeshes() { const out = []; for (const p of this.placements)
        out.push(...this.decorMeshes(p)); return out; }
    previewPlacement(type, x, z, rotation, valid) { return this.decorMeshes({ type, x, z, rotation }, valid ? '#87a87e' : '#c6796c', .48); }
    canPlace(x, z, type = 'plant', rotation = 0, ignoreId) {
        if (!Number.isFinite(x) || !Number.isFinite(z))
            return false;
        const f = rotatedFootprint(type, rotation);
        if (x - f.w / 2 < -12 || x + f.w / 2 > 12 || z - f.d / 2 < -9 || z + f.d / 2 > 9)
            return false;
        if (x + f.w / 2 > -3.8 && x - f.w / 2 < 5.8 && z + f.d / 2 > -6.6 && z - f.d / 2 < 6.6)
            return false;
        return !this.placements.some(p => {
            if (p.id && p.id === ignoreId)
                return false;
            const g = rotatedFootprint(p.type, p.rotation ?? 0);
            return Math.abs(p.x - x) < (f.w + g.w) / 2 + .14 && Math.abs(p.z - z) < (f.d + g.d) / 2 + .14;
        });
    }
}
function mixColor(a, b, t) { const parse = (h) => { const s = h.replace('#', ''); return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]; }; const aa = parse(a), bb = parse(b), v = aa.map((n, i) => Math.round(n + (bb[i] - n) * t)); return '#' + v.map(n => n.toString(16).padStart(2, '0')).join(''); }
function clamp01(v) { return Math.max(0, Math.min(1, v)); }
