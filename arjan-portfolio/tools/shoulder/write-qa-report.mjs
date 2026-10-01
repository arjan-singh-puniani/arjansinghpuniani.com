import { readFile, writeFile } from "node:fs/promises";
const browser = JSON.parse(
  await readFile("Documentation/shoulder-qa/browser-results.json"),
);
const capability = JSON.parse(
  await readFile("Documentation/shoulder-qa/capability-results.json"),
);
const compress = JSON.parse(
  await readFile("Documentation/shoulder-qa/compression/results.json"),
);
const m = browser.desktop.metrics;
await writeFile(
  "Documentation/SHOULDER-VISUAL-QA.md",
  `# Shoulder 2.0 — visual and engineering review

2026-09-30. Reconstruction candidate on branch holoanatomy-shoulder-2-20260930. Not deployed. Physical-iPhone performance and independent clinical review remain open; they are not inferred from emulation or passing tests.

## Visual evidence

Desktop captures: 1440×900 CSS pixels. Mobile: 390×844 CSS pixels, DPR2 browser emulation with renderer DPR capped at 1.5. PNG mobile images have twice the CSS-pixel dimensions. Landscape: 844×390. Source geometry is identical to the audit except the documented rigid normalization and optional scapula-only LODs.

| State | Before | After |
|---|---|---|
| Default | [Deployed shoulder](shoulder-baseline/default.png) | [Cuff-focused studio](shoulder-qa/initial.png) |
| Posterior | [Original camera axes](shoulder-baseline/posterior.png) | [Anatomical posterior](shoulder-qa/posterior.png) |
| Anterior | [Original camera axes](shoulder-baseline/anterior.png) | [Anatomical anterior](shoulder-qa/anterior.png) |
| Superior | [Original camera axes](shoulder-baseline/superior.png) | [Supraspinatus view](shoulder-qa/superior.png) |
| Dissection | [Original staging](shoulder-baseline/dissection.png) | [Peel](shoulder-qa/peel.png) / [four-slot table](shoulder-qa/staging-table.png) |
| Mobile | [Deployed mobile](shoulder-baseline/mobile.png) | [Mobile studio](shoulder-qa/mobile-initial.png) |

The original renderer did not transform the source Z-up anatomy into its Y-up camera convention. Accordingly, original-camera-axis baseline filenames must not be interpreted as clinically validated anatomical directions. The reconstruction's posterior/anterior direction is checked against the scapular spine/costal surface in Blender reference renders.

![Before](shoulder-baseline/default.png)
![After](shoulder-qa/initial.png)

## Composition and comparison

The posterior studio makes supraspinatus, infraspinatus and teres minor distinguishable in one composition. The anatomical coordinate transform replaces the previous superior-looking, sideways default. The source humerus is preserved; only the distal shaft is visually clipped in cuff views, with an explicit on-screen crop note. Regional vascular context restores the full structure. No synthetic cut cap, tendon or footprint is introduced.

The [posterior reference](reference-renders/posterior-cuff.png), [anterior reference](reference-renders/anterior-cuff.png), [superior reference](reference-renders/superior-cuff.png), [lateral reference](reference-renders/lateral-insertion.png) and [exploded reference](reference-renders/exploded-cuff.png) were generated before browser integration. Web posterior/anterior/superior/lateral screenshots preserve the reference silhouettes, relative muscle placement and source surface limitations. Web materials use a more muted palette and lighter background; exact pixel equality with Cycles is neither expected nor claimed. Web Peel uses camera-relative table positions instead of the reference render's fixed exploded offsets.

Source facets remain visible in small cuff meshes, particularly near their ends. No surface shader can supply missing tendon detail. The current result meets an honest low-resolution atlas presentation, not a textured cadaveric-detail claim. See SHOULDER-ASSET-GAP.md for the priority acquisition list.

## Mode evidence

- [Selected structure](shoulder-qa/selected.png): source identity, curriculum text, focus/isolate/clear.
- [Learn](shoulder-qa/learn.png): step-based camera changes and spatial comparisons.
- [Quiz](shoulder-qa/quiz.png): labels removed; answers are picked on the actual mesh; retries do not score.
- [Atlas](shoulder-qa/atlas.png): collision-spaced labels and visible-surface leader anchors; labels behind other anatomy are suppressed.
- [Mobile Learn](shoulder-qa/mobile-learn.png), [Peel](shoulder-qa/mobile-peel.png), [Quiz](shoulder-qa/mobile-quiz.png), [landscape](shoulder-qa/mobile-landscape.png): specimen remains visible while the lower/right control panel scrolls independently.
- [Portfolio integration](shoulder-qa/portfolio-integration.png): route embedded inside existing site navigation.

The initial mobile implementation scrolled the specimen out of view while accessing lesson text. That failed the review and was replaced with independent inspector scrolling. Initial occlusion checks traversed all triangles and caused ~30 ms average desktop frames. A spatial acceleration structure restored the full-detail renderer to the measured budget.

## Measured performance

Environment: local macOS Chrome, headless Chromium rendering, loopback static server, no network throttling. Measurements are not WAN or physical-iPhone claims. Frame samples measure presented rAF intervals during a scripted orbit plus continued rendering, not the old shader-duration-derived “fps”.

| Metric | Desktop measured |
|---|---:|
| Active main-pass triangles | ${m.triangles.toLocaleString()} |
| Active indexed vertices | ${m.vertices.toLocaleString()} |
| Main-pass draw calls | ${m.drawCalls} |
| Total source triangles, all 20 structures | 53,648 |
| GLB LOD0 file | 1,130,508 bytes |
| Original OBJ payload | 3,749,763 bytes |
| GLB loading/registration/BVH | ${m.loadMs.toFixed(1)} ms |
| Navigation to interactive marker | ${browser.desktop.interactive.toFixed(1)} ms |
| Average rAF interval | ${m.meanFrameMs.toFixed(2)} ms |
| 95th percentile rAF interval | ${m.p95FrameMs.toFixed(2)} ms |
| Samples | ${m.samples} |
| DPR / tier | ${m.dpr} / full topology, LOD0 |
| Source texture memory | 0 bytes (no source maps) |
| Shadow map texture estimate | 4 MiB plus approximately 4 MiB depth attachment |

Main-pass renderer.info draw calls exclude shadow rendering. Texture allocation is an estimate, not a vendor GPU memory query. Mobile emulation measured ${browser.mobile.meanFrameMs.toFixed(2)} ms average at DPR ${browser.mobile.dpr}; this does not establish the >=30 fps physical-iPhone gate. Idle rendering stops until interaction, resize or a camera transition requires another frame.

### Compression evaluation

| Candidate | File bytes | gzip bytes | Node parse/decode mean |
|---|---:|---:|---:|
${compress.results.map((r) => `| ${r.kind} | ${r.bytes.toLocaleString()} | ${r.gzipBytes.toLocaleString()} | ${r.meanParseDecodeMs.toFixed(2)} ms |`).join("\n")}

Five parse/decode trials per candidate in Node. Codec decoder startup and browser GPU upload are not included. Draco has the smallest candidate but adds decoding and quantization. Ship plain indexed GLB with the host's HTTP compression until landmark-error validation justifies quantization. KTX2/Basis has no current payload to compress; the source has no textures. Optional LOD1/2 reduce only scapular context, leaving all SITS triangles unchanged; LOD0 remains the default.

## Automated checks

- 87 existing portfolio tests pass with the bounded thread pool. The initial default fork pool timed out in this environment; the repository test configuration now uses two thread workers without changing test assertions.
- 14 dedicated domain/asset checks pass: manifest, tissue classes, SITS, provenance, camera visibility partitions, isolation, Peel/undo, quiz scoring, gesture thresholds, labels, all OBJ fallbacks, indexed GLB LODs and production paths.
- Browser interactions pass: all six presets, real mesh picking, click/drag suppression, trackpad pan, ctrl/pinch zoom, isolation, Peel undo, lesson navigation, actual 3D quiz answers, portrait/landscape layouts, mobile touch, OBJ fallback and LOD2.
- Textured multi-material fixture passes: one synthetic QA-only textured structure coexists with 19 legacy structures; color/normal/roughness/AO maps survive; biological metallic stays zero. Fixture remains outside public assets.
- Accessibility scan: ${capability.accessibility.length} axe violations on the tested desktop Explore state. Keyboard and reduced-motion paths also exercised. This is not a comprehensive screen-reader certification.
- WebKit mobile loads the GLB and completes Learn and Quiz checks with no page errors or failed resources. The earlier startup timeout was caused by a stale production preview returning 404 for the newly added raycast module; rebuilding and restarting the preview resolved it. This does not substitute for physical iPhone performance testing.
- No-WebGL fallback is readable and links to provenance.
- Production typecheck and build pass; 14 major routes and the embedded studio pass smoke tests. Contact is inspected without submitting anything.

## Release gates

| Gate | Status |
|---|---|
| Correct anatomical orientation / cuff-led composition | Implemented and visually inspected |
| Scientific identity and provenance | All 20 official FMA-to-mesh mappings verified; source hashes recorded |
| Source topology preserved in hero asset | Pass; GLB triangle counts match source |
| Orbit, picking, pinch, keyboard, orientation, bounded staging | Automated verification; physical trackpad feel remains a user acceptance check |
| Mobile portrait / landscape / panels / touch | Chromium touch emulation and WebKit mobile checks pass |
| Physical modern iPhone >=30 fps | OPEN — no physical device connected |
| Independent clinical content / anatomical review | OPEN — engineering verification is not clinical sign-off |
| True tendon / fiber / insertion detail | NOT PRESENT — asset ceiling disclosed; no fabricated replacement |
| Portfolio regression / build | Pass |
| Production deployment | Not performed |

Do not label this clinically validated or claim that all production quality gates are closed. It is a reviewable, tested reconstruction candidate with explicit hardware and asset limitations.
`,
);
