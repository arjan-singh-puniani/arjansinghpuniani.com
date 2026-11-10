// Game coordinates: +Y toward the hip, +X right in Front, +Z right in Side.
// Tilts are radians in their named projection. Twist is about the shaft.
export const views = ['front', 'side'];
export const stations = [
  {y:-1.88, view:'side', label:'Distal 1'},
  {y:-1.55, view:'side', label:'Distal 2'},
  {y:1.55, view:'front', label:'Proximal'}
];
export const openingSeed = 431, challengeSeed = 439;
const neutral = {x:0, z:0, gap:.055, front:0, side:0, twist:0};
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const limits = {offset:.085, gap:.10, tilt:.060, twist:.085};
export const dressingTolerance = .27;
const tray = {x:1.10,y:-.86};
export const sealPath = [
  {x:-.31,y:.60}, {x:.31,y:.60}, {x:.31,y:-.60}, {x:-.31,y:-.60}, {x:-.31,y:.60}
];
const traceWidth = .26;

export function makeCase(seed = openingSeed, expert = false) {
  seed >>>= 0;
  let random = seed;
  const roll = () => ((random = (Math.imul(random, 1664525) + 1013904223) >>> 0) / 4294967296);
  const signed = (base, spread) => (base + roll() * spread) * (roll() < .5 ? -1 : 1);
  const baseline = {
    x:signed(.27, .24), z:signed(.25, .25), gap:.24 + roll() * .17,
    front:signed(.13, .14), side:signed(.12, .15), twist:signed(.20, .20)
  };
  return {
    seed, expert, stage:'inspect', view:'front', mode:'move', pose:{...baseline}, baseline,
    checked:{}, prelock:{}, reviewed:{}, nail:0, locks:0, aim:initialAim(0), dressing:{...tray},
    dressingPlaced:false, edges:0, smoother:sealPath[0], grip:null,
    actions:[], corrections:0, misses:0, lockError:0, notice:''
  };
}

function initialAim(station) {
  return station ? {x:.37, y:.29} : {x:-.36, y:-.30};
}

export function error(pose, view) {
  return {
    offset:Math.abs(pose[view === 'front' ? 'x' : 'z']),
    gap:Math.abs(pose.gap - neutral.gap),
    tilt:Math.abs(pose[view]),
    twist:Math.abs(pose.twist)
  };
}

export function aligned(pose, view, factor = 1) {
  return Object.entries(error(pose, view)).every(([key, value]) => value <= limits[key] * factor);
}

const offsetAxis = view => view === 'front' ? 'x' : 'z';
const moveGain = offset => .65 + .35 * Math.min(1, Math.abs(offset) / .40);

export function nextAdjustment(pose, view) {
  const axis = offsetAxis(view);
  const candidates = [
    ['offset', 'move', -pose[axis] / moveGain(pose[axis]), true],
    ['gap', 'move', (neutral.gap - pose.gap) / .76, false],
    ['tilt', 'rotate', -pose[view] / .48, true],
    ['twist', 'rotate', pose.twist / .51, false]
  ];
  const readings = error(pose, view);
  const next = candidates.find(([key]) => readings[key] > limits[key]);
  if (!next) return null;
  const [key, mode, distance, horizontal] = next;
  const direction = horizontal ? (distance > 0 ? 'right' : 'left') : (distance > 0 ? 'down' : 'up');
  const delta = clamp(distance, -.20, .20);
  return {key, mode, direction, dx:horizontal ? delta : 0, dy:horizontal ? 0 : delta};
}

export function nudgeAlignment(s) {
  if (s.stage !== 'reduce' || s.expert) return false;
  const next = nextAdjustment(s.pose, s.view);
  if (!next || !begin(s)) return false;
  s.mode = next.mode;
  move(s, next.dx, next.dy);
  release(s);
  return true;
}

function log(s, action, detail = {}) {
  s.actions.push({action, ...detail});
}

export function changeView(s, view) {
  if (!views.includes(view) || s.stage === 'fix' || s.stage === 'dress') return;
  cancel(s);
  s.view = view;
  s.notice = '';
}

export function startReduction(s) {
  if (s.stage !== 'inspect') return;
  s.stage = 'reduce';
  log(s, 'take-clamp');
}

