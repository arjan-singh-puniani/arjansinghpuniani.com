# Homepage redesign — 19 November 2026

## Source and scope

Built from production commit `c367d112` in branch `codex/portfolio-home-editorial-20261119`. The live homepage and local desktop/mobile page were inspected before implementation. The working SeizeFreeze anatomy/device lab, ORTHO Lab fracture case, and current BODY//ATLAS were opened locally.

Only the homepage, its styles, and its existing SeizeFreeze feature component changed. The shared navigation, project pages, metadata, structured data, analytics, contact form, and project runtimes remain in place. Homepage-only header/footer styling is scoped through the homepage class. No dependencies were added.

The previous homepage repeated large equal-weight project panels, delayed the projects with a long introduction, and used generated concept illustrations. The replacement uses a shorter personal introduction, an original Cyberpunk Reality identity and real team photograph, a large real ORTHO Lab capture, and supporting atlas/BCI features. The consciousness and ECG homepage cards were removed; both project routes remain available.

## Assets

| Homepage asset | Actual source and treatment |
| --- | --- |
| `cyberpunk-reality-team.webp` | User-supplied `wins/IMG_7793.JPG`; real team photograph with the Kuzneski cup; orientation applied, resized to 1600 × 1200, WebP encoded; no generated content or people removed. |
| `cyberpunk-reality-mark.webp` | Existing `website/cpr_logo_v0.1.png`, matching the supplied original Cyberpunk Reality artwork. Cropped to the head emblem and resized; the original blue/white colors remain. Brand name is accessible HTML text. |
| `ortho-lab-capture.webp` | Screenshot of the running `/hospitalsim/ortho/index.html` workbench after selecting “Take the clamp,” showing the initial reduction stage. Original game controls and fictional alignment values remain visible. Captured at 2× scale; 2440 × 1618 WebP. |
| `body-atlas-current.webp` | Real screenshot of the current `/atlas` experience at 1600 × 1100 CSS pixels, captured at 2× and downsampled. It shows the current solid anatomical contour and source-linked intervention interface. |
| `bci-calibration.webp` | Existing public `images/research/rnel-gamified-bci-task.jpg`; resized to 1200 × 676 and encoded as WebP. |
| Portrait | Existing `images/hero/arjan-headshot.webp`; reused with a smaller responsive crop. |

The five added WebP assets total about 662 KiB. Project imagery is prepared in advance and uses the platform's static serving path: the local AVIF optimizer stalled for two smaller preview variants during browser QA, while the equivalent direct WebP responses succeeded. Native lazy loading remains enabled. The homepage loads no project canvases, iframes, videos, font service, or animation library.

## Evidence and wording

SeizeFreeze's role, architecture, modeling work, stage, and limitations come from the existing case study and lab evidence notes. The team photograph is identified as a team photograph, not device evidence. The homepage makes no claim of clinical validation, regulatory approval, tested seizure control, or an implemented implant.

ORTHO Lab's case steps were checked against the actual playable case and case notes. The page identifies its thresholds and gestures as game rules and makes no learning-outcome or clinical-training claim. BCI task wording follows the existing profile and case study.

The newer atlas view already contains external genital anatomy; the older translucent homepage preview obscured surface detail. No anatomical model, measurement, or underlying atlas runtime was changed.

## Verification

- ESLint: passes, with 41 existing unused-variable warnings in unrelated project runtimes/tools.
- TypeScript: passes.
- Existing coverage suite: 35 files, 306 tests pass.
- Final complete test run: 36 files, 307 tests pass, including the new homepage content/destination regression test.
- Production build: passes (39 generated pages).
- Chromium production browser review: full-page captures at 1440 × 1000, 820 × 1180, 390 × 844, and 320 × 760. All six images load; no horizontal overflow, page errors, or failed HTTP responses.
- Automated axe accessibility scans: zero violations at all four sizes. This is an automated check, not a conformance certification.
- Keyboard: skip link focuses main; mobile menu opens, exposes its links, closes with Escape, and returns focus. Reduced motion disables smooth scrolling; no animations run.
- All 17 internal destinations return HTTP 200, including the removed cards’ preserved project pages.
- Visual iteration: shortened the desktop introduction; stacked the team photo below the copy at tablet width to preserve faces; used a tighter crop of the real operative view on phones; simplified tablet navigation and footer.
- Not checked: physical phones, assistive-technology users, production analytics delivery, or contact-form submissions. Production deployment was not performed.

Browser captures and diagnostic scripts are in `/private/tmp/portfolio-home-review/`. Start this checkout with `npm run start -- --hostname 127.0.0.1 --port 3193` after building. The local preview is not a production deployment.
