import { parseOBJ } from './obj.js';

async function fetchText(url, signal) {
  const response = await fetch(url, { signal, cache: 'force-cache' });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

export async function fetchPart(part, { signal } = {}) {
  const errors = [];
  for (const [kind, url] of [['local', part.localUrl], ['remote', part.remoteUrl]]) {
    try {
      const text = await fetchText(url, signal);
      const geometry = parseOBJ(text);
      return { part, geometry, transport: kind, url };
    } catch (error) {
      errors.push(`${kind}: ${error.message}`);
    }
  }
  throw new Error(`${part.id} failed (${errors.join('; ')})`);
}

export async function loadManifest(manifest, { concurrency = 6, onProgress = () => {}, onPart = () => {}, signal } = {}) {
  const results = new Array(manifest.length);
  const failures = [];
  let next = 0;
  let completed = 0;

  async function worker() {
    while (true) {
      const index = next++;
      if (index >= manifest.length) return;
      const part = manifest[index];
      try {
        results[index] = await fetchPart(part, { signal });
        onPart(results[index]);
      } catch (error) {
        failures.push({ part, error });
      } finally {
        completed++;
        onProgress({ completed, total: manifest.length, part, failed: failures.length });
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, manifest.length) }, worker));
  return { loaded: results.filter(Boolean), failures };
}