export function confirmImage(s) {
  if (s.grip) return false;
  if (s.stage === 'reduce') {
    if (!aligned(s.pose, s.view)) {
      s.corrections++;
      log(s, 'alignment-check-failed', {view:s.view, error:error(s.pose, s.view)});
      s.notice = 'Alignment is still outside the game band.';
      return false;
    }
    s.checked[s.view] = true;
    log(s, 'alignment-checked', {view:s.view});
    if (views.every(view => s.checked[view])) {
      s.stage = 'seat';
      s.view = 'front';
      s.notice = 'Both views checked. This simulation starts nail travel after canal preparation.';
    } else s.notice = s.view === 'front' ? 'Front checked. Switch to Side and check it.' : 'Side checked. Switch to Front and check it.';
    return true;
  }
  if (s.stage === 'prelock') {
    if (s.prelock[s.view] || s.nail !== 1 || !aligned(s.pose, s.view)) return false;
    s.prelock[s.view] = true;
    log(s, 'seated-nail-checked', {view:s.view});
    if (views.every(view => s.prelock[view])) {
      s.stage = 'fix';
      s.view = stations[0].view;
      s.notice = 'Seated nail checked in both views. Start with the distal targets.';
    } else s.notice = 'Check the seated nail in the other projection.';
    return true;
  }
  if (s.stage === 'image') {
    s.reviewed[s.view] = true;
    log(s, 'final-image', {view:s.view});
    if (views.every(view => s.reviewed[view])) {
      s.stage = 'dress';
      s.notice = 'Both final images saved. Cover the site to finish.';
    } else s.notice = 'Image saved. Review the other projection.';
    return true;
  }
  return false;
}

export function begin(s) {
  if (s.grip || !['reduce', 'seat', 'fix', 'dress'].includes(s.stage)) return false;
  s.grip = {pose:{...s.pose}, aim:{...s.aim}, dressing:{...s.dressing}, edges:s.edges,
    smoother:s.smoother, nail:s.nail, blocked:false};
  s.notice = '';
  return true;
}

export function move(s, dx, dy) {
  if (!s.grip || !Number.isFinite(dx) || !Number.isFinite(dy)) return;
  const grip = s.grip;
  if (s.stage === 'reduce') {
    const axis = offsetAxis(s.view);
    const gain = moveGain(grip.pose[axis]);
    if (s.mode === 'move') {
      s.pose[axis] = clamp(grip.pose[axis] + dx * gain, -.85, .85);
      s.pose.gap = clamp(grip.pose.gap + dy * .76, .035, .72);
    } else {
      s.pose[s.view] = clamp(grip.pose[s.view] + dx * .48, -.5, .5);
      s.pose.twist = clamp(grip.pose.twist - dy * .51, -.75, .75);
    }
  } else if (s.stage === 'seat') {
    const clears = views.every(view => aligned(s.pose, view));
    const wanted = grip.nail + dy * (grip.nail > .35 ? .46 : .62);
    s.nail = clamp(wanted, 0, clears ? 1 : .43);
    grip.blocked = !clears && wanted > .43;
    s.notice = grip.blocked ? 'Advance blocked at the fracture. Retract or return to reduction.' : '';
  } else if (s.stage === 'fix') {
    s.aim = {x:clamp(grip.aim.x + dx, -.8, .8), y:clamp(grip.aim.y - dy, -.68, .68)};
  } else if (s.stage === 'dress') {
    if (!s.dressingPlaced) {
      s.dressing = {x:clamp(grip.dressing.x + dx, -1.35, 1.35), y:clamp(grip.dressing.y - dy, -1.45, 1.45)};
    } else {
      const start=sealPath[s.edges], next=sealPath[s.edges+1];
      if (!next) return;
      const vx=next.x-start.x, vy=next.y-start.y, length=Math.hypot(vx,vy);
      const x=grip.smoother.x+dx-start.x, y=grip.smoother.y-dy-start.y;
      if (Math.abs(x*vy-y*vx)/length > traceWidth) return;
      const along=(x*vx+y*vy)/length;
      if (along >= length-.17) {
        s.edges++;
        s.smoother=next;
      } else if (along > Math.hypot(s.smoother.x-start.x,s.smoother.y-start.y)) {
        s.smoother={x:start.x+vx*along/length,y:start.y+vy*along/length};
      }
    }
  }
}

