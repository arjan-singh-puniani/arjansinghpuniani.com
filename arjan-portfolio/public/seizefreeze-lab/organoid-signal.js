// Seeded, deliberately broadened extracellular-inspired impulses; no biological recording.
const sampleRateHz = 500, channelCount = 8, windowSeconds = .25;
const burstWindows = [[18, 46], [58, 82], [94, 114]];
const artifacts = [{ start: 12, end: 12.04, label: 'Injected common-mode artifact' },
  { start: 74, end: 74.04, label: 'Injected common-mode artifact' }];

function random(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ state >>> 15, 1 | state);
    value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

export function generateOrganoidSignals({ seed = 20261102, duration = 120 } = {}) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) throw new RangeError('seed must be an unsigned 32-bit integer.');
  if (!Number.isFinite(duration) || duration < 1 || duration > 120) throw new RangeError('duration must be 1–120 simulated seconds.');
  const count = Math.floor(duration * sampleRateHz) + 1;
  const channels = Array.from({ length: channelCount }, () => Array(count).fill(0));
  const generators = channels.map((_, channel) => random((seed ^ Math.imul(channel + 1, 0x9e3779b9)) >>> 0));
  const lastTruth = Array(channelCount).fill(-100), lastDetection = Array(channelCount).fill(-100);
  const events = [], detections = [];
  const population = Object.fromEntries(['count', 'groundTruthCount', 'feature', 'burst', 'burstCount', 'burstDuration', 'artifact', 'artifactDetected', 'truthBurst']
    .map(key => [key, new Array(count)]));
  const truthBins = new Uint16Array(count), detectionBins = new Uint16Array(count);
  let feature = 0, burst = false, burstCount = 0, burstDuration = 0, truthCount = 0, detectedCount = 0;
  for (let i = 0; i < count; i++) {
    const t = i / sampleRateHz;
    const truthBurst = burstWindows.some(([start, end]) => t >= start && t < end);
    const artifact = artifacts.find(a => t >= a.start && t < a.end);
    const artifactVoltage = artifact ? 420 * Math.sin(2 * Math.PI * (t - artifact.start) / (artifact.end - artifact.start)) : 0;
    let commonMode = 0;
    for (let channel = 0; channel < channelCount; channel++) {
      const uniform = generators[channel], samples = channels[channel];
      samples[i] += (uniform() + uniform() + uniform() - 1.5) * 8
        + 3 * Math.sin(2 * Math.PI * 1.7 * t + channel * .4) + artifactVoltage;
      if (i + 2 < count && i - lastTruth[channel] >= 3 && uniform() < (truthBurst ? 35 : 3) / sampleRateHz) {
        const amplitude = 60 + uniform() * 20;
        samples[i] -= amplitude * .35; samples[i + 1] -= amplitude; samples[i + 2] += amplitude * .25;
        events.push({ t: (i + 1) / sampleRateHz, channel }); truthBins[i + 1]++; lastTruth[channel] = i;
      }
      commonMode += samples[i] / channelCount;
    }
    const artifactDetected = Math.abs(commonMode) > 180;
    for (let channel = 0; channel < channelCount; channel++) {
      const samples = channels[channel];
      if (!artifactDetected && samples[i] < -35 && (i === 0 || samples[i - 1] >= -35) && i - lastDetection[channel] >= 5) {
        detections.push({ t, channel }); detectionBins[i]++; lastDetection[channel] = i;
      }
    }
    truthCount += truthBins[i]; detectedCount += detectionBins[i];
    const expired = i - Math.round(windowSeconds * sampleRateHz);
    if (expired >= 0) { truthCount -= truthBins[expired]; detectedCount -= detectionBins[expired]; }
    feature += (detectedCount / windowSeconds - feature) / (sampleRateHz * .3);
    const wasBurst = burst;
    burst = feature >= 80 || (burst && feature >= 40);
    if (burst && !wasBurst) burstCount++;
    if (burst && i > 0) burstDuration += 1 / sampleRateHz;
    population.count[i] = detectedCount; population.groundTruthCount[i] = truthCount; population.feature[i] = feature;
    population.burst[i] = burst; population.burstCount[i] = burstCount; population.burstDuration[i] = burstDuration;
    population.artifact[i] = Boolean(artifact); population.artifactDetected[i] = artifactDetected; population.truthBurst[i] = truthBurst;
  }
  return { sampleRateHz, channelCount, duration, seed, channels, events, detections, population,
    artifacts: artifacts.filter(a => a.start <= duration).map(a => ({ ...a })),
    units: { t: 's', voltage: 'µV', feature: 'estimated spikes/s across all channels', count: 'estimated spikes in preceding 0.25 s', burstDuration: 's' },
    generation: { baselineRateHzPerChannel: 3, burstRateHzPerChannel: 35, burstWindows: burstWindows.map(w => [...w]),
      rateStatus: 'Bernoulli proposal rates before the assumed minimum-event-interval constraint', groundTruthMinimumIntervalSeconds: .006,
      template: [-.35, -1, .25], amplitudeRangeMicrovolts: [60, 80], detectorThresholdMicrovolts: -35,
      detectorRefractorySeconds: .01, populationWindowSeconds: windowSeconds, featureLagSeconds: .3,
      burstOnRate: 80, burstOffRate: 40, artifactCommonModeThresholdMicrovolts: 180 },
    provenance: 'Entirely synthetic seeded teaching data. Broadened impulses at 500 Hz are not an acquisition specification, validated spike detector, clinical EEG or organoid experiment. Thermal state never enters this generator.' };
}

export function organoidSignalFrame(signals, t) {
  const index = Math.max(0, Math.min(signals.channels[0].length - 1, Math.round(t * signals.sampleRateHz)));
  const p = signals.population;
  return { signal: signals.channels.map(channel => channel[index]), populationCount: p.count[index],
    groundTruthCount: p.groundTruthCount[index], feature: p.feature[index], burst: p.burst[index], detected: p.burst[index],
    burstCount: p.burstCount[index], burstDuration: p.burstDuration[index],
    artifact: p.artifact[index], artifactDetected: p.artifactDetected[index], truthBurst: p.truthBurst[index] };
}
