import type { ContactLabel } from "@/lib/tennis/contact";

export type TennisBestMilestone = "BEST IN 2" | "BEST IN 1" | "TIED BEST" | "NEW BEST";

type AudioContextFactory = () => AudioContext | null;

type ActiveVoice = {
  source: AudioScheduledSourceNode;
  nodes: AudioNode[];
};

export type ImpactSoundProfile = {
  transientGain: number;
  bodyGain: number;
  brightnessHz: number;
  dampingSeconds: number;
  roomSend: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Pure mapping from measured contact state to a bounded sound profile. */
export function impactSoundProfile(label: ContactLabel, racketHeadSpeed = 1.2, stringBedOffset = 0, incomingSpeed = 1.5): ImpactSoundProfile {
  const speed = clamp((racketHeadSpeed - 0.45) / 1.25, 0, 1);
  const incoming = clamp((incomingSpeed - 0.7) / 2.4, 0, 1);
  const centered = 1 - clamp(Math.abs(stringBedOffset), 0, 1);
  const quality = label === "PERFECT" ? 1 : label === "CLEAN" ? 0.82 : label === "DEFENSIVE" ? 0.6 : label === "SCRAMBLE" ? 0.42 : 0.34;
  return {
    transientGain: clamp(0.045 + speed * 0.035 + quality * 0.018, 0.045, 0.098),
    bodyGain: clamp(0.035 + incoming * 0.026 + speed * 0.018, 0.035, 0.078),
    brightnessHz: clamp((label === "FRAME" ? 2550 : 980 + quality * 1220) * (0.76 + centered * 0.24), 720, 2700),
    dampingSeconds: clamp(0.045 + centered * 0.055 + quality * 0.035, 0.045, 0.135),
    roomSend: label === "PERFECT" ? 0.2 : label === "CLEAN" ? 0.16 : 0.11,
  };
}

const defaultContextFactory: AudioContextFactory = () => {
  if (typeof AudioContext === "undefined") return null;
  return new AudioContext();
};

/**
 * Original procedural tennis audio. No samples or external assets are used.
 * Voices share one dry/room/limiter graph and never feed back into simulation.
 */
export class TennisAudio {
  private context: AudioContext | null = null;
  private dryMaster: GainNode | null = null;
  private roomInput: GainNode | null = null;
  private roomDelay: DelayNode | null = null;
  private roomFilter: BiquadFilterNode | null = null;
  private roomGain: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private muted = false;
  private disposed = false;
  private eventSequence = 0;
  private emittedEvents = 0;
  private readonly activeVoices: ActiveVoice[] = [];
  private readonly timers = new Set<number>();
  private readonly firedMilestones = new Set<TennisBestMilestone>();

  constructor(
    private readonly contextFactory: AudioContextFactory = defaultContextFactory,
    private readonly maximumVoices = 24,
  ) {}

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.dryMaster) this.dryMaster.gain.value = muted ? 0 : 0.72;
    if (muted) this.stopAllVoices();
  }

  unlock() {
    if (this.muted || this.disposed) return;
    try {
      if (!this.context) {
        this.context = this.contextFactory();
        if (!this.context) return;
        this.buildSignalChain(this.context);
      }
      if (this.context.state === "suspended") void this.context.resume().catch(() => undefined);
    } catch {
      this.context = null;
      this.clearGraph();
    }
  }

  /** Stops stale tails and resets one-shot milestone accents for a fresh attempt. */
  beginRun() {
    this.stopAllVoices();
    this.firedMilestones.clear();
    this.eventSequence = 0;
  }

  private buildSignalChain(context: AudioContext) {
    const dryMaster = context.createGain();
    const roomInput = context.createGain();
    const roomDelay = context.createDelay(0.12);
    const roomFilter = context.createBiquadFilter();
    const roomGain = context.createGain();
    const limiter = context.createDynamicsCompressor();

    dryMaster.gain.value = this.muted ? 0 : 0.72;
    roomInput.gain.value = 1;
    roomDelay.delayTime.value = 0.042;
    roomFilter.type = "lowpass";
    roomFilter.frequency.value = 3100;
    roomFilter.Q.value = 0.55;
    roomGain.gain.value = 0.17;
    limiter.threshold.value = -12;
    limiter.knee.value = 10;
    limiter.ratio.value = 5;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.11;

    dryMaster.connect(limiter);
    roomInput.connect(roomDelay).connect(roomFilter).connect(roomGain).connect(limiter);
    limiter.connect(context.destination);

    const noiseBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.28), context.sampleRate);
    const noise = noiseBuffer.getChannelData(0);
    let state = 0x6d2b79f5;
    for (let index = 0; index < noise.length; index += 1) {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      noise[index] = ((state >>> 0) / 2147483648 - 1) * (1 - index / noise.length * 0.16);
    }

    this.dryMaster = dryMaster;
    this.roomInput = roomInput;
    this.roomDelay = roomDelay;
    this.roomFilter = roomFilter;
    this.roomGain = roomGain;
    this.limiter = limiter;
    this.noiseBuffer = noiseBuffer;
  }

  private eventStart() {
    const context = this.context;
    if (this.muted || this.disposed || !context || context.state !== "running" || !this.dryMaster || !this.roomInput) return null;
    const sequence = this.eventSequence;
    this.eventSequence += 1;
    this.emittedEvents += 1;
    return { context, time: context.currentTime + 0.002, variation: ((sequence * 17) % 7 - 3) * 0.0025 };
  }

  private connectEventGain(context: AudioContext, startTime: number, durationSeconds: number, gainValue: number, roomSend: number) {
    const gain = context.createGain();
    const send = context.createGain();
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(gainValue, startTime + Math.min(0.0035, durationSeconds * 0.12));
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSeconds);
    send.gain.value = roomSend;
    gain.connect(this.dryMaster!);
    gain.connect(send).connect(this.roomInput!);
    return { gain, send };
  }

  private registerVoice(source: AudioScheduledSourceNode, nodes: AudioNode[]) {
    while (this.activeVoices.length >= this.maximumVoices) this.stopVoice(this.activeVoices[0]);
    const voice = { source, nodes };
    this.activeVoices.push(voice);
    source.onended = () => this.removeVoice(voice);
  }

  private removeVoice(voice: ActiveVoice) {
    const index = this.activeVoices.indexOf(voice);
    if (index >= 0) this.activeVoices.splice(index, 1);
    for (const node of voice.nodes) {
      try { node.disconnect(); } catch { /* Already disconnected. */ }
    }
  }

  private stopVoice(voice: ActiveVoice) {
    try { voice.source.stop(); } catch { /* A completed source may already be stopped. */ }
    this.removeVoice(voice);
  }

  private stopAllVoices() {
    for (const voice of [...this.activeVoices]) this.stopVoice(voice);
  }

  private resonance(context: AudioContext, startTime: number, frequency: number, durationSeconds: number, gainValue: number, endFrequency: number, roomSend: number, type: OscillatorType = "sine") {
    const oscillator = context.createOscillator();
    const { gain, send } = this.connectEventGain(context, startTime, durationSeconds, gainValue, roomSend);
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(45, frequency), startTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, endFrequency), startTime + durationSeconds);
    oscillator.connect(gain);
    this.registerVoice(oscillator, [oscillator, gain, send]);
    oscillator.start(startTime);
    oscillator.stop(startTime + durationSeconds + 0.008);
  }

  private noise(context: AudioContext, startTime: number, durationSeconds: number, gainValue: number, centerFrequency: number, roomSend: number, filterType: BiquadFilterType = "bandpass") {
    if (!this.noiseBuffer) return;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const { gain, send } = this.connectEventGain(context, startTime, durationSeconds, gainValue, roomSend);
    source.buffer = this.noiseBuffer;
    filter.type = filterType;
    filter.frequency.value = centerFrequency;
    filter.Q.value = filterType === "bandpass" ? 0.85 : 0.45;
    source.connect(filter).connect(gain);
    this.registerVoice(source, [source, filter, gain, send]);
    source.start(startTime, Math.max(0, (this.eventSequence % 9) * 0.012), durationSeconds);
    source.stop(startTime + durationSeconds + 0.008);
  }

  /** Layered racket impact driven only by measured contact state. */
  impact(label: ContactLabel, racketHeadSpeed = 1.2, stringBedOffset = 0, incomingSpeed = 1.5) {
    const event = this.eventStart();
    if (!event) return;
    const profile = impactSoundProfile(label, racketHeadSpeed, stringBedOffset, incomingSpeed);
    const pitch = 1 + event.variation + clamp((racketHeadSpeed - 1.1) * 0.028, -0.018, 0.025);

    if (label === "FRAME") {
      this.noise(event.context, event.time, 0.026, profile.transientGain * 0.9, profile.brightnessHz, 0.08, "highpass");
      this.resonance(event.context, event.time, 1320 * pitch, 0.042, 0.038, 710 * pitch, 0.07, "triangle");
      this.resonance(event.context, event.time, 176 * pitch, 0.07, profile.bodyGain * 0.72, 92, 0.08);
      return;
    }

    const unstable = label === "DEFENSIVE" || label === "SCRAMBLE";
    this.noise(event.context, event.time, unstable ? 0.032 : 0.024, profile.transientGain, profile.brightnessHz, profile.roomSend, "bandpass");
    this.resonance(event.context, event.time, (label === "PERFECT" ? 610 : label === "CLEAN" ? 520 : label === "DEFENSIVE" ? 360 : 280) * pitch, profile.dampingSeconds, profile.transientGain * 0.54, 155 * pitch, profile.roomSend, "triangle");
    this.resonance(event.context, event.time, (label === "PERFECT" ? 188 : label === "CLEAN" ? 166 : label === "DEFENSIVE" ? 138 : 116) * pitch, profile.dampingSeconds + 0.035, profile.bodyGain, 68, profile.roomSend * 0.7);
    if (label === "PERFECT") this.resonance(event.context, event.time + 0.004, 1160 * pitch, 0.052, 0.026, 530 * pitch, 0.18, "sine");
    if (label === "SCRAMBLE") this.noise(event.context, event.time + 0.009, 0.034, profile.transientGain * 0.42, 720, 0.06, "lowpass");
  }

  opponentImpact(racketHeadSpeed = 0.9, incomingSpeed = 1.4) {
    const event = this.eventStart();
    if (!event) return;
    const strength = clamp((racketHeadSpeed + incomingSpeed * 0.35) / 2.4, 0.35, 0.85);
    this.noise(event.context, event.time, 0.019, 0.032 * strength, 1450, 0.08);
    this.resonance(event.context, event.time, 148, 0.075, 0.026 * strength, 72, 0.07);
  }

  cuePulse() {
    const event = this.eventStart();
    if (!event) return;
    this.resonance(event.context, event.time, 610, 0.042, 0.013, 720, 0.04, "sine");
  }

  bounce(verticalSpeed = 1.1) {
    const event = this.eventStart();
    if (!event) return;
    const strength = clamp(verticalSpeed / 2.4, 0.22, 0.82);
    this.noise(event.context, event.time, 0.018, 0.024 * strength, 820 + strength * 260, 0.05, "lowpass");
    this.resonance(event.context, event.time, 104 + strength * 24, 0.052, 0.025 * strength, 62, 0.04);
  }

  net(incomingSpeed = 1.4) {
    const event = this.eventStart();
    if (!event) return;
    const strength = clamp(incomingSpeed / 2.5, 0.35, 0.9);
    this.noise(event.context, event.time, 0.085, 0.04 * strength, 660, 0.1, "lowpass");
    this.noise(event.context, event.time + 0.026, 0.06, 0.024 * strength, 1180, 0.08, "bandpass");
    this.resonance(event.context, event.time, 92, 0.12, 0.026 * strength, 48, 0.08, "triangle");
  }

  personalBestMilestone(status: TennisBestMilestone | null) {
    if (!status || this.firedMilestones.has(status)) return false;
    this.firedMilestones.add(status);
    const event = this.eventStart();
    if (!event) return false;
    const frequency = status === "BEST IN 2" ? 392 : status === "BEST IN 1" ? 466 : status === "TIED BEST" ? 523 : 622;
    this.resonance(event.context, event.time, frequency, 0.07, 0.018, frequency * 1.08, 0.08);
    if (status === "NEW BEST") this.resonance(event.context, event.time + 0.045, 784, 0.09, 0.016, 932, 0.11);
    return true;
  }

  result(personalBest: boolean) {
    const event = this.eventStart();
    if (!event) return;
    if (personalBest) {
      this.resonance(event.context, event.time, 523, 0.1, 0.025, 659, 0.13);
      this.resonance(event.context, event.time + 0.06, 659, 0.12, 0.023, 784, 0.15);
      this.resonance(event.context, event.time + 0.12, 784, 0.14, 0.022, 1046, 0.17);
    } else {
      this.noise(event.context, event.time, 0.035, 0.018, 520, 0.06, "lowpass");
      this.resonance(event.context, event.time, 132, 0.13, 0.026, 64, 0.07, "triangle");
    }
  }

  debugSnapshot() {
    return {
      hasContext: this.context !== null,
      activeVoices: this.activeVoices.length,
      pendingTimers: this.timers.size,
      emittedEvents: this.emittedEvents,
      firedMilestones: this.firedMilestones.size,
      muted: this.muted,
      disposed: this.disposed,
    };
  }

  private clearGraph() {
    for (const node of [this.dryMaster, this.roomInput, this.roomDelay, this.roomFilter, this.roomGain, this.limiter]) {
      try { node?.disconnect(); } catch { /* Already disconnected. */ }
    }
    this.dryMaster = null;
    this.roomInput = null;
    this.roomDelay = null;
    this.roomFilter = null;
    this.roomGain = null;
    this.limiter = null;
    this.noiseBuffer = null;
  }

  dispose() {
    this.disposed = true;
    for (const timer of this.timers) window.clearTimeout(timer);
    this.timers.clear();
    this.stopAllVoices();
    this.firedMilestones.clear();
    const context = this.context;
    this.context = null;
    this.clearGraph();
    if (context && context.state !== "closed") void context.close().catch(() => undefined);
  }
}
