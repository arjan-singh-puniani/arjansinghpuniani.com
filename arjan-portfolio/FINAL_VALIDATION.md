# Final validation

Validation date: 2026-08-28

## Automated checks

- `npm run lint`: passed with no lint findings.
- `npm run typecheck`: passed with no TypeScript errors.
- `npm run build`: passed; 23 static/dynamic routes generated, including `/motorsport` and both custom motorsport case studies.
- `npm install`: registry access and dependency reification were attempted with Node 24. The iCloud-backed folder repeatedly failed to finalize npm's temporary package renames and then remained open after materializing the dependency tree. The incomplete generated tree was moved to a recoverable temporary location; the previously working locked dependency tree was restored. A final `npm install --package-lock-only --ignore-scripts --no-audit --no-fund` completed successfully and reported `up to date`.

## Evidence verification

- Audited the 13-page Belmont Abbey College MM 685 Assignment 6 paper line by line.
- Audited MM 685 Assignments 3 and 4 for the public operational-risk synthesis.
- Audited the Version 0.2 Mechanism-to-Medical Center pilot draft and separate disposition algorithm.
- Audited March 2026 ICMS-facilitated outreach and two physician feedback records.
- Audited ICMS membership/shadowing correspondence, newsletter context, and waiver records; the latter two were not used to claim attendance, credentials, or field experience.

## Browser QA

Verified in the Codex in-app browser:

- 1440 × 900: homepage and Sonoma case study; no horizontal overflow.
- 768 × 1024: motorsport hub; no horizontal overflow; mobile navigation active.
- 390 × 844: homepage and Sonoma case study; no horizontal overflow after constraining the risk-matrix scroller.
- 390 × 844: neurotrauma toolkit; no horizontal overflow; exploratory status and review boundary rendered correctly.
- Homepage orbital canvas preserves `touch-action: pan-y` for vertical mobile scrolling.
- Mobile menu click behavior updates `aria-expanded`; the control is a native button with a visible-text and screen-reader label. Focus-visible styling and reduced-motion handling were inspected in source. The in-app browser's synthetic Tab/Enter path did not move focus, so keyboard activation remains a manual-browser check rather than a claimed visual verification.
- Page titles, primary headings, evidence labels, disclaimer placement, and image alternative text checked in rendered output.
- The revised Sonoma page rendered all five planning zones, all three proposed incident levels, ten recovery-gate categories, the academic disclaimer, and the primary-source note.
- No browser console warnings or errors were present in the final case-study view.
- Reduced-motion behavior is implemented in both CSS and the orbital canvas. The browser surface did not expose preference emulation, so the reduced-motion branch was inspected in source rather than visually emulated.

## Captured screenshots

- `screenshots/home-desktop-1440x900.png`
- `screenshots/home-mobile-390x844.png`
- `screenshots/motorsport-tablet-768x1024.png`
- `screenshots/sonoma-desktop-1440x900.png`
- `screenshots/sonoma-mobile-390x844.png`
- `screenshots/toolkit-mobile-390x844.png`

## Environment warnings

Next.js built successfully with its WebAssembly compiler fallback because the native SWC package is absent. During the build it also attempted, but could not reach the registry to patch the lockfile with the optional native package. Next.js detected an unrelated `/Users/arjan/package-lock.json` above the project and warned about inferred workspace root. None of these warnings prevented compilation, linting, type checking, prerendering, or route generation.

## GitHub baseline diff

The local project has no `.git` directory. To produce a real comparison, the GitHub repository was cloned read-only to a temporary directory and the current project was overlaid there, excluding generated `.next`, `node_modules`, and `tsconfig.tsbuildinfo` content.

- 28 files changed
- 581 text insertions
- 120 text deletions
- 7 binary files added: one OpenGraph image and six QA screenshots
- 1 unreferenced 4.3 MB legacy hero image absent from the current project
