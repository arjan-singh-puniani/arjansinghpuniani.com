# Hero ponytail motion candidate

Taylor’s ponytail followed the skull as a rigid object. A small critically damped tail response now follows head turns and locomotion, with a restrained gait response and a gentle settle after stopping. It advances once per simulation update; drawing and replay do not advance it.

The existing ponytail has both an opaque core and textured strands. Their weights now blend from the head to one tail joint using the same falloff; the face and scalp roots remain on the original head bone. The renderer reserves one extra bone slot in its shared colour/shadow shader. Existing asset files and body joints are retained. Recorded pose angles reconstruct the same extra joint during replay.

| Rigid at the same turn phase | Candidate |
| --- | --- |
| ![Before](before-offline.png) | ![After](after-offline.png) |

These are offline textured CPU-skinned close-ups, not game screenshots. The tail has a slight bend relative to the unchanged scalp at the same head-turn phase. A still does not prove the quality of its settling motion; runtime acceptance is pending.

The new regression checks frame-rate integration, pause, yaw wrapping, trailing direction, bounded actual Character tip movement, shared core/strand transforms, pinned roots, an unchanged body palette, rendering purity and fractional recorded replay. Loaded character/contact, footwork, gait, rest, phone capture, Performance Lab and core tests pass; the stored pose trace has zero change in the original body fields through walk, rest, forehand, backhand and serve. Source/public release mirrors match. A pre-existing core test still expected Lucresia’s earlier ponytail; the same failure was verified on baseline and its mesh expectation now matches her already-rendered waves.

Design choices: core and strands move together; forward tilt is restricted near the neck; integration belongs to the simulation rather than drawing. This is one weighted tail joint, not independent strand/contact simulation. The existing hair-card shape/texture, residual clothing intersections and broader character quality remain unfinished. No fresh live-browser/GPU frame-time measurement or flagship-quality claim.
