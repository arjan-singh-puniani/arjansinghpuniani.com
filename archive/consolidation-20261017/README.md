# Historical recovery archive

This directory preserves unique source, tests, experiments, patchers and design rationale recovered during the 17 October 2026 consolidation. It is outside production build roots. Canonical applications remain in their named project directories.

Read `../../REPOSITORY-CONSOLIDATION-AUDIT.md` for implementation comparisons and `../../REPOSITORY-CLEANUP-MANIFEST.md` for cleanup policy. `inventory.json` maps every inspected artifact to its classification, original path/container, SHA-256, historical Git blob or recovery object. `areas.json` groups the individual entries. ZIP/tar member paths use `!/` to distinguish an archive member from a live file.

Unique textual files are stored once in `objects/<sha256>.txt`. Their inert extension prevents old application copies from being compiled or linted as active source. The original extension and path remain in the inventory. Original binary containers, personal media and any unreadable cloud conflicts are deliberately retained in the local preservation vault; those originals are not silently treated as disposable or published as application assets.

Run `python3 tools/consolidation/verify-archive.py` from the repository root to verify recovery object bytes and historical blob existence. For recovery, locate an inventory row, verify its SHA-256, then copy the referenced object to a new inspection directory. For a historical blob, use `git cat-file blob <gitBlob>` and verify the resulting SHA-256. Inspect any old patcher's assumptions before applying it to current code.

Classifications: A canonical now; B salvage into canonical; C distinct project; D archive; E generated; F obsolete/superseded; G junk; H uncertain. The archive does not claim historical tests still pass against modern APIs. Existing dated QA is historical evidence; fresh consolidation results are recorded separately.
