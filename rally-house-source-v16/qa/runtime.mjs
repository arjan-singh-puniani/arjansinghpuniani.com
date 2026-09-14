import {existsSync} from 'node:fs';import {homedir} from 'node:os';import path from 'node:path';import {pathToFileURL} from 'node:url';
let api;
try{api=await import(process.env.PLAYWRIGHT_MODULE||'playwright');}
catch(error){
 if(process.env.PLAYWRIGHT_MODULE)throw error;
 const bundled=path.join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
 if(!existsSync(bundled))throw Error('Install Playwright for browser QA, or set PLAYWRIGHT_MODULE to its module path.');
 api=await import(pathToFileURL(bundled).href);
}
export const chromium=api.chromium;
const cached=path.join(homedir(),'Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell');
const executablePath=process.env.CHROMIUM_EXECUTABLE||(existsSync(cached)?cached:undefined);
export const browserOptions={headless:true,...executablePath?{executablePath}:{}};
