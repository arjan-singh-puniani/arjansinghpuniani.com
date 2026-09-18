export function chooseQuality({ width = 1200, dpr = 1, hardwareConcurrency = 8, deviceMemory = 8, mobile = false } = {}) {
  if (mobile || deviceMemory <= 4 || hardwareConcurrency <= 4 || width < 700) return 'low';
  if (dpr > 2 || deviceMemory <= 8 || hardwareConcurrency <= 8) return 'medium';
  return 'high';
}

export const QUALITY_SETTINGS = {
  high: { maxDpr: 1.8, rimScale: 1, antialias: true },
  medium: { maxDpr: 1.35, rimScale: 0.9, antialias: true },
  low: { maxDpr: 1.0, rimScale: 0.72, antialias: false }
};

export class AdaptiveQuality {
  constructor(initial = 'high') {
    this.level = initial;
    this.frames = [];
    this.lastChange = performance.now();
  }
  sample(frameMs) {
    this.frames.push(frameMs);
    if (this.frames.length > 120) this.frames.shift();
    if (this.frames.length < 90 || performance.now() - this.lastChange < 5000) return null;
    const avg = this.frames.reduce((a,b)=>a+b,0) / this.frames.length;
    let next = this.level;
    if (avg > 25 && this.level === 'high') next = 'medium';
    else if (avg > 30 && this.level === 'medium') next = 'low';
    else if (avg < 14 && this.level === 'low') next = 'medium';
    if (next !== this.level) {
      this.level = next; this.frames = []; this.lastChange = performance.now(); return next;
    }
    return null;
  }
}
