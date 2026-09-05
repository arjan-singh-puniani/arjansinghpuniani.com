# SEO Implementation Report

## 1. Executive summary

This pass improves search-engine comprehension and authority without redesigning the site.

The implementation focuses on:

- explicit canonicals;
- truthful sitemap signals;
- route-specific social metadata;
- peer-reviewed publication authority;
- structured data for publications/projects;
- contextual internal links;
- preventing low-value standalone pages from competing with richer canonical pages.

It deliberately does not add keyword landing pages, a blog framework, an SEO dependency, or a replacement analytics stack.

## 2. Baseline problems

See `SEO_BASELINE.md`.

Highest-impact findings:

- peer-reviewed authority was not fully exposed;
- companion active-inference paper II was absent;
- paper II has a corrigendum that should be visible;
- many pages inherited homepage social metadata;
- sitemap `lastModified` was regenerated as "now" on every build;
- the root canonical created an inheritance hazard;
- the standalone quantum laboratory lacked canonical/noindex signals;
- privacy was a low-value sitemap/search landing page;
- contextual About → Research and Research → project links were weak;
- analytics remains unverified in the Cloudflare production environment.

## 3. Files changed

### Application/source

- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/sitemap.ts`
- `src/app/about/page.tsx`
- `src/app/contact/page.tsx`
- `src/app/cv/page.tsx`
- `src/app/notes/page.tsx`
- `src/app/playground/page.tsx`
- `src/app/playground/vector-tennis/page.tsx`
- `src/app/privacy/page.tsx`
- `src/app/research/page.tsx`
- `src/app/work/page.tsx`
- `src/app/work/[slug]/page.tsx`
- `src/app/work/belmont-motorsport-systems/layout.tsx` (new)
- `src/app/work/motorsport-neurotrauma-toolkit/layout.tsx` (new)
- `src/app/work/vector-ekg-reasonos/layout.tsx` (new)
- `src/content/publications.ts`
- `src/types/content.ts`
- `public/quantum-computer-lab/index.html`

### Documentation

- `SEO_BASELINE.md`
- `SEO_KEYWORD_MAP.md`
- `SEO_AUTHORITY_OPPORTUNITIES.md`
- `SEO_IMPLEMENTATION_REPORT.md`
- `SEARCH_CONSOLE_CHECKLIST.md`

## 4. Technical SEO fixes

### Canonical scope

Removed the root-layout `canonical: "/"`.

Added an explicit canonical `/` to the homepage.

Result: canonical ownership is page-specific rather than globally inherited.

### Sitemap

Removed `lastModified: new Date()` and removed `priority` / `changeFrequency`.

Google ignores sitemap priority/changefreq and only uses `lastmod` when it reliably reflects a significant content update. The site does not currently maintain authoritative modification dates, so omission is more truthful.

Removed `/privacy` from the sitemap.

### Standalone quantum lab

Added:

- `noindex,follow`
- canonical to `/work/rigetti-quantum-operations`

This preserves the interactive lab for users while concentrating search identity on the richer case study.

### Privacy

Added page-level:

`robots: { index: false, follow: true }`

The page remains accessible from the footer.

## 5. Metadata changes

Added or strengthened unique Open Graph and Twitter metadata for:

- homepage;
- About;
- Research;
- Work;
- CV;
- Notes;
- Contact;
- Playground;
- Vector Tennis;
- dynamic project routes;
- Belmont motorsport systems;
- Motorsport neurotrauma toolkit;
- Vector EKG Twitter metadata.

Dynamic project pages use a real first project image when available, otherwise the existing `/og.png`.

No new synthetic social images were created.

## 6. Structured-data changes

Preserved:

- root `Person`;
- root `WebSite`;
- About `ProfilePage`;
- Vector EKG `SoftwareApplication`.

Added:

- Research `ScholarlyArticle` ItemList;
- generic project `CreativeWork`;
- generic project `BreadcrumbList`;
- explicit Belmont `CreativeWork` + `BreadcrumbList`;
- explicit motorsport neurotrauma `CreativeWork` + `BreadcrumbList`;
- Vector EKG BreadcrumbList;
- Vector Tennis `SoftwareApplication`.

Stable Person ID remains:

`https://arjansinghpuniani.com/#arjan-singh-puniani`

No Physician, MedicalDevice, Review, Rating, or FAQ schema was added.

## 7. Content changes

### Research authority

Added verified peer-reviewed companion paper:

**Conscious active inference II: Quantum orchestrated objective reduction among intraneuronal microtubules naturally accounts for discrete perceptual cycles**

Verified public identifiers:

- DOI `10.1016/j.csbj.2025.09.016`
- PubMed `41019231`
- PMCID `PMC12475526`

Added direct DOI/PubMed/PMC links for paper I and paper II.

Added a visible link to the 2025 corrigendum for paper II:

