# Taylor human silhouette and sportswear refinement

Completed October 15, 2026; this evidence folder retains the work's October 14 start date. Baseline: `1145915d8676a2caadd62c318c63847045d27f9f`.

Taylor's human shoulder girdle is narrower, with the arm solver working from the revised anatomical landmarks. A new human-only dress has a softer waist/hip contour, a scoop neckline, an exposed shoulder yoke, deeper pleats, piping and curved tailoring seams. The shoulder and garment surfaces use the same contour and bone weights. The ponytail has more volume and two fine face-framing locks; relaxed club idle has a warmer smile. The existing facial sculpt is retained. This remains a stylized procedural game character.

## Actual visual comparison

These are the production `Character.meshes()` and production WebGL renderer on an isolated inspection stage. They are geometry inspection renders, not gameplay screenshots. The baseline routes every compiled module from an immutable pre-change snapshot, so the comparison includes the real old pose and clothing.

| View | Before | After |
| --- | --- | --- |
| Front | [Baseline](before-front.webp) | [Refined](after-front.webp) |
| Three quarter | [Baseline](before-three-quarter.webp) | [Refined](after-three-quarter.webp) |

Actual club and Championship screenshots and reports are in [Chromium](chromium/report.json), [Firefox](firefox/report.json) and [WebKit](webkit/report.json). All captures are unchanged pixels encoded as lossless WebP. The [manifest](image-manifest.json) records original PNG and committed WebP hashes. Raw PNGs remain local.

## Validation

- `npm test` passes all **31 game suites**, including the new tailoring suite; [complete output](game-tests.log). Simulation-generated reports are retained in `generated-simulation/`.
- **25,920** checks follow the actual emitted dress/shoulder boundary vertices through idle, walking, serve, forehand, backhand and phone reach at 30/60/120 Hz. Maximum edge separation is **0.02059 club units**; the deliberately overlapping boundaries are not coincident edges. This metric bounds deformation drift, not a measured visible hole. Surface winding, normals, weights and mesh budgets pass. Four human garment batches total **5,856 triangles**.
- The **4,200-frame** arm audit passes with zero failed rest checks, maximum sampled elbow flexion **153.89°** and maximum sampled elbow travel **0.36346 club units**. The adult suite retains **43,128** limb checks, maximum stretch **1.0000000000000013** and maximum exact world-contact error **1.93e-16**. Skin checks cover **7,560** joint pairs; continuous replay checks cover **3,800** intermediate samples.
- The cached human head totals **19,612 triangles**, below its existing 20,000-triangle budget. **15,840** independent eye/face separation checks pass. The facial sculpt remains closed at crown and chin.
- Native Chromium, Firefox and WebKit pass selected Taylor, desktop/portrait club, live Championship contact, exit and reload, with zero runtime/HTTP errors and no overflow. The actual recorded ball/string-center spacing is approximately **0.05 club units**, reflecting the configured contact spacing rather than the exact solver-error metric above.
- [Actual phone capture](phone/report.json) passes exact hand attachment, **157 pose samples**, an unedited **5.335-second** video, **4.193 ms** observed playback discrepancy, exact paused seek, zero Axe/runtime/HTTP errors, no overflow and zero remaining live stream tracks. The [native recording](phone/phone-recording.webm) and screenshots are retained.
- All **74** source/served release artifacts match. The **76-file** standalone archive passes CRC, exact source-byte comparison and [native startup/save/reload](standalone-smoke.json). [Archive bytes and SHA-256](package.json).

The earlier arm/detail commit's portfolio verification remains recorded in `../arm-detail-20261013/portfolio-verify.log` (91 tests, TypeScript, 32 routes, lint 0 errors / 12 existing warnings). This refinement changes the game's source and mirrored static runtime; the portfolio application source is unchanged.

## Reproduction

Run `npm test` and `npm run release:check` from `rally-house-source-v16`. Start `node qa/serve.mjs` on port 8078. Run `QA_ENGINE=chromium QA_OUT=/tmp/taylor-browser node qa/taylor-human.mjs`, repeating for Firefox and WebKit; `QA_OUT=/tmp/taylor-phone node qa/phone-capture.mjs` checks real recording. `QA_REFERENCE=0 QA_OUT=/tmp/taylor-inspect node qa/taylor-proportions.mjs` captures the inspection stage. Set `QA_BASELINE_RUNTIME` to a complete compiled snapshot to reproduce the old comparison.
