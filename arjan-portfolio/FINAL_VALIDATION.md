# Final validation

Validation date: 2026-08-30

## 1. Executive summary

The portfolio now makes its systems reasoning more legible without replacing the identity or hierarchy that already worked.

- Corrected the motorsport-neurotrauma evidence boundary from unsupported Version 0.3 wording to the directly audited Version 0.2 pilot record.
- Rebuilt the neurotrauma presentation around mechanism → protection context → neurologic observations → escalation/disposition → structured handoff, with critique clearly separated from validation, endorsement, adoption, and deployment.
- Expanded Belmont from four summary modules into an academic systems case study that exposes risk domains, escalation, decision ownership, medical handoff, closed-loop communication, recovery gates, documentation, and legal/organizational constraints.
- Added one compact hazard → decision → response → recovery → record sequence to the existing homepage motorsport section.
- Added a quiet `/playground` surface and an original `/playground/vector-tennis` Racket Lab vertical slice.
- Centralized project statuses and corrected the work-index order so ReasonOS, SeizeFreeze, and BCI calibration remain the first three systems.
- Corrected a mobile CSS defect that kept the mounted navigation menu visually hidden; the menu now manages focus and Escape correctly.
- Unified secondary-page accents with the existing restrained indigo/ivory homepage system.

## 2. Preserved strengths

The following were deliberately left unchanged:

- “Neural engineer pursuing medicine.”
- “Engineering for decisions that affect human lives.”
- “Engineering is most consequential when the system is human.”
- “Medicine. Engineering. At speed.”
- Homepage project hierarchy: `00 — Vector EKG + ReasonOS`, `01 — SeizeFreeze`, `02 — Gamified BCI calibration`.
- The production hero portrait and editorial layout; no orbital canvas was added because the existing hero is clearer, lighter, and more credible.
- ReasonOS’s inspectable source/state/transformation/constraint/trace model, executable synthetic laboratory, and no-clinical-use boundary.
- Existing `/work/belmont-motorsport-systems` and `/work/motorsport-neurotrauma-toolkit` routes.
- App Router, TypeScript, typed content, analytics, `next/image`, contact flow, About, CV, Research, and Notes architecture.

## 3. Files modified

