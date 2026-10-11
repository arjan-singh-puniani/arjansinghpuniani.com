# Avatar / rig registration correction — October 11, 2026

The prior default contact lens displaced the skeleton by (.36, 0, -.08) club units at contact. Translucent, overlapping garment surfaces made the silhouette confusing. Human limbs used coarse segments with child-bone influence spread over the whole segment; independently positioned shoulder spheres left openings when the sleeves rotated.

The default overlay now uses captured joint coordinates throughout playback. Slow contact changes time only. Separate rig is an explicit, static .85-unit inspection offset; opening the lab restores registration. Captured surfaces retain their original opacity. Only joint rods, nodes and selected angle arcs render above the visible body in an annotation pass; world depth testing is restored afterward.

Human shirts and limbs use smooth cross-sections. Child-bone blending on human limbs is restricted to the final quarter near the joint. Upper-arm skinned shoulder caps replace the shifted shoulder spheres. Taylor's authored geometry, face and contact solver are preserved; her overlay now follows the actual limbs.

Validation:

- All **23 game suites** pass; full output in `game-tests.log`.
- Actual GPU-skinned triangle cross-sections: **84 surface samples**, maximum endpoint-centre registration error **0.000000370 club units**; maximum intermediate limb-centre deviation **0.016363 units**. These are geometry tolerances, not human pose-estimation accuracy.
- **766 replay samples** preserve captured avatar surfaces and register every default joint annotation exactly to the captured landmarks.
- Garment topology verifies one cuff opening per human sleeve and no shoulder-cap opening. Waist, elbow, knee and Taylor boot seam checks pass.
- Chromium, WebKit and Firefox each pass **24 size/view combinations** and **100 replay lifecycle cycles**, native station entry, registered and separated joint picking, reduced motion, camera restoration and persisted-page reopening. No recorded JS or HTTP errors.
- Genuine Arjan and Taylor walk/forehand/serve captures, plus Taylor at 390 × 844, are in `screens/avatars`.
- Real Championship recording: **60 samples, one player contact, one bounce**, .05-unit ball/strings contact gap; selected replay time equals its source frame time. See `release/recording.json`.
- Portfolio: **91 tests**, TypeScript and production build pass; lint reports zero errors and 12 retained warnings. Source/served release check matches **68 artifacts**.
- Standalone: **70 files**, approximately **222 KiB**, CRC verified; extracted runtime compared byte-for-byte with all four changed source modules.

Sequential local frame observations: Chromium/Metal replay median 16.7 ms, p95 18.2 ms; WebKit 17 / 18 ms; Firefox 28 / 29 ms. These are local observations, not universal device performance guarantees.

Original PNGs remain local and unstaged. `screens` contains genuine WebP conversions; `capture-manifest.json` records original and curated hashes. The unchanged before capture is `../performance-lab-20261011/screens/chromium/1440x900-body.webp`. Current `screens/chromium/1440x900-body.webp` uses the same source, contact time, camera and viewport.

Reproduce with `npm test`, `npm run release:check`, `QA_OUT=evidence/rig-registration-20261011/chromium node qa/performance-lab.mjs`, corresponding `QA_ENGINE=webkit` / `firefox` runs, and `node qa/rig-registration.mjs`.

The fresh phone release check at 390 × 844 also passes Axe with zero violations, native Championship serving/return, 16 exits during held contact across all opponents and both motion modes, 12 bounded audio buffers/disposal, and five extracted-package reloads. See `impact/validation.json`. The first attempt exposed a stale temporary Next server after an in-place rebuild (400 for its old webpack chunk); the known temporary server was restarted and the complete check rerun successfully. The diagnostic screenshot is retained rather than discarded.
