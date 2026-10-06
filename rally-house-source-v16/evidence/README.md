# Evidence index

The source baseline is main `db9bb1e3d650f6094e40140b358424b841f10450`. `baseline-inventory.json` records 412 scoped baseline paths, sizes and hashes. Generated files are not independent sources of architectural authority.

## Before and after

| Subject | Baseline | Candidate |
|---|---|---|
| Portfolio | [Before](before/portfolio-desktop.webp) | [After](after/portfolio-final.webp) |
| Club | [Overview](before/club.webp) | Current hero/scene images in the served `media` folder |
| Bell | [Wide interaction](before/desk-interaction.webp) | [Actual surface reach](after/bell-detail.webp) |
| Portrait tennis | [Baseline](before/match-portrait.webp) | [Candidate](after/match-390.webp) |
| Transition | Same scene established by baseline build | [Approach](after/transition.webp), [contact](after/contact.webp), [return](after/return.webp) |

Images are WebP conversions of runtime screenshots. Captures are controlled QA views; pose freeze/camera staging is described in the experiment report. They are not proof of human enjoyment or exact visual equivalence across random simulation moments. Contact, transition and return show real authoritative phases. Continuous automated browser recording is served as `arjan-portfolio/public/rally-house/media/club-to-court.webm`, with VTT scene descriptions; it is silent.

`experiments/camera-{A,B,C}.webp` and `after/captures.json` preserve camera alternatives and projected coordinates. `experiments/hero-stacked.webp` preserves the rejected centered composition. The final selected side-by-side composition is in the candidate portfolio capture.

## Machine records

- `before/baseline.json`: three local page sizes, public responses and a paused frame sample.
- `before/public-build.json`: two public owner hashes and baseline identity checks.
- `experiments/tuning.json`: original post-bounce cue matrix; retained as baseline.
- `experiments/cue-{0.45,0.65,0.85,1}.json`: refined anticipation matrices. Current harness accepts `QA_CUE_LEAD`, e.g. `QA_CUE_LEAD=0.65 node qa/experience-tuning.mjs output.json`.
- `after/browser.json`: nine page sizes, accessibility, 32 lifecycle cycles and 30 active frame batches.
- `after/game-viewports.json`: nine game viewports and all projected court corners.
- `after/poses.json`: 30,240 conservative pose samples; method and warnings are included.
- `after/studio-matrix.json`: current four-size studio regression run, copied before historical outputs were restored.
- `after/final.json`: actual saved-result reload, audio cache/disposal, short active frame samples and extracted package styles/boot.
- `after/media.json`: footage dimensions/duration/track, keyboard entry, fullscreen fallback, five launcher reloads and separately recorded range cancellations.
- `after/film.json`: measured capture events, seven contacts and zero page errors.
- `logs` (trailing whitespace normalized): game suite, studio suite and portfolio verification outputs. Portfolio log is the preceding successful 91-test run; verification was repeated after the final media filename update and also passed.

The original Desktop tracked diff and status were compared byte-for-byte at the end and matched their initial backups. Those private dirty-tree backups are deliberately not committed with product evidence.

Read `RALLY-HOUSE-VALIDATION.md` and `RALLY-HOUSE-HUMAN-PLAYTEST.md` for measurement limits and open human/device gates.
