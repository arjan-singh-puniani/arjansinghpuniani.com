# v14 QA and release assessment

v14 turns largely interchangeable shared breaks into staged everyday scenes with persistent follow-ups. The source, compiled build, tests, trace logs and screenshots are included. This is a coherent development release with substantially stronger character behavior; it has not earned production certification or a claim of proven human entertainment.

## Audit and baseline

The supplied `Rally-House-Alive-Stories-v13.zip` was extracted into a separate v14 folder. The original remains untouched and is copied into `reference-v13/`. The existing activity architecture, relationship system, social planner, schedules, saves, character poses, renderer and documentation were inspected. The v13 build and all 66 inherited checks passed. v13 also ran in the local headless browser; its earlier documentation's unverified container-GPU status does not describe this local run.

The ten-minute v13 baseline recorded nine completed activities, zero interruptions: opening practice, a match, and seven variations of shared breaks. The diagnosis was not a lack of movement or pairings. The interaction structure and outcome text repeated despite different participants.

## Implemented changes

- Character-specific solo routines, all six pairings, returning dialogue and conditionally eligible rain/closing scenes.
- June's completed notes create a cold-tea follow-up; Mika's completed drink conversation changes later familiarity; a specific completed match supplies the score conversation.
- Physical travel and reservation before acting, multi-beat performance, silence, gestures, props, reactions and completion-only memories.
- A long rally or rain can briefly interrupt an everyday scene, which retains ownership and resumes. Ordinary tennis movement remains under the tennis activity's ownership.
- Scheduled passers-by can wait beside an occupied scene destination. A built bench can host Mika and Leo and retain their visits.
- Optional scene focus, speech kept within the viewport, panels that take precedence over the focus prompt, and no autonomous camera takeover.
- A slower club day, schema-6 persistence/validation, partial-scene safe reset and save-first graphics recovery.

## Automated checks

`npm test` passes the TypeScript build, 44 inherited simulation checks, 22 v13 causal/aliveness checks and 13 new everyday-life checks: 79 total. Output: `qa/v14-tests.txt`.

New checks cover participant availability, no invitation-time memory, failed-start backoff, completed-only follow-ups, learned variants, actual-score dialogue, consumed match IDs, weather/time eligibility, cooldown/breathing room, bounded persistence, invalid-state rejection, v13 migration/schema-6 writing and sticky everyday captions without wall-clock expiry, and perimeter circulation that avoids the playing area.

## Browser checks

- `qa/v14-fast.json`: 600 accelerated simulation seconds completed 14 everyday scenes spanning all four people and 12 distinct scene types, with no failed activities in that run.
- `qa/v14-interruption.json`: a real active notes scene paused on rain, wrote no premature history, resumed and completed, then retained its cold-tea follow-up through reload.
- `qa/v14-acting.json`: staged actual scene beats for visual inspection; cancellation released people/props without adding a completion; mobile speech stayed in bounds and the focus prompt yielded to building.
- `qa/v14-core.json`: drill selection left progress unchanged; actual completed practice increased it; a simulated match completed; Mika and Leo used a player-built bench; progress, results and visits survived reload.
- `qa/mobile-results.json`: touch coaching, pinch zoom, touch placement, reduced-motion setting, keyboard selection and landscape Club Book passed. These are emulated touch/viewport checks, not physical-device tests.
- `qa/v14-reliability.json`: forced WebGL context loss saved and recovered a club with 317 coins and unchanged progress; active everyday reload granted no receipt; malformed new save state was visibly refused. The intentional corruption test logs an expected error; this is not an unexplained runtime failure.

## Real-time observation

`qa/v14-session-summary.json` gives exact elapsed seconds, distinct activities, pairings, scene types, final clock and sampled CPU/render counters. The source observations are `qa/v13-baseline/watch.json`, `qa/v14-candidate/watch.json` and `qa/v14-final/watch.json`, and `qa/v14-release/watch.json`.

The first v14 candidate completed 15 activities, including 11 everyday scenes, over 602.953 seconds. It had zero activity interruptions and no reported browser errors. It included the bonsai exchange, Mika/June support, Nia's spare cup, June's notes, score banter, making room, cold tea, Mika's rehearsal and Leo's grip inspection. The prototype baseline and candidate ran under different concurrent browser loads and have different in-game clock rates; activity counts are not a controlled measure of entertainment or device performance.

