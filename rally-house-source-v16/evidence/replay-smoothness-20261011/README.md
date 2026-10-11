# Continuous registered replay — 11 October 2026

The reference supplied is a still image. This pass validates our actual moving replay, without claiming a comparison to unseen reference footage.

One cached continuous pose drives the anatomical skin, overlay, ball, camera, projected joint hit targets and measurements. Observed events remain exact; missing intervals remain missing. Static plot/history caches bound per-frame work. Taylor facial geometry changes do not freeze the body.

- `game-tests.log`: all 24 game suites.
- `motion-final/report.json`: six real RAF motion checks for Arjan/Taylor × gait/forehand/serve; measurements and graph cursor checked on all 540 frames, fractional canvas joint pick. `motion-final/registered-motion.webm` is unedited browser playback, including source changes.
- `chromium`, `webkit`, `firefox`: 24 responsive views per engine, native controls, projected joint picking, 100 open/close cycles and actual frame-time measurements.
- `release`: actual Championship recording/contact/ball registration.
- `impact-retry`: shipped phone viewport, four opponents, heavy contact, audio cleanup and standalone reload.
- Curated WebP captures are derived from preserved local PNGs; the curation manifest records original and output hashes.

Distances use club units. This is simulated rig analysis, not video pose estimation or measured force/medical data. Browser phone viewports do not establish physical-phone performance.

## Observed local frame intervals

| Engine | Club median / p95 | Lab median / p95 |
|---|---|---|
| chromium | 16.6 / 18.0 ms | 16.7 / 18.5 ms |
| webkit | 17.0 / 22.0 ms | 17.0 / 20.0 ms |
| firefox | 50.0 / 73.0 ms | 78.0 / 86.0 ms |

Chromium and WebKit remained near 60 fps in these runs. Firefox is a material performance limitation on this Mac in the current session; its slower baseline also prevents an isolated before/after inference. Its 120-frame profile reaches the end of the clip (`playing:false` in the report), so it is not proof of sustained smooth playback. The first Firefox run overlapped a production build and is preserved in `firefox-during-build`. The repeat had no concurrent task build, but system iCloud/File Provider and media analysis processes were consuming substantial CPU. No user/background services were stopped. Functional browser checks pass; no universal FPS claim is made.

The first shipped impact run passed the phone view, all 16 held-contact exits and audio disposal, then timed out awaiting the first standalone startup. Its report remains in `impact`; the repeated full check passes five extracted-package reloads in `impact-retry`. A separate startup diagnostic also records console/request failures. A fresh uncached diagnostic caught `ERR_CONNECTION_RESET` while parallel modules loaded through the old default Python QA server. The test server now matches the existing packaged launcher’s `request_queue_size=128`; five independent uncached startups pass with no console/request/HTTP failures. The failed diagnostic is preserved in `standalone-default-server-diagnostic.json`. No gameplay change was needed for this test-server correction.
