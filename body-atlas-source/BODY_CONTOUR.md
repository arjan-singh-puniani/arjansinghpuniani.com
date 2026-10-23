# Body contour

The Contour surface is an artistic adaptation of the HRA exterior, with altered shoulder breadth, chest and upper-arm volume, waist taper and localized external pelvic contour. The external glans region uses a radial scale of 1.38 relative to the preceding adapted contour, with a blended attachment. This is a model-edit parameter, not an anatomical measurement. It retains the neutral reference head and the neutral translucent grid material. No personal face, custom hair, photographic appearance, subject name or subject attribution is included.

These are illustrative proportions, not measured anthropometry, a personal scan or evidence of anyone's internal anatomy. Unseen surfaces remain approximate. All organs, brain, spinal cord and intervention anchors retain the original HRA reference geometry and frame. Both exteriors use the original skin bounds for centering and scale. **Contour / Reference** compares the surfaces; failure to load the adapted contour visibly falls back to the reference.

Base mesh: NIH Human Reference Atlas male united v1.5 skin, Kristen Browne and Heidi Schlehlein, [DOI 10.48539/HBM646.RKKC.257](https://doi.org/10.48539/HBM646.RKKC.257), CC BY 4.0. Attribution and modifications are declared in [contour-manifest.json](public/anatomy/contour-manifest.json). No endorsement is implied. See [HRA-BODY-SOURCE.md](public/anatomy/HRA-BODY-SOURCE.md).

The generator reads only the licensed source GLB and uses authored contour parameters. No photographs, facial colors, image textures, EXIF, private paths or identifying subject metadata are exported. The single-mesh derivative retains the source topology. Tests check the original reference hash, unchanged head/legs, localized contour changes and absence of appearance payloads.

Rebuild with Blender 4.0.2:

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup -t 2 \
  --python scripts/build-body-contour.py -- \
  --source public/anatomy/body.glb \
  --output public/anatomy/contour.glb
```