- `CONTENT_AUDIT.md`
- `FINAL_VALIDATION.md`
- `SITE_AUDIT.md`
- `next.config.ts`
- `package.json`
- `package-lock.json`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/sitemap.ts`
- `src/app/work/[slug]/page.tsx`
- `src/app/work/belmont-motorsport-systems/page.tsx`
- `src/components/Footer.tsx`
- `src/components/MobileNav.tsx`
- `src/components/ProjectCard.tsx`
- `src/components/ProjectFilter.tsx`
- `src/content/projects.ts`
- `src/types/content.ts`
- `tests/content.test.ts`

## 4. Files added

- `src/app/playground/page.tsx`
- `src/app/playground/vector-tennis/page.tsx`
- `src/app/systems.css`
- `src/app/work/motorsport-neurotrauma-toolkit/page.tsx`
- `src/components/VectorTennisLab.tsx`
- `src/content/statuses.ts`
- `src/lib/vector-tennis.ts`
- `tests/vector-tennis.test.ts`
- `Documentation/Validation/Portfolio/2026-08-30/README.md`
- 26 production-build screenshots in `Documentation/Validation/Portfolio/2026-08-30/`.

## 5. Files removed

None. No tracked project file was deleted.

Four iCloud-generated duplicate files under the generated `.next/types` directory were moved to `/private/tmp/arjan-portfolio-next-duplicates-2026-08-30` during validation; they were build artifacts, not source files, and are recoverable from that temporary location.

## 6. Claim audit

The full claim-by-claim table is in `CONTENT_AUDIT.md`. New public claim groups are summarized here.

| Public wording group | Source | Limitation | Evidence status |
|---|---|---|---|
| Belmont connects risk ranking to mitigation, decision ownership, communication, medical coordination, recovery, and recordkeeping. | Belmont Assignments 3, 4, and 6 | Academic course work; not commissioned, reviewed, approved, or operational. | A — directly verified |
| Belmont grouped six public operational domains within a documented 16-item analysis. | Assignment 3 and Assignment 6 | No current thresholds, actuarial prediction, or venue finding is asserted. | A — directly verified |
| Minor, Serious, and Major are course-use escalation classes. | Assignment 6 §3 | Not attributed to Sonoma Raceway, NASCAR, or a public agency. | A — directly verified |
| The neurotrauma toolkit is an exploratory Version 0.2 documentation/escalation framework. | Version 0.2 pilot card and disposition algorithm | Not clinical decision support, a protocol, or a sanctioning-body standard. | A — directly verified |
| External critique was requested and received. | March 2026 correspondence | Not validation, endorsement, adoption, deployment, or consensus. | A — directly verified |
| Vector Tennis is a physics-inspired arcade model where racket state changes modeled ball state. | Implementation and automated physics tests | Mechanically coherent inside the model; not validated against physical measurement data. | A for implementation; B for qualitative characterization |

## 7. Visual changes

- Belmont visuals answer concrete questions: what risk domain is involved, what changes the incident state, who owns the decision, where medical handoff occurs, how communication closes, and what blocks recovery.
- Neurotrauma visuals show what information moves through the handoff and where observational, clinical, and competition authority remain separate.
- The homepage motorsport strip shows the shared causal structure without adding racing imagery or changing the section’s copy hierarchy.
- Playground uses the same indexed, technical editorial language as the professional work but moves into a darker state-space surface with restrained gold contact feedback.
- The global secondary-page accent now matches the existing indigo/ivory homepage and ReasonOS family; gold remains limited to causal/contact emphasis.

## 8. Interaction changes

- No orbital behavior was implemented. The current hero won on clarity, load cost, mobile usability, and relevance.
- Belmont and neurotrauma diagrams are semantic HTML/CSS with accessible names and visible text equivalents; no decorative canvas was added.
- Vector Tennis supports pointer, keyboard, and visible touch controls. Arrows/WASD move the racket, Q/E changes face angle, Space swings, R resets, and L toggles learning mode.
- Flat, topspin, and slice modes change the compact contact model. Face angle changes launch, head speed changes outgoing speed, contact offset changes stability, spin changes flight/bounce, and learning mode exposes trajectory and vectors.
- Three production-browser runs—desktop, tablet, and mobile—produced verified sweet-spot topspin contact. Reset returned each simulation to a new incoming feed.

## 9. Validation results

- `npm install`: completed. `jsdom` was pinned to 26.1.0 so the tests run on the workspace’s Node 20.8.1 runtime. npm reported engine warnings for newer lint/Vite packages; installed commands still passed.
- `npm run lint`: passed with no findings.
- `npm run typecheck`: passed with no TypeScript errors.
- `npm run test`: passed — 4 files, 17 tests.
- `npm run build`: passed — 26 static/dynamic pages generated.

The final build reported:

- Homepage route module: 177 B; 111 kB first-load JS.
- Vector Tennis route module: 4.49 kB; 110 kB first-load JS.
- ReasonOS route module: 4.53 kB; 110 kB first-load JS.
- Shared first-load JS: 102 kB.

## 10. Screenshots

Production screenshots were captured at 1440 × 900, 768 × 1024, and 390 × 844. The set covers the homepage, ReasonOS, Belmont, neurotrauma, work index, Playground, Vector Tennis hero/contact, About, CV, and mobile navigation.

See `Documentation/Validation/Portfolio/2026-08-30/README.md` for the complete 26-image index.

## 11. Performance check

- No new production dependency was added.
- Vector Tennis keeps high-frequency physics state in refs and an imperative canvas loop; React updates are throttled to low-frequency readouts/status changes.
- Physics advances at a bounded 120 Hz fixed step with elapsed-time and accumulator caps.
- The trajectory overlay uses a reusable `Float32Array`; the main physics step mutates its retained state rather than allocating per substep.
- The canvas caps device pixel ratio at 2, pauses when hidden or offscreen, observes resize, cleans up its animation frame/observers, and avoids duplicate loops after navigation.
- Production browser checks found zero horizontal overflow and zero broken images at all three target sizes.
- No credible cross-device input-latency number was available from the local browser surface, so none is claimed.

## 12. Accessibility check

- Semantic headings, ordered system sequences, table roles, visible captions, and textual diagram equivalents are present.
- Mobile navigation was verified open/visible with focus on the first link; Escape closes it and returns focus to the trigger.
- Vector Tennis exposes keyboard and touch controls, an accessible live status, model readouts, non-color contact text, and visible focus.
- The canvas is hidden from assistive technology while the surrounding controls, instructions, and live summary expose the meaningful interaction.
- `touch-action: pan-y` was verified at 390 × 844, preserving vertical page scrolling.
- Focus treatment, contrast, touch targets, reduced-motion CSS, and the simulation’s reduced-motion contact branch were inspected. The browser did not expose reduced-motion emulation, so that preference branch was source-verified rather than visually emulated.

## 13. Adversarial review

- Medical-school admissions reader: prototype, academic, exploratory, published, and validated states remain visibly separated; the unsupported toolkit version claim was removed.
- Motorsport-medicine professional: no field authority, venue approval, sanctioning-body approval, operational threshold, clinical protocol, credential, or adoption is implied.
- Senior engineer: the interaction is dependency-free, lifecycle-safe, bounded, tested against invalid/finite/bounce/contact states, and avoids React per-frame state and hot-loop trajectory allocation.
- Product designer: every added diagram answers a specific operational question; the Playground appears after the professional narrative and adds interaction craft without replacing the portfolio’s core identity.

No material red-team finding remains open.

## 14. Remaining limitations

- Vector Tennis is not physically validated and has not been profiled on a representative matrix of mobile Safari hardware; the page says so.
- Reduced-motion behavior was source-verified but not browser-emulated in this environment.
- npm/Next reported environment warnings because Node 20.8.1 is below the preferred engine range of some development packages and Next attempted to normalize optional SWC lockfile entries. The installed compiler, lint, tests, typecheck, and production build all completed.
- The implementation was not deployed or published. The repository has no `.openai/hosting.json`, and no external deployment change was authorized.

## 15. Git diff summary

- 18 tracked files modified after this report is included.
- 35 untracked files added within `arjan-portfolio`: 8 source/test files, 26 screenshots, and 1 screenshot index.
- Before adding this report, the tracked diff contained 416 insertions and 250 deletions across 17 files; most deletions are the lockfile’s Node-compatible jsdom dependency adjustment.
- No tracked file removed.
- Unrelated repository-root `.DS_Store` and `arjan-portfolio-backup/` items were not touched.

## 16. Optional next iteration

The only worthwhile next step is device-lab testing on current iPhone Safari and a 60 Hz mid-range laptop to measure input-to-contact latency and thermal behavior. That evidence could guide physics-step or DPR adjustments without changing the current product scope.
