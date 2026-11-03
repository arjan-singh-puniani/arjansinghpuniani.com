import { simulateOrganoid } from './organoid-model.js';

self.onmessage = ({ data }) => {
  try {
    if (!data || !['run', 'compare'].includes(data.kind)) throw new RangeError('Unknown research request.');
    const result = simulateOrganoid(data.inputs);
    const control = data.controlCondition ?? 'sham';
    if (!['sham', 'baseline', 'perturbation'].includes(control)) throw new RangeError('Unknown comparison control.');
    const comparison = data.kind === 'compare' ? simulateOrganoid({ ...data.inputs, condition: control }) : null;
    self.postMessage({ id: data.id, result, comparison });
  } catch (error) {
    self.postMessage({ id: data?.id, error: error instanceof Error ? error.message : 'The virtual experiment could not run.' });
  }
};
