import { simulate } from './model.js';

self.onmessage = ({ data }) => {
  const id = data?.id;
  try {
    const result = simulate(data?.options ?? {});
    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : 'The model could not run.' });
  }
};
