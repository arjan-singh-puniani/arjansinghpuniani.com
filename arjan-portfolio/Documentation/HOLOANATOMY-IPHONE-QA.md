# iPhone interaction checkpoint

Production baseline: 404aa2f3. Changes are scoped to the shoulder application and its iframe sizing.

Fixed interrupted pointer capture clearing, cancellation reentry, and non-finite zoom when two contacts coincide. A multitouch gesture stays a camera gesture until every finger lifts. Native touch verifies local vertex deformation with fixed supports, release recovery, retractor hold, restore, pinch, remaining-finger lock and cancellation.

Added immediate grip feedback: 50px finger ring, a tether to the actual tissue particle, offset structure/release label and restrained load indication. Mobile instructions explain the current tool. Zoom and tool targets no longer overlap. Embedded height and scroll margin keep controls below the portfolio header, including on small screens. Unsupported vibration controls are disabled.

Seven gesture regression tests pass; running those against the production baseline reproduces four failures. All 95 portfolio and 37 shoulder tests, build and typecheck pass. Browser evidence is in shoulder-iphone/after/results.json. Chrome uses native CDP touch input; WebKit verifies native taps and mouse-driven deformation in an iPhone-sized context, not native Safari multitouch. Tested 375×667, 390×844, 430×932 and 844×390. Both inspected engines report zero automated WCAG A/AA violations and zero page errors.

The final sampled touch run on this Mac measured Chrome mean 16.67ms / p95 16.7ms and WebKit mean 20.4ms / p95 47ms. These are local emulation measurements, not physical iPhone frame rates or input-to-photon measurements. Real iPhone Safari, browser chrome/safe-area hardware behavior, tactile feel, heat and battery remain unverified.

After screenshots: shoulder-iphone/after. Reproduce: PORTFOLIO_URL=http://127.0.0.1:4198 node tools/shoulder/phone-qa.mjs.
