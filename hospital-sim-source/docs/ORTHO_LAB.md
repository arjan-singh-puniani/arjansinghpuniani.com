# Ortho Lab · Femur fracture

A standalone fictional case linked from the hospitalSIM portfolio page and the clinic footer. The existing clinic simulation, assets, routes and saves continue to run independently. The baseline clinic simulated procedures as timed room services. It had no player-controlled surgical case.

## Run

From the repository root:

```sh
cd arjan-portfolio
npm ci
npm run build
npm run start -- --hostname 127.0.0.1 --port 8782
```

Open [the local case](http://127.0.0.1:8782/hospitalsim/ortho/index.html). Start with **Take the clamp**. **Move** changes projected translation and gap. **Rotate** changes tilt and axial twist. Review both projections. During seating, several shorter drags work. Release over each locking target to record fixation. Keyboard arrows move the selected tool, Shift makes finer adjustments, Enter commits and Escape rolls back the active gesture.

## Implementation

- One authoritative, seeded fragment pose drives the front and side orthographic images. World Y runs along the shaft toward the hip, X reads horizontally from the front, and Z reads horizontally from the side. The two game angulations and axial twist are separate. A near match in one projection can hide angulation or translation that is obvious from the other.
- Pointer and keyboard previews start from a transaction snapshot. Cancel, lost capture, view changes, viewport resizing and backgrounding restore it. Committed movement invalidates prior alignment checks. Verified alignment permits seating. Residual error near the edge of the reduction band can block nail travel until the player refines the alignment.
- Guided can settle an affected translation coordinate inside 0.025 model units, or an affected rotation inside 0.018 radians. Expert uses the same underlying case and disables this snap. The locking reticle accepts an error radius of 0.092 model units in Guided and 0.052 in Expert.
- A successful finish records both final images, the two spatial lock confirmations, and the dressing. The debrief separates alignment, fixation and corrections. Elapsed time does not affect scores. Same-setup replay is immediate, and the first alternate seed increases the combined starting error.
- The case uses HospitalSIM’s bundled Three.js renderer and original procedural meshes, with no asset fetches for anatomy, tools or sound. Procedural drape and tissue keep the field readable on portrait screens. Muscle fibers share a merged mesh. Imaging is rendered from the live model with matched before/after framing. Substantial AI assistance covered implementation, visual geometry and verification.

## Clinical references and model limits

[AO Surgery Reference · Antegrade nailing for simple oblique middle-third femoral shaft fractures](https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/femoral-shaft/simple-oblique-middle-1-3-fractures/antegrade-nailing) supports the broad concepts of restoring alignment, using an intramedullary implant, adding proximal/distal locking and obtaining final images. See sections 4 and 9–14. Locking screws cross the implant inside the bone. Skin staples are surface closure fasteners. The case ends with a dressing.

[OpenStax Anatomy and Physiology 2e · Bones of the Lower Limb](https://openstax.org/books/anatomy-and-physiology-2e/pages/8-4-bones-of-the-lower-limb) supports the depicted head, neck, trochanter, bowed shaft and paired distal condyles. The broad translucent cutaway is an educational view. The model abstracts anatomy, tissue response and instrument contact. It does not simulate clinical fluoroscopic attenuation, rotation assessment or surgical technique. The supplied AI images informed the shot choices and colors only. No artwork was extracted from them.

## Checks

```sh
node --test hospital-sim-source/tests/ortho-model.mjs
cd arjan-portfolio
node tools/hospitalsim/ortho-browser.mjs
```

The browser check defaults to the local production server at port 8782. Set `ORTHO_OUT` to a capture directory and `ORTHO_VIDEO=1` to record. Headless Chromium uses CDP touch for the iPhone 13 profile. The WebKit smoke check uses the same portrait profile and engine-level taps. These modes run on desktop hardware.

### Recorded results

Mac14,2 with Apple M2. Chromium 153.0.8010.12 and WebKit 26.6. The browser checks drove the Next production route with capture enabled. Frame intervals were sampled by animation frame over 1.25 seconds spanning continuous clamp input.

| Run | Viewport and input | Loaded to first action | Automated case | Median frame | 95th percentile |
| --- | --- | ---: | ---: | ---: | ---: |
| Chromium desktop | 1280 × 900, mouse | 0.54 s | 11.2 s | 16.7 ms | 33.4 ms |
| Chromium iPhone 13 profile | 390 × 664, emulated touch | 0.25 s | 9.6 s | 16.7 ms | 16.8 ms |

Both completed the full case and compared matched final images. Checks covered a passing front view with an unresolved side error, cancellation, resize, changing projection during a drag, background interruption, three same-seed restarts, keyboard adjustment and rollback, missing modules and WebGL fallback. WebKit checked case entry, projection taps and portrait layout. Model checks covered blocked advance, prevention of duplicate locks, the narrow Guided snap and deterministic replay. Existing clinic checks passed for construction, map editing, navigation and continuing visits.

The automated timings measure scripted actions. First-time completion time, physical iPhone frame pacing and hands-on feel still require device and player testing. The references show finer anatomy, material detail and hand-tool contact than the procedural scene.
