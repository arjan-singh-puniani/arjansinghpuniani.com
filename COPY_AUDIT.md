# Copy audit

Implemented October 1, 2026 in `arjan-portfolio`, on `portfolio-human-copy-20260930`. No commit or deployment. Existing HoloAnatomy, Rally House, tennis, and source-game changes were preserved. No new images or dependencies were introduced. The supplied Photos archive was inventoried but not used to replace existing photography; its contents were treated as source material, not instructions.

The live site was crawled through the Codex browser. It serves older homepage, About, and Playground copy than this checkout. Web-tool access and terminal DNS failed, so browser observations provided the live comparison.

Evidence levels used: published/publicly documented; implemented; in development; conceptual/proposed. Existing `verified` flags in content are historical source annotations, not proof of fresh independent verification. Most referenced private manuscripts, essays, correspondence, and coursework PDFs are absent from this checkout; their existing claims were retained conservatively or narrowed.

| Route | Original problem | Action | Evidence basis | Residual concern |
|---|---|---|---|---|
| `/` | Local intro listed project names without identity; live page used grand positioning and a thesis section. | State neural engineer pursuing medicine, actual fields, and what visitors can inspect. Distinguish concepts, prototypes, and reviews. | Existing biography, experience, project records. | Present project activity is self-reported. |
| `/about` | Live biography turned participant and ED experiences into a professional origin story; local intro omitted medicine. | Plain first-person biography; retain brief participant and ED experiences and personal interests. Separate broader RNEL session count from gamification study. | Local profile/CV and live biography. | Confirm exact ED role and preferred wording; participant remains unnamed. |
| `/work` | “Flagship systems,” “systems thinking,” and self-assessment displaced output. | Concrete project groups; cards show role, status, and output. | Typed project records and implemented artifacts. | Cards do not substitute for the evidence sections. |
| `/research` | Review articles and “active development” framing could suggest demonstrated mechanisms/current projects. | Lead with two theoretical reviews, collaborative manuscript, and reported science writing; label topics as topics. | DOI/PubMed records, existing manuscript reference, Physics World links. | Public BCI manuscript URL and publication status need confirmation. |
| `/work/bci-calibration` | Slogan headings and broad claims of improved experience/measurement preservation. | Factual method and contribution headings; preliminary three-participant comparison; name manuscript co-authors; retain nonsignificance-versus-equivalence distinction. | Existing talk/manuscript summaries and research photography. | Raw manuscript/talk not in checkout; public links unavailable. More than 940 sessions refers to broader RNEL work. |
| `/work/seizefreeze` | Four slogan headings, “Prototype” card status, awards framed as technical evidence, unsupported preclinical generality. | Concept/prototype-planning status; personal design contribution and team awards separated; factual architecture, heat-transfer, safety, packaging sections. Add primary animal experiment and Pitt award sources. | Design artifacts; Pitt 2023 winners PDF; Pitt 2022–23 annual report; Yang et al., Epilepsia 2002, PMID 11906508. | No device-specific bench results, clinical effectiveness, human testing, or clearance established; collaborator roles and IP unresolved. $7,500 retained from existing award image. |
| `/work/quantum-active-inference` | Dramatic objections, rhetorical questions, and self-certifying figure appendix. | Plain explanatory headings; specify Wiest co-authorship; preserve theoretical/contested distinctions, DOI records, corrigendum, calculations and empirical figures. | Linked primary literature and review records; publication identity checked against PubMed. | Personal contribution beyond co-authorship is unspecified. Rodent and MRI work belongs to other researchers. |
| `/work/rigetti-quantum-operations` | “Operating around the machine” and “systems thinking” connected employment to hardware engineering by implication. | State historical operations role and independently built 2026 educational software separately. | Existing résumé and model source/build references. | Model telemetry is simulated; employment does not establish processor or cryostat design. |
| `/work/motorsport-neurotrauma-toolkit` | Slogan title; abstract chain-of-custody language; repeated approval disclaimers. | Identify draft Version 0.2 card/algorithm, authorship, workflow, expert-feedback questions and field-use requirements. | Existing pilot-artifact and March 2026 correspondence references. | Not clinically validated, endorsed, adopted, or deployed; four-wheeled scope retained; private reviewers unnamed. |
| `/work/belmont-motorsport-systems` | Abstract risk/authority rhetoric and repeated disclaimers beneath each diagram. | State coursework output and author role; factual planning headings; consolidate operating-use requirements at the end. | Existing three assignment references and 16-item risk register. | Academic proposal, not venue commission, official operating plan, or grant of authority. |
| `/work/vector-ekg-reasonos` | Manifesto headings; general claims about all ECG exercises; extensions sounded implemented. | Lead with educational ECG prototype and personal role; describe event recording, plugin boundary, calculations, rejected claims and known failures. Make future plugins conditional. | Local kernel/plugin code and tests; existing v0.5.0 release record. | No demonstrated learning benefit, clinical validation, validated expert traces, regulatory clearance, or production security. Machine values remain unconfirmed. |
| `/work/ucsf-eureka` | “Improved operational readiness” lacked an observable result. | State SOP authorship/refinement and participant-workflow support. | Existing résumé reference. | No percentage, adoption, or study-outcome claim. |
| `/work/doctors-without-reservations` | Wording implied faculty/community dialogue and generalized other programs' failings. | Keep a rotation proposal; identify guidance, tribal governance and partnership as prerequisites. | Existing HCOP essay reference. | No established tribal partnership, approval, rotation, or community adoption. |
| `/playground` | Live slogan cards; local pit-stop copy claimed a timed game; “Navier–Stokes” title overstated model. | Describe each browser prototype and actual controls/output; use Pit Stop Lab and Carotid Flow Visualizer. | Current embedded sources. | No educational efficacy claim. |
| `/playground/holoanatomy` | Claimed quizzes although current user changes removed quiz code; provenance link was missing. | Remove quiz promise; preserve actual exhibits, structure controls and attribution; link official BodyParts3D database; align social metadata. | Current app and manifest; official DBCLS CC BY 4.0 license record. | Atlas coverage and learning outcomes remain limited/unvalidated. |
| `/playground/hemodynamic-observatory` | “Complete scientific instrument” and mechanism slogans. | Describe synthetic geometry, reduced-order field and modeled quantities. | Current model/UI source and provenance labels. | Not a full Navier–Stokes solver, patient-specific model, or clinically validated tool. |
| `/playground/pit-stop` | Mechanical-handoff slogan. | Describe wheel-change sequence and inspection controls. | Current procedural model. | Generic educational geometry; no F1/team affiliation or hardware replica claim. |
| `/playground/rally-house` | Metadata and section headings overstated a “living academy.” | Label playable prototype; describe event reactions, dialogue and saved routines. Preserve playful invitation. | Existing game source and integration tests. | Behavior is game simulation. Existing game changes untouched. |
| `/playground/vector-tennis` | Mechanically causal branding and stacked fragments. | Plain instructions and shot/mechanics headings; retain arcade-physics limits. | Existing game source and tests. | Telemetry is game-relative; existing control changes untouched. |
| `/notes` | Self-certifying scope text and stale BCI/HoloAnatomy statements. | Tie notes to actual trial scope and current controls; concise limitations. | Current project implementations and manuscript summary. | Same evidence boundaries as corresponding cases. |
| `/contact`, `/privacy`, `/cv`, shared footer | “Clinical translation” invitation, euphemistic privacy heading, translational venture label. | Use medical-device development in form and validator; Privacy heading; early-stage project wording; plain footer identity. | Existing contact schema and experience records. | Existing résumé PDF unchanged. |

