# SEO Baseline — arjansinghpuniani.com

Baseline repository state: `main` at commit `8a726704e688a678a2ddf6b0f1889b86c85fcb37` ("Make About page more personal").

Audit date: 2026-09-05.

## Scope and evidence

This audit used:

- the current GitHub `main` tree and route/source files;
- the production homepage and several production routes as rendered HTML;
- current authoritative external records for peer-reviewed publications and Physics World authorship;
- current Google Search Central guidance for canonical URLs and sitemaps;
- current Cloudflare documentation for Web Analytics.

Search Console data was not available. Ranking observations in this document are therefore diagnostic web-search spot checks, not Search Console measurements.

## Executive baseline

The site already has strong fundamentals:

- server-rendered, crawlable HTML on primary routes;
- descriptive visible content rather than a JavaScript-empty shell;
- Next.js metadata APIs;
- a generated sitemap and robots route;
- HTTPS canonical host intent;
- `Person`, `WebSite`, `ProfilePage`, and some page-specific structured data;
- clear evidence/limitation language around medical and scientific work;
- descriptive internal navigation.

No P0 crawl-blocking defect was found in source.

The main weaknesses are consistency and authority consolidation. The site has stronger external evidence than the current pages expose. Several routes also inherit generic social metadata, the sitemap reports false freshness on every build, the standalone quantum lab can compete with its case study, and analytics is not yet verified for the Cloudflare production environment.

## Production observations

- `https://arjansinghpuniani.com/` renders meaningful HTML and a single human-readable H1.
- `http://arjansinghpuniani.com/` resolves to the HTTPS apex in the production fetch.
- `next.config.ts` contains a permanent `www.arjansinghpuniani.com` → apex redirect rule. The audit fetcher could not independently verify the `www` variants because of cache misses, so that redirect remains a post-deploy check.
- The search crawler showed a stale About page and an older Work project count while GitHub `main` already contained newer content. Treat this as evidence of crawl/index lag, not proof of deployment failure.
- Web-search spot checks for the name surfaced authoritative PubMed/PMC and Physics World results. The personal domain did not surface in the returned spot-check set. This is a discoverability signal, not a complete ranking report.

## Technical inventory

### Core routes

| URL | Baseline status | Indexable | Baseline canonical | Baseline title | H1 | Major H2s | Baseline social metadata | Structured data | Sitemap | Key internal links | Approx visible words | Purpose / intent | Index value |
|---|---|---:|---|---|---|---|---|---|---:|---|---:|---|---|
| `/` | 200 observed | Yes | `/` from root | Arjan Singh Puniani \| Neural Engineer Pursuing Medicine | Arjan Singh Puniani + editorial thesis | Thesis, Work with a pulse, Medicine/Engineering/At speed, Vector Tennis | Root OG/Twitter | Person, WebSite | Yes | Work, About, ReasonOS, SeizeFreeze, BCI, motorsport, Playground, Contact | ~280 | Branded identity + portfolio hub | Very high |
| `/about` | 200 observed; crawler stale vs current main | Yes | `/about` | About Arjan Singh Puniani | Arjan Singh Puniani | Current position, Physics World, personal section | Root social inherited at baseline | ProfilePage + Person | Yes | Research/Work via global nav; Physics World outbound | ~450 | Branded biography / entity corroboration | Very high |
| `/research` | 200 observed | Yes | `/research` | Research | Research by Arjan Singh Puniani in current source | Publications, science writing, research projects | Root social inherited at baseline | Physics World ItemList | Yes | Physics World outbound; global nav | ~420 | Publications / research authority | Very high |
| `/work` | 200 observed | Yes | `/work` | Work | Work | Project index cards | Root social inherited at baseline | None page-specific | Yes | All project case studies | ~400+ | Project discovery / topical hub | Very high |
| `/notes` | Source route | Yes | `/notes` | Notes | Notes | Two exploratory entries | Root social inherited at baseline | None | Yes | Research, ReasonOS | ~150 | Exploratory technical notes | Medium |
| `/cv` | Source route | Yes | `/cv` | CV | Arjan Singh Puniani — CV | Experience, Academic foundation | Root social inherited at baseline | None | Yes | Rigetti case study, résumé PDF | ~300 | Branded credentials / history | High |
| `/contact` | Source route | Yes | `/contact` | Contact | Start with the problem. | Direct contact | Root social inherited at baseline | None | Yes | Mailto + form | ~100 | Branded contact intent | Medium |
| `/playground` | Source route | Yes | `/playground` | Playground | Ideas you can move. | Vector Tennis card | Root social inherited at baseline | None | Yes | Vector Tennis | ~100 | Interactive portfolio / experimentation | Medium |
| `/playground/vector-tennis` | 200 observed | Yes | `/playground/vector-tennis` | Vector Tennis — Endless Rally | Endless Rally | Physics strategy, model boundary | Root social inherited at baseline | None | Yes | Playground | ~220 + app UI | Interactive tennis/physics experiment | Medium |
| `/privacy` | Source route | Yes baseline | `/privacy` | Privacy | Limited measurement. | Analytics, Contact, Hosting | Root social inherited | None | Yes baseline | Footer | ~120 | Utility / privacy | Low |
| `/quantum-computer-lab/index.html` | Static public HTML | Yes baseline | None baseline | Quantum Computer Operations Lab \| Arjan Singh Puniani | Quantum Computer Operations Lab | UI panels | Standalone title/description only | None | No | Linked from Rigetti case study | Mostly app UI | Standalone interactive artifact | Low as search landing page |
| `/api/contact` | API route | Not an HTML search target | n/a | n/a | n/a | n/a | n/a | n/a | No | Form POST only | n/a | Form endpoint | None |

