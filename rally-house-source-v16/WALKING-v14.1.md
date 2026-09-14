# Walking refinement — v14.1

The current v14 workspace and its compiled build have been updated in place, so the existing preview on port 8074 needs only a refresh. Saves retain schema 6. The original v14 ZIP is preserved; this revision is packaged separately as Rally-House-Grounded-Walking-v14.1.zip.

## What changed

Previously a walking shoe could move from a narrow animated stance to a much wider planted position. The swing pose, authored clip and support-foot lock each added their own stride. The path follower also snapped the last eight centimetres to waypoints and selected jogging by distance to the next individual waypoint.

WalkCycle now owns both shoe trajectories. Travel distance advances the gait; each foot supports the body at a fixed world position, then follows a low continuous swing arc into the next step. Shoe orientation stays fixed during support. Swing targets follow turns. Narrow foot spacing, reduced arm swing and restrained torso motion suit the existing character proportions. Stops blend from the actual outgoing pose.

Walking keeps a consistent speed target, eases into motion, anticipates corners and brakes at the destination. Navigation removes unnecessary grid zigzags only where an obstacle-expanded straight segment is clear. Club circulation still routes around the playing area.

The shoulder garment now closes over the upper chest, includes sleeves and joins at the shoulders. Skin transforms match each posed bone's length, keeping trouser ankles attached to shoes through the stride. Facial design, hair, colours, social performances and racket-contact targets retain their existing definitions.

## Verification

- `npm test`: all 79 existing checks pass, plus 12 walking scenarios covering four members at 30/60/120 updates per second, and obstacle-clearance/small-destination checks.
- Walking checks measure stationary support feet, finite poses, ground clearance, bounded foot displacement, arrival, walking speed and absence of automatic jogging. Sampled skin endpoints must meet the corresponding shoes within 0.1 mm.
- `node qa/browser.mjs walking-full`: 600 seconds of accelerated club simulation completed 14 everyday scenes with no failed activities. The interruption/resume check passed. No browser page errors were reported.
- Eight close-up browser frames were captured for the final gait and shoulder fit (`qa/walk-0.png` through `qa/walk-7.png`). `qa/walking-browser.json` contains the corresponding poses; `qa/walking-tests.txt` contains the test output.

These checks cover the walking refinement, not a claim of exhaustive production certification or device performance. The ten-minute integration run was accelerated, not a new ten-minute real-time viewing study. Court shuffling retains its separate existing motion system.

## Reproduce

Run `npm test`. With Playwright and Chromium installed, run `node qa/browser.mjs walking-full` for the integrated browser check. The browser test stages a separate isolated page and does not overwrite the user's preview save.
