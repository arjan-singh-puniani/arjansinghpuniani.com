import type { ContactLabel } from "@/lib/tennis/contact";

export class TennisAudio {
  private context: AudioContext | null = null;
  private muted = false;
  private timers = new Set<number>();

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  unlock() {
    if (this.muted || typeof AudioContext === "undefined") return;
    try {
      this.context ??= new AudioContext();
      void this.context.resume();
    } catch {
      this.context = null;
    }
  }

  private tone(frequency: number, durationSeconds: number, gainValue: number, type: OscillatorType, endFrequency = frequency) {
    const context = this.context;
    if (this.muted || !context || context.state !== "running") return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, endFrequency), context.currentTime + durationSeconds);
    gain.gain.setValueAtTime(gainValue, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + durationSeconds);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + durationSeconds);
  }

  /** Layered, synthesized racket palette. Pitch varies only from measured physics. */
  impact(label: ContactLabel, racketHeadSpeed = 1.2, stringBedOffset = 0) {
    const velocityPitch = Math.max(0.94, Math.min(1.06, 0.94 + racketHeadSpeed * 0.085));
    const centerBrightness = Math.max(0.72, 1 - Math.min(1, Math.abs(stringBedOffset)) * 0.24);
    if (label === "PERFECT") {
      this.tone(1120 * velocityPitch, 0.065, 0.145 * centerBrightness, "triangle", 720 * velocityPitch);
      this.tone(2150 * velocityPitch, 0.028, 0.048, "square", 1240 * velocityPitch);
      this.tone(238 * velocityPitch, 0.145, 0.15, "sine", 82);
    } else if (label === "FRAME") {
      this.tone(138 * velocityPitch, 0.11, 0.105, "square", 68);
      this.tone(1880 * velocityPitch, 0.026, 0.046, "square", 580);
    } else if (label === "SCRAMBLE") {
      this.tone(315 * velocityPitch, 0.13, 0.1, "sawtooth", 142);
      this.tone(1180 * velocityPitch, 0.046, 0.045 * centerBrightness, "square", 390);
      this.tone(92, 0.14, 0.08, "sine", 58);
    } else {
      const stringFrequency = label === "DEFENSIVE" ? 540 : 790;
      this.tone(stringFrequency * velocityPitch, 0.085, (label === "DEFENSIVE" ? 0.115 : 0.13) * centerBrightness, "triangle", 360 * velocityPitch);
      this.tone(1480 * velocityPitch, 0.032, label === "CLEAN" ? 0.036 : 0.022, "square", 740);
      this.tone(182 * velocityPitch, 0.13, 0.105, "sine", 76);
    }
  }

  cuePulse() {
    this.tone(440, 0.045, 0.018, "sine", 520);
  }

  bounce() {
    this.tone(118, 0.055, 0.035, "sine", 72);
  }

  net() {
    this.tone(96, 0.17, 0.075, "sawtooth", 48);
  }

  result(personalBest: boolean) {
    if (personalBest) {
      this.tone(440, 0.12, 0.045, "sine", 660);
      const timer = window.setTimeout(() => {
        this.timers.delete(timer);
        this.tone(660, 0.15, 0.04, "sine", 880);
      }, 70);
      this.timers.add(timer);
    } else this.tone(150, 0.16, 0.04, "triangle", 80);
  }

  dispose() {
    for (const timer of this.timers) window.clearTimeout(timer);
    this.timers.clear();
    const context = this.context;
    this.context = null;
    if (context && context.state !== "closed") void context.close();
  }
}
