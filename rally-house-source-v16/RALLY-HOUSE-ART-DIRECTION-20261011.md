# Rally House art direction — 11 October 2026

The user's reference supplied a visual direction: natural proportions, varied materials, leafy silhouettes and warm sunlight in a lived-in place. Its social-media text was reference content, not an engineering instruction. This pass develops those qualities within the existing miniature tennis club. It preserves the praised Championship contact, movement and camera tuning.

## Changes a player can see

- Smaller, coordinated faces and hairstyles; slimmer arms and calves; a rounded shirt core, restrained swept hair and small polo details. Cast colours, hairstyles, accessories and identities remain distinct.
- Skin sits inside sleeves and shorts instead of piercing their hems. Adjacent skinned segments share a joint ring plane, closing waist, knee and elbow seams. Descending garments retain outward winding.
- Wood grain, cloth weave, plaster variation, stone joints and court detail use local or bind-space coordinates. Derivative filtering suppresses periodic detail at small screen sizes. Shading uses linear-light albedo and a filmic highlight curve; ambient fill is lower and the court is a deeper green.
- Bonsai and floor plants have curved, pointed, two-sided leaf geometry. One cached canopy replaces each ellipsoid without adding a draw call per leaf. Each canopy has 552 triangles, within the replaced sphere's 560-triangle budget. Overall scene cost still increases because of other authored details.
- Folded linen curtains, a rail and window sill, reception joinery, and visible tea surfaces give existing assemblies more recognisable material and construction.
- A projecting racket display now has a physical footprint. Close-up review exposed a member walking through its shelves. The corrected boundary preserves shop-to-tea and shop-to-entrance routes. Semantic object IDs and specific actions stay with their existing assemblies.

## Visual experiments and corrections

The first lighting candidate was too pale; its 1.45 exposure multiplier was rejected in favour of .78. Grain contrast was reduced after the first review. A no-culling diagnostic ruled out back-face culling as the cause of the original jagged hems: the underlying skin was intersecting the garment.

The shared-ring experiment initially reversed the descending skirt's winding. Full-cast inspection caught it. Ring axes now follow the segment direction, and an explicit outward-winding regression covers every generated garment. Portrait inspection cameras were corrected after a locker occluded Leo; idle transitions are settled for the controlled cast review.

## Validation and evidence

The game passes all 20 suites in `npm test`, including 144 circulation routes, authoritative racket contact at three rates, 42 completed object actions, repeated exact clock restoration, save migration, and the new geometry/circulation checks. The portfolio's verify pipeline passed 91 tests, type checks and 31 generated routes with zero lint errors and 14 retained warnings. A subsequent production build includes the refreshed captures and correct Open Graph image dimensions.

Chromium object QA passed 13 native UI flows, 12 layouts, persistence, touch and Axe checks. Firefox and WebKit each passed three layouts and native keyboard object actions. Shipped portfolio checks cover nine layouts, accessibility, real entry/exit controls, all four opponents, 16 exits during held contact, bounded audio buffers, and five extracted-package reloads.

`qa/art-direction.mjs` captures desktop and phone views, clear midday, evening and rain, both avatars and the four members. Cast portraits are controlled idle geometry inspections, not gameplay footage. The whole-club, match and portfolio images are captured from the running game. No pixels or assets from the reference are imported.

The final rally profile, screenshots, source hashes, generated simulation reports and package hash are in `evidence/art-20261011`. Read the profile for the measured frame intervals and contact count. These are local headless browser measurements, not physical-phone certification or a zero-leak claim. The standalone package contains 64 files; CRC and module parity are verified.

## Practical limits

This remains an original stylized miniature. It does not claim the naturalistic character modelling or environment density of the referenced game. A further change in that direction requires a coherent authored character and environment asset pass, with rig/contact validation, rather than another colour filter. Human taste and physical-phone playtesting remain open gates. Existing captures of clock and watering rituals and the earlier continuous film remain historical gameplay captures; the club and rally stills are refreshed for this pass.

The temporary checkout suffered missing older files and Git objects during the work. New work and baseline captures were preserved, and a fresh clone recovered the merged PR #10 source. The original dirty repositories were not reset or cleaned. This art branch starts from merge `e0159e795c5e8ca6b1594bc9a19df0c0bc9a7a5a`.
