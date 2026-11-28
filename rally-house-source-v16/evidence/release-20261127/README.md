# Rally House release — 27 November 2026

Approved scope: stopping/recovery fix e32d1fab and living-club update 9d830b18. Production baseline: 6ae0bb3e. Release branch: release/rally-house-living-club-20261127.

The landing hero, Playground card, and social preview now use the verified living-club capture, encoded as an 88,736-byte WebP with a new filename to avoid stale image caches. Existing gameplay, four-step instructions, and direct mobile navigation are preserved.

Validation before publishing:
- Isolated checkout restored from Git; unrelated Desktop work untouched.
- Exact portfolio lockfile installed with npm ci --ignore-scripts. Initial shared dependencies were stale and caused JSX test failures; the locked install resolved them.
- 37 portfolio test files / 314 tests pass; optimized Next.js 15.5.28 production build passes type/lint checks.
- Five focused game scripts pass: living-club, motion-direction, world-interface, activity-reservation-cost, avatar-switch-lockout. Earlier full game checks and paired performance measurements are retained in the living-club-20261126 evidence directory.
- 133 source/served release artifacts match.
- Optimized local page: desktop Chromium and mobile-sized WebKit both load the walkthrough and start an actual rally through the visible Play action. No page/console errors, HTTP failures, or horizontal overflow. Screenshots inspected.
- QA script: qa/release-arrival.mjs BASE_URL OUTPUT_DIR.

Physical iPhone heat/battery testing and new external visitor feedback were not performed. These checks demonstrate working release paths, not a guarantee of how every visitor will react.
