# Shoulder dissection lab — October 26, 2026

Peel now opens a source-matched Z-Anatomy dissection lab when the additional anatomy loads. The original deltoid/cuff specimen remains available through “Switch to deltoid & cuff specimen”; it remains the fallback if the atlas cannot load.

Five teaching exposures cover cuff/bursae, tendon/insertion annotations, capsule, joint rim/ligaments/cartilage, and regional nerves/vessels. These are thematic study stations, not a claimed surgical sequence or segmentation of tissue depth. Matching bones remain ghosted. No mixing of specimens, generated anatomy, or new anatomical claims.

Probe selects and records each station's target once. Forceps removes one whole source mesh from the scene into a named return tray. Undo, individual return, restore all, and reset recover source positions. Drag remains orbit. Keyboard-accessible structure buttons invoke the same actions. Observations track exploration, not clinical competence; no score for removal or time pressure.

All 31 non-bone atlas parts can be lifted in their respective stations. Removed parts persist between stations until restored, while the original Explore/Learn/Quiz visibility stays separate. Bones cannot be removed. Source provenance remains accessible.

No incision, deformation, haptics, surgical planes, or physiological response is simulated. Four complete cuff tendons remain unavailable; insertion regions remain authored annotations. This is an interactive anatomy study, not a validated surgical simulator.

Verification: 95 portfolio tests and 21 shoulder tests; typecheck and production build. `tools/shoulder/dissection-qa.mjs` checks all stations, probe observations, lift/undo, direct rendered-mesh picking, source separation, desktop accessibility, mobile width, reset and mode transitions. Screenshots in `shoulder-dissection-qa/`. Physical device and educator review remain outstanding.
