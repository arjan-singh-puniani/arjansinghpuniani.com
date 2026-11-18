# Agent Orange production environment audit

Audit date: 2026-11-18

## Repository

- Repository: `arjansinghpuniani.com`, Next.js 15.5.7, React 19.1.1, TypeScript 5.9.3.
- Existing route and component inventory contains no Agent Orange implementation.
- Three.js was added for the interactive route. React Three Fiber and browser Playwright are not installed.
- `package-lock.json` exists. `node_modules` and `.vercel` do not.
- Work is isolated on `codex/agent-orange-long-shadow`. Pre-existing edits on `main` were present before branching and remain in the working tree. They are unrelated and were not edited for this task.

## Local tools

- Blender 4.0.2 is installed at `/Applications/Blender.app/Contents/MacOS/Blender`.
- Blender version query succeeds. A background factory-startup Python smoke test crashed with signal 11 before executing its expression. Python scene generation and rendering are therefore unverified.
- `ffmpeg`, Chromium, and Google Chrome were not found on `PATH`.
- A Python `playwright` command exists at `/opt/miniconda3/bin/playwright`; its browser installation and usable capture workflow have not been verified.
- Google Chrome is installed and available to the computer-use browser. A local production build was opened and inspected there.
- `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` completed successfully after adding the route. The 7 existing tests passed. The route was prerendered. First-load JS reported by Next.js was 241 kB for `/agent-orange`.
- The in-app browser showed no console errors or warnings, and selecting the substantia nigra updated the selected-region label. Mobile viewport, performance, and memory measurements were not run.
- Dependency installation reported 33 audit advisories (8 moderate, 23 high, 2 critical) across the resolved dependency tree. The advisory endpoint could not be reached for details, so newly introduced and pre-existing findings could not be separated.
- No GPU render device, available memory, dependency installation, or deployment credentials were verified.

## Verified source findings

- Scott et al., JAMA Neurology, published online 2026-11-16, DOI `10.1001/jamaneurol.2026.4219`: retrospective electronic-health-record cohort, 4,468,509 veterans included. Agent Orange exposure was self-reported. Adjusted Parkinson disease hazard ratio 1.44 (95% CI 1.37–1.52). Direct or occupational exposure subgroup hazard ratio 1.99 (95% CI 1.71–2.32). These are associations, not proof of causation, and are not estimates for 2,4-D alone.
- EPA identifies Agent Orange as a mixture of 2,4-D and 2,4,5-T. TCDD is a manufacturing contaminant associated with 2,4,5-T, not a third herbicide ingredient.
- PubChem identifiers checked: 2,4-D CID 1486, 2,4,5-T CID 1480, TCDD CID 15625.
- NINDS describes Parkinson disease pathology involving loss of dopamine-producing cells in substantia nigra. No patient-specific or exposure-specific mechanism can be inferred from this description.
- The supplied screenshots' “44 million pounds” annual 2,4-D estimate, paraquat comparison, and claimed 2023 Paul et al. interpretation have not been independently validated for those exact wordings. Do not publish them as established facts.

## Sources

- JAMA Neurology primary study: https://jamanetwork.com/journals/jamaneurology/article-abstract/2856723
- EPA 2,4-D overview: https://www.epa.gov/ingredients-used-pesticide-products/24-d
- PubChem CID 1486: https://pubchem.ncbi.nlm.nih.gov/compound/1486
- PubChem CID 1480: https://pubchem.ncbi.nlm.nih.gov/compound/1480
- PubChem CID 15625: https://pubchem.ncbi.nlm.nih.gov/compound/15625
- NINDS Parkinson disease overview: https://www.ninds.nih.gov/health-information/disorders/parkinsons-disease

## Release state

An evidence-led interactive route, schematic Three.js anatomy, evidence manifest, and narration draft now exist. No licensed atlas mesh, Blender scene, film, recorded narration, captions, or synchronized audio was produced. Blender's background crash blocks the Blender production stage. FFmpeg and a verified capture workflow are not available. Production deployment remains blocked by the missing film, provenance-validated anatomy, audio, and mobile/performance review.
