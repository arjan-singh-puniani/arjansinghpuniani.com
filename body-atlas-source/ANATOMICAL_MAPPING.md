# Anatomical mapping

## Accepted relationships

`lib/curation.ts` is the editable, reversible accepted layer. Every assertion has a stable ID, product-entry ID, component name, canonical or local anatomy ID, relationship type, evidence state, spatial precision, laterality, supported assertion, original evidence link, locator, review method/date, and limitations. There are no device coordinates.

The relationship vocabulary distinguishes implantation, tissue interface, physiological measurement, physiological target, therapeutic action, delivery, external placement, and unlocalized evidence. An experimental cooling perturbation uses **physiological target**; it does not acquire a therapeutic claim from the interface label.

Examples checked against originals:

- RNS generator: skull; cortical strip: brain surface; depth lead: patient-localized brain focus; electrical measurement and stimulation: separate roles. No universal hippocampal target.
- Original Activa: thalamic VIM lead/target, separate subclavicular or subcostal generator. No later STN/GPi indication is inherited.
- Brio: original approval statement supports STN and VIM targets; it does not yet establish component placement.
- VNS: left chest generator versus left vagus nerve lead. No brain nucleus or intracardiac interface inferred.
- ExAblate: external head apparatus versus unilateral VIM thermal action. It is not an implanted brain stimulator.
- Precision SCS: epidural lead implantation is distinct from an intended spinal cord physiological target; no parenchymal penetration or vertebral level is assigned.
- NeuroStar: external coil versus cortical field effects, based on the 2013 labeling summary, not a first-invention claim.
- BrainGate2: registry-reported cortical sensor placement, Supported and investigational; no precise gyrus or marketing authorization.
- Cortical cooling: regional cortical perturbation in a mapping study; no chronic antiseizure efficacy or owner's-product validation.
- Cochlear entry: detailed placement is withheld because approval identity alone is insufficient.

## Ontology and geometry

The bounded hierarchy is a navigation model, not a complete anatomical ontology. Canonical Uberon IDs are preserved where used. BODY IDs are explicitly local concepts, never presented as Uberon terms. Laterality is per assertion; anatomy navigation can group left/right structures.

The source GLB contains 286 nodes, with ontology metadata on some meshes and missing ontology assignments on others. The viewer respects provided IDs and explicitly curated source-name display groupings for cortex, thalamus, and STN. Cortical gyri form a partial visual grouping. VIM evidence uses broader thalamic display. Arbitrary source mesh clicks fall back to the parent brain when a supported group is unavailable.

Source geometry is the HRA male brain v1.3 (see DATA_SOURCES.md). Viewer centering, uniform scaling, and orbit controls do not create anatomical coordinates. Static screen orientation labels were removed because they would become misleading after orbit rotation. No patient/device registration is implemented. Unbundled anatomy uses region/text discovery rather than invented meshes.

## Candidate pipeline and review

```sh
python3 ingestion/mapping_queue.py
python3 ingestion/mapping_queue.py --validate validation/anatomical-review-queue.csv
node --import tsx scripts/validate.ts
```

The queue scans authentic regulatory titles/statements for explicit anatomical words. Matches are Provisional candidates, not accepted relationships. Absent terms yield Unknown. All remain spatially unlocalized and `automaticallyAccepted=false`. Device names, LLM certainty, generic product codes, and indication text cannot independently establish placement.

The CSV requires reviewer identity, accepted anatomy, relationship type, and original placement source/locator before acceptance. Rejection and abstention are explicit states. Review history is preserved through Git; acceptance is not automatically imported into the application. A curator must make a focused source-backed change and rerun tests. Production multi-user editing, audit authorization, candidate evidence retrieval, and a database review UI remain incomplete.

`validation/curated-anatomy-sample.json` is manually reviewable. It is not independent ground truth. The separate 100+ regulatory queue is unreviewed and must never be counted as 100 validated anatomical relationships. No 95% precision result is claimed.

## Human overview interaction

The full-body reference is the licensed HRA male v1.5 skin surface. Clickable labels navigate to brain, vagus, chest, spinal cord and the unreviewed cochlear entry. Screen/world label anchors are hand-positioned UI guides; they do not enter mapping records, exports, spatial analyses or confidence calculations. Body surface hit zones select a broad navigation category; lower body clicks return the whole collection with an explicit no-reviewed-mappings hint. Regional shader emphasis also represents categories, not organ boundaries or precise implant placement. Detailed evidence remains in each typed component relationship. Choosing a region never upgrades evidence confidence. The detailed brain retains its source meshes and source-name/ontology grouping.

The overview now includes original registered brain and spinal-cord geometry from that same united assembly. These reference meshes do not provide device placement coordinates. Both meshes and broad labels are selectable. Whole-body orbit supports full rotation; a dedicated detailed brain view supports region isolation. Choosing an intervention from the broad brain context highlights its accepted cortical/thalamic/STN group when available, with a source link; the collection's region filter stays intact. A broad reference thalamus remains distinct from a precisely modeled VIM target. No vagus mesh is invented.

## Labels directly on anatomy

Nine localized curated families can appear as intervention labels. Each label carries its chosen relationship type and anatomical region and links directly to that assertion's original source. Unknown/unlocalized and unaccepted assertions produce no anatomical annotation. Selection through an intervention label is independent of selecting a region; it preserves the collection's regional context.

