# Stroke hand and sleeve clearance

The former free-hand route cleared a palm point against the torso. It did not reserve the fingers’ width and length, so the open hand still passed through the fitted shirt. A wider stroke envelope and a forward hand margin keep that surface outside; the existing elbow guide advances slightly to retain sleeve clearance.

The skirt defect had a second cause: the fading ready-support constraint ran after clearance and pulled the hand inward again. The existing clearance block now reads the final hand target after support blending and reach limiting, before the elbow solve. Its height margin starts two centimetres earlier to cover the other cast members’ fingers. `recovery-before.png` and `recovery-after.png` show that same transition at the same update sample.

`before.png` and `after.png` are unretouched native Chromium/Metal renders of the same Taylor volley at 0.4 seconds, from the same camera and light. They are isolated reproductions using the real Character, asset, renderer and animation solver, not recordings of a played point. The baseline is the merged PR #42 version.

The expanded `qa/arm-clearance.mjs` checks actual GPU-deformed arms against the skirt and actual fingers against the torso, in color and shadow, through travel, strokes, recovery to ready/idle and interpolated replay. It does not prove that every sleeve/shoulder fabric fold is collision-free. A wider diagnostic sweep still detects a small forearm-sleeve intersection on a high backhand.

Rejected: less shoulder advance introduced earlier sleeve contact; a larger elbow guide did not clear the high-backhand fold; a torso-loading change did not improve it. These variants were restored before final validation.

The original regression fails for both finger/torso and arm/skirt contact. The final constraint ordering is also checked against authored limb lengths, exact racket contact, ready throat support, backhand hand spacing, walking, social poses and continuous replay.
