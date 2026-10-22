# Backhand grip and follow-through

The support hand used a world-space offset rather than the racket shaft, then retargeted independently from the gripping hand. Opposed racket vectors also normalized through a near-zero midpoint during release. A shared shaft constraint, sufficient handle room and rigid rotation fix the hand overlap and sudden turn. Replay retains the observed two-hand constraint between samples.

`review.html` compares native renderer reproductions; these clips are isolated rig checks, not claimed as actual gameplay. A real keyboard rally and its actual contact review are checked separately.

Regressions check deformed finger separation across Taylor, Coach Contessa, Lucresia and Barbara at 30/60/120 Hz, including intermediate replay frames. The old build fails the palm-clearance and shaft-turn checks.

Rejected: shoulder roll, extra protraction, changed elbow guides, unfitted jersey, extra shoulder joints and a separate ribcage anchor. None consistently improved the shoulder across strokes. Assets and the original shoulder deformation remain unchanged.

Remaining: shoulder/armpit self-folds during some strokes. This pass does not establish Valve/Rockstar quality.
