import { defaults, simulate } from './model.js';

// Input bounds match model.js; scenario multipliers still apply inside simulate.
const axes = {
  rejectionResistance: [0.5, 200],
  contactResistance: [0.1, 100],
};

export function simulateSensitivity(options = {}, axis = 'rejectionResistance') {
  if (!Object.hasOwn(axes, axis)) throw new RangeError('Sensitivity axis must be rejectionResistance or contactResistance.');
  const baseline = simulate(options);
  const activeInput = Object.hasOwn(options, axis) ? options[axis] : defaults[axis];
  const [minimum, maximum] = axes[axis];
  const runs = [0.25, 1, 4].map(multiplier => {
    const requestedInput = activeInput * multiplier;
    const inputValue = Math.max(minimum, Math.min(maximum, requestedInput));
    const clamped = inputValue !== requestedInput;
    const result = multiplier === 1 ? baseline : simulate({ ...options, [axis]: inputValue });
    const parameter = result.params[axis];
    return {
      label: `${multiplier}× input · ${parameter} K/W effective${clamped ? ' · input limited' : ''}`,
      multiplier, inputValue, parameter, clamped,
      status: `Exploratory modeling assumption${clamped ? '; input clamped to the model range' : ''}`,
      ...result,
      endpoints: {
        minimumSuperficialCell: Math.min(...result.frames.map(frame => frame.tissue[0])),
        peakHot: Math.max(...result.frames.map(frame => frame.Th)),
        tecEnergy: result.summary.electricalEnergy,
        sampling: '20 Hz displayed output; energy integrated at solver time step',
      },
    };
  });
  return { axis, unit: 'K/W', status: 'Assumption sensitivity, not measured uncertainty or a clinical prediction', runs };
}