Special metadata routes `/robots.txt`, `/sitemap.xml`, and `/manifest.webmanifest` are machine-facing resources rather than search landing pages.

### Work routes

All nine current project slugs are generated from `src/content/projects.ts`. Generic project pages already render problem, approach, results, limitations where present, evidence, related work, and a status/role sidebar.

| URL | Route implementation | Baseline canonical | Baseline title | Main visible topic | Baseline social metadata | Baseline structured data | Approx words | Primary intent | Index value |
|---|---|---|---|---|---|---|---:|---|---|
| `/work/seizefreeze` | dynamic + custom case component | self | SeizeFreeze | Focal cortical cooling concept for drug-resistant epilepsy | Custom OG only | No generic work schema | substantial | focal cortical cooling / SeizeFreeze | High |
| `/work/bci-calibration` | dynamic | self | Gamified BCI calibration | Intracortical BCI psychophysical calibration | Partial/root inherited | None | ~300 | BCI calibration gamification | High |
| `/work/rigetti-quantum-operations` | dynamic + custom component | self | Quantum systems operations | Superconducting quantum-computing control chain | Custom OG only | No generic work schema | substantial | quantum systems operations | High |
| `/work/quantum-active-inference` | dynamic | self | Conscious active inference | Peer-reviewed theoretical active inference work | Partial/root inherited | None | ~300 | active inference / quantum model | High |
| `/work/doctors-without-reservations` | dynamic | self | Doctors Without Reservations | Proposed community-led clinical/public-health learning model | Partial/root inherited | None | ~300 | project/name-specific | Medium |
| `/work/ucsf-eureka` | dynamic | self | Clinical research systems at UCSF Eureka | Digital clinical research operations | Partial/root inherited | None | ~300 | clinical research systems | Medium |
| `/work/motorsport-neurotrauma-toolkit` | explicit route | self | Motorsport Neurotrauma Toolkit | Crash mechanism → neurologic assessment → handoff | Root social inherited baseline | None | substantial | motorsport neurotrauma / handoff | High |
| `/work/belmont-motorsport-systems` | explicit route | self | Belmont Motorsport Systems | Academic motorsport risk/emergency systems | Root social inherited baseline | None | substantial | motorsport emergency systems | High |
| `/work/vector-ekg-reasonos` | explicit route | self | Vector EKG and ReasonOS \| Inspectable ECG Reasoning | Inspectable educational ECG reasoning | Unique OG but no route-specific Twitter | SoftwareApplication | substantial | ECG reasoning education / ReasonOS | High |

## Metadata and canonical findings

### Existing strengths

