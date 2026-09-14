# Acting system — v16

The simulation remains authoritative. Acting reads state; it does not grant progress, invent memories, or complete an activity. `ActingState.ts` converts bounded confidence, energy, emotional tone and the nearest relationship into eased pose parameters. The character’s existing distance-driven WalkCycle and skin matrices remain in use.

## What is visible

Confidence opens the shoulders, raises posture slightly, lengthens gaze and changes gesture amplitude. Energy changes idle frequency and reduces travel intensity slightly; it never speeds the actor beyond the existing walking limit. Emotional tone biases the brows and smile. Warmth and familiarity reduce conversational spacing, extend gaze and allow a longer shared pause. The adjustments are deliberately small, and whether people can read them without captions is an open human-test gate.

A conversation reserves its participants and space, approaches, orients for 1.2 seconds, speaks/listens through authored beats, pauses, resolves and exits. `settle` is a reserved acting-role value, not a separate implemented scene phase. Listening reduces arm activity; attention occasionally breaks away. Three-person scenes turn toward the current speaker and use a legal triangular arrangement in front of the cafe table. The world does not pause while someone speaks.

Twelve reaction profiles support acknowledgment, small smile, pride, relief, annoyance, embarrassment, surprise, focus, disappointment, teasing, encouragement and thoughtfulness. Completed matches use 18–22 second reactions; completed coaching and witnessing use shorter tails. Each has a personality-dependent perception delay, eased rise and three-second recovery. Low-priority witnesses stop briefly, look, react, then resume their saved destination. An active court action masks reaction motion. Not every profile has an authored event hook yet.

## Movement and space

A pre-existing local-to-world transform used cosine for both horizontal terms in its z coordinate. Replacing the incorrect term with sine restores rigid rotation: the body no longer shears when turning. A five-heading round-trip/distance test covers this separately from walking-foot tests.

Walking advances feet from distance traveled, not a free-running animation clock. Crowd handling may pause root travel and plan a detour, but does not push the actor or translate planted feet. Nearby actors become temporary navigation obstacles. If the actor starts within an expanded obstacle, a short escape must initially move away and have a viable continuation. Exchanging destinations allows a temporary escape while the other moving actor vacates the goal.

The navigation grid validates continuous-to-grid connections, preventing shortcuts through furniture corners. Scheduled departures use distinct waiting positions near the entrance, keeping the narrow entry aisle clear. Paired bench offsets are 1.12–1.24 units apart; standing social distance is relationship-derived. Real tennis uses its existing court movement system and is measured separately from pedestrian spacing.

Automatic travel timeouts remain bounded at 65 seconds and award nothing. They are a recovery mechanism, not evidence that a scene completed. User-requested lessons retry after such a timeout; explicit cancellation does not retry.

## Quiet behavior and props

Notebook tapping, cup turning, string checking, headband adjustment and leaf inspection require a compatible context. Micro-behaviors last 2.8 seconds, have a 24–39 second cooldown, and yield to major activity. They do not run as random background gestures on every actor.

Carried social props use reach, grasp/use and release intervals. The displayed prop remains at its pickup anchor until the hand reaches it, then follows the hand. This is a carried-prop transition, not a world-object inventory or a tabletop ownership system. Scheduled drink poses still have legacy cup handling. There is no completed towel/bag handoff or finger rig.

## Geometry and seats

A small head-scale and eye adjustment improves face readability; hair and face details follow the head, while socks and clothing remain on the body. Round shoulder/elbow volumes and a torso cover reduce exposed procedural seams. Hands have a palm and thumb indication. Rackets are stowed during ordinary walking and social activity unless a relevant inspection requires them.

Sitting uses a 0.54-unit seat surface and a short entry blend; standing holds travel until the exit blend is underway. Built benches use a real depth offset and foot contact. Seat height is exposed per character but is not automatically discovered from every decorative chair. Not all visible furniture is sit-enabled. The procedural silhouettes and some extreme hand/garment poses remain below an artist-authored production character.

## Validation

`tests/walking.mjs` retains the original kinematic checks. `tests/presence-integration.mjs` measures a real head-on pass, destination arrival, minimum distance and planted-foot drift. `tests/story-presence.mjs` runs an actual match, witness-based three-person conversation and earned reconciliation. `qa/v16-poses.mjs` records 20 seeded times for all 18 animation states; sitting includes a bench fixture. These tests cannot establish charm or attachment.
