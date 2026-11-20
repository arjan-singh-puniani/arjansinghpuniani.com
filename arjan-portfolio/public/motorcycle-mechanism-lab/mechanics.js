export const assemblies = [
  { id: "frame", name: "Main frame", parent: null, spread: [0,0,0], description: "The reference assembly stays anchored. Other assemblies can move away from it." },
  { id: "engine", name: "Engine & ancillaries", parent: "frame", spread: [.85,-.05,.1], description: "Engine surfaces, mounts and associated hoses, grouped for this visual study." },
  { id: "fork", name: "Front fork", parent: "frame", spread: [0,.15,.45], description: "The wheel, controls and front bodywork follow this assembly while their connections remain attached." },
  { id: "front-wheel", name: "Front wheel & brake", parent: "fork", spread: [0,-.05,.8], description: "Tire, rim, spokes and brake surfaces travel together as one wheel assembly." },
  { id: "cockpit", name: "Handlebar & controls", parent: "fork", spread: [0,.55,.05], description: "Bar, grips, levers and pad. Use the Controls camera to inspect the detail." },
  { id: "front-fender", name: "Front fender", parent: "fork", spread: [.1,.35,.3], description: "A useful surface for trying a localized dent or pulling a body panel free." },
  { id: "front-plate", name: "Front number plate", parent: "fork", spread: [-.45,.35,.3], description: "Front plate and its associated plastic surfaces, separate from the fork." },
  { id: "radiator", name: "Radiator", parent: "frame", spread: [-.7,.2,.15], description: "The modeled radiator is a separate surface group; internal fluid behavior is not represented." },
  { id: "shrouds", name: "Tank shrouds", parent: "frame", spread: [.8,.4,0], description: "The creator's paired shroud surfaces are edited as one component group." },
  { id: "seat", name: "Seat", parent: "frame", spread: [0,.9,-.1], description: "The textured seat lifts away to expose the frame and rear suspension context." },
  { id: "rear-body", name: "Rear bodywork", parent: "frame", spread: [0,.5,-.65], description: "Rear and side plastic surfaces, grouped from the creator's material and scene hierarchy." },
  { id: "shock", name: "Rear shock", parent: "frame", spread: [-.7,.4,-.15], description: "Spring and shock surfaces are grouped for inspection. Spring rate and damping are not calibrated." },
  { id: "swingarm", name: "Swingarm & drive", parent: "frame", spread: [-.45,.05,-.4], description: "The rear wheel follows the swingarm until its own visual connection is released." },
  { id: "rear-wheel", name: "Rear wheel & brake", parent: "swingarm", spread: [0,-.05,-.8], description: "Rear tire, wheel and brake surfaces remain a coherent assembly during a pull." },
  { id: "exhaust", name: "Exhaust", parent: "frame", spread: [-.85,.35,-.35], description: "Header and silencer surfaces form a single inspection group, not a heat or flow model." },
];

export function classifyAssembly(name, ancestors, material) {
  const mesh = name.toUpperCase().replace(/[_.-]/g," ");
  const path = ancestors.toUpperCase().replace(/[_.-]/g," ");
  const surface = material.toUpperCase();
  if (/FRONT WHEEL/.test(path)) return "front-wheel";
  if (/REAR WHEEL DEF/.test(path)) return "rear-wheel";
  if (/SEAT/.test(surface)) return "seat";
  if (/FENDERS/.test(surface)) return /FRONT STEER|FRONT SUS/.test(path) ? "front-fender" : "rear-body";
  if (/NUMBERPLATES/.test(surface)) return /FRONT STEER/.test(path) ? "front-plate" : "rear-body";
  if (/SHROUDS/.test(surface)) return "shrouds";
  if (/SHOCK|SPRING/.test(path) || /SPIRAL/.test(mesh)) return "shock";
  if (/SUS REAR/.test(path)) return "swingarm";
  if (/EXHAUST/.test(mesh+surface)) return "exhaust";
  if (/HANDLEBAR|BARPAD/.test(mesh)) return "cockpit";
  if (/FORK/.test(mesh) || /FRONT SUS|FRONT STEER/.test(path)) return "fork";
  if (/RADIATOR/.test(mesh)) return "radiator";
  if (/FRAME|BASH GAURD|MUD GUARD|AIRBOX/.test(mesh)) return "frame";
  return "engine";
}

export function clamp(value, low, high) {
  return Number.isFinite(value) ? Math.min(high,Math.max(low,value)) : low;
}

export function dentWeight(distance, radius) {
  if (!(radius > 0) || !Number.isFinite(distance) || distance >= radius) return 0;
  const t = 1 - Math.max(0,distance) / radius;
  return t * t * (3 - 2 * t);
}

export function releaseVelocity(delta, elapsedSeconds) {
  const elapsed = clamp(elapsedSeconds,.08,2);
  const velocity = delta.map(value => Number.isFinite(value) ? value / elapsed : 0);
  const length = Math.hypot(...velocity);
  return length > 3 ? velocity.map(value => value * 3 / length) : velocity;
}

export function stepMotion(position, velocity, seconds) {
  const dt = clamp(seconds,0,1/30);
  const nextVelocity = [velocity[0],velocity[1] - 9.81 * dt,velocity[2]];
  return { position: position.map((value,index) => value + nextVelocity[index] * dt), velocity: nextVelocity };
}
