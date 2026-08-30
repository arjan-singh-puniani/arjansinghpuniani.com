# Site audit

Audit date: 2026-08-30

Scope reviewed: `package.json`, application layout and metadata, homepage, global and ReasonOS styling, work index, generated and custom project routes, ReasonOS, Belmont motorsport systems, neurotrauma content, components, typed content, public assets, analytics, desktop/mobile navigation, sitemap, manifest, automated tests, and the running site at 1440 × 900 and 390 × 844.

## 1. What is already excellent

- The homepage establishes a concrete responsibility-centered position immediately: “Neural engineer pursuing medicine” and “Engineering for decisions that affect human lives.”
- “Engineering is most consequential when the system is human.” is a strong, memorable thesis that connects the portfolio without flattening the projects into one discipline.
- The selected-work sequence is intellectually coherent: ReasonOS first, then SeizeFreeze, then BCI calibration. ReasonOS is presented as an inspectable reasoning system rather than generic AI branding.
- ReasonOS already demonstrates architecture through artifacts: source, state, transformation, constraints, trace, rejected events, provenance, and a working synthetic laboratory.
- The homepage motorsport transition, “Medicine. Engineering. At speed.”, is concise and correctly framed around incomplete information, limited time, and human consequences.
- Evidence boundaries are unusually visible. Project limitations, verified sources, prototype language, and non-clinical-use statements appear in public content rather than being relegated to legal fine print.
- The visual system has a distinctive editorial/system-instrument character. The homepage hero, signal trace, indexed labels, technical flows, and restrained ReasonOS surface are more specific than generic portfolio cards.
- The App Router and typed content model are small and understandable. Most pages are server components; high-frequency interactivity is already isolated to client components.
- Accessibility foundations are sound: semantic headings, a skip link, keyboard-operable controls, visible focus treatment, reduced-motion handling, descriptive image text, semantic lists/definitions, and a mobile menu with `aria-expanded`/`aria-controls`.
- Performance foundations are sound: no heavy visual dependencies, optimized `next/image` usage, few client boundaries, and no production orbital canvas or decorative main-thread animation.
- At 390 × 844, the hero preserves its hierarchy, primary actions are large touch targets, the portrait follows the copy, and there is no visible horizontal clipping in the first viewport.

## 2. What should remain unchanged

- Preserve the exact homepage core positioning, thesis, motorsport transition, and the framing across neurotechnology, clinical reasoning, rehabilitation/patient-centered design, and motorsport safety.
- Preserve project order `00 — Vector EKG + ReasonOS`, `01 — SeizeFreeze`, `02 — Gamified BCI calibration`.
- Preserve ReasonOS prominence, the executable synthetic lab, the source/state/transformation/constraint/trace architecture, and the explicit educational/research/no-clinical-validation boundary.
- Preserve the existing hero instead of replacing it with the explored orbital particle concept. The current portrait and copy communicate identity and credibility with no client-side rendering cost; an orbital canvas would add distraction and performance risk without a demonstrated comprehension gain.
- Preserve `/work/belmont-motorsport-systems` and `/work/motorsport-neurotrauma-toolkit`; do not introduce a redundant motorsport hub or replacement route.
- Preserve the App Router, TypeScript, current content arrays, analytics, `next/image`, sitemap/metadata structure, contact flow, and existing research/About/CV content.
- Preserve the restrained motorsport visual language. No race-car stock imagery, checkered flags, tachometers, carbon-fiber textures, or invented telemetry are warranted.

## 3. P0 correctness issues

- The mobile navigation component mounts and manages `aria-expanded`, but a broad `.site-header nav { display: none; }` mobile rule also hides the opened mobile menu. The trigger appears to work in the DOM while the links remain visually unavailable.
- The public neurotrauma project data claims a version 0.3 toolkit and version 0.3 source files, while the repository’s evidence audit directly verifies a Version 0.2 pilot draft. Public wording must return to Version 0.2 unless version 0.3 primary artifacts are added and audited.
- The current project status type uses broad lifecycle labels (`Completed`, `Prototype`, `Under development`) that do not distinguish completed research, academic study, course-use proposal, exploratory work, and clinical-validation status. This creates avoidable ambiguity on the work index.
- The neurotrauma route currently falls through to the generic project template, so its “not validated / not endorsed / not adopted” boundary is less prominent than the evidence risk requires.

## 4. P1 high-impact credibility/usability issues

