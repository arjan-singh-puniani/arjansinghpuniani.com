# Crew and full-motion refinement — 2 November 2026

The full lap → pit → lap recording exposed problems that paused screenshots missed. The cockpit camera drifted behind the moving car, a stand post crossed the car's silhouette, outgoing tires stayed parked as handlers retreated, and dry asphalt reflected a wet-looking glare. This release corrects those visible behaviors and refines the crew.

## Result

- The cockpit camera copies the car-relative pose on every rendered frame. It no longer lags over the engine cover. Its orbit polar limit permits the intended driver-eye height. The halo, front wheels and suspension remain visible while moving; portrait uses a wider lens.
- Directed shots cut away individual architecture instances blocking five points across the car. Orbit and circuit overview restore every instance. This preserves existing instancing and adds no rendering dependency.
- Outgoing tires clear the hub before lifting to 0.61 m and following their handler's retreat. Both gloves stay with the tire. Incoming/mounted wheels retain their existing hub, alignment, axle and retention contracts.
- Jack operators move with the handles and use deterministic world-space foot contacts. Helmet groups track working hands independently of torso lean. Slimmer hips, knee pads, glove orientation and original role markings make the crew more readable.
- A front-corner service camera shows the hub without the outgoing handler filling the foreground. The shared garage loads near lap completion to reduce the chapter-transition stall. Explicit Pit wall still avoids Three.js initialization.
- Asphalt roughness removes the dry-track glare. Recorded telemetry, ML calibration, seeded events and safe release logic are unchanged.

## Executed review and checks

A fresh 74.56-second recording was inspected at half-second intervals across the entire timeline, including the moving cockpit, every pit phase, departure and loop. The review caught a cockpit defect that did not occur while paused; the final camera now stays attached during playback. Camera candidates were compared in the actual rendered scene. The final portrait cockpit/service/retreat was checked in embedded Chrome and WebKit at 390px; the Watch journey also checks 320px.

177 unit tests across 18 files pass. The browser suites pass 192 checks: world 54, historical intelligence 23, experience 21, garage/challenge 26, wheels 5, crew 5, pit wall 26 and Watch 32. Two additional mobile integration checks pass. No application exceptions were recorded. The inspected automated Watch WCAG A/AA checks report no violations; this is not a complete manual accessibility audit.

The crew browser check covers 13,865 planted-contact samples, including both jack operators. Maximum support drift and render/contact error are below 8.89e-16; backward seeking restores identical contacts and head poses. Across 2,592 measured hand/tire samples, the maximum grip-center distance is 0.389 m, consistent with the tire radius plus glove contact. Rendered racing wheel pivots remain centered; axle error is below 5.73e-16. Existing garage wheel checks still cover 980 mounted samples without removed-wheel spin.

Production build, targeted ESLint and `git diff --check` pass. No dependencies added. Current production's unrelated hospitalSIM and anatomy work was carried forward. The final hardware Chrome/ANGLE Metal sample on an Apple M2 at 1440×1000/DPR 1 measured approximately 60.1 fenced racing draws/s over three seconds. This is a specific desktop sample, not a universal device guarantee.

## Limits and reproduction

The crew, car, track, cameras and inferred steering remain an illustrative procedural reconstruction. Physical-phone thermals, battery life and a full manual assistive-technology audit are unmeasured. This pass does not claim motion capture, surveyed track geometry, calibrated human biomechanics, live team data or a guaranteed design/hiring outcome.

Run `npm test`, `npm run build`, and targeted `npx eslint --no-ignore`. Serve the build and run `tools/pit-stop/cinema-qa.mjs` and `crew-qa.mjs` with `PIT_STOP_URL` and `PIT_CHROME_METAL=1`. The updated crew QA exposes matrices only through a test response, including actual hand/tire distances and both jack operators' contacts. No test-only hooks ship in the application.
