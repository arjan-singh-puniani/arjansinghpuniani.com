# Agent Orange production environment audit

Audit date: 2026-11-18

## Repository

- Repository: `arjansinghpuniani.com`, Next.js 15.5.7, React 19.1.1, TypeScript 5.9.3.
- Baseline inventory before the project branch contained no Agent Orange implementation.
- Three.js was added for the interactive route. React Three Fiber and browser Playwright are not installed.
- `package-lock.json` and `node_modules` are present. No `.vercel` deployment directory is present.
- Work is isolated on `codex/agent-orange-long-shadow`. Pre-existing edits on `main` were present before branching and remain in the working tree. They are unrelated and were not edited for this task.

## Local tools

- Blender 4.0.2 is installed at `/Applications/Blender.app/Contents/MacOS/Blender`.
- Blender 4.0.2 version query succeeds, but background factory startup crashes with signal 11 before Python executes. This build is not used for generation.
- Blender 5.3.0 Apple Silicon was downloaded from Blender Foundation's mirror, verified against its published SHA-256, installed alongside 4.0.2 at `/Applications/Blender 5.3.app`, and passed a background Python startup check. The background environment reports no Metal render device; verified Cycles jobs use CPU.
- `scripts/agent-orange/build_molecule.py` parsed the PubChem CID 1486 3D SDF, checked its 19 atoms, 19 bonds, and formula, saved a `.blend`, exported a 42-mesh GLB, and rendered a Cycles PNG preview. The actual frame was inspected. The user thumbnail write emitted a permission error, but the scene and render outputs were saved successfully.
- FFmpeg 9.0.2 was installed with Homebrew after the initial audit and is available at `/opt/homebrew/bin/ffmpeg`; it includes libx264. The full frame sequence was encoded and verified as a silent H.264 MP4. The first AVFoundation writer and `avconvert` paths failed, so they were not used for delivery.
- A Python `playwright` command exists at `/opt/miniconda3/bin/playwright`; its browser installation and usable capture workflow have not been verified.
- Google Chrome is installed and available to the computer-use browser. A local production build was opened and inspected there.
- `npm run build` completed with type/lint checks; `npm test` passed all 7 existing tests. The route is statically prerendered. Latest build output reported 269 kB first-load JS for `/agent-orange` before the final native video-player update; run a fresh build for the current route measurement.
- Earlier in-app browser inspection showed no console errors or warnings, and selecting the substantia nigra, atlas, and molecule controls updated the scene. The latest video-player update has not been runtime-tested in a browser. Mobile viewport, measured performance, and memory checks remain incomplete.
- Dependency installation reported 33 audit advisories (8 moderate, 23 high, 2 critical) across the resolved dependency tree. The advisory endpoint could not be reached for details, so newly introduced and pre-existing findings could not be separated.
- No Metal render device was detected for Blender. Available GPU memory and deployment credentials were not verified.

## Verified source findings

- Scott et al., JAMA Neurology, published online 2026-11-16, DOI `10.1001/jamaneurol.2026.4219`: retrospective electronic-health-record cohort, 4,468,509 veterans included. Agent Orange exposure was self-reported. Adjusted Parkinson disease hazard ratio 1.44 (95% CI 1.37–1.52). Direct or occupational exposure subgroup hazard ratio 1.99 (95% CI 1.71–2.32). These are associations, not proof of causation, and are not estimates for 2,4-D alone.
- The JAMA abstract reports 4,917,272 screened, 4,468,509 included, mean follow-up 12.5 years (SD 7.0), 1,035,210 (23.2%) self-reported exposure, and 7,600 direct or occupational exposure. Full article methods, absolute counts, and complete sensitivity analyses have not been independently checked beyond the accessible article abstract.
- EPA identifies Agent Orange as a mixture of 2,4-D and 2,4,5-T. TCDD is a manufacturing contaminant associated with 2,4,5-T, not a third herbicide ingredient.
- PubChem identifiers checked: 2,4-D CID 1486, 2,4,5-T CID 1480, TCDD CID 15625.
- Teardown was reviewed at its upstream README and frame-capture script. It is an MIT-licensed Claude Code skill with a standalone simulator/capture workflow rather than an installed runtime package. This project reuses the relevant ideas—shared GLB science assets, a timed 3D camera sequence, and actual preview-frame review—without copying its code or adding a dependency. REA was not used because no reverse-engineering task was needed. No upstream commit is pinned because neither repository's code is included.
- The CIT168 paper is CC BY 4.0; the official OSF API reports the CIT168 project node `jkzwp` under CC-By Attribution 4.0 International. Attribution and display modifications are recorded and linked on the route. The raw label map is retained outside `public/`.
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

An evidence-led interactive route, CIT168 label-derived subcortical surfaces, three PubChem molecule assets, a 105-second editable Blender scene, 2,520 rendered 720×405 CPU frames, and an encoded 105-second H.264 MP4 silent review (718×404, 24 fps) now exist. The MP4 was probed, visually inspected, and played in headless Chrome; it has no audio and is not the finished documentary. Desktop and emulated mobile Chrome Playwright checks passed for GLB loading, keyboard and touch rotation, reduced motion, MP4 playback, horizontal overflow, and console/network errors. There is no 4K master, recorded narration, sound mix, or synchronized caption track. Real-device/Safari, performance, memory, broader accessibility, full portfolio regression, and independent expert review remain incomplete. The 4.0.2 background crash is avoided by using the verified 5.3.0 side-by-side installation. No deployment was performed.
