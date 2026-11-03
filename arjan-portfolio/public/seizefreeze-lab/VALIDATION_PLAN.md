# Validation path and decision gates

2 November 2026. This is a proposed evidence roadmap, not a completed study, wet-laboratory protocol or schedule. The reported bench hardware is not a clinically validated device. The Organoid Research Workbench is a computational planning environment; no organoid experiment or therapeutic outcome is reported.

## Three propositions to test separately

1. A specified assembly can deliver and account for thermal/electrical energy.
2. A defined interface can deliver a measured thermal field to a defined preparation/environment.
3. That perturbation changes a predeclared biological endpoint in a relevant model, beyond recording and environmental artifacts.

The third does not follow from the first two. An in-vitro observation would not establish adult cortical response, implant suitability, clinical effectiveness or tissue-safety settings.

## Five milestones

| Milestone and current status | Required evidence and decision | Pass criterion | What passing would not establish |
| --- | --- | --- | --- |
| **1 · Hardware identity and documentation. User-reported inventory; not yet independently documented.** | Identify controller, TEC, acquisition board, driver, supply, sensors and rejection path. Preserve part markings, wiring/system diagram, firmware version and provenance. Separate actual components from proposed additions. | An independent technical reviewer can understand the documented assembly and identify which functions and components remain missing. | Successful acquisition, calibrated temperatures, closed-loop operation or an implant. |
| **2 · Nonbiological thermal characterization. Proposed.** | Under appropriate engineering supervision, compare a specified assembly with an inert test article/phantom. Record electrical input, hot/cold/interface temperatures, environmental conditions, contact and timing; characterize sensor uncertainty and driver losses. Fit parameters on designated data, then assess separate held-out transients. Predeclare error budgets and failure criteria before reviewing results. | Measured behavior and model predictions can be compared reproducibly, with units, calibration, uncertainty, energy balance and reported residual/error. Deviations and missing terms remain visible. | Validation of tissue response, clinical bounds or a thermal field in a living preparation. |
| **3 · Signal-acquisition validation. Proposed.** | Identify the actual NeuroSky variant and intended measurement. Evaluate acquisition integrity, reference configuration, gain/scaling, filters, sampling/timestamps, missing packets, noise, coupling and actuator-related artifacts with suitable engineering tests. Define when specialized MEA/patch/optical instrumentation or collaboration is needed. | Defensible test records establish the acquisition chain's limitations and suitability for a stated signal-processing task. Detector performance, if claimed, uses appropriate independent labeled data and explicit endpoints. | Organoid recording capability, clinical seizure recognition or equivalence among scalp EEG, ECoG and MEA. |
| **4 · Biological research feasibility. Proposed; no experiment performed.** | Qualified neural-organoid collaborators evaluate model relevance, maturity/heterogeneity, appropriate functional assays, independent temperature measurement, viability, controls, reproducibility and artifacts. Define hypothesis, endpoint, experimental unit, replicate structure, missing-data rules, analysis and governance needs. Relevant institutional review/approvals precede real work. | A collaborator can evaluate a bounded, falsifiable hypothesis and a feasible, appropriately governed plan with specified controls and interpretation limits. | An approved protocol merely because this website describes questions, or preliminary biological data from a simulation. |
| **5 · Evidence assessment. Proposed.** | Link conclusions to actual records, measurement uncertainty, controls and predeclared analysis. Separate technical repeats from independent biological replicates. Report negative/null results and distinguish model fit from predictive assessment. | A reviewer can trace each conclusion to its relevant data, system, control and analysis, and identify which propositions remain unsupported. | Human therapeutic effect, chronic-implant safety, regulatory progress, partnerships or inevitable translation. |

No numerical temperature, exposure duration or biological acceptance limit is prescribed by this roadmap. Such limits require a separate preparation-specific protocol and qualified review. Numeric model inputs are exploratory assumptions, not experimental instructions.

## Computational experiment record

Every exported record should identify the software/model version, computational condition, all inputs and units, initial and boundary conditions, seed, signal provenance, model outputs, numerical diagnostics and limitations. A real measurement record would require separate acquisition/calibration provenance; changing an export label cannot make a synthetic trace measured.

For a comparison, specify the changed assumption and hold the remaining settings and random seed constant. State that feedback can produce different current trajectories in different runs. A parameter sweep is an assumption sensitivity study, not a statistical confidence interval. Baseline/sham equality can be a useful software control; it does not characterize physical mounting, handling or recording artifacts absent from the model.

The thermal planning question can use computed shell temperatures, medium/package temperatures, commanded and delivered current, electrical input energy, signed heat transfer and conservation residuals. It cannot use a synthetic burst count as evidence of efficacy. A “burst” or “spike” generated by the signal model is an illustrative event, not a clinically confirmed seizure.

## Proposed biological control and analysis questions

These are design questions for collaborators, not procedures for preparing or perturbing living tissue:

- What preparation and functional assay address the stated mechanism, and what important adult-brain features are absent?
- Can temperature at relevant locations be measured independently of the controller, with uncertainty and timing understood?
- Can recording-chain, electrode-contact, optical and environmental artifacts be distinguished from a biological response?
- What untreated, sham and recovery comparisons are appropriate? Which observations could falsify the hypothesis?
- What constitutes an independent preparation, batch or cell line? What analysis and exclusion rules are set before examining outcomes?
- What viability, reproducibility and governance evidence is required before interpreting a change in activity?

Published [assembloid MEA work](https://doi.org/10.3791/67396) establishes the possibility of particular functional assays, while [Walker and Parent](https://doi.org/10.1177/15357597261469411) discuss model variability and translational limits. These sources do not supply a SeizeFreeze cooling protocol or prove assay suitability for its reported hardware. [RESEARCH_SOURCES.md](RESEARCH_SOURCES.md) records source context and verification depth.

## Release and review boundaries

Software checks should establish energy conservation, limiting cases, refinement, deterministic replay, valid inputs, export provenance and agreement among charts/scene/state. Accessibility and browser checks establish specific software behavior, not scientific validity. Numerical verification, literature review and agent review must not be described as independent hardware or clinical expert validation. Deployment/merge requires the separate authorization specified for this work; a successful build alone is not a release decision.
