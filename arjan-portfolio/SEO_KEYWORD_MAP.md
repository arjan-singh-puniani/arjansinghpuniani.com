# SEO Keyword / Search-Intent Map

This is a relevance map, not a promise of ranking. Queries are assigned only where the current site has a defensible, evidence-backed destination.

| Cluster | Representative queries | Intent | Evidence support | Best destination | Current gap | Implementation / next action |
|---|---|---|---|---|---|---|
| Branded identity | Arjan Singh Puniani; Arjan Puniani | Find the person, biography, work | Strong | `/`, `/about`, `/cv` | External authority outranks the domain in spot checks | Strengthen entity consistency, canonical metadata, authoritative source links |
| Neural engineering | Arjan Singh Puniani neural engineering; neural engineering rehabilitation | Person + field expertise | Strong | `/research`, `/about` | Research authority not fully connected | Strengthen Research metadata and links |
| BCI calibration | brain-computer interface calibration; BCI calibration gamification; gamified psychophysics; intracortical BCI calibration | Technical methodology/research | Strong from project + supplied preprint | `/work/bci-calibration`, `/research` | Preprint has no public publisher record; project metadata is generic | Improve project social/CreativeWork data; keep preprint clearly labeled |
| Neurotechnology / cortical cooling | focal cortical cooling; cortical cooling epilepsy; SeizeFreeze; drug-resistant epilepsy engineering concept | Technical concept | Strong for the project concept, not clinical efficacy | `/work/seizefreeze` | Search intent can be medical; claims must stay bounded | Preserve “concept / not clinically validated” language; strengthen metadata only |
| ECG reasoning education | ECG reasoning education; medical reasoning software; evidence-aware clinical reasoning; ReasonOS; Vector EKG | Educational software / reasoning architecture | Strong for software prototype | `/work/vector-ekg-reasonos` | Social metadata incomplete | Add Twitter/Breadcrumb data; preserve clinical boundary |
| Motorsport neurotrauma | motorsport neurotrauma; trackside neurotrauma; motorsport medical handoff | Educational/exploratory systems | Strong for exploratory toolkit, not clinical protocol | `/work/motorsport-neurotrauma-toolkit` | Route lacks page-specific social/structured data | Add metadata + CreativeWork/Breadcrumb; retain validation disclaimer |
| Motorsport emergency systems | racing safety systems; motorsport emergency human factors; race-day emergency operations | Academic systems analysis | Strong for academic coursework | `/work/belmont-motorsport-systems` | Route lacks page-specific social/structured data | Add metadata + CreativeWork/Breadcrumb; retain academic boundary |
| Active inference | conscious active inference; quantum active inference; microtubules active inference; quantum consciousness active inference | Research paper / theory | Very strong for co-authored peer-reviewed papers | `/research`, `/work/quantum-active-inference` | Paper II omitted; DOI/PubMed/PMC hidden; corrigendum omitted | Add both peer-reviewed records, source links, ScholarlyArticle data, corrigendum |
| Quantum systems | superconducting quantum computer operations; Rigetti quantum systems; quantum computing operations model | Educational model / career context | Strong for independent model + documented Rigetti role, with boundaries | `/work/rigetti-quantum-operations` | Standalone 3D app can compete; search context split | Canonical/noindex standalone app; keep case study canonical |
| Science writing | Arjan Singh Puniani Physics World; BCI Physics World Arjan | Author/article lookup | Strong third-party evidence | `/research`, `/about` | Contributor archive is external; site should connect to it clearly | Preserve contributor links and Person sameAs |
| Interactive tennis | tennis physics game; Vector Tennis | Play / inspect physics experiment | Strong for original site experiment | `/playground/vector-tennis` | No structured application context | Add SoftwareApplication metadata; do not overstate sports-science fidelity |

## Page ownership rules

- `/` owns the broad branded entity.
- `/about` owns biography/person intent.
- `/research` owns publication/research-record intent.
- `/work` owns project-index intent.
- Individual `/work/...` pages own their specific technical/project phrase.
- `/notes` remains exploratory and should not compete with peer-reviewed Research.
- `/playground/vector-tennis` owns the game/interactive experiment, not general tennis coaching or sports science.

## Cannibalization controls

- Keep "active inference" detailed bibliographic authority on `/research`; use `/work/quantum-active-inference` for project context and limitations.
- Keep "focal cortical cooling" project details on `/work/seizefreeze`; do not create a second thin SEO page with the same content.
- Keep "ECG reasoning" on `/work/vector-ekg-reasonos`; Notes may discuss reasoning principles but should link back rather than duplicate the case study.
- Keep motorsport academic systems and neurotrauma toolkit separate because their user intent and evidence boundaries differ.

## Future content threshold

A new indexable page is warranted only when it can provide:

1. a unique question not already answered elsewhere;
2. substantial original or source-backed explanation;
3. explicit evidence/limitations;
4. at least one meaningful inbound link from an existing hub;
5. a durable reason to remain useful after publication.

Until then, improve existing pages rather than creating new URLs.