- The Belmont page states the boundary prominently but only exposes four summary modules. It does not yet let a reader answer the central operational questions quickly: what is ranked, who owns a decision, where handoff occurs, and what blocks recovery.
- Belmont’s operational-use reconciliation list should explicitly include current communications plans, credentialing, agency authority, EMS protocols, and hospital procedures in a single visible boundary.
- The neurotrauma system needs a dedicated structure showing mechanism → occupant-protection context → neurologic observations → escalation/disposition → structured handoff, plus a clear distinction between feedback received and validation/endorsement/adoption.
- Status words are rendered with inconsistent capitalization and vocabulary across the homepage, cards, and custom pages. A single exported status map should drive all project labels.
- The Playground does not exist, so interaction design, simulation thinking, physical intuition, and playful technical craft are absent from the public portfolio.

## 5. P2 meaningful refinements

- Add one compact systems strip to the existing motorsport homepage section so the connection is demonstrated visually without changing its position or copy hierarchy.
- Unify the secondary-page accent with the homepage’s restrained indigo/ivory system. The legacy teal accent is visually disconnected from the newer homepage and ReasonOS surfaces.
- Make mobile navigation close on Escape and after navigation, expose an explicit open/close accessible label, and move focus into the opened menu.
- Give complex diagrams visible captions and nearby textual equivalents instead of relying on `role="img"` alone.
- Add the Playground as a quiet footer/work-index discovery path rather than another top-level professional identity.

## 6. P3 optional polish

- Active-route treatment in desktop and mobile navigation would improve orientation but is not required for comprehension.
- A future evidence page could expose source classes across projects; current per-project evidence sections are adequate.
- A static social preview tailored to the final visual system could replace the current general Open Graph asset after the content work is stable.

## 7. Evidence gaps

- No public claim should advance the Belmont work beyond academic systems study/course-use proposal without venue, sanctioning-body, EMS, hospital, communications, credentialing, and agency review records.
- No public claim should describe the neurotrauma toolkit as validated, endorsed, adopted, deployed, or clinical decision support. Existing correspondence supports critique requested/received only.
- Version 0.3 neurotrauma claims are not supported by the current evidence audit and must be withheld.
- BCI numerical outcomes beyond the documented session count require primary study records.
- SeizeFreeze clinical efficacy, human testing, regulatory clearance, and final patent status remain unsupported for public expansion.
- Playground physics must be described as physics-inspired/mechanically coherent, not realistic or validated against physical measurements.

## 8. Performance risks

- The homepage ticker animates continuously; reduced-motion already disables animation globally, but motion should remain limited to this existing low-cost transform.
- Any tennis simulation that stores per-frame state in React would create unnecessary rerenders and input latency. Physics state should stay in an imperative animation loop with React used only for low-frequency controls/readouts.
- Canvas rendering must cap device pixel ratio, pause offscreen and when the document is hidden, handle resize without duplicating animation loops, and avoid allocations in hot paths.
- The Next.js development server currently warns that it inferred a workspace root from another lockfile. Setting `outputFileTracingRoot` to the project directory would remove ambiguity for production tracing.

## 9. Accessibility risks

- The mobile menu does not currently move focus into the opened menu or close on Escape.
- Existing system diagrams have concise accessible labels but need more complete textual equivalents for readers who cannot perceive the visual relationships.
- A canvas-based experiment would be inaccessible if it were pointer-only. Vector Tennis needs keyboard controls, touch-friendly controls, visible instructions, an accessible live summary, non-color contact feedback, and a reduced-motion mode.
- Canvas touch handling must not block vertical page scrolling; only intentional contact with game controls should consume input.
- Status labels must remain readable at high zoom and not rely on color alone.

## 10. Recommended implementation order

1. Correct the neurotrauma version/status evidence mismatch and add a consistent status taxonomy.
2. Build dedicated, evidence-safe neurotrauma and expanded Belmont presentations using semantic HTML/CSS diagrams and explicit text equivalents.
3. Add the compact homepage motorsport sequence without changing the preserved hero, thesis, or project order.
4. Add a lightweight `/playground` index and `/playground/vector-tennis` vertical slice with desktop keyboard/pointer input, mobile controls, learning mode, bounded physics, and lifecycle-safe canvas rendering.
5. Improve mobile-menu behavior and align the legacy secondary-page accent with the existing indigo/ivory palette.
6. Update `CONTENT_AUDIT.md`, automated tests, metadata, sitemap, and validation records.
7. Run lint, typecheck, tests, production build, responsive/browser checks, screenshots, performance/accessibility checks, and four adversarial reviews; fix material findings before handoff.
