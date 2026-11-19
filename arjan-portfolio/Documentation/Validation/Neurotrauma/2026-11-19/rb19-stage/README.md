# RB19 integrated dark stage

19 November 2026. Based on production `739d9dff`. The requested change was to enlarge the Red Bull model and remove the gray box so the vehicle feels part of the surrounding interface.

The live renderer now uses the page's exact navy background, `#101f2a`, through the official Sketchfab Viewer API. A wider desktop vehicle column, a 16:10 scene and closer authored cameras give the car more room horizontally while reducing empty vertical space. On screens at or below 500px, the scene extends through the graphic's side padding. Cyan rails, a restrained control grid and accessible dark controls connect the viewer to the rest of the explorer. No provider branding or controls are cropped or hidden.

Front, front-left, side, rear, top and cockpit views were opened in hardware-rendered Chrome. The first closer front and top views clipped the vehicle; these were corrected before the final checks. The rear camera has its own look-at target so it can remain closer without losing the rear wing. Final desktop and mobile screenshots were opened and reviewed, including the 320px layout. The original impact questions, unknowns and fictional handoff are unchanged.

The opening and fallback use a new 111,184-byte WebP render of the same credited Redgrund model, captured through the official `getScreenShot` API. The new asset URL avoids cached gray thumbnails. The old thumbnail remains available at its original URL. Attribution, CC BY 4.0 licensing, render settings and SHA-256 are recorded in `assets/neurotrauma-rb19/provenance.json`. The public source ledger and methods now describe the actual render. No dependency was added.

`npm run verify` passes: lint (41 existing warnings, zero errors), TypeScript, 308 tests across 36 files with coverage and the optimized build. The page remains statically prerendered at 11.8 kB route JS / 124 kB first-load JS. See `verify.log`.

The optimized-build browser suite passes in Chromium at 1440×1000, 1024×768, 768×1024, 390×844 and 320×740, and WebKit touch at 390×844. It checks all 16 direction/stage combinations, keyboard/touch controls, reduced motion, poster loading, zero automated WCAG A/AA violations, links, sources, no-JavaScript text, blocked images, blocked model service and fresh retry, metadata and the printable handoff. The handoff still produces one A4 page.

The separate real-renderer suite passes in hardware-rendered Chrome at 1440×1000, 390×844 and 320×740: no provider requests before activation, a stable selected camera, all four rendered directions, orbit, top/cockpit/reset actions, close/unmount, no overflow and no browser exceptions. `browser-results.json`, `viewer-results.json` and the two viewport screenshots record these local production-build checks. Post-deployment evidence is recorded on the pull request.

Physical phones and human screen-reader sessions were not tested. Interactive 3D requires the external model host and hardware WebGL; the local render and complete text comparison remain available if it cannot load. This is an illustrative 2023 artist reconstruction, not official CAD, a crash simulation or a clinical assessment.
