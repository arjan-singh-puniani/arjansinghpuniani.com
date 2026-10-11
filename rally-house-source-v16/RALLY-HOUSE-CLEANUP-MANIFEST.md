# Rally House cleanup manifest — 10 October 2026

| Disposition | Exact scope | Rationale / action |
|---|---|---|
| KEEP | Canonical `rally-house-source-v16/src`, HTML/CSS, config, tests, active QA, documentation | One authored TypeScript source tree; generated JS is rebuilt from it |
| KEEP | `arjan-portfolio/public/rally-house`, Rally route, actual media | Release mirror and portfolio integration; 61 artifacts checked against source |
| KEEP | Curated `evidence/objects-20261010` | Reproducible current results and historical hash/provenance metadata |
| ARCHIVE | All 886 relevant original files enumerated in `cleanup-classification.json` | Verified copy in `/Users/arjan/Desktop/arjansinghpuniani-hardening/rally-house-forensic-archive-20261010`; originals remain in place |
| ARCHIVE | Pre-change canonical scoped tree | `rally-object-canonical-20261010.tar`, main `846d1c7` |
| DELETE | None of the user's historical files | Unique cast/prop experiments and uncertain media remain valuable; duplicate bytes alone do not justify deletion |
| EXCLUDE from release diff | Five test-generated tracked telemetry snapshots | Capture current results separately, then put only these safe-clone files back to their exact HEAD bytes; no user checkout changes |
| EXCLUDE from Git | `takeover-evidence`, generated playtest ZIP | Retain local captures/package; ship selected evidence and actual portfolio WebP captures |
| DO NOT TOUCH | HoloAnatomy, Vector Court, ReasonOS, SeizeFreeze, Hemodynamic Observatory, unrelated research / photos | Outside Rally scope |

The isolated checkout is the consolidation: it imports no RC/backup/patch directory and contains only the selected canonical implementation. There is no destructive cleanup to validate. Fresh processes, builds, source/served parity, package boot and browser flows still validate the resulting release boundary. Original dirty work is preserved. The archival folder is the only addition to the hardening checkout.


## 11 October — preservation-first consolidation

| Class | Authority / disposition |
|---|---|
| A / B | Current `src`, compiled `dist`, synced portfolio public runtime; maintain this single browser authoring tree |
| C | Existing live deployment preserved until the tested branch is reviewed/deployed |
| D / E | New lab QA, screenshots, source hash manifests and capability/design/implementation documents retained |
| F / G / I | Earlier Rally snapshots, experiments and regression evidence preserved; existing verified 10 October archive retained |
| H | Private VectorCourt footage and anatomy archives stay at original local locations; not copied to browser/public tree |
| J | Annotation, native tests and lab QA tools retained in their owning projects |
| K / L | Duplicated generated simulation reports preserved as dated evidence; original dated fixtures retained |
| M | No original scratch artifact deleted in this pass |
| N / O | HoloAnatomy/OBJ work and every uncertain Desktop/native artifact left untouched |

No blanket clean/reset/delete occurred. The portable ZIP is regenerated from verified runtime owners including `lab.css`. The generated audit source copy under `/tmp/anatomymotion-lab-audit` is not a competing maintained app or a release dependency.
