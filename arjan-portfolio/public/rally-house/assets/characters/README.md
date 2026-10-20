# Authored athlete

Taylor uses a complete, clothed MakeHuman adult mesh, fitted sportswear, ponytail, eyebrows, eyelashes and eyes. Other cast members retain their existing appearance while this hero is reviewed. No user reference photograph is embedded in the assets.

The source geometry, default weights, adult targets and system assets were released under CC0 by the MakeHuman community, Data Collection AB, Joel Palmius and Jonas Hauquier. The natural makeup skin is by **MargaretToigo**, CC0. The full license is in `LICENSE.md`; source URLs and source/runtime SHA-256 checksums are in `taylor/provenance.json`.

Sources:

- [MakeHuman core at the pinned revision](https://github.com/makehumancommunity/makehuman/tree/a8bc2d54ff0ac92e78ff71431b1023eda42bf482)
- [Official system assets and their licenses](https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html)
- [Official skin pack and individual authors](https://static.makehumancommunity.org/assets/assetpacks/skins01.html)

To rebuild, place `base.obj`, `default.mhskel`, `default_weights.mhw`, `asian-female-young.target`, `caucasian-female-young.target`, and `universal-female-young-maxmuscle-averageweight.target` from the pinned core revision in a working source directory. Extract the official CC0 system pack to another directory. Extract `skins01_cc0.zip` beneath the core working directory as `skins/`; the required skin is `skins/skins/toigo_light_skin_with_natural_makeup/young_lightskinned_female_diffuse4.png`.

Run the project's `tools/bake-authored-athlete.py CORE_DIRECTORY SYSTEM_DIRECTORY assets/characters/taylor` using Python with NumPy and Pillow. It uses the installed `/Applications/Blender.app/Contents/MacOS/Blender` (validated with Blender 4.0.2) to fit sportswear against the anatomical body and transfer the actual surface weights. Build inputs and temporary unclothed fitting geometry stay outside the public release.

The runtime has no new dependency. The existing anatomical pose drives the character, props, captures and replay; two foot bones preserve planted shoes, and the source forearm twist joints distribute wrist rotation. Facial channels are bounded to smile, mouth opening, blinking and brow raising; a fifth channel closes the authored fingers around the racket. Anatomical wrist endpoints keep the forearm connected while the game continues to anchor the grip. The renderer verifies UV and displacement data and uses the same alpha masks in color and shadow passes. This is a review candidate, not a claim of studio-quality art or animation.
