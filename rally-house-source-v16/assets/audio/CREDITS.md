# Opponent reaction

The user selected preview **A** from [WavSource’s Homer Simpson TV archive](https://www.wavsource.com/tv/simpsons/homer1.htm): [doh1_y.wav](https://www.wavsource.com/snds_2020-10-01_3728627494378403/tv/simpsons/homer/doh1_y.wav), attributed to Homer Simpson / Dan Castellaneta. It replaces the user-rejected Simpsons: Hit & Run recording and earlier profanity clips.

This is third-party character dialogue, **not CC0**. Production redistribution permission has not been verified.

The complete approved 0.705-second utterance is retained at its original pitch, timing and 11,025 Hz sample rate. Processing is mono 16-bit PCM conversion, peak headroom and 3 ms / 8 ms edge fades only; no resynthesis, pitch shift or reverb. Input/output hashes are in provenance.json.

Rebuild from a decoded 16-bit WAV with `python3 tools/prepare-opponent-voices.py SOURCE.wav assets/audio`. Shoe sounds remain original procedural synthesis in src/core/FootstepSound.ts.
