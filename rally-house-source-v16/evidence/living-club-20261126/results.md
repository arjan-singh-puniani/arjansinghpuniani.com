# Living club pass — 26 November 2026

Baseline: `e32d1fab`. Branch: `feature/rally-house-living-club-20261126`.
Local preview: http://127.0.0.1:18132/ . Comparison: `comparison.html`.
No deployment or merge was performed for this pass.

## What changed

- The director can run one quiet solo routine alongside one foreground scene. Barbara takes tea, Contessa reviews notes, Lucresia stretches, and Leo checks his racket. These use actual navigation, existing poses/props, and completed activity receipts.
- Optional routines have separate pacing, repeat cooldowns, and saved completion counts. They cannot take over foreground speech or postpone a conversation after completion/failure.
- Direct player invitations and court bookings can preempt optional routines. Their character cards continue to offer conversation and challenges. Committed activities retain their reservations. An unavailable court does not cancel an unrelated break.
- Releasing a parallel routine no longer clears another activity's lesson flag.
- Added a practice-board diagram, equipment grip rolls, a ball tube, folded towels, a tea tray, and a courtside bottle. 575 static meshes versus 528 at baseline. Existing materials and cached static transforms; no new dependencies, downloaded assets, particles, or navigation obstacles.
- The interactive whiteboard sketch keeps its own clear area. The new props are decorative parts of existing furniture, not new individual interactions.

Implementation: `src/simulation/EverydayLife.ts`, `src/Game.ts`, `src/simulation/ActivitySystem.ts`, `src/ui/ClubContextPresenter.ts`, `src/world/World.ts`. Ball physics, input timing, shot classification, movement solvers, and scoring were not edited.

## Checks and evidence

All 69 regression scripts passed across the full-suite attempt and targeted continuation after the two fixture corrections. See `regression-summary.json` and `remaining-tests.json`. The initial failure output is retained in `initial-checks.json`. After the final availability guard alignment, all six focused invitation, reservation, avatar-switch, decor, and causality checks passed again (`final-invitation-checks.json`).

- `tests/living-club.mjs`: concurrent scenes, distinct reservations, separate pacing, persistence, speech ownership, immediate invitation preemption, no invented completion reward, committed-court protection, parallel lesson state, closing hours, and all four routines completing through real travel/animation.
- Actual director execution: 76.15 seconds of overlapping life scenes in a four-minute simulation; never more than two life scenes.
- One simulated hour across three club days: 22 scene families, all six NPC pairs, 13 locations, zero cancellation/failure flags. This is deterministic simulation evidence, not a human enjoyment score.
- Two controlled witness tests now explicitly disable autonomous background travel. They require a specific observer to stay near court while validating result memory and its follow-up; the new director otherwise correctly sends that observer to an activity. Witness criteria and assertions were retained.
- WebKit live browser check: pointer serve, drive and lob returns, pause, Analyze Swing entry and three serve phases, portrait layout, keyboard response after replay, and return to club. No page/console errors. See `gameplay/report.json`.
- `before.webm` and `after.webm`: the same arrival and camera sequence. The camera is matched; autonomous activity timing is allowed to differ.
- Desktop closeups and 402 × 874 WebKit screenshot were inspected for clipping, placement, and interface layout.

## Limits

This is a focused enrichment of the existing four-person club, not a larger crowd or new social system. Quiet routines reuse existing animation vocabulary. Their counts and cooldowns persist; an in-progress routine is not resumed mid-pose after reload, consistent with existing activity persistence.

Browser captures and tests ran on this Mac. Mobile-sized WebKit is not physical iPhone validation; heat, battery, and sustained on-device performance remain unverified. New uncoached playtesting has not been performed for this pass. Added geometry still has a rendering cost, even though its CPU transforms are cached.

## Performance

Mac Apple M2, hardware-accelerated desktop browsers, render scale 1. Eight separate 15-second samples, each after 18 seconds of club activity; before/after/after/before order in each engine. CPU-heavy regression tests had finished before measurement. Raw data: `performance.json`.

| Environment | Baseline p95 | Updated p95 | Frames over 50 ms |
|---|---:|---:|---:|
| Chromium, 1200 × 900 | 16.7–16.8 ms | 16.7–16.8 ms | 0 in all samples |
| WebKit, 402 × 874 | 18 ms | 18 ms | 0 in all samples |

Each sample contained 900 measured frames. At the final sampled club state, draw calls rose from 778 to 825 and triangles from 475,921 to 490,897. The added detail has a measurable geometry cost, but no frame-pacing regression appeared in these samples. No console/page errors occurred. These are short browser measurements, not a thermal or battery test. The final café/coaching availability guard alignment was applied after these samples; the scene geometry and animation behavior measured here were unchanged.

Release artifacts were synchronized locally and import parity checked. The result is ready for local review; production is unchanged.
