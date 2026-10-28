import * as THREE from './vendor/three.module.js';
export function createAudio() {
    let ctx = null;
    let master = null;
    let compressor = null;
    let enabled = true;
    function ensure() {
        if (!enabled)
            return null;
        if (!ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext)
                return null;
            ctx = new AudioContext();
            master = ctx.createGain();
            master.gain.value = 0.72;
            compressor = ctx.createDynamicsCompressor();
            compressor.threshold.value = -12;
            compressor.knee.value = 10;
            compressor.ratio.value = 8;
            compressor.attack.value = 0.003;
            compressor.release.value = 0.12;
            master.connect(compressor).connect(ctx.destination);
        }
        if (ctx.state === 'suspended')
            ctx.resume().catch(() => { });
        return ctx;
    }
    function panNode(pan = 0) {
        if (!ctx || !master)
            return null;
        if (typeof ctx.createStereoPanner === 'function') {
            const node = ctx.createStereoPanner();
            node.pan.value = THREE.MathUtils.clamp(pan, -1, 1);
            node.connect(master);
            return node;
        }
        return master;
    }
    function noise(duration = 0.1) {
        const c = ensure();
        if (!c)
            return null;
        const length = Math.max(1, Math.floor(c.sampleRate * duration));
        const buffer = c.createBuffer(1, length, c.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++)
            data[i] = Math.random() * 2 - 1;
        const src = c.createBufferSource();
        src.buffer = buffer;
        return src;
    }
    function hiss({ when = 0, duration = 0.16, gain = 0.12, pan = 0, bright = true } = {}) {
        const c = ensure();
        if (!c)
            return;
        const start = c.currentTime + when;
        const src = noise(duration + 0.04);
        if (!src)
            return;
        const hp = c.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = bright ? 1800 : 850;
        const bp = c.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = bright ? 4600 : 2200;
        bp.Q.value = 0.55;
        const amp = c.createGain();
        amp.gain.setValueAtTime(0.0001, start);
        amp.gain.exponentialRampToValueAtTime(gain, start + 0.012);
        amp.gain.setValueAtTime(gain * 0.82, start + duration * 0.45);
        amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        src.connect(hp).connect(bp).connect(amp).connect(panNode(pan));
        src.start(start);
        src.stop(start + duration + 0.03);
    }
    function metallicClick({ when = 0, gain = 0.16, pan = 0, pitch = 1 } = {}) {
        const c = ensure();
        if (!c)
            return;
        const start = c.currentTime + when;
        const out = panNode(pan);
        [620, 1120, 1860].forEach((base, index) => {
            const osc = c.createOscillator();
            const amp = c.createGain();
            osc.type = index === 0 ? 'triangle' : 'sine';
            osc.frequency.setValueAtTime(base * pitch, start);
            osc.frequency.exponentialRampToValueAtTime(Math.max(90, base * pitch * 0.62), start + 0.045);
            amp.gain.setValueAtTime(gain * (1 - index * 0.22), start);
            amp.gain.exponentialRampToValueAtTime(0.0001, start + 0.055 + index * 0.018);
            osc.connect(amp).connect(out);
            osc.start(start);
            osc.stop(start + 0.09);
        });
        const src = noise(0.045);
        if (src) {
            const hp = c.createBiquadFilter();
            hp.type = 'highpass';
            hp.frequency.value = 2500;
            const amp = c.createGain();
            amp.gain.setValueAtTime(gain * 0.38, start);
            amp.gain.exponentialRampToValueAtTime(0.0001, start + 0.04);
            src.connect(hp).connect(amp).connect(out);
            src.start(start);
            src.stop(start + 0.05);
        }
    }
    function thud({ when = 0, gain = 0.22, pan = 0 } = {}) {
        const c = ensure();
        if (!c)
            return;
        const start = c.currentTime + when;
        const out = panNode(pan);
        const osc = c.createOscillator();
        const amp = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(92, start);
        osc.frequency.exponentialRampToValueAtTime(46, start + 0.13);
        amp.gain.setValueAtTime(gain, start);
        amp.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
        osc.connect(amp).connect(out);
        osc.start(start);
        osc.stop(start + 0.18);
    }
    function gunBurst({ tighten = false, duration = .37 } = {}) {
        const c = ensure();
        if (!c)
            return;
        // High-flow air hiss under a rapid train of torque impacts.
        hiss({ duration, gain: 0.10, pan: 0.42, bright: true });
        const impacts = Math.max(3, Math.round(duration / .04));
        const spacing = duration / impacts;
        for (let i = 0; i < impacts; i++) {
            const when = i * spacing;
            const punch = 0.16 + (i % 3 === 0 ? 0.045 : 0);
            metallicClick({ when, gain: punch, pan: 0.43, pitch: tighten ? 1.18 : 0.96 });
            const osc = c.createOscillator();
            const amp = c.createGain();
            const start = c.currentTime + when;
            osc.type = 'square';
            osc.frequency.setValueAtTime(tighten ? 132 : 108, start);
            osc.frequency.exponentialRampToValueAtTime(tighten ? 88 : 72, start + 0.028);
            amp.gain.setValueAtTime(0.075, start);
            amp.gain.exponentialRampToValueAtTime(0.0001, start + 0.036);
            osc.connect(amp).connect(panNode(0.35));
            osc.start(start);
            osc.stop(start + 0.04);
        }
    }
    function jackRelease() {
        hiss({ duration: 0.34, gain: 0.15, pan: -0.28, bright: false });
        metallicClick({ when: 0.06, gain: 0.18, pan: -0.24, pitch: 0.72 });
        thud({ when: 0.09, gain: 0.24, pan: -0.18 });
    }
    function triggerEvent(event, playback = 1) {
        if (!enabled) return;
        const state = event.state;
        if (state === 'LOOSENING' || state === 'TIGHTENING') gunBurst({ tighten: state === 'TIGHTENING', duration: event.duration / playback });
        if (state === 'LIFT' && event.track === 'Front jack') { hiss({ duration: .22, gain: .11, bright: false }); metallicClick({ gain: .11, pitch: .82 }); }
        if (state === 'NUT_RELEASED') { metallicClick({ gain: .12, pitch: .88 }); thud({ gain: .08 }); }
        if (state === 'WHEEL_CLEAR') hiss({ duration: .13, gain: .04, bright: false });
        if (state === 'WHEEL_INSTALLED') { metallicClick({ gain: .11, pitch: 1.04 }); thud({ gain: .08 }); }
        if (state === 'TOOL_CLEAR') hiss({ duration: .18, gain: .05 });
        if (state === 'LOWER & CLEAR' && event.track === 'Front jack') jackRelease();
    }
    function setEnabled(next) {
        enabled = Boolean(next);
        if (enabled) {
            ensure();
            metallicClick({ gain: 0.055, pitch: 1.2 });
        }
        else if (master && ctx) {
            master.gain.cancelScheduledValues(ctx.currentTime);
            master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.015);
        }
        if (enabled && master && ctx)
            master.gain.setTargetAtTime(0.72, ctx.currentTime, 0.02);
    }
    return { ensure, triggerEvent, setEnabled, dispose: () => ctx?.close(), get enabled() { return enabled; } };
}
