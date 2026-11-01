import { simulate } from './model.js';
import { simulateSensitivity } from './sensitivity.js';

self.onmessage = ({ data }) => {
  const id = data?.id;
  try {
    const kind=data?.kind;
    const result = kind==='sensitivity'?simulateSensitivity(data?.options??{},data?.axis):simulate(data?.options??{});
    self.postMessage({ id, kind, result });
  } catch (error) {
    self.postMessage({ id, kind:data?.kind, error: error instanceof Error ? error.message : 'The model could not run.' });
  }
};
