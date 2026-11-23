# Original procedural audio

Racket/string-bed contacts are synthesized by `src/core/TennisImpactSound.ts`. Shoe contacts are synthesized by `src/core/FootstepSound.ts`. Opponent miss reactions reuse the original racket/frame material at low volume in `src/core/AudioManager.ts`; they contain no recorded voice or borrowed character dialogue.

Impact strength controls energy and filtering. Lob contacts soften the high shelf by 3 dB. Mute, pause, hidden-page and disposal paths stop scheduled reactions.

`provenance.json` identifies the source files. `qa/impact-audio.mjs` renders reproducible contact samples for signal checks and listening comparisons. No third-party audio recording is distributed in this directory.