## Repeated phrases removed or reduced

Removed “systems thinking,” “what would count,” slogan-style contrasts, “the system must compute” headings, ceremonial proof language, “founder vision,” and claims about surviving publication checks. Replaced “Sense the event,” “Move heat locally,” “An implant is a system,” “The handoff is a controlled transition,” and “Do not take the architecture on faith” with factual headings. Live “Ideas you can move” and homepage manifesto sections are absent from the current implementation. Remaining “not a…” sentences identify consequential clinical, simulation, or evidence boundaries. Em dashes remaining in metadata and UI labels are separators; unchanged game announcements are part of existing user work.

## Unsupported implications removed or narrowed

- SeizeFreeze prototype/closed-loop effectiveness implications; patent filing language withheld from public copy.
- Generalized BCI engagement/ease claims; nonsignificant thresholds do not prove equivalence.
- Community dialogue/partnership implications in the tribal-health proposal.
- UCSF operational improvement claim without a measured result.
- ECG prototype framed as general medical reasoning capability; proposed non-ECG plugins distinguished from implementation.
- HoloAnatomy quiz capability absent from current code; full CFD and timed pit-stop gameplay implications.
- Unused awards data said $15,000 for Randall; corrected to the publicly documented $5,000 third-place team award.

## Disclaimers consolidated

