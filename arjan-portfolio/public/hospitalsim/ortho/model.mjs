// Game coordinates: +Y toward the hip, +X right in Front, +Z right in Side.
// Tilts are radians in their named projection. Twist is about the shaft.
export const views = ['front', 'side'];
export const stations = [1.55, -1.55];
export const openingSeed = 431, challengeSeed = 439;
const neutral = {x:0, z:0, gap:.055, front:0, side:0, twist:0};
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const limits = {offset:.085, gap:.10, tilt:.060, twist:.085};

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
    checked:{}, reviewed:{}, nail:0, locks:0, aim:initialAim(0), grip:null,
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
      s.notice = 'Alignment is still outside the game band. Adjust the fragment, then check again.';
      return false;
    }
    s.checked[s.view] = true;
    log(s, 'alignment-checked', {view:s.view});
    if (views.every(view => s.checked[view])) {
      s.stage = 'seat';
      s.notice = 'Both views checked. The nail is ready to advance.';
    } else s.notice = 'View checked. Switch projections and check the other view.';
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
  if (s.grip || !['reduce', 'seat', 'fix'].includes(s.stage)) return false;
  s.grip = {pose:{...s.pose}, aim:{...s.aim}, nail:s.nail, blocked:false};
  s.notice = '';
  return true;
}

export function move(s, dx, dy) {
  if (!s.grip || !Number.isFinite(dx) || !Number.isFinite(dy)) return;
  const grip = s.grip;
  if (s.stage === 'reduce') {
    const axis = s.view === 'front' ? 'x' : 'z';
    const gain = .65 + .35 * Math.min(1, Math.abs(grip.pose[axis]) / .40);
    if (s.mode === 'move') {
      s.pose[axis] = clamp(grip.pose[axis] + dx * gain, -.85, .85);
      s.pose.gap = clamp(grip.pose.gap + dy * .76, .035, .72);
    } else {
      s.pose[s.view] = clamp(grip.pose[s.view] + dx * .48, -.5, .5);
      s.pose.twist = clamp(grip.pose.twist - dy * .51, -.75, .75);
    }
  } else if (s.stage === 'seat') {
    const clears = views.every(view => aligned(s.pose, view, .80));
    const wanted = grip.nail + dy * (grip.nail > .35 ? .46 : .62);
    s.nail = clamp(wanted, 0, clears ? 1 : .43);
    grip.blocked = !clears && wanted > .43;
    s.notice = grip.blocked ? 'Advance blocked at the fracture. Retract or return to reduction.' : '';
  } else if (s.stage === 'fix') {
    s.aim = {x:clamp(grip.aim.x + dx, -.8, .8), y:clamp(grip.aim.y - dy, -.68, .68)};
  }
}

export function cancel(s) {
  if (!s.grip) return;
  s.pose = s.grip.pose;
  s.nail = s.grip.nail;
  s.aim = s.grip.aim;
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
      s.checked = {};
      log(s, 'reduction', {view:s.view, mode:s.mode, pose:{...s.pose}});
    }
  } else if (s.stage === 'seat') {
    if (grip.blocked) {
      s.corrections++;
      log(s, 'advance-blocked', {travel:s.nail});
    }
    if (s.nail >= 1) {
      s.stage = 'fix';
      s.view = 'front';
      s.notice = 'Nail seated. Match the virtual reticle to the locking target.';
      log(s, 'nail-seated');
      return 'seated';
    }
  } else if (s.stage === 'fix') {
    const distance = Math.hypot(s.aim.x, s.aim.y);
    if (distance <= (s.expert ? .052 : .092)) {
      s.lockError += distance;
      log(s, 'lock-confirmed', {station:s.locks, distance});
      s.locks++;
      if (s.locks === stations.length) {
        s.stage = 'image';
        s.notice = 'Fixation confirmed. Save a final image in each view.';
      } else {
        s.aim = initialAim(s.locks);
        s.notice = 'Upper lock seated. Match the lower target.';
      }
      return 'locked';
    }
    s.misses++;
    log(s, 'lock-missed', {distance});
    s.notice = 'Target missed. Bring the two reticles together and release.';
  }
  return '';
}

export function returnToReduction(s) {
  if (s.stage !== 'seat') return;
  cancel(s);
  s.stage = 'reduce';
  s.nail = 0;
  s.checked = {};
  s.corrections++;
  s.notice = 'Nail withdrawn in the model. Refine both views.';
  log(s, 'returned-to-reduction');
}

export function dress(s) {
  if (s.stage !== 'dress') return false;
  s.stage = 'review';
  s.notice = '';
  log(s, 'dressing-placed');
  return true;
}

export function score(s) {
  const errors = [...Object.entries(error(s.pose, 'front')), ...Object.entries(error(s.pose, 'side'))];
  const fraction = errors.reduce((sum, [key, value]) => sum + value / limits[key], 0) / errors.length;
  return {
    alignment:Math.max(0, Math.round(60 - 22 * fraction)),
    fixation:Math.max(0, Math.round(12 * s.locks + (Object.keys(s.reviewed).length * 3) - s.lockError * 28)),
    correction:Math.max(0, 10 - 2 * s.corrections - s.misses)
  };
}
