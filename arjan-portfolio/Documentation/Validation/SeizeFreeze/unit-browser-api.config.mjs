import config from '../../../vitest.config.ts';
import { fileURLToPath } from 'node:url';
// Reproduce browser API availability without changing unrelated product code or its tests.
const verificationConfig = { ...config, test: { ...config.test, setupFiles: [...config.test.setupFiles, fileURLToPath(new URL('./unit-browser-api-shim.js', import.meta.url))] } };
export default verificationConfig;
