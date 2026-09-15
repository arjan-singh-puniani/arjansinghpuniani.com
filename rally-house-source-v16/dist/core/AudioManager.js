export class AudioManager {
    ctx;
    enabled = true;
    volume = .65;
    noise;
    ensure() { if (!this.ctx)
        this.ctx = new AudioContext(); if (this.ctx.state === 'suspended')
        void this.ctx.resume(); return this.ctx; }
    getNoise() { const c = this.ensure(); if (this.noise)
        return this.noise; const b = c.createBuffer(1, Math.floor(c.sampleRate * .11), c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++)
        d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); this.noise = b; return b; }
    tone(freq = 440, duration = .08, gain = .018, type = 'sine', detune = 0) { if (!this.enabled || this.volume <= 0)
        return; try {
        const c = this.ensure(), o = c.createOscillator(), g = c.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, c.currentTime);
        o.detune.value = detune;
        g.gain.setValueAtTime(Math.max(.0001, gain * this.volume), c.currentTime);
        g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + duration);
        o.connect(g).connect(c.destination);
        o.start();
        o.stop(c.currentTime + duration + .02);
    }
    catch { } }
    noiseBurst(freq = 900, duration = .045, gain = .018, q = .9) { if (!this.enabled || this.volume <= 0)
        return; try {
        const c = this.ensure(), src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
        src.buffer = this.getNoise();
        f.type = 'bandpass';
        f.frequency.value = freq;
        f.Q.value = q;
        g.gain.setValueAtTime(Math.max(.0001, gain * this.volume), c.currentTime);
        g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + duration);
        src.connect(f).connect(g).connect(c.destination);
        src.start();
        src.stop(c.currentTime + duration + .01);
    }
    catch { } }
    click() { this.tone(520, .055, .010); }
    paper() { this.noiseBurst(1250, .055, .005, 1.6); this.tone(610, .035, .004, 'sine'); }
    bounce() { this.tone(116 + Math.random() * 8, .034, .010, 'triangle'); this.noiseBurst(520 + Math.random() * 80, .030, .007); }
    hit(quality = 'clean') {
        if (quality === 'frame') {
            this.tone(224, .040, .010, 'triangle', 240);
            this.noiseBurst(1550, .030, .010, 1.4);
            return;
        }
        if (quality === 'net') {
            this.net();
            return;
        }
        this.tone(184 + Math.random() * 12, .054, .015, 'triangle');
        this.tone(365 + Math.random() * 20, .036, .007, 'sine');
        this.noiseBurst(1100 + Math.random() * 140, .044, .013, 1.05);
    }
    net() { this.noiseBurst(390, .078, .011, .7); this.tone(92, .07, .007, 'triangle'); }
    shoe(squeak = false) { if (squeak) {
        this.noiseBurst(1750, .045, .0045, 2.4);
        this.tone(720, .025, .0028, 'sine');
    }
    else
        this.noiseBurst(260, .025, .0027, .7); }
    cup() { this.tone(1060, .035, .0045, 'sine'); this.tone(790, .028, .0028, 'sine'); }
    door() { this.noiseBurst(310, .09, .004, .55); this.tone(138, .07, .0025, 'triangle'); }
    stringing() { this.tone(940, .045, .004, 'triangle'); setTimeout(() => this.tone(1160, .035, .003, 'triangle'), 45); }
    watering() { this.noiseBurst(750, .10, .003, .5); }
    chuckle() { this.tone(230, .055, .002, 'triangle'); setTimeout(() => this.tone(270, .07, .0015, 'triangle'), 90); }
    success() { this.tone(660, .08, .013); setTimeout(() => this.tone(880, .10, .011), 70); }
}
