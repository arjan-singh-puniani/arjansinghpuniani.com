# Groundstroke sequence and opponent reaction

The arm used a compact wrist arc with a brief override onto the contact target. Adult body loading moved that world target again, and blending racket endpoints shortened the shaft during transitions. Together these produced a wrist reversal at impact and an unconvincing preparation/finish.

The retained fix gives adult groundstrokes one continuous wrist path through exact contact, a raised preparation and racket drop, extension and an opposite-shoulder finish. The existing rigid-frame interpolation keeps the racket and grip together. Body loading preserves this world path; the elbow opens before gathering across the chest. Shared forearm roll and transported free-hand orientation prevent the new sequence from pinching or flipping the sleeve. Live and fractional replay use the same palette correction. No asset, renderer, joint count or cloth system was added.

## Regression evidence

- 108 forehand/backhand cases across the cast, low/normal/high contacts and 30/60/120 Hz: minimum incoming/outgoing wrist direction dot product improved from -0.999997 at HEAD 2219531b to +0.993526. This measures contact continuity, not visual quality. Maximum sweet-spot error remains below 0.000000015 game units.
- Fractional replay uses the live forearm correction exactly (palette error 0); replay registration passes 3,800 samples.
- Native wrist lengths, grip registration, forearm volume and 450 animation transitions pass. Maximum relative hand step is 0.050514 game units; zero-time transition jump is below 0.000000033.
- Gait and stroke-footwork regressions pass, including grounded shoes, heel pivots, recovery and contact. The same 300 idle/walking pose samples match the prior approved build exactly: SHA-256 `e6d03aaad90596eda58d7a78a7bd7889d4fb69c311660ef33c387977b06abba9`.
- Jersey contact passes 72 sampled poses, retaining zero distant sleeve crossings in ready and the sampled forehand. Backhand/serve still have shallow residual folds: maximum local surface depth 0.014430 game units. The test now measures nearest torso surface distance instead of projected torso-yaw ray depth; those different metrics must not be compared as a numerical improvement. Garment crease checks also pass.

Reducing shoulder protraction, projecting a fresh palm direction every frame, an abrupt forearm-roll switch and removing default posture loading were rejected: they increased stretching, hand snaps or transition defects.

## Human result and limits

After playing the motion candidate, the user said: “omg it is soooo fun!!!!” This supports a real playability improvement. Later small regression refinements have automated evidence but have not been visually rechecked: browser-control tooling is unavailable. Small sleeve folds remain. The colleague-send test moved closer on playability; the overall Valve/Rockstar quality gate remains open.

The user rejected the profanity reaction as frightening and requested Homer’s “D’oh!” instead. Both the trimmed and complete Simpsons: Hit & Run replacement were rejected. The user then selected preview **A** from the Homer TV archive; that complete 0.705-second take is now used, with peak headroom and edge fades only. The live HTTP response matches the source asset SHA-256. PCM format, duration, asset hash, shared loading, miss cadence, caption, mute/pause and late-load cancellation checks pass. The source take is human-selected; its in-game comic timing still awaits listening feedback. The agent cannot audition audio. See assets/audio/CREDITS.md for source and unverified redistribution permission.