- DOI `10.1016/j.csbj.2025.10.016`

The corrigendum corrects equations on page 102. The page does not hide this correction.

Replaced the stale "publisher record still required" notice with a precise status boundary: peer-reviewed records use public identifiers; the BCI manuscript remains a preprint until a public publication record supports a different status.

No claims of experimental proof were added.

## 8. Internal-link changes

Added restrained contextual links:

- About → Research;
- active-inference publication → active-inference project;
- BCI preprint → BCI calibration project;
- Notes active-inference entry → Research and project context.

Generic project related-work behavior remains intact.

## 9. Performance changes

No visual or animation system was removed.

No heavyweight dependency was added.

No client component was added for SEO.

No large asset was replaced without measurement.

This pass should therefore have negligible JavaScript/runtime cost. The added JSON-LD is small server-rendered text.

## 10. Analytics changes

No analytics code was changed.

Reason: the current source loads the Vercel Insights endpoint while the production dashboard shown by the owner is Cloudflare. Without confirming the hosting/injection behavior, replacing analytics would be speculative.

Owner action:

- verify whether `/_vercel/insights/script.js` returns successfully in production;
- enable Cloudflare Web Analytics in the Cloudflare Pages/zone dashboard if it is not already enabled;
- compare Search Console clicks with Cloudflare landing-page sessions.

Cloudflare Web Analytics is privacy-first and can collect real-user Core Web Vitals.

## 11. Search Console actions required

See `SEARCH_CONSOLE_CHECKLIST.md`.

Highest priority:

1. submit `/sitemap.xml`;
2. inspect `/`, `/about`, `/research`, `/work`;
3. inspect active-inference, BCI, SeizeFreeze, ReasonOS, motorsport, and Rigetti pages;
4. confirm Google-selected canonicals;
5. request indexing once after deployment;
6. establish 28-day baseline.

## 12. Backlink/profile opportunities

See `SEO_AUTHORITY_OPPORTUNITIES.md`.

Highest-quality opportunities:

- GitHub profile → canonical website;
- Physics World contributor profile → personal site if editors permit;
- verified ORCID/Google Scholar profile if controlled by the owner;
- legitimate university/lab/award profile pages.

No paid/link-scheme tactics are recommended.

## 13. Validation results

Completed in the packaging environment:

- inspected current `main` tree at commit `8a726704e688a678a2ddf6b0f1889b86c85fcb37`;
- production homepage rendered meaningful HTML;
- production About, Research, Work, Vector Tennis, and motorsport-neurotrauma pages were spot-checked where the web fetcher returned them;
- authoritative PubMed/PMC/Physics World records were verified;
- all packaged TypeScript/TSX files were passed through TypeScript transpilation for syntax diagnostics with no syntax errors.

Not possible in the packaging environment:

- full `npm run typecheck`;
- full `npm run build`;
- changed-file ESLint using the project’s installed dependency tree;
- local browser screenshots at every requested width.

These must be run in the owner’s existing local clone, which already has the project dependencies and has successfully built the current site.

Required local validation commands are included in the package instructions.

## 14. Known limitations

- Search Console was not connected, so no claims are made about exact impressions, index counts, CTR, or Google-selected canonical state.
- The audit fetcher returned stale cached versions of some live pages and cache misses for others.
- `www` redirect behavior exists in Next configuration but should still be verified at the edge/Cloudflare layer.
- Analytics remains an owner-side verification task.
- No new evergreen article was created because the current Notes entries do not yet justify standalone indexable pages.
- No image/video replacement was performed without Core Web Vitals evidence.

## 15. 30 / 60 / 90-day measurement plan

### 30 days

Measure:

- branded impressions/clicks;
- indexing of priority routes;
- Google-selected canonicals;
- Research page impressions;
- active-inference and BCI long-tail impressions;
- Cloudflare real-user Web Vitals after analytics is enabled.

### 60 days

Compare two 28-day periods:

- organic landing pages;
- non-branded impressions;
- CTR by page;
- top queries per project;
- project → Contact / research-outbound engagement.

Revise titles only where query evidence supports it.

### 90 days

Decide whether the site has enough demonstrated query demand to justify one substantial new evergreen Note.

Prefer one authoritative, source-backed article over many thin pages.

## Expected impact

### High confidence

- cleaner canonical architecture;
- more truthful sitemap;
- better research/entity corroboration;
- correct publication discovery paths;
- more accurate social previews;
- lower duplicate-index risk for the standalone quantum lab;
- stronger internal topical graph.

### Moderate confidence

- improved branded search consolidation;
- more long-tail impressions for research/project queries;
- improved crawler understanding of project relationships.

### Experimental / dependent on external systems

- ranking changes;
- click-through-rate changes;
- backlink acquisition;
- analytics coverage;
- crawl/re-index speed.

No ranking guarantee is made.
