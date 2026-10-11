# REPLISOME integration — 11 October 2026

Base production commit: `4263736409264b37253cb985df9c69209b35e52d`.
Previous successful production deployment:
`https://arjansinghpuniani-gzuooyse1-arjan3.vercel.app`
(GitHub deployment `7000537933`).

## Change

- One card immediately after Anatomy Learner, reusing the existing card component styles.
- A scoped introduction at `/playground/replisome`, retaining the portfolio header, footer, and navigation.
- A click-to-launch iframe served from `/replisome/index.html`, with fullscreen/new-tab alternatives and a close action that unloads the application.
- A local poster captured from the actual molecular scene. No automatic GPU or molecular-data loading on the listing or introduction.
- Separate source and dependencies in repository-root `replisome-source/`; a prebuilt static bundle in `arjan-portfolio/public/replisome/`.
- Sitemap/canonical metadata, scientific source links, and visible model limitations.

No existing experience bundle, shared layout, global CSS, contact behavior, or portfolio dependency was changed. All changes were prepared in a clean checkout of production, preserving unrelated local work.

## Local validation

- `npm run verify`: lint (0 errors; 13 pre-existing warnings in anatomy/Rally House bundles), TypeScript, 91 existing tests with coverage, production build passed.
- `npm test --prefix ../replisome-source`: 22 unit tests passed.
- `node tools/replisome/sync-build.mjs`: strict TypeScript and standalone production build passed, using `/replisome/` as the asset base.
- `REPLISOME_QA_URL=http://127.0.0.1:3072 node tools/replisome/browser-qa.mjs`: 20 integration/regression scenarios passed, no page errors or failed HTTP responses.
- Chromium and WebKit at 1440×900 and 390×844: card placement, decoded preview images, zero eager app requests, responsive parent/iframe layouts, automated WCAG A/AA scan of the introduction, keyboard launch, local fonts and molecular data, all three modes, fullscreen or its fallback, close/focus restoration, reopen, direct/new-tab launch and Playground navigation. The card title stays within its column, and the site header does not cover the launched experience.
- Missing-WebGL checks in both engines retain readable guidance and a working close control.
- Twelve established routes return HTTP 200 and retain their heading and shared navigation.

Screenshots and machine-readable results are in `Documentation/replisome-qa/`.
The standalone source retains its earlier verification evidence in `replisome-source/evidence/`.
Automated browser checks do not replace physical iPhone, thermal, or VoiceOver validation.

## Release and rollback

Push only the isolated feature branch and require a successful Vercel preview build. Repeat browser QA against the hosted preview when access permits. Vercel currently protects preview URLs with sign-in, so unauthenticated hosted browser QA is unavailable; the full local production-build checks above provide the pre-release validation. Confirm the resulting public production deployment and repeat browser QA immediately after release. Do not deploy unrelated dirty local checkouts.

For rollback, revert the integration merge commit through a new commit and redeploy, or restore the previous production deployment above in Vercel. Existing experiences have not been rebuilt or replaced by this integration.
