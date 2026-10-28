# Crew foot contact correction · 27 October 2026

The prior posture fix still used a guessed distance and direction to oscillate each foot locally. Actual body paths included nonlinear interpolation, sideways wheel handling, and abrupt changes in kneeling stance; the guessed stride could not cancel that motion. Some handlers also followed a wheel still attached to the approaching car. Thus planted soles moved across the floor even after the wide squat was removed.

Body paths now stay relative to the service bay. Handlers shift a shorter distance, let their arms handle the remaining wheel movement, and rise before a short retreat. The cart operator faces and moves along the cart's path. These visible path changes do not alter the simulation's stop, fastening, jack or release timestamps.

`crew.js` compiles deterministic foot-contact plans from those same body/posture paths. During support, each foot is a fixed world-space point; during swing, it lifts and moves to its next anchor. The renderer transforms those anchors into person-local coordinates before solving the legs. The pelvis makes a small reach adjustment instead of stretching the legs. The plan is independent of render rate and can be sought backward without accumulating state. Plans are cached per schedule with weak keys; no new runtime dependency or asset was added.

Validation:

- **144 unit tests passed**, including real four-corner paths, reversals, stationary support, limb lengths, upright travel, and preventing handlers from chasing the approaching car.
- The new **four-check browser contact suite passed**. It inspects the actual scene foot matrices using test-response-only instrumentation, without shipping a debug hook. Over **11,756 support samples**, maximum support drift and render-to-anchor discrepancy were both **8.88e-16 m**, floating-point rounding. It covers all wheel-station roles and the supply-cart operator, as well as exact backward seeking. This is geometric contact verification, not a human motion-capture validation.
- The complete **26-check garage challenge journey passed**, including direct manipulation, keyboard alternative, safe release, exact replay, best score, mobile layout and bounded graphics allocations.
- Typecheck and targeted ESLint passed. The local production build was rebuilt; build output is retained with the evidence.

[Saved screenshots, browser reports and motion clip](/Users/arjan/.codex/visualizations/2026/10/24/01a16fd8-9529-7623-b5b8-c9e9ddd053a5/pit-garage-2026-10-27/foot-contact-fix).

Reproduce: `npm test`; `npm run typecheck`; `npx eslint --no-ignore public/pit-stop-lab/crew.js public/pit-stop-lab/world.js tools/pit-stop/crew-qa.mjs tests/pit-crew.test.js`; run the local production server, then `PIT_CHROME_METAL=1 node tools/pit-stop/crew-qa.mjs` and the existing garage QA script. The contact suite defaults to `http://127.0.0.1:4174`, configurable through `PIT_STOP_URL`; output is configurable through `PIT_CREW_EVIDENCE`.

The characters remain procedural and stylized. This does not add a whole-body collision solver or motion capture; physical-device testing was not repeated. No external publishing was performed.
