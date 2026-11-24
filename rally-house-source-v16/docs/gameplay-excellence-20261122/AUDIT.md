# Rally House gameplay audit — 22 November 2026

## Baseline and isolation

Work started from fetched `origin/main` at `d0218b52`, on `feature/rally-house-gameplay-slice-20261122`, in a separate worktree. The canonical checkout contains unrelated edits and was left untouched. Production was not deployed. No dependencies were added.

The baseline full `npm test` passed, including the existing geometry, serve, input, save, character, and replay suites. Baseline browser capture: `evidence/gameplay-slice-20261122/baseline/report.json`; 6.568 seconds from Play to serve, four viewport checks, 60 seconds of real input, no page errors, 2.85 minimum world-unit pedestrian distance, visible serve contact. These are automation observations, not enjoyment or physical-phone measurements.

## Ownership and frame loop

| System | Responsibility and source |
|---|---|
| Game | Composition, UI callbacks, fixed simulation, rendering, saves; `src/Game.ts:1274`, `:1453` |
| MatchInput | Keys/touch, held movement, expiring aim + shot command; `src/tennis/MatchInput.ts` |
| InteractiveMatchSystem | Point physics, stroke preparation/contact, opponent movement, quality, first bounce and outcome; `src/tennis/InteractiveMatchSystem.ts` |
| ChampionshipController | Challenge → intro → serving/rally → point result → match result → exit; `src/tennis/ChampionshipController.ts` |
| Character | Locomotion, authored skeletal strokes, incoming-contact IK, racket frame; `src/entities/Character.ts` |
| BallPhysics | Analytic launch plus stepped gravity, bounce, net and forecast; `src/tennis/BallPhysics.ts` |
| ActivitySystem / Navigation | Exclusive court/participant reservations, travel and release; `src/simulation/ActivitySystem.ts`, `src/world/Navigation.ts` |
| CharacterMind / SceneGrammar | Bounded motives and memories, explicit authored behavior; `src/simulation/CharacterMind.ts`, `src/simulation/SceneGrammar.ts` |
| SaveSystem | Revision/session checks, IndexedDB and fallback storage; `src/persistence/SaveSystem.ts`, `src/persistence/migrations.ts` |

The simulation advances at 60 Hz, with at most six catch-up steps during championship play. Hidden/paused states clear accumulated time and input. Rendering uses interpolation and adaptive pixel resolution. Custom WebGL2 geometry/bone caches, bounded replay frames, and cached procedural audio avoid rebuilding their expensive resources per frame. Browser frame pacing must still be measured on actual devices.

## Swing → point → next match

1. Space/pointer Swing or Q/pointer Lob captures horizontal aim and shot choice together. Later recovery movement cannot overwrite the command. The buffer expires after **1.1 seconds** and clears on disable/blur/reset.
2. A return is eligible after the first bounce, inside lateral reach and the timing window. Eligibility is not permission to hit from anywhere: missing the reachable window resolves visibly.
3. `playerQuality` classifies timing/lateral error. Current thresholds are **0.15 perfect, 0.42 clean, 0.85 defensive**; deliberate horizontal aim uses **abs(aim) > 0.18**. These values were verified in source, not taken on trust from earlier notes.
4. Preparation freezes the target and flight time, predicts incoming contact, starts the correct stroke and supplies incoming-contact IK.
5. The staged incoming ball is assisted toward the live racket frame. Contact is emitted once, at the authored animation phase and a small string-bed gap (serve 0.055, return 0.12 world units). Contact compression/pose hold leaves player steering active. This is intentionally assisted arcade contact, not unconstrained rigid-body racket collision.
6. Contact emits sound, restrained camera feedback and replay data. Launch originates at that actual racket frame using the planned target/flight time. Bounce, net, first landing, second bounce and missed return drive point resolution.
7. The controller updates score once. A match is first to seven, win by two. Next point resets transient input/physics; rematch resets the score/controller while retaining this opponent’s bounded lane learning and the completed shot lesson for the current challenge. Exit releases participants and restores the club camera and clock.
8. Completed championship outcomes now enter the actual opponent’s mind. A loser rehearses recovery; a winner reflects; completion offers a rematch. This is saved and bounded, not generated dialogue.

## Concrete defect fixed

Previously `InteractiveMatchSystem.targetFor` used `.55 + opponentProfile.angleBias * .9` for **both** sides. Switching opponents changed the player’s scatter even with identical aim, quality, shot sequence, rally length and receiver position. The new player spread is fixed at `.85`; opponent profiles still control their own angles. `tests/player-placement.mjs` reproduced the discrepancy before the fix and now compares 300 matched scenarios across four profiles.

## Preserved mechanics

Captured aim, 1.1-second buffer, quality thresholds, first-five-contact assistance, live racket attachment, serve sequence, player movement/reach, first-bounce rules, score state machine, court clearance, character switching recovery, approved avatar geometry and gait, reduced motion, mute and replay were preserved. Foundational changes have direct regression tests.

## Honest limitations

- Arcade tennis: no full regulation diagonal service boxes, fault/double-fault system, spin aerodynamics or racket-face angular physics. Ball restitution is scalar.
- Deterministic placement hashes remove random noise for identical state; floating-point integration, timing and position can still change outcomes across runs/devices.
- AI reads visible flight periodically and has bounded lane memory. It is not human reasoning or a learned model. Style readability and tactical balance need uncoached testing.
- The court, cast and simulation already existed. This slice extends them; it does not rebuild a commercial-scale game.
- Save schema 12 protects new follow-up events. Existing schema 11 loads; older production builds cannot load a newer save. Use the separate preview origin for testing and export before transferring saves.
- Physical iPhone was reported unavailable by Apple’s device tools. No current heat, battery, speaker or Safari-on-device claims are justified.
- No uncoached participants have supplied results yet. User can arrange testers. Automated rematches are not evidence of desire to continue.

## Assets and deployment

Character asset notices were retained (CC0 / MIT, with Apache-licensed tooling notices as applicable). An existing TV reaction sample explicitly had unverified redistribution permission. This branch removes it from source and public assets; reactions now reuse original procedural material and an authored caption. `assets/audio/provenance.json` and `CREDITS.md` record current audio sources; the obsolete recording-preparation script was removed. The release check now catches removed audio left in the mirror.

The Next.js portfolio serves `arjan-portfolio/public/rally-house`. `npm run release:sync` builds and compares source/public artifacts and imports; it is a local sync, not deployment. The repository’s tracked CI targets other work, so this slice’s regression/browser commands and evidence are explicit release requirements. No production configuration or credentials were changed.