A subsequent isolated run (`v14-final`) exposed severe renderer stalls in this environment. The old 0.5-second catch-up cap discarded elapsed time and made the simulation crawl. This was a failed pacing check, not a successful production benchmark. The release now catches up at most two seconds through 120 fixed simulation steps, resets accumulated time on visibility changes, and adapts rendering pixel resolution between 0.64× and 1×. Scene geometry, lighting and shadow maps are retained; Full detail disables adaptation.

`qa/v14-frame-check.json` verifies 1.5 seconds of simulation after a 1.5-second stall, no advance in the hidden-tab path, adaptive resolution reduction and the full-detail override. The final post-fix watch run is `qa/v14-release/watch.json`; exact results appear in the release evidence note. The perimeter-routing adjustment was verified after that soak began using the 600-second accelerated browser integration and a route-segment test; it did not receive an additional full real-time soak. A final HUD copy adjustment moved the unfinished-intention counter out of the main view and left it in the Club Book; that adjustment was build-checked. No claim is made that an unattended run tests every possible UI state.

## Visual inspection

The existing miniature-club geometry, palette, hybrid skins and lamp shadows remain. Screenshots include the bonsai exchange, notes, cup offer, equipment exchange, mobile speech/build layout and graphics recovery. Character acting is a procedural layer over the existing rig, not a replacement animation system.

Some inherited static seating and close approaches remain imperfect. Single screenshots cannot establish motion quality; human art review of transitions and spacing is still needed. The optional focus button lets the player choose a close view; scenes do not automatically frame themselves.

## Performance limits

The harness uses Chromium headless-shell in the same environment whose renderer diagnostics reported ANGLE/SwiftShader. Parallel software-rendered browsers visibly slowed the candidate run; it must not be used to claim real-device frame rate. Snapshot CPU timings are smoothed instrumentation samples, not GPU frame time or frame-time percentiles. Draw calls, triangles and entity counts are retained in the summary. Physical iPhone/Safari, MacBook Air GPU, thermal, battery and longer-duration memory budgets are not certified.

## Remaining production gates

- **Human readability and enjoyment:** test unprompted recall, who people care about, missed lines, repetition and desire to watch another day. No human participant feedback was collected here.
- **Longer-term variety and overnight pacing:** a small authored catalog has recognizable habits but cannot sustain unlimited fresh comedy. Second visits acknowledge history; further content should follow observed repetition problems. After-hours quiet remains and should be tested on returning saves, not only fresh morning clubs.
- **Physical polish:** props and handling are stylized. Destination courtesy is not a continuous crowd collision solver. Dense placements and all static seats need more coverage.
- **Platform coverage:** real mobile performance, browser-specific audio/input behavior and long sessions need acceptance tests. Tested context recovery is one recovery path, not proof against every graphics failure.
- **Persistence scope:** this is local single-profile persistence, with no cloud sync or cross-tab conflict resolution. Partial scenes reset instead of resuming the exact beat.
- **Social depth:** authored scenes use selected state, not a general dialogue AI. Ordinary exchanges change existing relationships; they do not implement a full emotional-needs model or inventory simulation.

## Reproduce

```sh
npm ci
npm test
python3 -m http.server 8080 --bind 127.0.0.1
```

For browser QA, install Playwright locally or set `PLAYWRIGHT_MODULE`; set `CHROMIUM_EXECUTABLE` if using a specific browser. The helper can also use the development machine's existing bundled runtime. Browser tests use isolated profiles.

```sh
node qa/browser.mjs everyday
node qa/browser.mjs acting
node qa/browser.mjs reliability
node qa/browser.mjs core-v14
node qa/browser.mjs frames
node qa/watch.mjs replay 600
python3 qa/summarize-v14.py
```

`replay` creates its own log folder; the summary script summarizes the named release runs. Earlier QA files in the archive are historical and are not v14 test evidence unless named above.

## Final release evidence

The post-fix observation recorded 608.111 seconds (10 minutes 8 seconds), 20 completed activities, 15 completed everyday scenes across 12 scene types, zero activity cancellations and no reported browser errors. All four members participated. Adaptive rendering reached 0.64× pixel resolution in this software-rendered environment.

The final source passes 79 automated checks and compiles all 31 modules. The current-build visual capture is `qa/v14-release-desktop.png`; it uses full-detail rendering and a deliberately staged scene beat for inspection, not an uninterrupted play session. Human enjoyment and physical-device performance remain unverified.
