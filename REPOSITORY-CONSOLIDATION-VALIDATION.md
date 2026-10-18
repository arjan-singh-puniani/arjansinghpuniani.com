# Consolidation validation — 18 October 2026

October 18 follow-up: the production-preserving statements below describe PR #25. The subsequent realism feature integration and corrected endurance gate are documented in the [realism qualification](rally-house-source-v16/evidence/endurance-20261018/README.md); its 64-cycle run includes eight native review round trips.

## Canonical decision and review

Baseline production main: `4ada219a06682b76c7a230686bb40714a9fb9d3b`. The consolidation branch preserves its production source and deployed runtime byte-for-byte. Changes outside the recovery archive are repository documentation, explicit recovery-vault ignore rules, an archive verifier and browser QA configuration/selection fixes.

[PR #25](https://github.com/arjan-singh-puniani/arjansinghpuniani.com/pull/25) contains the consolidation. The newer `rally-house-realism-proportions-20261017` branch is deliberately preserved and unmerged. Its full game suites passed, but its 32-cycle browser soak failed on match entry 28; the same canonical-main test passed all 32 cycles. The trial merge was aborted. See the archived branch gate and diagnostic logs.

Review checks: production source/runtime diff against baseline is empty; no old patcher was executed; no blanket branch merge, force push, reset of unsaved work or `git clean` was used. Recovery objects are inert text outside production build roots. The archive verifier checks their exact bytes and historical blob availability. Secret-pattern scanning of all 180 recovery objects found no matches. New source artifacts are small text; original ZIPs, videos and personal media are excluded from Git.

## Preservation and executed cleanup

- 3,754 project artifact records, including live files and inspected ZIP/tar members.
- 180 unique historical text objects preserved in Git; 875 distinct referenced historical Git blobs verified after the cloud retry.
- 1,744 original local files accounted for: 1,735 relocated using same-filesystem rename with device/inode/length checks; nine Finder metadata files deleted.
- 131 personal media files preserved as a distinct private collection, with filenames excluded from the public source inventory.
- A second bounded read attempt recovered 50 initially unreadable cloud copies; their bytes already existed on canonical main or remote history. No additional production implementation was introduced.
- 111 cloud copies remain unreadable and explicitly uncertain. Their originals remain in the local vault, not discarded or represented as inspected content.
- Inventoried tracked paths restored after preservation: 52 in the primary checkout, 26 in hardening, 17 in shoulder-2. Copy-resolution had no tracked edits; its one generated cache file was preserved separately.
- Five stale worktree metadata entries pointing to nonexistent temporary directories were pruned; branch histories remain preserved. Active historical worktrees were retained.
- Divergent old local main is preserved on the remote tag `archive/pre-consolidation-local-main-20261017` before the canonical local main label is updated.

The exact nine deleted paths and per-root counts are in `archive/consolidation-20261017/CLEANUP-EXECUTION.json`. The versioned inventory maps every project artifact to its destination or historical blob. The private vault index records every original-file operation, including checksums, unreadable status and recovery paths. Original-file destinations follow `originals/<root>/<original relative path>` under `.local-preservation/20261017`.

## Fresh pre-merge validation

| Check | Result / evidence |
| --- | --- |
| Recovery archive | 180 recovery objects and 875 historical Git blobs verified; `python3 tools/consolidation/verify-archive.py` |
| Portfolio locked install | Fresh `npm ci --offline --no-audit --no-fund` completed from local cache; dependency lockfile unchanged |
| Portfolio verification | `npm run verify` passed: zero lint errors, 14 existing warnings, TypeScript, 91 tests in nine files with coverage, production Next.js build |
| Rally House | `npm test` passed all 33 executable suites on canonical source, including simulation, object identity, Championship, contact, appearance, rig registration, replay, phone capture, athletic cast and gait |
| Source/deployment parity | `npm run release:check` passed: 74 release artifacts match, module sets agree, all compiled relative imports resolve |
| HoloAnatomy domain | All 14 domain tests pass: source geometry/provenance, topology/LOD, staging, labels, quiz and input semantics |
| HoloAnatomy browser | Full desktop/mobile suite passed with `QA_METAL=1`: camera presets, mesh picking, orbit/pan/pinch, isolation, peel/undo, lessons, 3D quiz, OBJ fallback and LOD2; no page errors or failed HTTP responses |
| Vector Tennis / VectorCourt | Production browser controls pass: J/K/L, retired Space handling, arrow movement, button activation, focus stability and normal page scrolling |
| REPLISOME | 33 tests in four files and independent production build pass. The build warns about chunk size and a font link resolved at runtime; source and distribution both contain the local stylesheet and licensed fonts |
| Living-club continuity | Canonical Chromium passes nine stages and three challenge/return cycles, preserves object/cast/fixture identity and state, advances the live club during Lab replay, restores the camera and reports no console/HTTP errors |
| Repeated-match lifecycle | Canonical main passes 32 cycles: DOM range 268–268, court/input/match ownership released, camera restored, zero tracked transient audio nodes after settling. Coarse heap endpoints both reported 42.1 MB |
| Native object interaction | Desktop evidence covers 13 physical action flows, 12 viewport layouts and zero Axe violations; the separate final native 390×844 touch check selects the clock and starts exactly one inspect activity with no page/HTTP errors |

Curated machine-readable evidence and logs are in `archive/consolidation-20261017/validation`. Historical source reports keep their original dates and claims. Current test output is kept separately from historical reports.

## Browser harness corrections and limits

QA now accepts isolated base URLs/output directories. This prevented accidental testing against an unrelated existing server on port 8078. Object selection settles and pins the camera, locates an exposed native hit, then uses a real mouse/touch action and checks the resulting authoritative selection; it does not force clicks or directly call an interaction to bypass the UI. Mobile selection also waits for avatar-choice transition completion.

Anatomy defaults to the browser managed by the locked Playwright package and supports an explicit executable. The successful visual run used Metal on this Mac; the default graphics path timed out. Output directories are created before error reporting so a missing directory cannot hide the actual failure. Screenshot suppression is optional and is not used to claim visual validation. The successful anatomy screenshots were rendered and inspected.

The first Firefox game attempt timed out at readiness; no Firefox pass is claimed for that run. Automated browser checks and short heap/frame measurements do not establish physical-device comfort, clinical accuracy, thermal behavior or an absence of all long-duration leaks.

## Merge and post-merge recording

Merge only the reviewed consolidation head after its latest checks pass. Preserve the feature branches and recovery tag; do not rewrite remote history. Fetch the merge, update canonical local main, then start fresh processes for post-merge builds/tests/browser checks.

The final merge SHA, remote equality, complete commit list, active worktree status, post-merge results and any remaining limitations are recorded in the final user-facing Git state report and the local `.local-preservation/20261017/FINAL-GIT-STATE.md`. This pre-merge record does not infer that a successful merge itself proves runtime correctness.
