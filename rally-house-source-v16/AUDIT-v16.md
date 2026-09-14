# v16 audit — baseline evidence

Canonical v15 ZIP extracted under `../v16-audit-reference/`. The v16 candidate starts from the later working copy to retain Taylor/Arjan and the user-selected display names Contessa, Lucresia and Barbara; the canonical ZIP is preserved in `reference-v15/`. Internal member IDs remain unchanged.

Before application changes, all seven canonical deterministic suites passed (2026-09-13). The extracted archive lacked installed dependencies; `npm ci` restored the locked TypeScript version. No canonical source was edited.

The ten-minute untouched browser observation completed in 609 real seconds with no browser errors. The twenty-minute automated mixed play session finished in 1,206.633 real seconds with all 20 action steps and no browser errors. Randomized pose captures were also recorded. Neither is independent human evidence.

## Defect inventory

| Priority | Finding | Evidence / acceptance gate |
| --- | --- | --- |
| P0 | No cross-tab save comparison; fallback can overwrite another session | SaveSystem writes unconditional put/setItem. Test two actual browser tabs and reload of the winner. |
| P0 | Coaching travel cancellation can discard an accepted request; prior timeout has no root cause | beginLesson clears queuedLesson on reservation; cancelActivity releases without requeue. Instrument request, phase, routes and resolution; randomized timing regression. Do not retroactively claim this caused the historical timeout. |
| P1 | Local-to-world pose rotation shears the body | The inherited z transform used `-cos(yaw)*x` instead of `-sin(yaw)*x`. Found during pose review; fixed and covered by inverse/distance-preservation checks at five headings. |
| P1 | Characters occupy identical positions | Actual Game one-day baseline audit produced zero-distance pairs and a 0.036-unit pass between Leo and Barbara. `qa/baseline-simulation-audit.json`. |
| P1 | Outcome acting can be replaced immediately by schedules | completeActivity releases reservation before three-second emotion/celebrate call; next unreserved update schedules again. |
| P1 | Hidden confidence/energy mainly affect choices | quietLife supplies only tired/attentive overrides; no bounded posture/gesture mapping. |
| P1 | Gaze jumps and does not break naturally | poseFor computes clamped target directly at render time. |
| P2 | Seated height and entry depend on a fixed offset | seatDepth selects fixed -.30; pose transition is only .22 seconds. Need seat height and supported feet. |
| P2 | Primitive hands and prop appearance limit contact readability | Spherical hands and immediate socialProp assignment in each beat. Preserve honest limits; no finger rig supplied. |
| P2 | Culture trends permanently toward ceilings; major memories unbounded | CharacterMind culture only increments; remember retains all importance >= .95. |
| P2 | Dialogue repeats; triangles unsupported by pair-index assumptions | Finite greetings; updateEveryday uses people[1-i]. Add only evidence-gated composition and limited safe layouts. |
| P3 | Headband looks oversized at close distance | Baseline pose capture shows band wider than head; face details too small in gameplay view. |
| P3 | No shipped professional asset loader or provenance validation | Integration documentation exists; implement strict intake readiness, not a fabricated asset. |

## Evidence boundaries

The timed sessions use headless Chromium and overlap other QA. Timing is not device FPS. Independent tester availability has been confirmed by the user; no tester responses have been received. Physical-device checks remain unperformed.
