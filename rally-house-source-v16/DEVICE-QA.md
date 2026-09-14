# Device and browser QA — v16

## Tested browser engines

The local Playwright matrix opens the build, reads member cards, saves and reloads, detects a stale save, attempts keyboard character selection, and opens the Club Book at 390×844. Captures wait for the panel transition to finish.

- Chromium headless shell 1243, macOS ARM64: tested; no page errors in the matrix.
- WebKit test engine 2359 using its installed executable: tested; no page errors in the matrix. This is not physical Safari certification.
- Firefox test engine 1538: tested; startup, reload, stale-save protection and portrait overflow checks pass with no page errors.

Keyboard selection produced Lucresia in Chromium and Firefox; the WebKit selection title was empty, so that specific WebKit check remains unresolved rather than passed. See qa/v16-matrix.json.

The stronger primary/fallback save-concurrency test uses two actual Chromium pages. Other Chromium checks exercise both avatar selections across reload, canvas context-loss recovery, corrupt-save protection, frame catch-up, hidden-document pause and adaptive quality. The mixed browser session covers portrait and landscape layouts. Layout emulation does not reproduce phone GPU, touch accuracy, thermal behavior or safe-area/browser chrome behavior on physical hardware.

## Physical-device tests

Not performed. No physical iPhone, Android, tablet or independent desktop-browser test results have been supplied.

Before production release, record device model, OS/browser version, display scale, refresh rate, viewport and whether hardware acceleration is enabled. On each representative device:

1. Play a fresh 20–30 minute session with audio unlocked by a user gesture.
2. Watch walking turns, passing, seat entry/exit and a completed tennis lesson.
3. Pan, pinch, select an object, read a long caption and close panels.
4. Save, background the browser, return and reload. Confirm progress and avatar selection.
5. Observe thermal slowdown, audio repetition, frame pacing and memory pressure.
6. Test keyboard focus and captions with an actual screen reader where relevant.
7. Record defects with exact actions and times, rather than an overall “works” mark.

Audio was disabled for the long automated observation to avoid disturbing the workspace. Therefore those sessions do not establish audible mix quality, non-repetitiveness, or phone audio-resume behavior. No voiced dialogue was added.

Final emulated-touch rerun: startup wait timed out before interactions. This attempt is not a pass; physical touch testing and a successful final emulation remain open.

Final two-avatar rerun also timed out at startup after correcting its picker navigation. Earlier two-avatar results and the final standalone-package Arjan smoke test are retained separately. See qa/v16-late-attempts.json.
