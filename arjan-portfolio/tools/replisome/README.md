# REPLISOME portfolio integration

The portfolio serves the independently built app from `public/replisome/`.
Its React and Three.js dependencies belong to `replisome-source/`, outside the
Next.js project. Ordinary portfolio builds use the checked-in static bundle and
do not install or import those dependencies.

Update the app from the repository root:

```sh
npm ci --prefix replisome-source
npm test --prefix replisome-source
cd arjan-portfolio
node tools/replisome/sync-build.mjs
npm run verify
REPLISOME_QA_URL=http://127.0.0.1:3000 node tools/replisome/browser-qa.mjs
REPLISOME_QA_URL=http://127.0.0.1:3000 node tools/replisome/study-qa.mjs
REPLISOME_QA_URL=http://127.0.0.1:3000 node tools/replisome/motion-qa.mjs
```

Start the production portfolio server separately before browser QA. The QA tool
uses the portfolio's existing Playwright dependency. It verifies lazy loading,
embedded paths, keyboard access, responsive layout, error-free rendering,
closing/reopening, existing routes, and WebGL fallback in Chromium and WebKit.
The additional study tool verifies the optional MCAT lens, first-attempt
feedback, diagrams, confidence, modal focus and rendering suspension. For the
source molecular suite, `REPLISOME_TEST_CHROME=1 npm run test:e2e` selects installed
Chrome rather than bundled Chromium; WebKit still runs as the second project.

`/playground/replisome` is the crawlable introduction; `/replisome/index.html`
is the standalone runtime and carries `noindex,follow` plus the canonical page
URL. Closing the frame unloads its JavaScript, audio, and WebGL context.
Fonts and molecular JSON use the standalone base path. No runtime request goes
to the private ChatGPT Sites deployment.

The poster is captured from the actual app with interface overlays hidden,
then compressed to 1200 × 900 WebP. It is not an invented molecular illustration.
`build-manifest.json` records hashes for the app bundle and locked dependencies.

The integration adds one card after Anatomy Learner, one scoped page, one
static asset directory, and a sitemap entry. It does not alter existing project
bundles or the shared site layout. Dependencies and global styles stay as they
were at base commit `4263736409264b37253cb985df9c69209b35e52d`.

Before production: pass the portfolio checks and browser QA, deploy a preview,
then repeat the integration checks against the preview. Preserve the previous
production deployment for rollback. Physical iPhone GPU/thermal testing remains
unverified; this is described as an educational model rather than a universally
validated molecular simulation.
