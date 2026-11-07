import { DEFAULT_MODEL, vectorAt, type Vec2 } from "./model";

// Prescribed teaching source in an infinite, homogeneous 3D conductor; not a torso solve.
export const CONDUCTOR = { conductivity: 0.2, electrodeRadius: 0.25 } as const;
const { conductivity: sigma, electrodeRadius: radius } = CONDUCTOR;
export const ELECTRODES = {
  RA: [-Math.sqrt(3) * radius / 2, -radius / 2],
  LA: [Math.sqrt(3) * radius / 2, -radius / 2],
  LL: [0, radius],
} as const;
export const BIPOLAR_LEADS = {
  I: ["RA", "LA"], II: ["RA", "LL"], III: ["LA", "LL"],
} as const;
export type BipolarLead = keyof typeof BIPOLAR_LEADS;
export function sourceDipole(timeMs: number): Vec2 {
  if (!Number.isFinite(timeMs)) throw new RangeError("Time must be finite");
  const v = vectorAt(timeMs, DEFAULT_MODEL);
  // This explicit scale reproduces the existing synthetic limb-lead teaching waveform.
  const scale = 4 * Math.PI * sigma * radius ** 2 / Math.sqrt(3) * 1e-3;
  return [v[0] * scale, v[1] * scale]; // A m
}
export function dipolePotential(point: Vec2, p: Vec2) {
  if (![...point, ...p].every(Number.isFinite)) throw new RangeError("Coordinates and source must be finite");
  const r = Math.hypot(...point);
  if (r === 0) throw new RangeError("A point-dipole potential is singular at its origin");
  return (p[0] * point[0] + p[1] * point[1]) / (4 * Math.PI * sigma * r ** 3); // V
}
export function leadReading(timeMs: number, lead: BipolarLead, reversed = false) {
  const p = sourceDipole(timeMs);
  const pair = BIPOLAR_LEADS[lead];
  const [negative, positive] = reversed ? [pair[1], pair[0]] : pair;
  const potentials = Object.fromEntries(Object.entries(ELECTRODES).map(([name, position]) => [name, dipolePotential(position, p) * 1000])) as Record<keyof typeof ELECTRODES, number>;
  const voltageMv = potentials[positive] - potentials[negative];
  const a = ELECTRODES[negative], b = ELECTRODES[positive];
  const field: Vec2 = [
    (b[0] / Math.hypot(...b) ** 3 - a[0] / Math.hypot(...a) ** 3) / (4 * Math.PI * sigma),
    (b[1] / Math.hypot(...b) ** 3 - a[1] / Math.hypot(...a) ** 3) / (4 * Math.PI * sigma),
  ]; // V / (A m)
  return { p, potentials, voltageMv, field, negative, positive };
}
export const SOURCE_PHASES = [
  { id: "P", time: 80, title: "Atrial activation", text: "Activation spreads through atrial muscle after initiation in the sinoatrial node. The P wave reflects the distributed atrial source, not a recording of the node itself." },
  { id: "PR", time: 160, title: "Between P and QRS", text: "The simplified source is zero here. In the heart, conduction continues through the AV conduction system; its activity need not produce a visible surface deflection." },
  { id: "QRS", time: 240, title: "Ventricular activation", text: "The His–Purkinje system recruits ventricular muscle at multiple sites. The visible boundary is a teaching schematic; the arrow summarizes a prescribed net source, not the path of one ion." },
  { id: "ST", time: 370, title: "Largely activated ventricles", text: "Many ventricular cells remain depolarized. With small spatial voltage differences, surface lead voltages can be near baseline. Zero in this teaching model is not proof of electrical inactivity." },
  { id: "T", time: 530, title: "Ventricular recovery", text: "Different regions recover at different times. Recovery reverses the boundary’s electrical polarity. A recovery sequence opposite to activation can therefore give a T wave with the same sign as the main QRS deflection." },
  { id: "rest", time: 700, title: "Between ventricular cycles", text: "The prescribed source returns to zero. A near-zero surface difference does not report individual membrane voltages or prove that every cardiac cell is inactive." },
] as const;
export function sourcePhase(time: number) {
  if (!Number.isFinite(time)) throw new RangeError("Time must be finite");
  const t = ((time % DEFAULT_MODEL.rr) + DEFAULT_MODEL.rr) % DEFAULT_MODEL.rr;
  return SOURCE_PHASES[t < 40 ? 5 : t < 120 ? 0 : t < 200 ? 1 : t < 290 ? 2 : t < 480 ? 3 : t < 580 ? 4 : 5];
}
export function frontPolarity(recovery: boolean, towardPositive: boolean) {
  return (recovery ? -1 : 1) * (towardPositive ? 1 : -1);
}
export function syntheticLeadPath(lead: BipolarLead, reversed = false) {
  return Array.from({ length: 411 }, (_, i) => [i * 2, leadReading(i * 2, lead, reversed).voltageMv] as const);
}
