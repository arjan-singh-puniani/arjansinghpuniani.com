# Rally House — event demo resilience, October 9, 2026

This pass executes the [tailored brief](RALLY-HOUSE-TAILORED-PROMPT.md) through four sequential roles: architecture audit, implementation, independent review, and measured optimization. It follows the earlier [heavier-contact pass](CHAMPIONSHIP-IMPACT-20261009.md). The living-club reveal, same-world camera orbit, and selected contact tuning remain the foundation.

## Architecture and scope

The portfolio defers the game iframe until Play and owns its framing and fullscreen controls. `main.ts` constructs `Game` and awaits saved-club restoration. `Game` integrates the fixed-step world, actors, activities, presentation, and persistence. `ActivitySystem` owns reservations; `ChampionshipController` owns match phases and scores. `MatchInput` owns intent; `InteractiveMatchSystem` consumes it and uses `Character`'s live string-bed frame as contact authority. Physical contact drives ball dwell/release, stroke hold, sound, and render-only camera feedback. The HUD presents state and invokes actions; it does not own match progress.

`SaveSystem` persists completed events with IndexedDB ownership checks and a locked fallback. No new service, account system, API, or database is needed for these failures. Work stayed in the isolated validation clone; the original dirty Desktop checkouts were not edited.

## Baseline failures and decisions

| Reproduced trigger | Before | Resulting behavior |
| --- | --- | --- |
| Focus Exit during serving and press Space | A serve began while Exit kept focus | Native buttons retain Space/Enter; gameplay receives input outside interactive controls |
| Put a second finger on the movement pad | Steering reversed from +0.9 to −0.9 | The first pointer keeps ownership until release; phase changes and interruptions release capture and intent together |
| Deliver a visible two-second frame gap | 120 fixed updates before a render | Championship runs at most six fixed ticks, about 100 ms, and drops excess debt; ordinary club catch-up is preserved |
| Interrupt a live match | The ball continued while focus moved away | Match pauses on blur/hidden, clears input, and waits for explicit Resume |
| Need sound/motion changes during a match | Ordinary settings were hidden and inert | The pause surface exposes sound and reduced motion using existing settings |
| Open a protected newer save | Hardware-acceleration advice falsely blamed WebGL | Saved-club failure is identified separately, with storage preserved and visible recovery actions |

The six-step limit bounds unseen progress while retaining fixed-step physics at ordinary frame rates. Pausing freezes the world clock and physical match state; resuming clears wall-clock debt. Exit deliberately advances its transition even from a pause and restores the club's previous pause state, speed, and saved camera. Mute uses the same volume preference as the club controls, remembers the prior audible value, and preserves normal volume adjustment after exit.

Focused controls must support native activation; this follows the [W3C button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/). Pointer capture owns subsequent events until release; phase/pause cleanup therefore releases capture and intent together, following [the pointer capture API](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture). Browser animation callbacks can pause for hidden tabs/iframes; timing and resume behavior account for that [documented lifecycle](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame).

## Review and iteration

The independent reviewer reproduced a further 390×280 failure: the centered pause panel covered the original corner Resume and Exit controls. The final panel contains its own Resume and Return actions; compact styling preserves reachable controls on short screens. The reviewer then verified real pointer activation of both actions and exact club restoration at that size, with no remaining material findings.

Visual inspection also exposed the existing startup illustration occupying the entire failure screen and hiding recovery text. The fallback now constrains that illustration, keeps recovery actions visible in portrait/landscape, and disables club actions during failed startup. The illustration is labelled as an illustration. A typed saved-club load error distinguishes restore failures from other startup failures; no raw exception is inserted into product copy and no recovery action deletes data.

The first multitouch QA draft incorrectly passed a nonempty touch list to CDP `touchEnd`; browser event traces identified the harness error. The final harness uses an empty list as required by [Chrome's input protocol](https://chromedevtools.github.io/devtools-protocol/tot/Input/#method-dispatchTouchEvent). Real two-finger input tests ownership, and a delayed DOM move tests retired-pointer rejection. This was a QA repair, not a product regression.

## Validation and reproduction

`npm test` runs the 18 game suites, including contact at 30/60/120 Hz, live steering during holds, camera restoration, scoring/history causality, navigation, and audio envelopes. `npm run verify` in the portfolio checks lint, types, 91 tests, and the 31-route build. Lint retains fifteen pre-existing warnings and no errors. `npm run release:check` compares all 58 source/served artifacts and their imports; the standalone package contains 60 files and passes CRC verification.

With the source on 8078, `node qa/session-validation.mjs` checks four game layouts (1280×800, 390×844, 844×390, 390×280), native keyboard activation, pause-control pointer hits, HUD Axe results, real two-finger steering, and retired-pointer rejection. Eight flight/string-dwell pauses keep ball, score, actor, stroke, hold, and contact count exactly unchanged. Resume produces one contact, and paused exit restores the prior paused club at speed 2. Nine 100/500/2000 ms stall injections cover serving, flight, and held contact, with finite state, bounded debt, and no unseen scored point. Malformed, future, invalid, and unavailable storage cases preserve their protected bytes; unavailable WebGL still receives graphics-specific guidance.

The existing `qa/impact-validation.mjs` passes the shipped portfolio through its actual UI at nine sizes, sixteen exits during held contact across four opponents and two motion settings, audio cache/disposal, and five reloads of the extracted package. It requires production port 3096 and extracted-package port 8079. `qa/session-baseline.mjs` records the earlier triggers; run it against the earlier commit to reproduce the before evidence rather than relabelling the repaired build as the baseline.

The optimizer's 32 repeated sessions cover all opponents and both motion settings. They restore the exact saved camera, prior pause/speed, court ownership, input, competitor state, and camera impulse. Total DOM stays within 202–203 with no cumulative increase; coarse reported heap is 10 MB at first and last sample. Instrumented transient audio connections settle to zero after each cycle. This instrumentation does not count browser-internal GPU allocations or every Web Audio implementation detail.

The definitive isolated trial runs 1,200 actual RAF frames with 16 authoritative contacts: median 16.7 ms, p95 16.7 ms, p99 16.8 ms, matching the previous isolated cadence, with no page errors. Its smoothed endpoint CPU snapshot is 0.062 ms simulation and 3.105 ms rendering (previous endpoints 0.083/2.226 ms); those are not full-trial CPU averages. Draw calls/triangles remain 888/273,356, and the original production audio graph retains its peak and attack bounds. The earlier `session` label could have overlapped compilation; only `session-isolated` is used for the final comparison. No further optimization was supported by this short trial.

Run `node qa/session-lifecycle.mjs` to reproduce the 32-session stress check. Run `node qa/impact-browser.mjs session-isolated` alone for the frame/audio trial, with no build or other browser QA running concurrently.

The headless-shell runtime kept both pages visible and did not deliver lifecycle events when QA opened another tab. The report records that attempt as `lifecycleDelivered: false`, then verifies the actual hidden/visible handler using explicit visibility events, with explicit Resume still required. Real headed/OS tab switching, physical Safari/phone performance, and human judgment of fun remain separate gates.

Curated before/after reports and screenshots are in `evidence/session-20261009/`. Preview deployment success does not bypass Vercel sign-in or imply a public main-branch deployment.
