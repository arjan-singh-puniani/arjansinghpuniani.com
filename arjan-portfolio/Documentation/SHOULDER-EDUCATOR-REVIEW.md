# Shoulder educator review

Status: review protocol only. No educator approval, participant data or learning-effectiveness result has been obtained. Review the exact candidate commit, browser and device; do not generalize from automated tests.

## What is being evaluated

HoloAnatomy is an interactive right-shoulder spatial-learning prototype. Its intended task is to help a learner locate the four cuff muscles around the glenohumeral joint and relate their positions to curriculum descriptions of function. It is not a joint-mechanics simulator or a clinical decision tool.

The assembly contains BodyParts3D surfaces, not a complete shoulder. Tendons, insertion footprints and fiber orientation are not separately represented. The displayed surface quality limits fine landmark interpretation. Blender processing changed shading normals, not anatomical topology or vertex positions.

## Educator walkthrough: approximately 20 minutes

1. Open Explore. Inspect posterior, anterior, superior and lateral views. Check right-side orientation, structure identities and the relationships implied by the assembly. Flag any misleading surface or overlap, including limitations inherited from the source.
2. Select each cuff muscle. Check origin, insertion, action, innervation, spatial relationship and clinical text against the linked curriculum sources. Separate text accuracy from what the actual geometry demonstrates. Record exact wording requiring correction.
3. Use Peel. Assess whether offsets are clearly understood as an illustrative dissection, and whether reassembly restores the anatomical relationships. Check that the interface does not imply that missing tendons or footprints are shown.
4. Run Present and the four function studies. Check that learners can distinguish anatomical position from simulated movement, activation or force. Ask them to describe what the highlight means.
5. Complete Quiz. Inspect question ambiguity, whether labels or camera choices reveal the target, and whether retries and scores are explained honestly. Later rounds start from a shared lateral view; learners must navigate as needed.
6. Repeat the key tasks on a phone. Record device, browser, orientation, clipping, touch-selection problems and any task requiring help.

## Record each finding

| Field | Record |
| --- | --- |
| Candidate | Commit, date, browser, device |
| Reviewer | Role and relevant anatomy/teaching expertise; name only with permission |
| Location | Mode, view, structure ID, exact statement or action |
| Observation | What happened, with screenshot if useful |
| Severity | Misleading anatomy; blocked learning task; usability friction; cosmetic |
| Evidence | Source citation or anatomical explanation |
| Correction | Required change and how the reviewer will verify it |
| Disposition | Open, corrected awaiting recheck, or reviewer verified |

A proposed release gate is no unresolved misleading-anatomy finding and no blocked core learning task. This is a project acceptance criterion, not accreditation. A review counts as complete only when a real reviewer has performed it and agreed to the recorded scope; do not prefill a sign-off.

## Small formative learner pilot

Use this to find failures, not to claim educational efficacy. Recruit willing learners through the project owner; no invitations have been sent. Record prior anatomy experience without collecting unnecessary personal information. Obtain permission before recordings. If the work is intended as institutional research or publication, have the supervising institution determine its review requirements before recruitment.

- Before the lesson, ask the learner to locate the four muscles and explain one anterior/posterior relationship. Use an educator-approved alternate representation or unfamiliar viewpoint, not the lesson's labeled opening frame.
- Let the learner complete the spatial tour without coaching. Observe where they get lost, select the wrong structure, or confuse the source geometry with curriculum text.
- Afterward, use equivalent but different prompts and viewpoints approved by the educator. Counterbalance the two prompt sets across learners to reduce question-order effects. Include a task requiring rotation from the opposite side.
- Record first-attempt correctness, required assistance, navigation failures and completion time. Record wrong answers and incomplete tasks, not only successful demonstrations. The app's practice score is not a substitute for this observation.
- Ask: “What can this model show accurately?”, “What is missing?”, and “What did the highlighting mean?” Misunderstanding the model's limits is a product defect to investigate.
- Report the sample size, prior experience, exact tasks, all outcomes and limitations. A small uncontrolled pre/post exercise cannot establish causal benefit or superiority over an atlas. Treat it as formative feedback.

## Conference demonstration: three minutes

- 0:00–0:30: state the learning objective and identify the right shoulder. Explain source scope briefly.
- 0:30–1:15: use posterior and anterior views to show how the cuff surrounds the joint. Invite the audience to predict where the anterior muscle will appear before rotating.
- 1:15–2:00: compare the posterior pair in the external-rotation study, then inspect the internal-rotation study. Explain that these are curriculum-guided highlights on static anatomy.
- 2:00–2:40: ask a live spatial question and let the learner manipulate the specimen. Show first-attempt scoring and retry feedback.
- 2:40–3:00: show provenance, disclose missing anatomy, and describe what has actually been tested. Mention educator feedback or learner results only after obtaining them.

## Claims the present evidence supports

The project includes interactive source anatomy, a guided lesson, function-group studies, reversible dissection, provenance and local practice questions. Automated checks exercise engineering behavior. Derived normals preserve exported triangle positions.

The present evidence does not establish anatomical expert approval, improved learning, clinical validity, physical-iPhone performance, adoption by a medical school, or an admissions advantage. Keep a factual contribution log distinguishing project direction, source assets, AI-assisted implementation and personal validation work; be prepared to explain each technical and educational decision.