Overview endpoints use the existing coarse human-region navigation locators. Brain endpoints use bounds centers of the identified source-mesh group after the viewer's centering, uniform scaling and initial rotation. These are reference-region UI anchors, not device, electrode, lesion, patient or treatment coordinates. In particular, a thalamic leader does not localize VIM. Lines track the camera, not inferred intervention trajectories. Multiple labels may share a regional endpoint. No accepted mapping state or precision changes when a label is shown or selected.

## Source-context layer (whole-body expansion)

`indication_context` is a ninth, explicitly separate relationship: **the FDA source mentions this anatomical region**. Every generated edge is Provisional and unreviewed. It must never be read as an implantation site, tissue contact, measurement location, target, current indication or demonstrated benefit. PMA statements and 510(k) device names cannot establish those facts by themselves. Modalities remain Unknown until reviewed; laterality remains unspecified.

The builder preserves exact quote/span, source field, matched phrase, application ID, source SHA and rule version. Negation, specimen assays and incidental words are filtered; parent/child duplicate matches are reduced. Generic cortical-bone text does not become cerebral cortex. Pulmonary valve text does not become a lung relationship. Tests validate all 721 generated edges against the exact original text. Deleting/rebuilding the generated catalogue reverses the contextual index without changing curated assertions or raw evidence.

The dense map uses one primary regional relationship per visible entry; entries with multiple contexts remain inspectable in the evidence panel. Dot spirals encode record distribution around a region, not precise locations or biological density. Exact organ centers come from source bounds where available; other locators are coarse navigation guides. Source-region locators and glyph offsets are never exported as biomedical coordinates. Female-only regions have no locators on the male model.

`validation/catalogue-review-queue.json` contains a deterministic 150-row region-balanced convenience sample with exact citations and empty independent adjudication fields. It is a review queue, not a validated accuracy benchmark. No automatically accepted physical mappings, independently adjudicated precision, or confidence interval is claimed.

### Editorial region scopes — October 22, 2026

`lib/whole-body-explanations.json` contains 75 record-specific explanations and explicit regional scopes. `anatomical-context-v3` restricts source extraction to these scopes and raises an error if any named region lacks an exact anatomical phrase in the indexed record. This prevents a co-procedure, disease origin, access vessel or injury diagnosis from inheriting the intervention's target. The source quote, character span, record identity and immutable source hash are retained. Statements remain Provisional `indication_context` relationships; no new accepted implantation or tissue-interface edge is created.

Positive/negative cases distinguish liver metastasis treatment from the colorectal primary, femoropopliteal stenting from knee replacement, glaucoma treatment from lens replacement, spinal reconstruction from cord penetration, and hand assistance from a spinal-cord implant. The 91-entry explained layer directly covers 44 structures/regions, including existing curated relationships. Uterus and vagina have text-only exploration with a visible model limitation and no fabricated male-reference locator. Coverage and source traceability are tested; an independent expert precision estimate remains unavailable.


## Dossier milestone — 2026-10-22

Dossier completion does not upgrade any anatomical relationship. FDA application/supplement and recall joins concern regulatory identity, not implantation coordinates or confirmed affected models. Existing Provisional contexts and unknown placements remain unchanged.

## Body contour — 2026-10-23

The adapted contour alters shoulder, chest, upper-arm, waist and localized external pelvic geometry. Head, legs and unaffected regions retain source coordinates. Both surfaces use the original HRA bounds for centering and scale; organs, nerves and intervention anchors are unchanged. The contours do not establish personal anatomical coordinates or body measurements. See [BODY_CONTOUR.md](BODY_CONTOUR.md).

The external pelvic contour now uses a closed, smooth parametric surface joined locally to the exterior. This is illustrative geometry, not a sourced anatomical specimen, clinical assertion or device coordinate. Reference organs and intervention anchors remain unchanged.

### Named map callouts

Explained entries are now named on the default map. Overview labels represent approaches within broad regions; focusing a region exposes individual indexed approaches. Leader lines and marker spirals are diagrammatic regional associations, never new implant coordinates. Each callout retains its relationship role and original source, and the existing reviewed/provisional distinction remains visible. Where the reference has no applicable structure or locator, the entry stays discoverable through the index without a fabricated marker.

## Reference focus and schematic mechanisms — 2026-10-27

Selection now focuses the available source reference region rather than leaving the camera at the whole-body overview. Organ centers come from the existing HRA geometry manifest. Missing substructures use explicitly broader reference anatomy: heart for the aortic-valve example, whole brain for thalamic/cortical targets in the human view, and spinal cord context for epidural relationships. The dedicated brain view retains its tagged thalamic/cortical meshes. Bilateral kidney bounds do not assign a treatment side. Unlocalized cochlear placement and female-only anatomy in this male reference abstain.

Eleven mechanism descriptions cite existing source assertions or original FDA summaries. Device glyphs are enlarged schematic insets, tethered to reference anatomy; they are not device meshes placed in tissue. Animation shows qualitative operation only, with no dose, waveform, blood-flow, acoustic or thermal model. Existing Provisional indication-context mappings remain Provisional. No new accepted anatomical placements or precision estimate are claimed.