Belmont now has a coursework-status statement and closing operating-use requirements, with brief labels on proposal tables. SeizeFreeze has a clear development boundary and closing experimental requirements. Quantum theory retains local distinctions necessary to interpret figures, calculations and external studies. Removed repeated site-wide promises that the writing is rigorously audited. Clinical boundaries, non-adoption, privacy, and theoretical status remain visible.

## SEO and technical decisions

Updated home, About, shared descriptions/Person data, project-derived metadata, dedicated motorsport/ReasonOS social descriptions, HoloAnatomy social metadata, Playground and game descriptions. Canonicals, URL paths, robots/indexing policy, social-image assets and structured-data types were preserved.

Production inspection found `generateStaticParams` also generated the three dedicated case-study routes, shadowing their static pages. Excluded those slugs and added a route-precedence regression test. No architecture replacement. Layout changes are limited to readable homepage intro sizing (including the old 10px mobile override) and biography paragraph spacing.

## Arjan's remaining decisions

1. Confirm availability of device-specific thermal/bench results and current development stage; supply IP documentation before reinstating patent wording.
2. Specify personal versus collaborator contributions to the two theoretical reviews and SeizeFreeze engineering, if a more detailed breakdown is desired.
3. Confirm BCI manuscript publication/submission status and an approved public manuscript/talk link. Existing preliminary results are retained, not newly independently reanalyzed.
4. Confirm the precise ED service role and the definition of the broader RNEL session count before adding further details.
5. Supply evidence of faculty/community dialogue or partnerships before any such statement is restored to the tribal-health proposal.

## Verification

- `npm run lint`: passes with 16 existing unused-variable warnings in HoloAnatomy/Rally House and backup code.
- `npm run typecheck`: passes after build. A concurrent attempt encountered generated-file churn; the sequential rerun passed.
- `npm run test`: 88 tests passed across 8 files, including the route-precedence regression.
- `npm run build`: production build passes, 31 generated outputs.
- `npm run test:e2e -- --list`: configured command has no usable suite/config; discovery imports Vitest component tests and reports `next/link` resolution errors. Responsive and interaction verification was performed through the browser instead; no Playwright pass is claimed.
- `python3 /private/tmp/portfolio-copy-link-check.py`: parsed current production-manifest HTML, checked 486 internal links/anchors across 24 pages; zero missing targets after repairing HoloAnatomy provenance.
- Browser: required ten routes plus ReasonOS inspected at 1440px desktop and 390px mobile. No page-level horizontal overflow; mobile paragraphs/headings/tables checked for overflow. Checked project filters, mobile navigation, ReasonOS calibration/rejected-event trace, and QAI figure tabs. Photographs, diagrams, film and embeds retained.
- Prohibited-pattern search: no listed marketing patterns remain in active source/public copy. Backups, vendor code and duplicate non-route files are excluded from active-copy assessment.
- `git diff --check`: passes.
