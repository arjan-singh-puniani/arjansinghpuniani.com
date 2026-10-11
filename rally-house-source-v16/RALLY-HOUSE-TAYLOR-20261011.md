# Taylor reference-led appearance

Taylor now uses a dedicated gold and indigo feline model instead of the human face with small cat-ear accessories. The supplied clothed reference informed pointed ears, a framed bob, heavy almond eyelids, a forehead jewel, a white sleeveless dress, indigo gloves and boots, rounded gold feet, and a striped tail. This is original procedural geometry and a stylized approximation; no pixels or ripped character assets from the references are included.

The existing fifteen-bone movement and contact rig remains authoritative. Cosmetic head pieces follow its head position, gaze and tilt; the tail follows its pelvis and hip heading. Taylor's dress is one skinned surface across the hem, waist, torso and neckline. Gold leg geometry terminates inside the boots rather than continuing through their rim. Avatar selection and saved Taylor identity retain the existing avatar key. Character card copy describes the new look.

## Validation

- All 21 game suites passed, including geometry winding, garment ring seams, immutable head anchors, bounded tail geometry and exact gameplay-kinematics equality across eleven animation states at 30, 60 and 120 Hz.
- Portfolio verification passed: 91 tests, production build, type checking and lint with zero errors and 13 retained warnings.
- Chromium, Firefox and WebKit each rendered front, three-quarter, back and Championship views at 1440×900 and 390×844 with no JavaScript or WebGL errors.
- All nine shipped portfolio layouts passed with Taylor: zero Axe, overflow, JavaScript or request errors, 16 held-contact exits across four opponents and both motion modes, and five standalone reloads.
- A 1200-frame live Championship sample recorded 16 aligned contacts and a 16.7 ms p95 frame interval on the local headless browser. This is a local observation, not physical-device certification.
- All 63 source/served artifacts match. Each of the 65 entries in the standalone ZIP matches the final runtime or handoff file.

Capture controls in `qa/taylor-look.mjs` deliberately settle Taylor into idle, temporarily place her on court and orbit a close inspection camera. Only the welcome toast and world nameplates are hidden for these model inspection screenshots. Normal UI returns before Championship capture, and the original player position is restored before entering a match. These are running WebGL captures, not generated illustrations or normal gameplay footage.

Early prototypes exposed inverted ear faces, an unsuitable horizontal shoulder skin segment, and gold leg geometry piercing boot rims. The final geometry fixes those issues. The existing shot solver, racket contact, heavy-contact holds, movement, opponents, scoring and Championship camera tuning are unchanged.
