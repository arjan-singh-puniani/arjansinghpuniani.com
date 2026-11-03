# Juniper Clinic — patient flow, RC5

Implemented with substantial AI assistance. Owner: Arjan Singh Puniani. No external clinician review, learner study or commercial-game comparison has been completed.

The new default `clinic` begins with no rooms or staff and $9,000 of fictional operating funds. Build reception ($400), recruit/assign administrator Quinn ($500), build a GP room ($900), recruit/assign general practitioner Mira ($800), then explicitly open the doors. Time, expenses and arrivals remain stopped while closed. Each hire enters through the actual entrance and walks to the assigned module; rooms do not create free staff. Existing saved hospitals are retained until the player chooses a fresh start, which archives the old hospital locally. The previous RC4 `first` scenario remains an archived consultation-only model; its existing visits are not converted to new pathways.

## Visit and revenue

Seeded arrival gaps vary from 14 to28 game seconds; the first arrival is randomly scheduled within1–4 seconds after opening. Early bookings introduce services gradually, while later bookings mix existing needs. This is deterministic randomness: the same seed replays the same external arrivals. Staff and visual clothing variants do not change the random arrival tape.

A neighbor arrives in everyday clothes, waits for staffed reception, checks in, walks behind a changing screen, spins once into a gown, and queues for a GP. The patient sits across the desk from the GP, with the computer on the GP’s side. On completing the booked pathway, the neighbor spins back into everyday clothes and leaves through the exit. Reduced motion removes the spins. People can be picked up on clear corridors and in waiting states; active check-in/change/service/transfer states are protected. Carrying retains the prior translucent squirm and reaction behavior.

The all-visitor gown change is a requested visual game convention. It is **not** a representation of usual outpatient practice. Clothing changes happen without nudity. Wardrobes are11 original appearance-matched,39-joint rigs. Casual outfits use full trousers and everyday tops; their animations reuse the matching original rig’s clips. Changing time is counted separately from waiting, walking, check-in and service.

Fees are credited once, at completion of each paid service, with an inspectable ledger and recorded simulation timestamp. No additional generic discharge payment is added. GP $180; pharmacy $75; neurology $220; gait $180; video EEG and sleep $260 each. These costs, fees, wages, durations and capacities are game parameters, not estimates of hospital economics.

## Booked fictional pathways

- General practice: reception → GP → home.
- Collection order: reception → GP → pharmacy → home.
- Neurology review: reception → GP → neurologist → home.
- Parkinson’s follow-up with an already-booked mobility assessment: reception → GP → neurologist → physiotherapist/gait room → pharmacy → home.
- Epilepsy follow-up with already-booked video EEG: reception → GP → neurologist → neurophysiology technologist/video EEG → pharmacy → home.
- Narcolepsy follow-up with an already-booked sleep assessment: reception → GP → neurologist → technologist/sleep lab → home.

These bookings are scenario data. They do not diagnose a person, prescribe medicines, choose tests or assert that everyone with a condition follows that pathway. Pharmacy has generic collection packages and no drug names or doses. The gait room uses an ordinary voluntary walk, not a parody of a neurological symptom. Video EEG is non-invasive in this scene; ECoG/intracranial procedures are not modeled. Sleep recording is compressed to game seconds and does not reproduce an overnight study or a full diagnostic workup.

Terminology was checked against primary sources: [NICE epilepsy assessment](https://www.nice.org.uk/guidance/ng217/chapter/diagnosis-and-assessment-of-epilepsy), [NICE tertiary service methods, including video EEG](https://www.nice.org.uk/guidance/ng217/evidence/methods-ngc-pdf-11065731374), [NICE Parkinson’s recommendations](https://www.nice.org.uk/guidance/ng71/chapter/Recommendations), and [NHLBI sleep studies](https://www.nhlbi.nih.gov/health/sleep-studies). These sources inform names and limits, not validation of the game’s pathways, timings or usefulness.

## Executed Blender work

`blender/clinic_flow.py` was executed in Blender4.0.2. Retained editable sources: `clinic_wardrobes.blend` and `clinic_equipment.blend`. It exported22 casual human GLBs (11 detailed and11 low-detail),8 role GLBs (pharmacist, neurologist, physiotherapist, neurophysiology technologist, each detailed/low-detail), and7 equipment GLBs: reception, GP, pharmacy, neurology, gait assessment, video EEG, sleep. Administrator and GP reuse the original front-desk and doctor wardrobes. All are original procedural geometry/materials, CC0-1.0; no downloaded/ripped game assets.

Equipment uses meters, beveled powder-coated housings, satin blue counters, brushed metal supports, matte linen/upholstery, rubber cables and restrained fictional monitor glass. GLB station empties are checked against shared browser pose coordinates. GP and neurology have separate staff/visitor chairs and an offset monitor. Reception includes a changing screen; pharmacy has generic shelves, a collection bag and cabinetry; gait has rails/cameras; video EEG and sleep have beds and recording consoles. Rebuild command, from this source directory:

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b --python blender/clinic_flow.py
```

`dist/assets/clinic-stations.json` retains the input station coordinates. `ASSET_MANIFEST.json` retains source paths, licenses, hashes, bytes, triangle counts and clips. No new external image textures are required; material colors and modeled traces are source-generated. Existing texture sources remain retained.

Browser camera remains orthographic, from(16,19,23) toward(0,.3,0), with bounded pan/zoom and responsive framing. Lighting remains a warm studio key, cool fill, hemisphere/environment fill, contact patches and platform shadows; ACES tone mapping, sRGB output and exposure1.13. New equipment uses the existing browser lighting. The new .blend files are editable asset sources, not a claim that a Blender offline render equals browser lighting.

## Checks and limits

Run from hospital-sim-source: `node tests/clinic-flow.mjs`. It checks closed-clock conservation, required admin/GP, no free staff, wardrobe sequence, occupied-room protection, per-service fee uniqueness, all six complete pathways, ten seeded whole-shift runs, timing/accounting/capacity conservation, mid-visit save/load equivalence, continued hospitals,39-joint wardrobe exports, GLB station coordinates and rejection of damaged booking/ledger data. The separate regression log covers the existing25 other game suites. Portfolio unit/type/build checks and browser observations are recorded separately in the release evidence.

A scripted expansion policy is an engineering check, not proof of fun, a dominant-strategy analysis or an external playtest. Expansion must still be affordable; buying every unlocked service can produce a negative budget on some seeds. Normal-speed first GP revenue is visible around50 game seconds on seed431; the first complete exit is around66seconds. The90-second recording includes the whole first visit. Existing RC4 recordings remain historical.

Known gaps: original procedural humans still have simplified faces, cloth and task contact; sit/stand animation blends remain less natural than authored commercial animation. The EEG cap and compressed recordings are illustrative. There are no seizures, symptom-specific clinical gait models, medication management or actual diagnosis. Specialist appointments are simplified bookings; no external model/clinical/educational validation has occurred. Desktop narrow-viewport measurements are not physical-iPhone or Safari results. This remains an engineering release candidate.
