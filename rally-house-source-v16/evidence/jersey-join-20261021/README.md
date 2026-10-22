# Jersey join — 21 October 2026

1. Wrong: dark shoulder marks during low strokes looked like torn sleeve joins.
2. Cause: independently fitted torso and sleeve surfaces overlapped; the material mapping also carried the navy side panel into the moving arm cap. The neutral unlit diagnostic showed coverage rather than an open hole.
3. Fix: one continuous body-derived jersey fitted to the authored punkduck silhouette. Preserve collar/hem heights and source arm weights, blend atlas placement through blue at the cap, retain the physical cuff strip, keep side contrast lower on the torso and render thin cloth from both sides.
4. Regression: the former top has three surface components and ten boundary loops; the new top has one component and only the four intended openings, with manifold seams. Full npm test passes. Torso clearance now identifies arm caps by body weights rather than the obsolete separate sleeve UV strip. All four women pass the existing native garment checks; actual cast views, phone recording/review, a complete eight-shot point and release parity pass. Five non-kit primitives remain byte-identical in their geometry attributes.
5. Perception: matched native backhand/forehand views show a continuous blue shoulder instead of the prominent dark slit. Collar, cuffs and lower side panels remain readable. Active-point ABBA timing stays near 16.7 ms in both builds; the scene has fewer triangles.
6. Colleague-send: closer; still no. Human evaluation of cast appeal and broader presentation remains open.

shoulder.webp uses the same backhand time and camera. Full captures remain in /tmp/rh-shoulder-views9, actual cast views in /tmp/rh-shoulder-cast, and recording/point evidence in /tmp/rh-shoulder-{phone,point}. Tests verify seam continuity and sampled clearances, not general cloth self-collision. Public publication remains pending explicit approval.
