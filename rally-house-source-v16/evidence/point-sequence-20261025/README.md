# Point result to next serve

Scoring triggered a celebration/miss reaction and immediately replaced it with a baseline shuffle. No reaction frame survived. Baseline movement also inherited the final analog steering speed, so releasing movement before point end could leave the player crawling back.

The result now holds its existing reaction for .32 seconds, then starts baseline recovery at the Championship movement pace. Game continues the match's result update with gameplay input disabled. The original 1.05-second next-point pause is retained. A racket already in hand is retained through the reaction and final-result ownership release; a club celebration cannot summon one.

A matched 60 Hz CPU run from three units wide, after steering decayed to .08, produced:

| | Before | After |
| --- | --- | --- |
| Visible reaction-state frames | 0 | 20 |
| Return distance before next point | .228 | 3.000 |
| Next-point time | 1.05 s | 1.05 s |

These are actual Game/Character simulation results, not live-browser perceptual evidence. Runtime preference is pending. `tests/point-reaction.mjs` fails before the change and verifies long/short point ownership, visible held racket meshes, no ball/input activity during results, recovery timing and stop cleanup at 30/60/120 Hz. Controller, arcade contact/aim, final-point/rematch receipts, court audio, accepted gait and stroke-footwork checks pass. Source/public release artifacts match.

The approved character assets, walking and hands-on-hips pose, stroke solver, camera and court layout are retained. No new reaction animation, longer result delay, camera effect, voice asset or character deformation was introduced. The existing raised-arm celebration was inspected offline; this does not establish its live-game quality or the overall flagship gate.
