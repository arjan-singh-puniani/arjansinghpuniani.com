# Adult athletic cast

Coach Contessa, Lucresia, Barbara, Leo and Arjan now use the adult human rig and facial materials introduced for Taylor. Their head proportions, hairstyle, iris/lip/hair colors, shoulder spans and tenniswear are configured individually. Contessa has a bun and green coaching outfit, Lucresia a ponytail and coral outfit, Barbara a sculpted bob and plum outfit, Leo a cropped hairstyle and blue shirt, and Arjan swept dark hair and charcoal sportswear. The women have fitted bodices and separate pleated skirts; the men have fitted short-sleeve shirts, shaped limbs and shorts with a closed waistband. Free hands have separated, relaxed fingers; strokes and prop interactions retain grip hands.

The existing individual AI profiles, coaching, learning and social roles remain. Movement, skin, racket, phone and replay use one authoritative pose. Selection bounds now follow the actual posed body so the taller characters can be selected at their faces. These are original stylized game characters, not photographic replicas. The private reference images are not included.

## Genuine production renders

The before captures route the complete compiled runtime from local checkpoint `38b7974` (Taylor portrait improvements, before the cast rebuild). Both sets use the production `Character.meshes()` and WebGL renderer, the same diagnostic stage, full detail, camera and viewport. These posed inspection renders are separate from live gameplay evidence.

| Character | Before | After |
| --- | --- | --- |
| Coach Contessa | [Before](before-coach.webp) | [After](after-coach.webp) |
| Lucresia | [Before](before-mika.webp) | [After](after-mika.webp) |
| Barbara | [Before](before-nia.webp) | [After](after-nia.webp) |
| Leo | [Before](before-leo.webp) | [After](after-leo.webp) |
| Arjan | [Before](before-arjan.webp) | [After](after-arjan.webp) |

The [image manifest](image-manifest.json) records source PNG and lossless WebP hashes and verifies identical RGBA pixels. Raw PNG files remain local. See [live Championship](live/championship.webp) and [actual portrait phone replay](phone-arjan/review-body.webp) for the game itself.

## Validation

- All **32 game suites** pass: [full log](game-tests.log). The new cast suite checks all six named adults through **6,480 poses** across 12 animation states and three simulation rates, with maximum chain stretch **1.0000000000000018** and exact solver racket error **1.57e-16** club units. It also verifies normalized bounded geometry, distinct rendered identities, registered clothing/skin, grip switching and head selection bounds.
- Native [Chromium](chromium/report.json), [Firefox](firefox/report.json) and [WebKit](webkit/report.json) pass Taylor selection, desktop/portrait club views, real Championship serve contact, exit and saved-avatar reload, with zero runtime/HTTP errors or overflow. Live ball/string spacing is approximately **0.05** club units; this spacing is separate from the exact solver attachment error.
- [Live cast checks](live/report.json) actually click all four members at their projected faces, then enter a fresh Championship against Leo, record contact and exit. All selected IDs agree, with zero runtime, HTTP or GL errors.
- The taller human Arjan completes [actual portrait phone recording](phone-arjan/report.json): exact hand/phone attachment, **127** captured pose samples, a downloaded **501,587-byte WebM**, observed playback discrepancy **9.423 ms**, exact paused seek, visible full body between the collapsed video drawer and controls, zero Axe violations, no overflow and zero retained live media tracks. The recording is a real in-game render of simulated known motion; it does not activate a physical phone camera or run computer vision.
- All **75** source/served release artifacts match. The **77-file** standalone passes CRC and exact runtime-byte comparison; [archive metadata](package.json) records its SHA-256. [Native Metal startup, Arjan selection, members, save and reload](standalone-native/report.json) pass. See the previous [portrait evidence](../taylor-presence-20261015/README.md) for the retained default-headless renderer-path limitation and baseline control.
- [Portfolio release verification](portfolio-verify.log) passes **91 tests**, TypeScript and the **32-route** production build. Lint has zero errors and 12 retained warnings.
- [Portfolio browser entry](portfolio-entry.json) passes the actual page-to-iframe flow, Arjan selection and phone-capture entry with zero runtime/HTTP errors. The existing preview server initially retained an obsolete webpack chunk URL after the production rebuild; [that incomplete attempt](portfolio-entry-stale-server.json) is retained. Restarting this task's verified server on the same port resolves the chunk mismatch, and the repeat passes.

The first live diagnostic tried Championship entry after deliberately moving every actor for isolated selection tests; that fixture could not enter normally. The [first incomplete report](live/first-attempt.json) is retained. The diagnostic now reloads the real club before match entry. The [second attempt](live/second-attempt.json) captured correct contact but asserted more than 10 samples at exactly 10 frames. The diagnostic now explicitly waits for more than 20 recorded frames; the final complete run passes without changing product code for either diagnostic issue.

## Reproduction

From `rally-house-source-v16`, run `npm test` and `npm run release:check`. Start `node qa/serve.mjs` on port 8078. Run `node qa/athletic-cast.mjs`, `node qa/cast-look.mjs`, and `QA_ENGINE=chromium QA_OUT=/tmp/cast-browser node qa/taylor-human.mjs`, repeating the latter for Firefox and WebKit. Use `QA_BASELINE_RUNTIME=/path/to/complete/baseline/dist QA_LABEL=before QA_OUT=/tmp/cast-before node qa/cast-look.mjs` for a comparable baseline. Run `QA_AVATAR=Arjan QA_WIDTH=390 QA_OUT=/tmp/cast-phone node qa/phone-capture.mjs` for actual portrait capture. Use `QA_METAL=1 QA_OUT=/tmp/cast-standalone node qa/standalone-compare.mjs /path/to/extracted/Rally-House-v16-Playtest` for the tested standalone renderer configuration.
