# Rally House experiment log

## Anticipation, movement and feed

Each matrix runs 3 movement profiles × 3 feed profiles × 3 update rates (30/60/120 Hz) × 4 opponents × 2 input delays (80/400 ms): 216 deterministic 18-second point scenarios. A tracking bot presses from the actual cue. Accessibility means at least three contacts, not a human success/enjoyment score. Seeds and contact authority are retained. Tests mutate only a development configuration and restore it; production does not expose a preset menu.

| Movement | Acceleration / deceleration / reversal / max scale |
|---|---|
| Calm | 28 / 32 / 44 / 2.05 |
| Current | 38 / 44 / 62 / 2.45 |
| Fast | 50 / 54 / 78 / 2.70 |

| Feed | Buffer / opponent flight / serve flight / reach / spread |
|---|---|
| Generous | 1.30 / 1.28 / 1.35 / 3.05 / .22 |
| Current | 1.10 / 1.14 / 1.24 / 2.85 / .28 |
| Demanding | .75 / 1.00 / 1.08 / 2.50 / .45 |

Baseline current/current: 12/24 accessible scenarios, mean 7.708 contacts. Delayed reactions often miss the first return; increasing speed alone did not solve the prompt timing. Allowing a pre-bounce cue gave 24/24 accessible scenarios in every profile. The four refined lead sweeps gave:

| Cue lead | Current/current mean contacts | Accessible | Decision |
|---|---:|---:|---|
| .45 s | 11.625 | 24/24 | Viable; less preparation headroom |
| .65 s | 13.250 | 24/24 | Selected |
| .85 s | 12.000 | 24/24 | More advance notice without measured benefit |
| 1.00 s | 12.000 | 24/24 | Rejected as unnecessary advance notice |

These runs do not establish a universally optimal reaction window. Retain current movement/feed and change the information that was late. Current movement travels 2.472 / 2.427 / 2.464 world units in 350 ms at 30/60/120 Hz; 90% reversal takes .067/.083/.075 s and measured release drift is zero. The largest contact gap in the scenario matrix is .05 world units. Faster movement provided no consistent enough benefit to justify a different feel. Exact evidence is in `evidence/experiments`.

The landing ring predicts the actual semi-implicit-Euler first bounce at the fixed simulation step. Nine forecast cases agree at three update rates. It renders only for the incoming player’s legal-court flight; no auto-positioning or scoring shortcut is introduced. Ball, contact quality, hit-stop, trail, camera impulse and audio remain under their existing owners.

## Portrait camera

390×844, same staged serve and court projection:

| Profile | Distance / elevation / FOV | Projected court height | Near-side x extent |
|---|---|---:|---|
| A, baseline | 32.6 / .565 / 45° | 213.96 px | 40.24–355.32 |
| B | 28.6 / .600 / 48° | 240.95 px | 27.55–368.46 |
| C | 26.6 / .620 / 51° | 249.96 px | 24.90–371.21 |

B makes the court approximately 12.6% taller while preserving all corners. C buys only another 3.7% over B with less edge room. B was selected after viewing all three and checking the nine-size game matrix. Landscape values remain unchanged. This comparison is geometric and visual, not a physical-phone readability study.

## Object contact and release

The initial floor-center solution let a bell effect appear below/away from the bell. A separate contact anchor aligned the actual surface but an initial bell position was obscured by a plant, then another by the monitor. The final visitor-facing edge placement makes the action visible. Close capture uses actual completed approach and a controlled paused camera/pose sample, not an authored marketing render.

The bounded hand constraint reaches the bell with a measured gap below .12 world units (the chosen fixture measured effectively zero). Initial release dropped the hand immediately when the target was cleared. Retaining the target during decay removed that pop. Release sharpness 10 still moved the hand .0944 units on the first 60 Hz frame, exceeding the .08 regression bound; sharpness 4 passed and clears the transient target. Entry remains 10 for responsiveness. Cup/can/notebook pickup is still inherited stylized prop motion; it was not relabeled as exact world-object transfer.

## Portfolio presentation

A: thesis alongside the actual club, followed by manual Wander/Challenge/Rally scenes and a deliberate play section. B: centered stacked hero. Both were captured; A puts the project and thesis in the same initial desktop view with less vertical travel. An initial wide headline split “One more rally” awkwardly; reducing its upper size to 64 px produced the intended two-line headline. Mobile stacks naturally. The first stacked comparison captured a scrolled sticky header; the final comparison was recaptured at scroll zero.

Initial tiny decision numbers failed contrast at approximately 3.91:1. A darker green passed the entire nine-size Axe matrix. The bell media was changed from an uninformative wide shot to the actual surface reach. A distinct media filename avoids stale optimized-image cache reuse during review. Footage is continuous browser recording, manually opened, silent and explicitly labeled automated, with caption descriptions. No fake human playtest is presented.

## Experiments deliberately not shipped

No net hop was attempted: route-around meets ordinary traversal with a much smaller animation risk. No new hit-stop/audio/lighting profile was shipped without a convincing comparison. Existing continuous movement, shot safety, tactile effects, procedural atmosphere and spectator tracking already passed baseline tests. Historical patch scripts were not rerun over newer owners. Scope stayed concentrated on perceptible gaps; an authored motion library and physical-device/listening tests remain the next sources of useful evidence.
