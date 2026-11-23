# Browser tester-readiness pass — 22 November 2026

This pass removes friction from the existing vertical slice. It changes no ball physics, opponent tactics, avatar geometry, or save schema. Production remains unchanged.

## What changed and why

| Change | Reason | Verification |
| --- | --- | --- |
| Visible desktop Swing beside the existing Lob control | Pointer players could see Lob but had to discover a keyboard shortcut for a normal return. | Chromium and WebKit pointer input produced actual drive and lob contacts. Keyboard input still worked after analysis closed. |
| Suppress contact praise while paused | A recent lob could leave “LOB · RECOVER” displayed over the pause state. | A targeted paused presentation fixture checks empty praise and inactive cue styling in both engines. |
| Scrollable result panel, 44px minimum action targets, no duplicate score in short result views | Short windows need reachable actions and one clear final score. | Rendered fixtures at 640 × 240 and 320 × 568: panel fits, every button is reachable, duplicate score hidden at the short height. Fixtures are layout checks, not claims of naturally completed matches. |
| Initialize native video controls only for an actual recording; release video source when leaving it | An unused hidden video initialized WebKit media controls on every club visit and emitted four native icon errors. | Both engines passed match → pause → serve analysis → resume → club with zero console/page errors. Actual Chromium recording, playback, seeking, source switching and close passed. |

Explanatory comments are next to the non-obvious behavior. Runtime changes are mirrored into the portfolio's bundled game.

## Browser evidence

Artifacts are under `evidence/tester-polish-20261122/`:

- `chromium/report.json` and `webkit/report.json`: desktop pointer contacts, replay transitions, keyboard focus recovery, and extreme result layouts; both passed.
- `touch-chromium/report.json` and `touch-webkit/report.json`: actual drive/lob contact across desktop, portrait and landscape layouts; no console errors or page overflow. Chromium additionally checks simultaneous movement/shot touch and touch cancellation.
- `recording/report.json`: a real 5.24-second, 160-sample browser recording; live capture tracks released, playback alignment error about 13ms, seek error zero, no reported Axe violations, console errors or failed requests. Actual recording was checked in Chromium only. The test now checks the selected recorded avatar rather than obsolete text in a marketing heading. The earlier assertion failure is retained as `recording-before-qa-fix.json`.
- `regressions.json`: performance-lab, phone-capture, serve-snapshots and studio-polish suites passed.
- `soak-webkit/report.json`: 180.076-second follow-up passed: 51 shot inputs, 20 lob inputs, one completed match/rematch and one analysis review; zero console errors, WebGL errors or context losses. Geometry count stayed at 86 and DOM count at 309. Recording and sound caches stayed within their bounds.

Frame pacing is still a limitation: WebKit recorded 9,949 frames, a median interval of 17ms in each sample window, window p95 intervals of 25–33ms, and 73 intervals above 50ms. Median measured render time was 4ms. There was no observed resource-count growth, but WebKit does not expose retained heap in this harness. These data do not isolate the cause of occasional stalls or establish a locked 60fps experience. Controlled profiling and testers' reports of visible interruption should guide further performance work; lowering rendering quality without identifying the cause would be speculative.

The previous ten-minute Chromium run remains evidence for the underlying slice. The previous ten-minute WebKit report remains marked failed at its strict console gate; it is not retroactively relabeled. This pass fixes unnecessary media-control initialization in normal gameplay. It does not establish that native video controls are error-free in every WebKit recording configuration.

## Recommendation and boundaries

Ready for a controlled, uncoached browser playtest: the final sustained-session and release checks passed. All 133 runtime artifacts match the served mirror; the regenerated 135-file ZIP passed CRC validation and has a per-file SHA-256 manifest. Use the neutral [playtest protocol](PLAYTEST.md); do not tell testers which mechanics they should like. Record observed behavior separately from interpretation.

No external playtest results exist yet. These automated rematches are not evidence of voluntary replay or enjoyment. iPhone hardware, heat, battery use and speaker listening were explicitly deferred for this browser-only pass. Mobile viewports and touch emulation do not replace those checks. Further investment should follow observed control confusion, tactical choices, opponent recognition and voluntary rematches.

The ZIP requires a local HTTP server; localhost preview links work only on this Mac. The existing schema-12 preview remains isolated from production saves. No production release is recommended before the human playtest evidence is reviewed.