- Root metadata defines `metadataBase`, a title template, description, authorship, Open Graph, Twitter, robots directives, Google verification, and Bing verification.
- Most human-facing routes already self-canonicalize.
- Dynamic project pages already generate a unique title, description, and canonical URL.

### Defects / risks

**P1 — Incomplete per-route social metadata**

Many pages define their own title/description/canonical but no Open Graph/Twitter block. Because Next metadata merges by segment, generic root social metadata can survive on those routes. This can produce a correct HTML title but a homepage-like social preview.

**P2 — Root canonical is too broad**

The root layout defines `alternates.canonical: "/"`. Current major pages mostly override it, but it creates an inheritance hazard for any route without a page-level override. The safer design is an explicit homepage canonical in `src/app/page.tsx` and no global canonical in the root layout.

**P2 — Sitemap reports false freshness**

The current sitemap assigns `lastModified: new Date()` to every URL on every build. This does not represent significant content changes. Google explicitly recommends using `lastmod` only when it consistently reflects a real significant modification. If reliable dates are unavailable, omitting `lastmod` is safer.

**P2 — Low-value utility/static URLs can compete**

`/privacy` is useful to humans but low-value as a search landing page. The standalone `/quantum-computer-lab/index.html` duplicates the search purpose of `/work/rigetti-quantum-operations` while providing mostly interactive UI. Neither should compete with the canonical content hub.

## Research/entity findings

**P1 — Authority is under-exposed**

The current research page contains the first active-inference paper but does not expose DOI, PubMed, or PubMed Central links in visible content. It also omits the peer-reviewed companion paper II despite authoritative 2025 records.

Authoritative records verified during the audit:

- Paper I DOI: `10.1016/j.csbj.2025.09.017`
- Paper I PubMed: `https://pubmed.ncbi.nlm.nih.gov/41036467/`
- Paper I PMC: `https://pmc.ncbi.nlm.nih.gov/articles/PMC12481606/`
- Paper II DOI: `10.1016/j.csbj.2025.09.016`
- Paper II PubMed: `https://pubmed.ncbi.nlm.nih.gov/41019231/`
- Paper II PMC: `https://pmc.ncbi.nlm.nih.gov/articles/PMC12475526/`
- Paper II corrigendum DOI: `10.1016/j.csbj.2025.10.016`
- Physics World author archive: `https://physicsworld.com/author/arjan-singh-puniani/`

The corrigendum corrects equations on page 102 of paper II; it should be linked rather than silently ignored.

**P1 — Research page contains a stale evidence notice**

The current source still says a final DOI/publisher record is required before exact bibliographic details can be published, even though paper I already has a DOI in the site data and authoritative public records exist. This creates unnecessary uncertainty and weakens entity consolidation.

**P2 — Structured data is uneven**

The root Person/WebSite graph is useful. About has ProfilePage. Vector EKG has SoftwareApplication. Research only has an ItemList for Physics World articles. Project pages lack a consistent CreativeWork/Breadcrumb graph, and peer-reviewed papers are not expressed as ScholarlyArticle items.

## Internal-link findings

Current graph strengths:

- Header links: Work, Research, Playground, About, CV, Notes, Contact.
- Footer links: Work, Research, Playground, Contact, Privacy.
- Homepage links to major projects, About, motorsport work, Playground, and Contact.
- Generic project pages include same-category related work.

Current gaps:

- About discusses science writing but lacks a contextual link to the Research record.
- Research publications do not link to their related project/case-study context.
- Notes links to Research/ReasonOS but can better connect active-inference notes to the active-inference project page.
- Standalone quantum lab points away from the preferred search landing page only through its parent project; it lacks canonical/noindex signals itself.

## Content architecture findings

**No recommendation to create thin `/notes/[slug]` pages now.**

The current Notes page contains only two short entries. Splitting them into individual URLs now would create thin search surfaces without enough unique value. Keep Notes consolidated until a note can support a durable, source-backed article.

Potential future article topics are justified only after enough source material exists:

- BCI calibration gamification methodology/results;
- focal cortical cooling engineering constraints;
- active inference/path-integral theory with explicit theoretical boundaries;
- motorsport medical handoff information architecture.

These are future editorial opportunities, not part of this implementation.

