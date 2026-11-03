# Website design audit — November 3, 2026

Audited the eleven visible items in the supplied screenshot against the production repository, starting from main commit `8583e6cc`. Work is isolated in `fix/portfolio-design-audit` under `website/design-audit-20261103` so other ongoing work is preserved.

| Screenshot pattern | Finding and resolution |
| --- | --- |
| Purple-to-blue gradients everywhere | Removed decorative page, preview-frame, card and tennis gradients in portfolio CSS. Replaced gradient figure frames with solid surfaces. |
| Gradient hero text | Hero titles were already solid. Removed the gradient numeric result text in the quantum active inference case study. |
| Emojis in headings | No emoji headings found in portfolio JSX. Navigation arrows, scientific symbols and functional control icons are retained. |
| Inter for everything | Portfolio already uses Arial and Georgia. Removed Inter declarations from Anatomy Learner, Pit Stop Lab and quantum lab controls. REPLISOME retains its existing DM Sans/Space Grotesk typography. |
| Cards with colorful borders | Removed colored hover borders and movement on portfolio cards and quantum case-study cards. Unified quantum figure frames. Scientific series, selected controls, warnings and evidence-state colors remain meaningful. |
| Glassmorphism on every component | Made shared navigation, case-study subnavigation and embedded control panels opaque; removed their backdrop blur. Updated Anatomy Learner, SeizeFreeze, quantum lab, Pit Stop Lab, Carotid Flow Visualizer, Rally House and REPLISOME. |
| Low-contrast dark mode | Made panel backgrounds independent of the scene underneath, brightened Anatomy Learner secondary text and quantum figure labels, and added a contrasting outer backing to portfolio focus indicators. Checked representative text/panel pairs numerically; this is not a full rendered accessibility certification. |
| Three icon boxes in a row | No generic three-icon feature strip found in the portfolio. Scientific sequences, project facts and interactive controls retain their structure. |
| Random badges above headlines | Removed redundant Playground tags, homepage status dot/index and quantum publication badge row. Moved project-card status into its definition list; placed meaningful motorsport status information after the introduction. |
| Lucide icons everywhere | No Lucide dependency in the portfolio application. REPLISOME uses Lucide for working controls; those controls and their accessibility labels are retained. |
| Default shadcn styling | No shadcn components or dependency in the portfolio. Existing bespoke components retained. |

## Scope and compatibility

Changes reach portfolio page styles, homepage markup, shared ProjectCard metadata, Playground, motorsport and quantum case studies, and the existing static lab styles. Rally House source and served styles stay byte-identical. REPLISOME was rebuilt through `tools/replisome/sync-build.mjs`; its bundle names and build manifest were regenerated together.

Photography, scientific data, medical/evidence qualifications, contact validation, routing, interactive behavior and dependencies are unchanged. Image/video contrast scrims, scientific shape shading, progress rings and modal dimmers are functional visual treatments and are retained. Atlas and hospital modal backdrops are not glass control panels and were not redesigned.

## Verification

- Portfolio TypeScript check passed.
- Portfolio: 255 tests passed across 31 files.
- REPLISOME: 33 tests passed across four files; production bundle rebuilt successfully.
- `eslint src` passes. Full-repository lint reports 32 existing errors in unchanged hospitalSIM Three.js vendor files; vendor code was not changed.
- Portfolio production build passed; 35 static pages generated.
- All changed stylesheets parsed with PostCSS; no gradient text declarations remain in those stylesheets.
- Representative foreground/background ratios: Anatomy Learner 9.68:1; QAI figure labels 9.53:1; QAI numeric result 16.23:1; REPLISOME 7.32:1; Pit Stop 6.85:1; SeizeFreeze 9.47:1.
- `git diff --check` passes. Rally House source/served CSS parity checked.
- Browser access is disabled in Work settings. Desktop/mobile screenshots, rendered contrast, visual layout and physical-device interactions were not verified in this run.
