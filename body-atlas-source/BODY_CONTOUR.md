# Body contour

The Contour surface is an artistic adaptation of the HRA exterior, with altered shoulder breadth, chest and upper-arm volume, waist taper and localized external pelvic contour. The local external contour is reconstructed as a smooth shaft, a broader rounded glans and an embedded root. The modeled glans-to-shaft radius ratio is 1.2834 (7% less glans girth than the preceding rounded contour); this is a shape parameter, not a measured anatomical dimension. The head now has sculpted jaw angles, tapered chin and cheeks, nose bridge, brow, eyelid and lip relief, and a swept scalp silhouette. The chest and abdomen have paired muscle volumes, a shallow midline and oblique relief. Normal-based holographic shading makes this geometry readable in both grid and surface modes. No photographs, image textures, subject name or identifying subject attribution are included.

These are illustrative proportions, not measured anthropometry, a personal scan or evidence of anyone's internal anatomy. Unseen surfaces remain approximate. All organs, brain, spinal cord and intervention anchors retain the original HRA reference geometry and frame. Both exteriors use the original skin bounds for centering and scale. **Contour / Reference** compares the surfaces; failure to load the adapted contour visibly falls back to the reference.

Base mesh: NIH Human Reference Atlas male united v1.5 skin, Kristen Browne and Heidi Schlehlein, [DOI 10.48539/HBM646.RKKC.257](https://doi.org/10.48539/HBM646.RKKC.257), CC BY 4.0. Attribution and modifications are declared in [contour-manifest.json](public/anatomy/contour-manifest.json). No endorsement is implied. See [HRA-BODY-SOURCE.md](public/anatomy/HRA-BODY-SOURCE.md).

The generator reads only the licensed source GLB and uses authored contour parameters. No photographs, facial colors, image textures, EXIF, private paths or identifying subject metadata are exported. The single-mesh derivative retains the source coordinates outside the edited regions; a closed parametric surface is joined locally with a Boolean union. Tests check the original reference hash, the entire previously approved lower-body surface (a fingerprint of 47,447 unique coordinates), facial projection, abdominal relief, localized contour changes and absence of appearance payloads.

Rebuild with Blender 4.0.2:

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup -t 2 \
  --python scripts/build-body-contour.py -- \
  --source public/anatomy/body.glb \
  --output public/anatomy/contour.glb
```

The history slider and playback start at 1999. This changes the viewing window, not the evidence: earlier genuine event dates remain in cited device histories, the records collection and exports. No dated sources were removed or re-dated.

The share view (`?view=portrait`) opens a rotatable upper-body crop with internal anatomy hidden. The skin shader discards surface fragments below reference y=0.14 in this view; the cropped presentation is not a privacy boundary for the already-public underlying atlas assets. The original full anatomical atlas remains available through Explore atlas. Copy link removes other query parameters and fragments; clipboard failures expose a selectable link. No messages or invitations are sent.
