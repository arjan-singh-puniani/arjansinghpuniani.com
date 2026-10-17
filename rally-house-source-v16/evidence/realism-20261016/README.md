# Adult character surfaces and tennis proportions — October 16–17, 2026

This pass refines the existing adult cast and corrects the oversized racket and squat court identified during review. The game continues to use one persistent physical club, its existing objects and its original character instances.

## Visible changes

- Sculpted cheek, orbital, nasal and chin relief; smaller circular pupils, convex eye surfaces, softer lower lids and an upper eyelid fold. Arjan and Leo use a smoothly broadened jaw variant and subtler lip volume.
- Finer scalp and lock grooves, filtered skin micro normals, and an opt-in performance-knit material. Existing room materials retain the same shading. Small collarbone relief and cloth tension folds follow the garment's existing skin weights.
- Matching thigh and calf boundary radii remove the exposed knee seam. Trainer laces and heel panels follow the actual shoe upper. Existing movement, joint landmarks and contact ownership remain authoritative.
- A thin elliptical racket frame replaces the thick generic torus. The head is approximately **0.376 × 0.510 club units**, versus **0.783 × 0.979** before. An open string bed, throat and smaller grip replace the translucent solid insert. Grip-to-head offsets and the rendered string plane share the existing contact solver.
- The existing court changes from **12 × 8.5** to **12.8 × approximately 5.907 club units**, with singles sidelines, doubles alleys and service boxes using [ITF court ratios](https://www.itftennis.com/en/about-us/organisation/tennis-glossary/). Markings, net span, navigation net bounds, selection bounds, singles scoring, aiming and analysis coverage share one court definition. Championship serves begin behind the baseline; ordinary practice retains its previous interior positions. The match camera widens to include the longer court and the player's feet.

The court remains a compact indoor game court. Its clubhouse footprint, run-off and scale relative to furniture are **not a full regulation tennis facility**, and club units are not meters. Characters remain stylized procedural models, not photorealistic replicas. No private reference images are published and no replacement scene is introduced.

## Actual visual evidence

Baseline runtime: `042ce5f9e40c12cb81e8535145d52e38bd9ea197`.

- [Previous court/racket in live play](../gait-20261016/chromium/C-gameplay.webp) / [updated live play](chromium/C-gameplay.webp)
- [Previous club court](before-club.webp) / [updated club court](after-club.webp)
- [Taylor before](before-taylor-portrait.webp) / [Taylor after](after-taylor-portrait.webp)
- [Arjan before](before-arjan-portrait.webp) / [Arjan after](after-arjan-portrait.webp)
- Each adult has matching `before-<id>-body.webp` and `after-<id>-body.webp` captures. The live casts, original world and original renderer are used with controlled inspection cameras.
- `moving-replay/registered-motion.webm` is unedited native browser video; `phone-arjan/phone-recording.webm` is the actual in-game encoded recording.

PNG captures are encoded losslessly as WebP and verified for identical decoded pixels; hashes and dimensions are in `image-manifest.json`. Full raw captures stay local. Day, cloud and evening material checks are diagnostic portraits rendered through the production renderer; the cast and gameplay comparisons include the actual club.

## Verification and limits

All **34 game suites pass**. The added emitted-surface checks cover round pupils, the closed masculine facial sculpt, **21,600 animated knee boundary pairs with zero gap**, **576 trainer detail vertices** registered above the actual shoe, regulation line ratios and bounded racket head dimensions. Existing limb-length, skin registration, exact racket contact, early/late return, phone and gait checks remain in the full run (`game-tests.log`).

Chromium, Firefox and WebKit each pass three Championship/return cycles and nine world/identity/state checks. An additional 390-pixel Chromium run passes those same cycles. Actual player head/foot projections remain in the match viewport. The original world, objects, fixtures and four NPCs persist through matches and Lab replay. Reports and native `C-gameplay.webp` captures are in each browser directory and `portrait-match/`.

Moving replay covers both avatars, forehand, serve and gait over **540 actual RAF frames**. Joint annotations show zero positional disagreement, the shared timeline stays synchronized and fractional-pose canvas picking works. The phone report includes real encoded media, attachment error, playback/seek measurements, full-body visibility, Axe results and stream cleanup. These measurements describe simulated motion with known pose; the app does not yet fit an uploaded real-person video.

The GPU material audit compares all twelve existing world materials at two lighting times against the complete baseline, plus current human portraits at three lighting profiles. Package metadata records CRC and exact source/runtime bytes; the extracted standalone is tested with native Metal startup, selection, save and reload. Source and served runtime contain **76 matching release artifacts**; the standalone contains **78 files**. No new full portfolio framework run is claimed for this game/static-runtime pass.

## Diagnostics corrected during the pass

The initial full run found a stale facial-geometry name in a test; cast detection now recognizes the actual current feminine and masculine surfaces. The first court change sent ordinary coaching participants to the crowded rear circulation strip; ordinary practice keeps its previous interior positions, while Championship alone uses the formal baseline serve positions. Historical tests that assumed the old court width now measure the actual singles span and corners. The initial knee test selected both legs' coplanar rings; it now isolates each real knee boundary. Early logs are retained under `diagnostics/`.

A phone QA timing race queried the mounting phase in a second browser task after that phase had ended. Its attachment sample is now collected atomically while mounting. A heavily concurrent GPU run produced a shortened encoded clip, so the final phone recording is checked separately from the browser matrix. No successful full-duration recording is inferred from a screenshot alone.

## Reproduction

Run inside `rally-house-source-v16`, with dependencies installed and `node qa/serve.mjs` on port 8078:

```sh
npm test
npm run release:sync
QA_LABEL=before QA_BASELINE_RUNTIME=/path/to/042ce5f/dist node qa/realism-look.mjs
QA_LABEL=after node qa/realism-look.mjs
QA_OUT=evidence/realism-20261016 QA_BASELINE_RUNTIME=/path/to/042ce5f/dist node qa/taylor-presence.mjs
QA_ENGINE=chromium QA_OUT=evidence/realism-20261016/chromium node qa/same-world.mjs
QA_ENGINE=firefox QA_OUT=evidence/realism-20261016/firefox node qa/same-world.mjs
QA_ENGINE=webkit QA_OUT=evidence/realism-20261016/webkit node qa/same-world.mjs
QA_WIDTH=390 QA_OUT=evidence/realism-20261016/portrait-match node qa/same-world.mjs
QA_AVATAR=Arjan QA_WIDTH=390 QA_OUT=evidence/realism-20261016/phone-arjan node qa/phone-capture.mjs
QA_OUT=evidence/realism-20261016/moving-replay node qa/replay-smoothness.mjs
QA_METAL=1 QA_OUT=evidence/realism-20261016/standalone node qa/standalone-compare.mjs /path/to/Rally-House-v16-Playtest
```
