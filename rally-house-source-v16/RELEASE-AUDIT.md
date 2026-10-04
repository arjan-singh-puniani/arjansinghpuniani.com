# Rally House release audit — 2026-10-04

## Release boundary

The original checkout is on portfolio-human-copy-20260930, eight commits behind its fetched remote branch. Remote main is 0f7d5c6b. The mixed checkout contains HoloAnatomy edits, archives and backups alongside Rally House. Many seemingly uncommitted game changes already exist upstream. This isolated release branch starts at current main and includes only the additional Rally House work: spatial interactions, arcade movement/contact generosity, character appearance, and reproducible validation. No HoloAnatomy, portfolio editorial changes or archives were copied into this release.

Local screenshots/results and machine-specific delivery manifests are excluded from the new release. Existing tracked QA evidence remains tracked. Compiled dist files remain committed because the portfolio serves them directly.

## Checks completed

- Entire npm test suite passes on the assembled release branch, including simulation, saved-state migration, walking, character life, interactions, Championship, racket contact, spatial UI, and arcade timing at 30/60/120 Hz.
- git diff --check passes; whitespace issue removed.
- 57 compiled/static release artifacts match source and portfolio-served copies byte for byte. All compiled relative imports resolve in both trees.
- No new/modified release file exceeds 1 MB.
- Keyboard/touch browser rallies and five character portraits were validated during the implementation; they are historical evidence, not a new cross-device performance measurement of this branch.

## Fixes learned from the audit

1. Two manual build copies can drift. Added npm run release:check and npm run release:sync; both rebuild before comparing or syncing artifacts. Sync touches only managed build/static assets, preserving saves and other files.
2. Preview scripts referenced temporary ports. Arcade and character QA now accept QA_BASE_URL, defaulting to the standard 8078 preview. Performance comparison requires explicitly distinct QA_BEFORE_URL and QA_AFTER_URL; arbitrary running ports are not valid baseline labels.
3. The character regression assumed exactly three skinned surfaces and a cone skirt. The new continuous garment has an explicit skirt identity and a fourth surface; the updated assertion matches that intentional shape change.
4. A mixed, outdated tree hides what is already upstream. Prepare releases from fetched main in an isolated worktree, rather than git add -A from the old checkout.

## Game improvements suggested by evidence

- Preserve the forgiving return buffer. Tests show intentional early/late returns connect at three frame rates. Reward accuracy with visible directional/depth targets and a short explanation of perfect versus defensive placement; tune this in playtests rather than narrowing the timing window again.
- Profile real low-end/mobile devices before adding more effects. Historical desktop reports show around 780–790 draw calls, while spatial UI costs about 0.1–0.2 ms. Investigate repeated decor/character primitive batching and shadow work first; the current measurements do not establish a mobile bottleneck.
- Improve cosmetic cohesion through a garment/face style guide and a stable portrait fixture. Tiny primitive overlays can look blocky at close range even when the skeleton/contact rig is correct. Keep appeal refinements independent from contact geometry.
- Strengthen browser QA with repeatable match fixtures and both avatar choices. A Taylor touch run timed out waiting for a later return; the standard Arjan touch run passed. Do not treat that timeout as proof of an avatar bug without a deterministic reproduction.

## Push this prepared branch

The original mixed checkout remains preserved. Use this release worktree, review its commit, then push rally-house-polish-audit-20261004 and open a PR against main. No force push or destructive reset is needed. Pushing does not itself guarantee deployment; use the repository's normal PR/deployment workflow.
