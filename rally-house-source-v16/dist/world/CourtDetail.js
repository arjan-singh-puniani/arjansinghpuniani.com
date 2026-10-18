import { COURT, COURT_POST_MIN_X as left, COURT_POST_MAX_X as right } from '../tennis/CourtGeometry.js';
import { Vec3 } from '../rendering/Math3D.js';
import { DetailBatch } from '../rendering/DetailGeometry.js';
let cached;
export function courtDetails() {
    if (cached)
        return cached;
    const cord = new DetailBatch('court-woven-net-v1', '#34483f', 'fabric'), tape = new DetailBatch('court-bound-net-tape-v1', '#f1eee2', 'fabric'), metal = new DetailBatch('court-post-hardware-v1', '#52645d', 'metal'), brass = new DetailBatch('court-tension-hardware-v1', '#b79556', 'metal');
    // The visible top stays at the actual .94-unit collision plane, everywhere.
    for (let i = 0; i <= 86; i++) {
        const x = left + .05 + i / 86 * (right - left - .10);
        cord.rod(new Vec3(x, .105, 0), new Vec3(x, .915, 0), .004, 0, 5);
    }
    for (let i = 0; i <= 10; i++) {
        const y = .105 + i / 10 * .81;
        cord.rod(new Vec3(left + .05, y, 0), new Vec3(right - .05, y, 0), .004, 0, 5);
    }
    tape.box(new Vec3(COURT.centerX, COURT.netTop - .022, 0), new Vec3(right - left, .044, .033));
    tape.box(new Vec3(COURT.centerX, .51, .008), new Vec3(.045, .82, .019));
    cord.rod(new Vec3(left, .085, 0), new Vec3(right, .085, 0), .009);
    for (const x of [left, right]) {
        metal.rod(new Vec3(x, .075, 0), new Vec3(x, 1.12, 0), .047, 0, 12);
        metal.ellipsoid(new Vec3(x, 1.12, 0), new Vec3(.050, .025, .050));
        metal.box(new Vec3(x, .08, 0), new Vec3(.19, .035, .19));
        for (const dx of [-.065, .065])
            for (const dz of [-.065, .065])
                brass.ellipsoid(new Vec3(x + dx, .105, dz), new Vec3(.011, .007, .011), 0, 4, 6);
        brass.rod(new Vec3(x, .75, .035), new Vec3(x, .75, .11), .022, 0, 10);
        brass.rod(new Vec3(x, .75, .11), new Vec3(x, .65, .11), .012);
        brass.ellipsoid(new Vec3(x, .645, .11), new Vec3(.020, .028, .020));
        for (const y of [.18, .83, .99])
            metal.box(new Vec3(x, y, 0), new Vec3(.106, .028, .106));
    }
    return cached = [cord, tape, metal, brass].map(b => ({ ...b.finish(), id: 'court' }));
}
