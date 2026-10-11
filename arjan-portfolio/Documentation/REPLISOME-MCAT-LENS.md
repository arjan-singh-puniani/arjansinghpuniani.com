# REPLISOME MCAT lens

The cinematic replisome explains protein roles and fragment maturation, but does
not by itself establish transfer to passage-based replication questions. The
optional **MCAT lens** adds a separate visual reasoning studio within the same
standalone app and portfolio iframe. Watch, Explore and Play remain the default
experience modes.

## Learning scope

| Mechanism | Visual interaction | Reasoning task |
| --- | --- | --- |
| Antiparallel templates and origins | Switch between outward-moving left and right forks with fixed parental polarity | Infer leading synthesis from template polarity and fork direction |
| Primer chemistry | Compare terminal 3′ H and 3′ OH | Predict chain termination despite correct base pairing |
| Enzyme functions | Isolate ligase, helicase, topoisomerase, primase or proofreading | Distinguish direct assay effects from later cellular damage |
| Semiconservative inheritance | Change replication round 0–3; compare density bands and individual duplexes | Distinguish duplex abundance, strand abundance and band position |
| End replication | Step through primer removal, template extension and complementary fill-in | Identify RNA-templated DNA synthesis and the normal 3′ overhang |
| Transfer checkpoint | Three new questions without a worked diagram | Reverse-complement orientation, changed isotope denominator and limits of a rescue experiment |

There are twelve original prediction/practice items. Answers require a selection
and confidence rating before revealing the mechanism. Explanations cover every
alternative. The checkpoint reports first-attempt accuracy and identifies
high-confidence errors without awarding a mastery claim. Attempts are local to
the open studio session and reset on closing; no tracking or account is added.

Scientific review references the [AAMC outline](https://students-residents.aamc.org/media/9261/download?attachment=),
[Alberts replication mechanisms](https://www.ncbi.nlm.nih.gov/books/NBK26850/),
[Cooper replication](https://www.ncbi.nlm.nih.gov/books/NBK9940/),
[Brown genome replication](https://www.ncbi.nlm.nih.gov/books/NBK21113/), and
[Alberts chromosome initiation/completion](https://www.ncbi.nlm.nih.gov/books/NBK26826/).
These are conceptual schematics and original questions, not AAMC exam materials.
The studio explicitly distinguishes human Pol α/ε/δ and FEN1 from E. coli Pol
III/I; proofreading from primer removal and mismatch repair; nicks from gaps;
and nucleotide incorporation energy from the scene's illustrative ATP counter.
The telomere lab depicts a simplified lagging-end problem and acknowledges
leading-end processing and the normal remaining overhang.

DNA repair pathways, other nucleic-acid topics and broad passage skills are not
fully covered. No student-outcome study or validated MCAT-readiness assessment
has been conducted. A three-item checkpoint is practice feedback only.

## Interface and validation

The native modal dialog makes the molecular interface inert, pauses the engine,
suspends GPU rendering and suppresses recurring UI updates while open. Closing
restores the previous running/paused state and focuses the launch button,
including Safari-style mouse focus behavior. Diagrams and questions remain
usable without WebGL. Mobile navigation scrolls horizontally within its rail;
lab content scrolls within the dialog with a keyboard-focusable region. Flexible
height allocation prevents long headings from pushing the header offscreen.

Validation on the release candidate:

- 25 simulation/scientific-model unit tests passed; the isotope model conserves
  the two original heavy strands and uses separate duplex/strand denominators.
- 91 portfolio tests, TypeScript checks, lint and the 32-route production build
  passed. Lint retains 13 pre-existing warnings in other experiences.
- 18 molecular browser scenarios passed in installed Chrome and WebKit,
  including gameplay completion, proofreading recovery, four viewport sizes,
  touch, missing assets and missing WebGL.
- Six studio scenarios passed: desktop/phone in Chrome and WebKit plus both
  no-WebGL cases. They cover all five perturbations, commitment before reveal,
  first-attempt reporting, confidence capture, isotope rounds, chromosome-end
  steps, modal focus, Escape, rendering suspension and state restoration.
- Automated WCAG A/AA scans of the initial studio views reported no violations.
- Twenty portfolio integration/regression scenarios cover lazy loading,
  surrounding routes, embedding, modal launch/close, fullscreen, focus and asset
  requests. Final results are in the adjacent QA evidence directories.

The bundled software-rendered Chromium run timed out during gameplay under
concurrent graphics load; the complete suite was rerun successfully using the
installed Chrome channel, matching portfolio QA. Physical iPhone GPU/thermal
testing and VoiceOver testing remain unverified.

Reproduce the additional checks after syncing the standalone bundle and starting
the portfolio production server:

```sh
REPLISOME_TEST_CHROME=1 npm run test:e2e --prefix ../replisome-source
node tools/replisome/study-qa.mjs
node tools/replisome/browser-qa.mjs
```

Set `REPLISOME_QA_URL` for the live site; set `REPLISOME_STUDY_QA_OUT` and
`REPLISOME_QA_OUT` to keep live evidence separate. Hosting uses the existing
GitHub/Vercel deployment; the private Sites prototype is not changed. Vercel
preview authentication stays enabled. As in the initial integration, validate
the local production build and hosted preview build, then repeat browser checks
on the public production domain immediately after the guarded merge.
