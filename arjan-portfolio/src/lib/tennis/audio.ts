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

  impact(label: ContactLabel) {
    if (label === "PERFECT") {
      this.tone(920, 0.09, 0.11, "triangle", 610);
      this.tone(205, 0.14, 0.12, "sine", 92);
    } else if (label === "FRAME") {
      this.tone(142, 0.12, 0.09, "square", 75);
      this.tone(1740, 0.035, 0.035, "square", 620);
    } else if (label === "SCRAMBLE") {
      this.tone(330, 0.095, 0.075, "sawtooth", 170);
      this.tone(1280, 0.04, 0.028, "square", 430);
    } else {
      this.tone(label === "DEFENSIVE" ? 520 : 690, 0.075, 0.085, "triangle", 390);
      this.tone(165, 0.1, 0.07, "sine", 88);
    }
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
