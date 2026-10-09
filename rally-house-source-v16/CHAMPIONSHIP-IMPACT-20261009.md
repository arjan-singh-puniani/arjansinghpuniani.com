# Championship contact — October 9, 2026

The requested focus was the living club's first reveal and its transformation into arcade tennis. The user chose **heavier contact pauses and more camera punch** after the initial comparison. The opening club and the Championship orbit remain the foundation; this pass concentrates the new emphasis at actual racket contact.

## What changed

A sweet-spot strike holds the stroke clock for 72 ms and compresses the ball against the live strings for 87 ms. Clean strikes use 46/65 ms, defensive strikes 23/41 ms, and frame strikes 12/29 ms. Steering, gaze, string recoil and the surrounding club keep updating. The old short movement plant would otherwise have frozen the player's feet throughout the longer pose hold, so Championship steering now continues through it. Ordinary club strokes retain their plant.

The contact camera response now bypasses the slow orbit springs. It is a short render-only push toward the court, with a small offset following the shot direction. Opponent contacts receive 45% of the player camera strength. The pulse does not modify saved camera state or spring velocities, expires completely, and clears when reduced motion is enabled or the match exits.

The contact burst now has a normalized lifetime: it expands immediately instead of sitting on a strength-dependent plateau. Perfect strikes get eight warm sparks and a broader ring; lesser contacts have smaller, quieter responses. Sweet-spot praise gets a matching warm accent at the screen edge. Both the HUD animation and camera pulse respect reduced motion.

The original procedural racket sound has a faster transient, a stronger early body component and shorter string decay. Playback gain is unchanged. Reflections now copy the dry signal rather than recursively extending its ring. The cache still contains at most twelve quality/variation buffers, and disposal releases it.

Production browser testing also found that the sticky portfolio header could cover the embedded game's Exit button. The embedded game now fits the space beneath the header, scrolls with a safe offset, and receives focus without another automatic scroll. This includes short phone landscape screens.

## Experiments and decision

The initial restrained, balanced and heavy profiles produced 405, 399 and 395 physical contacts respectively across twelve 45-second trials each (four opponents at 30, 60 and 120 Hz). These are automated neutral-steering rallies, not human preference scores. All contact gaps stayed below the physical 0.12-unit acceptance limit.

After the user's heavier preference, the selected version increased camera emphasis further while bounding the pose hold below 75 ms. A second comparison produced 399, 395 and 388 contacts for restrained, selected and extra-heavy versions. The extra-heavy version extended ball dwell to 126 ms without adding camera emphasis because the camera already reached its cap. The selected 87 ms dwell keeps the requested weight with less delay.

At peak selected impact, the furthest projected court corner shifts about 21 pixels at 1280×800 and 9.6 pixels at 390×844. All court corners remain in frame. Screenshots and raw trials are in [the evidence folder](evidence/impact-20261009/).

Before and after the change, isolated 1,200-frame browser trials recorded 16 contacts and a 16.7 ms frame-time p95. This is a short Chromium trial on this Mac, not a guarantee for other hardware. A separate video capture ran alongside viewport QA and is labelled separately in the evidence.

The clean strike's rendered RMS increased from 0.00452 to 0.00554 with unchanged playback gain; its peak increased from 0.0413 to 0.0444. The defensive and frame sounds lose more of their lingering tail. WAV files permit direct listening; waveform checks establish timing and bounds, not whether a human prefers the sound.

## Validation

- Game: all 18 executable suites pass, including physical contact, live steering during holds, exact release, cleanup, nine peak camera framings/restores, and 36 audio envelopes.
- Portfolio: 91 tests in nine files pass; type checking and the 31-route production build pass. Lint has zero errors and fifteen pre-existing warnings.
- Release: all 58 source/served artifacts match and relative imports resolve. The standalone ZIP has 60 files and passes CRC verification.
- Production browser: all nine viewport sizes pass through the real portfolio UI; zero Axe violations on the entry page and no horizontal overflow. Keyboard activates the moving member card; pointer Exit works beneath the site header.
- Lifecycle: sixteen exits during a held contact pass across all four opponents, with both motion settings; no remaining pose hold, camera impulse, input owner or court reservation. DOM count stays constant.
- Audio/package: 120 impacts retain exactly twelve cached buffers; muted playback creates no context and disposal clears it. Five extracted-package reloads include the new sound module and Championship styles.
- Actual keyboard and touch steering, early returns and restoration pass in `qa/arcade-feel.mjs`.

## Basis for the changes

Developers describe using brief impact-pose holds, sound and animation together while limiting camera motion to preserve target readability. This informed the experiment, rather than prescribing a tennis timing value. [PlayStation developer discussion](https://blog.playstation.com/2022/10/04/game-developers-explain-what-makes-god-of-war-2018s-combat-tick/).

Racket feel includes an initial shock and subsequent frame/string vibration. The authored sound therefore separates a short collision transient from damped body and string components. It uses original synthesis, not commercial game audio. [Tennis Warehouse University's racket feel experiments](https://twu.tennis-warehouse.com/learning_center/videoracquetfeel2.php).

For an event demo: let the club breathe, select Leo, challenge him, and play several returns with sound on. The important test now is whether the heavier resistance makes the next return more inviting to the person holding the controls.

## Reproduce the focused checks

From `rally-house-source-v16`, run `npm test` and `npm run release:check`. From `arjan-portfolio`, run `npm run verify`.

Serve the source on port 8078 and the portfolio production build on 3096. `node qa/impact-experiment.mjs` compares the current contact defaults at three strengths. `node qa/impact-browser.mjs isolated` records a 1,200-frame rally and exports the actual production audio graph; `node qa/impact-browser.mjs audio` exports only the sounds. `node qa/arcade-feel.mjs` exercises real keyboard and touch input.

For `node qa/impact-validation.mjs`, also package with `python3 qa/package-playtest.py`, extract the ZIP, and serve its game directory on port 8079. This checks production UI sizes, interruption cleanup, bounded audio and five package reloads. It uses keyboard activation for the moving member card and actual pointer activation for Exit; it does not force clicks through the header.
