# Low-stroke shoulder clearance

The cross-body elbow guide ignored grip height, holding the upper arm across the chest during low backhands and serve recovery. The existing low-grip weight now lowers and opens that elbow guide. The forward reach stays intact so the upper arm clears the fitted torso.

That path exposed an existing palm-roll singularity: projecting a palm axis onto the forearm could flip the sleeve and collapse its volume. The rig now uses its existing shortest-arc frame transport for palm roll as well as shoulder roll. The same function builds live and replay skin matrices. The body and clothing assets, contact targets, timing and animation framework stay intact.

The regression skins the actual jersey panels that previously crossed during the loaded backhand, at 30/60/120 Hz. The old build fails. Existing anatomical-length, exact-contact, forearm-volume, fitted-top, finger-clearance and replay checks pass. Native checks cover all four women, both men, actual color/shadow arm-to-skirt clearance, real rally review, phone capture and repeated session cleanup.

`review.html` shows matched native screenshots and isolated rig motion. These videos are not presented as actual gameplay.

Rejected: extra shoulder protraction, changing elbow guides at every height, extra shoulder joints, upper-arm roll alone and an independent ribcage anchor. They distorted other poses or increased overlap. Lowering the elbow without correcting palm transport failed the existing forearm-volume guard; shortening its forward guide failed the fitted-top guard.

Remaining: some high-pose shoulder fabric folds and legacy clothing fit. The overall Valve/Rockstar bar remains unproven.
