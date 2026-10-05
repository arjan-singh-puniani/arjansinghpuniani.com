# World as interface — validation

Validated 4 October 2026 against the current Rally House filesystem.

## Baseline

`npm test` passed before behavior changes. No baseline failures were observed. The source already contained valuable uncommitted Championship, tactile interaction, atmosphere and contact work; the scoped backup includes those changes.

Baseline log: `qa/world-interface/baseline-tests.log`.

## Automated suite

The full `npm test` command passes after implementation, including strict TypeScript compilation and all existing simulation, walking, character life, presence, save/causality, Championship, studio-polish and contact regressions.

New `tests/world-interface.mjs` checks finite projection, canvas offsets, viewport bounds for all four target sizes, authoritative energy display, unavailable challenge/conversation/drill suppression, and furniture interaction/history presentation.

Final log: `qa/world-interface/final-tests.log`.

## Browser QA

Headless Chromium with the Metal renderer:

| Viewport | Result |
| --- | --- |
| 1280×800 desktop | PASS |
| 1024×768 tablet | PASS |
| 390×844 portrait | PASS |
| 844×390 landscape | PASS |

`qa/world-interface.mjs` checks all four core member cards at every size, true energy values, dismissal, camera movement, resizing, reduced motion, entity deletion, pointer selection, keyboard selection and routing, changing reservations, prop-history display/deletion, Championship suppression, exact captured camera restoration, repeat challenge/return, reload and console errors.

Bell interaction ran through real-time browser travel, active animation/effect and completion. Journal, strings, tea and bonsai transactions also completed; those additional transaction checks accelerate existing fixed-step simulation ticks rather than waiting for all travel in real time.

Championship entered through the real card button, staged approach and camera transition, accepted a keyboard serve, reached match results, returned and repeated. The result/return stress check uses the existing debug point-resolution hook to finish scoring. It is not a human-played seven-point match. Existing contact tests independently validate physical ball/racket contact at 30, 60 and 120 Hz.

`qa/world-final-check.mjs` additionally passes actual touchscreen tap selection/dismissal, OS reduced-motion CSS, Happening Now focus, offscreen Find return, card measurement after hiding, portrait-to-landscape rotation, marker cleanup and selection disappearance. The final landscape card occupies y=74…302, leaving the control region clear.

All observed browser page/console errors: zero.

The actual portfolio-served build was then loaded separately: spatial card, Challenge action and single-layer lifecycle PASS with zero browser errors. Evidence: `qa/world-interface/served-check.json` and `portfolio-served.png`.

Machine-readable results: `qa/world-interface/results.json` and `final-check.json`.

## Visual review

Before and after screenshots were captured and inspected. The earlier character selection zoomed strongly into the club and placed a fixed edge sheet. The new selection retains the miniature overview, connects the card to its subject and exposes only a few activity labels. Portrait selection brings an offscreen member into view; landscape cards scroll within a bounded height. Card entry uses a short fade and five-pixel translation; reduced motion removes it.

Screenshots: `qa/world-interface/` (before overview/member, four-size overview/member/object, embodied bell, Championship and final touch landscape).

## Performance sample

100 requestAnimationFrame samples per build at 1280×800, full detail, warm browser, club paused. The after sample includes an open character card and selection ring.

| Measurement | Before | After |
| --- | ---: | ---: |
| Median frame interval | 16.70 ms | 16.60 ms |
| 95th percentile frame interval | 17.50 ms | 17.90 ms |
| Draw calls | 784 | 785 |

Spatial update median: 0.10 ms; 95th percentile: 0.20 ms. One ring adds one render item/draw call. No major regression appeared in this local sample. This is a short Chromium sample, not a guarantee for every device. Raw data: `qa/world-interface/performance.json`.

## Issues found and resolved

- Portrait selection initially left an offscreen member outside the narrow view. Touch selection now eases toward the selected location without changing the lens or zoom.
- Hidden-card ResizeObserver reports were replacing real card dimensions with zero. Zero reports are now ignored; border-box measurements are retained.
- Landscape rotation needed a tighter height cap to preserve all control clearance. Card height now reserves the same 162 pixels as the anchor bounds.
- The first QA results locator selected the hidden Championship exit button. The test now targets the explicit results and exit controls separately.

## Scope and remaining human checks

Source and served files are copied with baseline hash checks using `WORLD-AS-INTERFACE-SYNC.json`. No unrelated repository file is changed by this pass. Save schema and dependencies are unchanged.

Remaining human checks: a complete match played by hand, physical iOS/Android browser safe areas and dynamic browser chrome, sound quality/levels, and subjective first-minute/portfolio recording quality. Firefox and WebKit were not revalidated in this pass. Use PLAYTEST-CHECKLIST.md for these experiential checks.
