# Pit crew body motion correction

Foot/helmet-only validation missed workers’ arms crossing neighboring legs, forearms passing through tires during lifting, and discontinuous body shifts. The original full-body sample found a 0.142 m capsule overlap and a pelvis displacement of approximately 0.19 m in one 1/120 s sample.

Changes coordinate the body with the task: continuous support transfer, a fixed elbow hinge, quintic easing, stride-sized foot lift, wheel height tied to the handler’s rise, body-relative hand relaxation, blended head attention, and eased jack engagement. Tire handlers face their work and keep separate fore/aft paths. Smaller retreat steps and slower rises preserve clearance without the previous crouched shuffle.

## Validation

- 237 unit tests pass, including regressions for the former kneeling-threshold jump, elbow continuity and small-step clearance. Targeted ESLint and the Next production build pass.
- The browser scan samples actual rendered matrices at 120 Hz through clean, slow-gun, poor-position and unsecured-wheel scenarios: no measured crew/crew or non-grip limb/tire intersections above the 5 mm capsule tolerance. Full per-case maxima are in the companion JSON.
- Existing crew contacts/grip/seeking, mounted-wheel alignment, cinema controls, exterior venue, safety hold, engineering controls and portfolio embedding checks pass.
- Reviewed a fresh uninterrupted lap–pit–lap recording and the slow crew recording; checked mobile WebKit views. A separate WebM captures the complete pit stop directly from the application canvas.

## Limits

This remains authored procedural animation, not motion capture. Capsule proxies are not a triangle-level collision or self-collision proof. The gripping wrist band is exempted only against its own tire; glove contact is checked against the tire surface. Temporal limits catch large pose discontinuities and do not certify visual quality. Physical-phone performance, manual screen-reader testing and professional pit-crew review were not performed.
