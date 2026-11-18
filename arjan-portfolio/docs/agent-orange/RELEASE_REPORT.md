# Agent Orange release report

Status as of 2026-11-18: **BLOCKED**

| Gate | Status | Evidence |
| --- | --- | --- |
| Evidence-backed claim set | PASS, limited scope | `evidence.json`; article abstract, EPA, and PubChem linked in route |
| Historical and chemical distinctions | PASS, limited scope | Agent Orange ingredients and TCDD contaminant are described separately |
| Genuine 3D rendering | PASS, schematic only | Three.js WebGL scene is visible in local browser; region selection works |
| Atlas-based neuroanatomy and provenance | BLOCKED | Current brain shapes are explicitly schematic; no licensed atlas mesh integrated |
| Blender source scene and reproducible render | BLOCKED | Installed Blender 4.0.2 crashes in `metal_is_supported` before Python startup |
| 90–120 second cinematic film | BLOCKED | No rendered film, production master, captions, or contact sheet |
| Narration and synchronized sound | BLOCKED | Not recorded or synthesized; no audio track exists |
| Desktop browser route | PASS | Local production build route opened in browser; substantia nigra selection changed correctly; no console errors or warnings observed |
| Mobile, touch, keyboard, reduced motion | PARTIAL | Responsive styling and controls implemented; dedicated mobile viewport and input checks remain |
| Production build | PASS | `npm run build` completed, `/agent-orange` prerendered |
| TypeScript | PASS | `npm run typecheck` completed |
| Existing automated tests | PASS | 7 tests passed |
| Production audit and performance measurements | BLOCKED | Dependency install reported 33 advisories (8 moderate, 23 high, 2 critical), but audit endpoint failed DNS so individual findings could not be reviewed; no frame-time or memory measurements captured |
| Existing portfolio routes | NOT REGRESSION-TESTED | Build includes existing routes; route-by-route browser regression remains |
| Production deployment | BLOCKED | Release gates above remain incomplete; no deployment was made |

The current work is an evidence-led interactive prototype on branch `codex/agent-orange-long-shadow`. It is not a finished film or production release. The installed Blender crash report identifies a segmentation fault in Blender 4.0.2's Metal backend detection on this M2 system. Do not use this binary for scene generation until replaced or repaired.

## Current prototype quality review

Scores apply only to the built prototype, not the unproduced film. Scientific claim handling: 7/10, with the cohort estimates cited and qualified. Anatomical fidelity: 2/10, because the visible geometry is schematic. Camera direction and animation: 2/10, because there is drag rotation and subtle ambient movement but no guided tour. Lighting and materials: 4/10, based on the inspected browser render. Narrative clarity: 6/10, based on the route's visible order and claim register. Sound: not scored, because no audio exists. Accessibility: 4/10, based on keyboard-operable controls and reduced-motion control, with mobile and full keyboard review still pending. Technical reliability: 6/10, based on the passing production build, tests, and a successful desktop browser interaction. Originality: 4/10, because the current experience is a focused prototype and does not yet include original atlas-based or film assets.
