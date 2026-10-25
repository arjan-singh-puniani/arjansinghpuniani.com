# Opponent reaction recordings

- Masculine: “Screaming Fuck”, performed and uploaded by **Fabrizio84**: https://freesound.org/people/Fabrizio84/sounds/457964/
- Feminine: first-word excerpt of “Fuck Off.wav”, performed and uploaded by **pyro13djt**: https://freesound.org/people/pyro13djt/sounds/332125/

Both source pages publish the recordings under **CC0 1.0**: https://creativecommons.org/publicdomain/zero/1.0/ . These are the creators’ own performances, not television dialogue or an actor imitation. The source previews were acquired from Freesound’s public CDN. The game excerpts are mixed to mono with restrained gain and short edge fades. Exact ranges and hashes are in provenance.json. The masculine recording retains the source performance’s saturation.

Rebuild from decoded 16-bit source recordings with `python3 tools/prepare-opponent-voices.py RECORDINGS assets/audio`. Original filenames and ranges are specified in that script. Shoe sounds are original procedural synthesis in src/core/FootstepSound.ts.
