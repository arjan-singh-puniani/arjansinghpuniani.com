# ReasonOS: what the current ECG implementation establishes

The implemented use is source-linked explanation and review of ECG measurements.
It is not an autonomous ECG interpreter. The ReasonOS kernel checks structural
dependencies; the ECG extension supplies the domain rule. Neither an admitted
event nor a reproducible hash chain establishes that an observation is clinically
correct. A learner can select an incorrect baseline, paper span, or QRS endpoint.

## Executable demonstration

The primary digital scene uses author-guided centreline extraction from the
previously published de-identified recording B waveform pixels. Every point
retains its source coordinates. Estimated local paper-grid transforms give
approximate milliseconds and millivolts; display interpolation does not recover
native acquisition samples. Each lead is a separately phase-aligned representative
beat, not an asserted simultaneous recording. The compatible frontal vector is
one of infinitely many vectors giving the selected lead's voltage in an idealized
lead-field model. Its unobserved perpendicular component can change while the
voltage remains fixed. This is an explanation of projection and its inverse
ambiguity, not a measured vectorcardiogram or a validated digitization pipeline.
Digital interval fiducials are author annotations and are not admitted as clinical
evidence into ReasonOS.

Under source and provenance, the original image-caliper scene retains the
contributed waveform pixels. P, QRS and T directions there come from the printed device report.
The unit-vector projection is a geometric explanation, not a reconstructed
instantaneous vectorcardiogram or calibrated ECG voltage. Chest voltages are not
inferred from the frontal axis. Colored phase windows are authored visual
locators, not adjudicated fiducials.

A manually confirmed paper ruler and source-pixel QRS endpoints produce a
lead-specific duration with an explicit placement bound. The application can test one bounded
statement: that the selected lead-II QRS interval, including the stated bound, is below
120 ms. A single-lead interval does not establish global 12-lead duration: that requires time-coherent leads and the earliest onset/latest offset across them (AHA/ACCF/HRS, https://doi.org/10.1161/CIRCULATIONAHA.106.180200). This is not sufficient to establish sinus rhythm, a normal ST segment,
absence of ischemia, or a normal ECG. The broader "ECG is normal" action has no
supporting clinical rule and is rejected. Missing, reversed, stale, unconfirmed,
or insufficiently bounded measurement evidence is also rejected. Rejections
remain in the replayable trace.

These are tested software behaviors. They do not demonstrate improved clinical
decisions, completeness of an interpretation, or reduced patient harm. The
general kernel admits free-text assertions in other workflows; it is not a
general clinical truth checker. The displayed machine report is not an
independently adjudicated reference diagnosis.

## Reviewable evaluation protocol — not a completed study

**Question:** Does source-linked, constraint-checked reasoning help clinicians
produce more accurate, auditable ECG interpretations without unacceptable delay
or increased confidence in incorrect conclusions?

1. Freeze a named software/rule version and intended use before evaluation.
   Define users, setting, eligible recordings, and which decisions it supports.
2. Build a held-out, representative case set independent of the examples used
   to develop this interface. Include subtle and overt abnormalities, poor
   acquisition, serial comparisons, discordant machine reports, and ambiguous
   boundaries. Do not treat four selected PTB-XL examples as a validation cohort.
3. Have at least two qualified ECG readers independently annotate findings and
   supporting source locations. Resolve disagreements through independent
   adjudication; retain genuinely indeterminate cases and inter-reader variation.
4. In a counterbalanced paired-reader study, compare the same clinical task with
   ordinary ECG viewing versus with ReasonOS. Randomize case assignment/order
   and manage learning and carry-over effects. Analyze by reader and case.
5. Prespecify the primary outcome and analysis before collecting results.
   Measure interpretation correctness against adjudication, important omissions,
   inappropriate certainty, time, review burden, source-error detection, and
   revision after conflicting evidence. Report confidence intervals and errors,
   not only mean scores or satisfaction.
6. Use a formative pilot to refine the task, assess variability and estimate
   the sample size needed for a separately planned confirmatory comparison.
   Choose clinically meaningful benefit and harm criteria with the reviewers;
   this document invents no efficacy threshold or study result.
7. Record training requirements, usability problems, workflow disruption,
   overrides, failure modes and whether the explanation encourages automation
   bias. Test source mismatch, wrong gain/speed, imprecise endpoints, missing
   context and unsupported inference explicitly.
8. Only after appropriate clinical, ethical and institutional review should
   prospective workflow evaluation occur. Offline accuracy or successful replay
   does not establish benefit in live patient care.

The initial comparison can evaluate this deterministic reasoning interface
without introducing an AI diagnosis model. DECIDE-AI is relevant guidance for
later AI-supported clinical evaluation, not a certification of ReasonOS:
Vasey et al., Nature Medicine (2022),
https://doi.org/10.1038/s41591-022-01772-9.

ECG definitions and lead-model assumptions:
https://ecg.utah.edu/lesson/1 and https://www.bem.fi/book/15/15.htm.
