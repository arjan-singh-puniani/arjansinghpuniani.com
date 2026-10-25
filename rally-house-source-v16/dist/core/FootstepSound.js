/** Original shoe material: sole compression, floor contact and a short rubber scuff. */
export function footstepSignal(surface, scuff, variant, sampleRate) {
    const court = surface === 'court', seconds = scuff ? .14 : .085, data = new Float32Array(Math.ceil(seconds * sampleRate));
    let seed = (variant + 1) * 7919, low = 0, phase = 0, peak = 0;
    for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        seed = (seed * 1664525 + 1013904223) >>> 0;
        const white = seed / 2147483648 - 1;
        low += (white - low) * (court ? .12 : .28);
        const attack = 1 - Math.exp(-t / .001), sole = Math.sin(2 * Math.PI * (court ? 92 : 156) * t) * Math.exp(-t / .016), contact = (court ? low : white - low) * Math.exp(-t / .010);
        phase += 2 * Math.PI * (1230 + variant * 43 - 440 * t / seconds) / sampleRate;
        const drag = scuff ? Math.sin(Math.PI * t / seconds) ** 2 * Math.exp(-t / .045) * (.10 * Math.sin(phase) + .16 * (white - low)) : 0;
        data[i] = attack * (sole * .48 + contact * (court ? .7 : .25) + drag);
        peak = Math.max(peak, Math.abs(data[i]));
    }
    for (let i = 0; i < data.length; i++)
        data[i] *= .8 / Math.max(.001, peak);
    return data;
}
