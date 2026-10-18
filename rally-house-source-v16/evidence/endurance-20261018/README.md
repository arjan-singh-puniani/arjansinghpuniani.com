# Realism integration and endurance follow-up — October 18, 2026

The candidate is `6e3fb6debaac1c9062e8f0702cdc7b13d9992927`, integrated with canonical main `79ef482419013307d9d1d3216bc177f8e89c32e9` in an isolated checkout. This retains main's browser-QA fixes and consolidation archive. The original realism branch and all historical recovery references remain preserved.

During validation, main independently adopted realism and a direct first-rally arrival in PR #27, followed by the short-URL redirect in PR #28. This branch then integrated main `f592e69fe7b1ce4a599e82b04381df0715bc9152`, retaining the arrival helper, native-engine lifecycle support and native-audio completion checks. The full 36-suite game gate, standard portfolio verify command, desktop/phone native arrival and 64-cycle/eight-review gate were rerun on that combination. Earlier qualification snapshots are retained as `candidate-game-tests.log` and `candidate-endurance.json`.

## Reproduced defects and corrections

The unmodified candidate failed repeated Championship entry on cycle 11; a diagnostic rerun failed on cycle 15. The trace shows a previous opponent standing at the exact far-baseline target while the incoming opponent repeatedly replans. The new baseline is ±6.65, beyond the old nonparticipant clearing range of ±6.3 and navigation admission range of ±6.6. Moving the tea table did not resolve this state.

Navigation now derives a shared court-access boundary from `COURT`. Both baseline targets are admitted directly through normal obstacle-aware walking, and nonparticipants leave the same reserved area. The clearance-expanded circulation obstacle uses that exact boundary. The depth leaves the spectator-bench corridor and its navigation grid accessible. No actor teleport, collision bypass, crowd-avoidance bypass, or extension of the 65-second arrival timeout is used.

`tests/court-entry.mjs` exercises all 12 distinct previous/next opponent combinations at 30/60/120 Hz using actual Game reservations and character updates. It checks baseline entry/exit, furniture/net clearance and outside circulation, including spectator-bench ↔ warm-up. The older cafe-circulation test now checks the corrected court footprint rather than its superseded width.

The extended browser endurance test also exposed four replay-source `<option>` elements retained after the first Lab visit. `PerformanceLab.close()` now clears those transient choices together with its clips and timeline. The strict DOM return assertion remains in place.

## Reproduction

From `rally-house-source-v16`, install locked dependencies, run `npm test` and `npm run release:check`. Start a separate server with `PORT=18083 node qa/serve.mjs`.

```sh
QA_BASE_URL=http://127.0.0.1:18083 QA_CYCLES=64 QA_OUT=/tmp/realism-endurance node qa/session-lifecycle.mjs
QA_BASE_URL=http://127.0.0.1:18083 QA_REVIEW=1 QA_OUT=/tmp/realism-review-endurance node qa/session-lifecycle.mjs
QA_BASE_URL=http://127.0.0.1:18083 QA_OUT=/tmp/realism-continuity node qa/same-world.mjs
QA_BASE_URL=http://127.0.0.1:18083 QA_WIDTH=390 QA_OUT=/tmp/realism-phone-review node qa/rally-review.mjs
```

`QA_ENGINE=firefox` or `webkit` selects the native engine for same-world and swing-review QA. Run native-input browser checks separately on a busy graphics host. `QA_CYCLES` cannot reduce the endurance gate below 32. Failure reports retain participant/path traces; page errors, console errors and HTTP failures are checked.

## Qualification results

| Gate | Result |
| --- | --- |
| Game build and full suite | 36 suites passed, including arrival and 36 consecutive-opponent travel scenarios |
| Release parity | 76 artifacts match; compiled imports resolve in both trees |
| Final browser endurance | 64 cycles, all four opponents, alternating reduced motion, eight native Analyze/Lab/Return trips |
| Ownership and resources | Exact camera/settings return; court/input/match released; stable DOM 279–279, total 279–280 with one identified transient notice; zero tracked transient audio connections after settling |
| Coarse heap | 33.1 MB at both endpoints; no forced collection |
| Same-world continuity | Chromium, Firefox and WebKit passed; busy reservation and continuing club preserved |
| Native swing review | Chromium desktop/390-pixel portrait, Firefox desktop and WebKit desktop passed with actual contacts, playback, framing and return |
| Objects and accessibility | 13 native physical flows, 12 viewports, Axe, native touch and persisted state passed |
| Current-main arrival | Native desktop and phone Play tennis reached an actual three-contact rally and returned with the court released |
| Portfolio | Lint/typecheck passed; 91 tests in nine files passed, including a fresh standard V8 coverage run; production build passed |
| Other projects | VectorCourt keyboard/buttons/scroll passed; 14 shoulder domain tests and native anatomy browser matrix passed |
| Recovery archive | 180 recovery objects and 875 historical Git blobs verified; all 111 unreadable originals still present with recorded lengths and unchanged inventories |

The initial busy-host coverage runners stalled; fresh standard coverage passed after they were stopped. Early Firefox and portrait timeout diagnostics are retained in local raw evidence; the final runs above passed in fresh processes. Existing portfolio lint warnings and the portfolio review's artistic limitations are not represented as new fixes.

The integrated lifecycle fixture identified a pause-button locator race and one ordinary expiring `.world-notice`. It now waits for the native pause-panel control and separately bounds those notices while requiring every other DOM node to return exactly after **every** cycle. The four retained Lab options still fail that assertion. Arrival-specific diagnostics and the original failed endpoint comparison remain in local raw evidence.

## Evidence limits

The lifecycle runner accelerates approach and exit with fixed ticks and holds autonomous scheduling to isolate ownership. Pause freezing, Resume clicks, short flight, Analyze and Lab exit use live browser behavior. Same-world QA separately checks a continuing club and its existing activities. Swing-review QA uses real challenge, movement, serve, return attempts and recording controls. Coarse heap endpoints and instrumented outgoing AudioNode connections do not establish indefinite leak freedom. Visual inspection checks framing and continuity; the procedural cast's artistic limitations documented in the portfolio review remain.

The 111 unreadable cloud originals are preserved in the existing ignored local vault. Their content was neither opened nor modified during this follow-up; the preservation journal and public recovery inventory hashes are checked independently.
