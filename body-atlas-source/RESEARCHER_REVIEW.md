# Independent research review kit

This is a review protocol, not a completed user study. No independent reviewer, clinical validation, time saving or user impact is implied.

## Materials

Launch the current atlas and open **Sources → Review coverage → Export independent anatomy review packet**. The CSV contains all 108 currently indexed anatomical assertions across the 92 explained entries. It retains original URLs, source locators, extraction methods, existing states, recorded precision, limitations and available exact source quotations/hashes. Blank fields are reserved for independent adjudication. No location coordinates or personal images are exported. CSV cells are quoted; formula-like source text is prefixed with an apostrophe for spreadsheet safety.

Review units are assertions, not patients or unique products. Assertions within an entry are correlated. The sample is the complete explained collection, not the full FDA corpus; existing review states are visible, so this is not a blinded study. Where no exact source quotation/hash was indexed, the corresponding field stays blank rather than being synthesized from the summary.

## Reviewer tasks

Use a biomedical researcher or clinician with relevant anatomical/device expertise. Record their role and any conflicts privately; use a pseudonymous reviewer ID in a shared worksheet. Do not introduce patient data.

1. **Placement versus action:** find Activa, inspect the original source and separately identify the thalamic lead/target and chest generator. Follow the chest component link and check that camera context changes.
2. **Compare mechanisms:** compare Activa with ExAblate. Identify electrical stimulation versus thermal ablation and explain why shared anatomy and historical approvals do not establish comparative effectiveness.
3. **Investigational recording:** compare Neuralink with BrainGate. Inspect recording relationships, registered studies and the distinction between manufacturer reports, registry records and demonstrated outcomes.
4. **External placement:** inspect TMS and distinguish the external coil from the intended cortical effect.
5. **Anatomical specificity:** inspect the SAPIEN 3 example. Determine whether the original source supports aortic-valve context, and whether the available valve-group representation could mislead. Record a correction rather than inferring a precise implant position.
6. **Abstention:** inspect the cochlear example and the female-only regions. Confirm that missing accepted locations or reference anatomy do not become fabricated placements.
7. **Traceable export:** export a Markdown brief, open its cited original documents and check that important uncertainty survives export.

Optionally record completion time and source-verification errors. A single reviewer or uncontrolled timing comparison does not demonstrate general time savings.

## Assertion-level decisions

For every reviewed row, fill `independent_reviewer`, `independent_review_date`, `independent_assessment`, `proposed_correction` and `review_notes`. Suggested assessments: `supported at stated precision`, `unsupported`, `contradicted`, `insufficient evidence`. Check region/structure, component, relationship type, laterality, evidence locator and precision separately. A plausible anatomical association is not evidence of implantation. A representative point on a reference mesh is not a patient coordinate. An FDA application is not necessarily a distinct product family.

Do not mark a row supported from the device name, the illustration or a language-model confidence score. If sources are inaccessible or conflicting, record that uncertainty. Do not infer permission for one model from another model's label. Historical authorization does not establish current labeling or clinical suitability.

## Feedback and adjudication

After the tasks, ask: What was useful? What was misleading? What evidence or workflow was missing? Would this help a specific research task, and why? Preserve direct feedback accurately with consent; never manufacture testimonials.

Downloading or completing the packet changes no accepted mapping. Review proposed corrections against original sources, preserve the previous assertion and provenance, and apply a focused source-backed commit with regression checks. A completed packet is not an automatic production import.

Publish results only after recording actual participation, reviewed sample size, missing/ambiguous cases, errors, abstentions, sampling limits and reviewer qualifications. Distinguish source-context accuracy from physical-placement accuracy. Report appropriate uncertainty and dependence between assertions; do not claim the 95% high-confidence precision target from engineering tests or selectively reviewed examples.
