# Body contour

The Contour surface adapts the attributed HRA exterior with authored shoulder breadth, chest/upper-arm volume, waist taper and abdominal relief. A privately prepared facial surface supplies the face outline and feature layout. Pose is corrected and estimated depth is damped before the face is stitched into the head. Scalp volume remains authored. This is an artistic approximation from photographs, not measured anthropometry, a clinical scan, identity verification or evidence of anyone's internal anatomy. Unseen surfaces remain approximate; recognizability requires human review.

Organs, brain, spinal cord and intervention anchors retain their original HRA reference geometry and frame. Both exteriors use the reference skin bounds for centering and scale. **Contour / Reference** compares them. Failure to load the adapted contour visibly falls back to the reference. The asset URL includes its content hash to prevent a previous contour remaining in browser cache.

The November 2 jaw revision uses a less perspective-distorted frontal fit, constrains the mandibular outline during seam smoothing, and graduates the submandibular surface into the neck. Front, three-quarter and profile sculpt views are reviewed alongside the browser display. A geometry regression checks under-chin recession; this is a display-shape check, not a biometric likeness score. Raw reference images and private fit arrays remain outside the repository.

The approved lower exterior is preserved: tests fingerprint all 47,447 unique coordinates below reference y=0.02. Its previously approved shape parameters are unchanged and do not represent measured personal dimensions.

No photos, image textures, pixel landmarks, facial embeddings, EXIF, private input paths, subject names or identifying attribution are shipped. The baked shape can itself be recognizable; absence of a name does not anonymize it. `_SURFACE_DETAIL` contains three semantic weights (iris, pupil and brow/scalp), not photographic colors. The website applies monochrome shading. Front-facing ray tests check that old geometry does not hide the eye details.

## Sources and licenses

- Base: NIH Human Reference Atlas male united v1.5 skin, Kristen Browne and Heidi Schlehlein, [DOI 10.48539/HBM646.RKKC.257](https://doi.org/10.48539/HBM646.RKKC.257), CC BY 4.0. See [HRA-BODY-SOURCE.md](public/anatomy/HRA-BODY-SOURCE.md).
- Facial topology: [Google MediaPipe canonical face](https://github.com/google-ai-edge/mediapipe/blob/master/mediapipe/modules/face_geometry/data/canonical_face_model.obj), Apache-2.0. Full [license](public/anatomy/MediaPipe-LICENSE.txt) accompanies the derivative.
- Local estimator: [Face Landmarker documentation](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker/python) and [official model card](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20MediaPipe%20Face%20Mesh%20V2.pdf). Its monocular depth is estimated, not ground truth.

The shipped [manifest](public/anatomy/contour-manifest.json) records the source and derivative hashes, modifications and licenses. No source endorsement is implied.

## Local regeneration

Website installation/build needs no reference photos, landmark model or Python fitting packages. It loads the baked GLB. To prepare a replacement privately, use a separate development virtual environment (tested with MediaPipe 1.2.0, Pillow 12.3.0, NumPy 2.2.6). Put private inputs under ignored `data/private/`, never `public/`:

```sh
MPLCONFIGDIR=data/private/mpl-cache .venv/bin/python scripts/prepare-contour-surface.py \
  --image data/private/reference.jpg \
  --model data/private/face_landmarker.task \
  --topology data/private/canonical-face.obj \
  --output data/private/face-surface.json
.venv/bin/python scripts/prepare-contour-surface.py --self-test
/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup -t 3 \
  --python-exit-code 1 --python scripts/build-body-contour.py -- \
  --source public/anatomy/body.glb \
  --surface-fit data/private/face-surface.json \
  --output public/anatomy/contour.glb
```

Download the official model from `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task` and the canonical OBJ from the source above; review their license/model card. All image processing runs locally. The prep tool rejects missing or multiple faces. The builder rejects oversized/nonfinite/out-of-frame data and invalid topology. The self-test checks normalization and rejection behavior, not likeness accuracy. Omitting `--surface-fit` generates an authored generic face instead of reproducing the shipped fitted face.

## Viewing

`?view=portrait` opens a rotatable upper-body view with internal anatomy hidden. **Face / Upper body** changes framing; `?view=portrait&frame=face` opens the close-up directly. Copy link preserves that framing, removes unrelated query parameters/fragments and exposes a selectable link if clipboard access fails. No invitations/messages are sent.

The portrait shader crops below reference y=0.14. This is presentation, not a privacy boundary for public geometry. Explore atlas restores anatomical exploration. History playback begins at 1999; earlier genuine evidence remains in device histories and exports without redating.