## Image/performance findings

- Next/Image is used on important Next routes.
- The homepage hero source PNG is approximately 4.3 MB in the repository. Next/Image should optimize delivered variants, so replacing it without a measured LCP problem would create unnecessary visual risk.
- The Vector Tennis background video is already available in MP4/WebM at sub-megabyte scale.
- The SeizeFreeze concept film is approximately 18 MB in `public/video`; it warrants real-user/per-route measurement before intervention.
- No performance-driven visual deletion is justified from source evidence alone.

The recent local production build supplied by the owner showed approximately 102 KB shared first-load JavaScript and successful static generation. Full Core Web Vitals require real-user or browser measurement.

## Analytics baseline

`src/components/SiteAnalytics.tsx` loads `/_vercel/insights/script.js` and sends custom `window.va` events.

The owner’s current dashboard screenshot is Cloudflare analytics. That does not prove the Vercel endpoint is working on this deployment.

Therefore analytics is classified **P1 measurement uncertainty**, not an automatic code defect.

Do not replace the existing tracker blindly. First verify the production response and hosting integration. Cloudflare Pages supports one-click privacy-first Web Analytics and can collect real-user Core Web Vitals. Enabling it is an owner/dashboard action.

## Crawl/index baseline

- `robots.ts` allows crawling and publishes the sitemap location.
- No source-level accidental `noindex` was found on primary content.
- Primary HTML is server-rendered.
- Canonical host intent is HTTPS apex.
- Sitemap includes primary routes and all project slugs.
- Search-crawler snapshots appear behind the current GitHub `main`, which makes post-deploy URL inspection and indexing requests important.

## Prioritized findings

| Priority | Finding | Evidence | Impact | Fix | Risk |
|---|---|---|---|---|---|
| P0 | None found | Primary routes are crawlable in source; homepage renders meaningful HTML | — | — | — |
| P1 | Research authority under-exposed | DOI exists in data; PubMed/PMC records exist; visible page lacks links and paper II | Entity recognition and topical authority | Add verified records, ScholarlyArticle data, visible source links | Low |
| P1 | Per-page OG/Twitter inconsistent | Many routes set title/description but inherit root social fields | Wrong previews / weak page identity | Add route-specific social metadata | Low |
| P1 | Analytics not verified | Vercel Insights script + Cloudflare production dashboard | Cannot measure acquisition/retention reliably | Verify Vercel endpoint; enable Cloudflare Web Analytics if appropriate | External/setup |
| P2 | Sitemap fake `lastModified` | Every route uses `new Date()` | Weakens freshness signal credibility | Omit until real modification dates exist | Very low |
| P2 | Root canonical inheritance hazard | Root layout sets canonical `/` | Future/non-overridden pages could canonicalize incorrectly | Move homepage canonical to homepage only | Very low |
| P2 | Standalone quantum lab index competition | Static HTML has no canonical/noindex | Competes with richer Rigetti case study | `noindex,follow` + canonical to case study | Low |
| P2 | Privacy page in sitemap/index | Thin utility page | Low search value | `noindex,follow`; remove from sitemap | Low |
| P2 | Internal contextual links can improve | About/Research/Notes are globally linked but not always semantically connected | Weaker topical graph | Add restrained contextual links | Low |
| P2 | Generic project structured data absent | Dynamic case-study pages have no CreativeWork/Breadcrumb graph | Less machine-readable project context | Add stable JSON-LD | Low |
| P3 | Notes too thin for separate articles | Only two short entries | New URLs would be thin | Do not split yet | Avoided |
| P3 | Large hero source asset | 4.3 MB repository PNG | Possible image-processing/build/storage cost; delivered cost unknown | Measure before replacing | Medium visual risk |
| P3 | RSS not justified yet | No recurring article feed | Little discovery value | Do not add now | Avoided |

## Recommended implementation boundary

Implement high-confidence technical/entity fixes now.

Do not:

- redesign the site;
- create keyword landing pages;
- add FAQ spam;
- add a new SEO library;
- rewrite medical/scientific content beyond verified records;
- replace analytics until the deployment is verified;
- split Notes into thin pages;
- replace hero/video assets without measurement.
