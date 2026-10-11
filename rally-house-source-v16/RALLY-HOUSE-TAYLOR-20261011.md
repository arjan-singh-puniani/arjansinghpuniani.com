# Taylor reference-led appearance

Taylor now uses a dedicated, fully clothed gold and indigo feline model instead of the human face with small cat-ear accessories. The supplied references informed pointed ears, a framed bob, heavy almond eyelids, a forehead jewel, a white sleeveless dress, indigo gloves and boots, rounded gold feet, and a striped tail. This is original procedural geometry and a stylized approximation; no pixels or ripped character assets from the references are included.

The refinement replaces the primitive face with an authored cheek and chin profile, projects the eye graphics onto that convex surface, and adds the zigzag hairline, curved headdress stripes and a sculpted forehead crest. The headdress crown shares the bob's boundary vertices, removing the visible rear seam. The dress uses a smooth continuous profile rather than coarse linked segments; rounded shoulder caps join the higher-resolution arms. The tail is now two cached smooth meshes with a rounded gold tip rather than ten separate cylinders.

The existing fifteen-bone movement and contact rig remains authoritative. Cosmetic head pieces follow its head position, gaze and tilt; the tail follows its pelvis and hip heading. Taylor's dress is one skinned surface across the hem, waist, torso and neckline. Gold leg geometry terminates inside the boots rather than continuing through their rim. Avatar selection and saved Taylor identity retain the existing avatar key. Character card copy describes the new look.

## Surface-refinement validation (`ba811bb`)

- All 21 game suites passed, including geometry winding, garment ring seams, immutable head anchors, bounded tail geometry and exact gameplay-kinematics equality across eleven animation states at 30, 60 and 120 Hz. The eye regression independently intersects the emitted face mesh at graphic-triangle centroids, including the compressed blink, to detect graphics cutting through the face. The full cached head stays below 12,500 triangles.
- Portfolio verification passed: 91 tests, production build, type checking and lint with zero errors and 13 retained warnings.
- Chromium, Firefox and WebKit each rendered front, three-quarter, back and Championship views at 1440×900 and 390×844 with no JavaScript or WebGL errors.
- All nine shipped portfolio layouts passed with Taylor: zero Axe, overflow, JavaScript or request errors, 16 held-contact exits across four opponents and both motion modes, and five standalone reloads.
- A 1200-frame live Championship sample recorded 16 aligned contacts and a 16.7 ms p95 frame interval on the local headless browser. This is a local observation, not physical-device certification.
- All 63 source/served artifacts match. Each of the 65 entries in the standalone ZIP matches the final runtime or handoff file.

Capture controls in `qa/taylor-look.mjs` deliberately settle Taylor into idle, temporarily place her on court and orbit a close inspection camera. Only the welcome toast and world nameplates are hidden for these model inspection screenshots. Normal UI returns before Championship capture, and the original player position is restored before entering a match. These are running WebGL captures, not generated illustrations or normal gameplay footage.

Early prototypes exposed inverted ear faces, an unsuitable horizontal shoulder skin segment, and gold leg geometry piercing boot rims. Refinement captures also exposed eye triangles cutting into the gold face, lower headdress stripes clipping through the bob and a small rear crown seam. The final geometry fixes those issues. The existing shot solver, racket contact, heavy-contact holds, movement, opponents, scoring and Championship camera tuning are unchanged.

The initial pass is retained in `evidence/taylor-20261011`. Surface-refinement reports, actual WebGL screenshots and source/package hashes are in `evidence/taylor-refined-20261011`; the validation numbers above come from that refinement. All three engines measured 871 draw calls and 279,038 rendered triangles in the controlled idle inspection scene, which includes the academy, other characters and shadow passes. These counts are scene observations, not universal performance guarantees.

## Glamour and expression pass

Taylor now wears an indigo neckline with gold edging, a fine gold hem and small turquoise drop earrings. The costume edging samples the existing dress profile and the same spine weights, so it follows the fabric during movement. The earrings follow the head frame and have attachment studs. The forehead crest's dark details sit in front of its gold surface rather than being hidden inside it.

Swept eyeliner and rounded double catchlights sharpen the eyes. The neutral face has a small asymmetric smile; friendly and proud reactions use a wider warm smile; focused or disappointed reactions retain the original frown. These are responses to the existing emotion system, not new idle poses or changes to the gameplay rig. The fully clothed silhouette and clothing coverage stay the same.

Current validation is saved in `evidence/taylor-glamour-20261011`:

- All 21 game suites passed. The independent face intersection check now covers eyeliner, lashes, catchlights and mouth graphics across four emotional expressions, including compressed blinking.
- Portfolio verification passed: 91 tests, type checking, production build, zero lint errors and 13 retained warnings.
- Chromium, Firefox and WebKit each rendered 16 views: front, side, back, four actual emotion states and Championship at desktop and portrait sizes. All 48 captures had zero JavaScript and WebGL errors.
- The current shipped 390×844 portfolio flow passed with zero Axe, overflow and request errors. All 16 held-contact exits, four opponents, both motion modes, bounded audio disposal and five extracted-package reloads passed again.
- A 1,200-frame live Championship sample recorded 16 aligned contacts and a local p95 frame interval of 16.7 ms, with no JavaScript errors. This is a local browser observation rather than physical-device certification.
- Source/served parity covers all 63 artifacts, and every entry in the 65-file standalone ZIP matches the current runtime or handoff file.
- The controlled idle scene measured 880 draw calls and 283,644 rendered triangles in each browser engine. This includes the complete academy and other actors, not just Taylor.

The expression captures call the real `setEmotion` method and let the existing character update blend the face before capture. Neutral emotion is restored before Championship. Selected images are retained alongside the full capture reports; the screenshots remain actual WebGL renders with the inspection controls described above.
