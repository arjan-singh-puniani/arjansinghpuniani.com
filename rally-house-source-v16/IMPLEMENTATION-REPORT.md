# Rally House studio polish — 30 September 2026

Implemented and verified as a playtest candidate. The user reported that the initial studio pass was fun and felt cool, then requested stronger ball bounce, string-bed contact and a comet trail. Physical touch-device feel, audible mix and broader independent playtesting remain open.

## Repository and recovery

The active project was `/Users/arjan/Desktop/arjansinghpuniani.com/rally-house-source-v16`, on the existing `portfolio-human-copy-20260930` branch. The current source built and passed its original suite, but had no Championship modules despite a Championship document. The RC3.2 directory was empty and RC3.4 was a partial patch with incompatible older furniture and racket code.

A complete source backup was made before edits in the sibling workspace `RallyHouse/Studio-Polish-20260930/rally-house-before.tar.gz`. Work was developed and tested in that workspace, then narrowly synchronized to the active source and `arjan-portfolio/public/rally-house`. No reset, clean, checkout, global restore, commit, deployment, or unrelated portfolio edits were performed. The system Git launcher was blocked by an Xcode license prompt; the installed Command Line Tools Git worked normally.

The local `rally-house-championship-production-patch (1).zip` supplied the missing mode and audited integration anchors. Selected RC3.4 camera, audio, lighting and HUD work was recovered, inspected and corrected. Existing rotating furniture, the complete decoration catalog, physical string-bed geometry and autonomous tennis were retained. `EverydayOwnership` was named in the brief but was absent from the real source and available complete recovery bundle; it was not invented or replaced with an incompatible save model.

## Perceptible changes

- Evening sunlight now actually loses energy. Cooler ambient fill gives the desk, tea station, lounge and equipment corners distinct warmth. Weather changes ease; practicals stay visible in daylight. New clubs begin at golden hour; existing save times are preserved.
- Correct normal handling for stretched geometry and local highlights distinguish fabric, ceramic, wood and metal. Small emissive lamp cores, restrained halos, light pools and peripheral falloff add depth without a bloom framebuffer or fog pass.
- Built-in and placed objects share embodied interactions: approach, reach/prop/pose, localized effect, sound, nearby acknowledgment, then a persistent receipt. Bell, tea, strings, machine, leaves, water, journal, board, seating and decoration categories respond. Busy members keep their activities; glances expire and have a seven-second per-member cooldown.
- A quiet procedural room bed ducks during play, respects mute, reuses one loop source, stops when hidden, and disposes on page exit. Cached material strikes distinguish perfect, clean, defensive and frame contact. Transient nodes disconnect after playback.
- Challenge reserves the existing court, produces acknowledgment and natural travel, then a 1.9-second orbit/descent. The edge HUD introduces controls. Championship suppresses club atmosphere; the exact camera state, including spring velocities, returns on exit. Early exit, normal result, rematch, pause/speed restoration and repeated cycles are covered.
- Steering accelerates, reverses and decelerates continuously. Swing intent survives; movement continues through preparation/follow-through with a brief contact plant. All four opponents carry visible rackets, including Barbara.
- Early balls bounce before the receiving strike zone, with manageable pace and spread. The ball has a bright core, halo, floor locator, bounded trail and bounce ring. Good shots have safe margins; a legally landed ball leaving the court cannot be incorrectly charged as a long shot.
- Spectator eyes lead the head, the chest follows partially and the hips stay quiet. Seated watchers track live play. A foreground club member can fade softly out of the player's silhouette without interrupting their activity.

## Implementation boundaries

The existing simulation, schedules, relationships, history, persistence schema, lessons, navigation, avatars and autonomous RallySystem remain authoritative. Championship uses the same ActivitySystem reservations, Character poses and BallPhysics. Contact is arcade-assisted near the strike window, but launch and sound wait for live string-bed proximity. There is no multiplayer, account system, progression expansion or external asset dependency.

Core source changes: `Game.ts`; `Character.ts`; `World.ts`; `Renderer.ts`; `CameraController.ts`; `AudioManager.ts`. New/recovered owners: `ClubAtmosphere.ts`, `ClubInteractions.ts`, `ChampionshipController.ts`, `ChampionshipCameraRig.ts`, `InteractiveMatchSystem.ts`, `MatchInput.ts`, `ChampionshipTuning.ts`, `ChampionshipOpponents.ts`, `ChampionshipHUD.ts`. Entry/CSS/package files, compiled counterparts, targeted tests and QA runners were updated. The exact delivery list is in `STUDIO-DELIVERY.json`.

## Performance and validation

Immutable architecture reuses transform/material data across shadow and lit passes. Light uniform arrays are reused. Effects, trails, witnesses and audio caches are bounded. No extra animation loop, rendering dependency, or full-screen render pass was added.

On this Apple M2, full-resolution 1280×800 Chromium/Metal measurements held a 16.7 ms median frame before and after, both in a paused comparison and with the club running. Live-club p95 was 16.8 ms before and 16.7 ms after; this is a short local measurement, not a hardware-wide guarantee. See VALIDATION.md for exact evidence and limits.

## Remaining human review

The geometry remains the project's stylized miniature art, not a new asset set. Some minor fixed decorations remain observational. Tactile sound sources use a quiet mono mix rather than spatial audio. Contact windows are deliberately generous, and extended difficulty tuning needs human matches. Headphones/speakers, physical touch hardware, comfort over a longer session, and independent replay desire remain unverified. No positive human playtest has been fabricated.

## Ball-feel follow-up

The Championship ball now rebounds with restitution 0.64 (previously 0.56), with the original first-landing target and horizontal pace preserved. Autonomous club tennis retains its original restitution. A slightly larger core squashes briefly at the floor and stretches along flight velocity.

Confirmed racket contact now compresses the ball in the live racket face's coordinate frame. Strings have fixed endpoints and a deflecting center that springs back; the latched ball follows that same deflection. The 50–60 ms contact dwell remains gated by actual proximity. Sound and scoring still fire once at confirmed contact.

`BallTrail.ts` replaces faint separated dots with connected tapered segments sampled at 90 Hz, capped at 18 samples, 0.19 seconds and 1.9 world units. Reduced motion shortens/dims the trail and suppresses bounce squash, flight stretch and impact rings. Trail state clears between points and matches. There is no new shader, texture or animation loop.

The follow-up backup is `Studio-Polish-20260930/ball-feel-before.tar.gz`. Regression evidence includes rebound/first-landing comparison, animated compression/launch/string recovery and trail bounds at 30/60/120 Hz. Real rendered contact, flight and bounce frames are in `qa/studio/ball-*.png`.

## Return-interception correction

A follow-up trace reproduced the reported backward ball travel in both tennis owners: the club rally could capture the ball 1.10 world units behind the receiver, and Championship could let a late buffered stroke run two frames behind before pulling the ball toward the racket.

Club rally bounce targets now leave room ahead of the receiver, and capture requires the ball to be on the net side. Championship predicts arrival at a strike plane ahead of the body and captures earlier for late buffered input. The Character contact solver uses the outgoing shot direction instead of a stale locomotion yaw. Forehand/backhand choice follows the incoming side. The small club handoff keeps the ball visible.

At 30/60/120 Hz, sustained rally regressions kept every monitored return in front, including forward movement through preparation. Launch and sound remain gated by live string-bed proximity. This correction changes interception staging rather than movement controls or hit-quality windows.