export function cancel(s) {
  if (!s.grip) return;
  s.pose = s.grip.pose;
  s.nail = s.grip.nail;
  s.aim = s.grip.aim;
  s.dressing = s.grip.dressing;
  s.edges = s.grip.edges;
  s.smoother = s.grip.smoother;
  s.grip = null;
  s.notice = '';
}

export function release(s) {
  const grip = s.grip;
  if (!grip) return '';
  s.grip = null;
  if (s.stage === 'reduce') {
    const moved = Object.keys(neutral).filter(key => Math.abs(s.pose[key] - grip.pose[key]) > 1e-7);
    if (moved.length) {
      if (!s.expert) for (const key of moved) {
        const band = key === 'gap' || key === 'x' || key === 'z' ? .025 : .018;
        if (Math.abs(s.pose[key] - neutral[key]) < band) s.pose[key] = neutral[key];
      }
      for (const view of views) {
        if (view === s.view || !aligned(s.pose, view)) delete s.checked[view];
      }
      log(s, 'reduction', {view:s.view, mode:s.mode, pose:{...s.pose}});
    }
  } else if (s.stage === 'seat') {
    if (grip.blocked) {
      s.corrections++;
      log(s, 'advance-blocked', {travel:s.nail});
    }
    if (s.nail >= 1) {
      s.stage = 'prelock';
      s.view = 'front';
      s.notice = 'Review nail position and the reduced shaft before locking.';
      log(s, 'nail-seated');
      return 'seated';
    }
  } else if (s.stage === 'fix') {
    const distance = Math.hypot(s.aim.x, s.aim.y);
    if (distance <= (s.expert ? .052 : .092)) {
      s.lockError += distance;
      log(s, 'lock-confirmed', {station:stations[s.locks].label, distance});
      s.locks++;
      if (s.locks === stations.length) {
        s.stage = 'image';
        s.view = 'front';
        s.notice = 'Fixation confirmed. Save a final image in each view.';
      } else {
        s.aim = initialAim(s.locks);
        s.view = stations[s.locks].view;
        s.notice = stations[s.locks].label === 'Proximal'
          ? 'Distal targets complete. Switch to the simulated proximal aiming jig.'
          : 'First distal lock placed. Match the second distal target.';
      }
      return 'locked';
    }
    s.misses++;
    log(s, 'lock-missed', {distance});
    s.notice = 'Target missed. Bring the two reticles together and release.';
  } else if (s.stage === 'dress') {
    if (s.dressingPlaced) {
      return s.edges === sealPath.length-1 ? dress(s) : '';
    }
    if (Math.hypot(s.dressing.x,s.dressing.y) <= dressingTolerance) return dress(s);
    s.dressing = {...tray};
    s.notice = 'The dressing returned to its tray. Drag it onto the dashed outline and release.';
  }
  return '';
}

export function returnToReduction(s) {
  if (s.stage !== 'seat' && s.stage !== 'prelock') return;
  cancel(s);
  s.stage = 'reduce';
  s.nail = 0;
  s.checked = {};
  s.prelock = {};
  s.corrections++;
  s.notice = 'Nail withdrawn in the model. Refine both views.';
  log(s, 'returned-to-reduction');
}

export function dress(s) {
  if (s.stage !== 'dress' || s.grip) return '';
  s.notice = '';
  if (!s.dressingPlaced) {
    s.dressingPlaced = true;
    s.dressing = {x:0,y:0};
    log(s, 'dressing-placed');
    return 'applied';
  }
  s.stage = 'review';
  s.edges = sealPath.length-1;
  log(s, 'dressing-smoothed');
  return 'done';
}

export function score(s) {
  const errors = [...Object.entries(error(s.pose, 'front')), ...Object.entries(error(s.pose, 'side'))];
  const fraction = errors.reduce((sum, [key, value]) => sum + value / limits[key], 0) / errors.length;
  return {
    alignment:Math.max(0, Math.round(60 - 22 * fraction)),
    fixation:Math.max(0, Math.round(24 * s.locks / stations.length + (Object.keys(s.reviewed).length * 3) - s.lockError * 28)),
    correction:Math.max(0, 10 - 2 * s.corrections - s.misses)
  };
}
