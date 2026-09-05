# Google Search Console Checklist

Search Console was not connected during this implementation. Use this checklist after the SEO deployment is live.

## 1. Confirm the correct property

Prefer a **Domain property** for:

`arjansinghpuniani.com`

This covers HTTPS/HTTP and subdomains. Keep the canonical website itself on:

`https://arjansinghpuniani.com/`

## 2. Submit the sitemap

In Search Console:

1. Open **Sitemaps**.
2. Submit:
   `https://arjansinghpuniani.com/sitemap.xml`
3. Confirm it is fetched successfully.
4. Remove any obsolete sitemap entries if an older path was submitted.

Do not use the deprecated sitemap ping endpoint.

## 3. URL Inspection priority list

Inspect these after deployment, in this order:

1. `https://arjansinghpuniani.com/`
2. `https://arjansinghpuniani.com/about`
3. `https://arjansinghpuniani.com/research`
4. `https://arjansinghpuniani.com/work`
5. `https://arjansinghpuniani.com/work/quantum-active-inference`
6. `https://arjansinghpuniani.com/work/bci-calibration`
7. `https://arjansinghpuniani.com/work/seizefreeze`
8. `https://arjansinghpuniani.com/work/vector-ekg-reasonos`
9. `https://arjansinghpuniani.com/work/motorsport-neurotrauma-toolkit`
10. `https://arjansinghpuniani.com/work/rigetti-quantum-operations`

For each:

- Confirm "URL is available to Google".
- Confirm Google-selected canonical matches the declared canonical.
- View crawled page if available.
- Confirm the rendered content resembles the current deployment.
- Request indexing for the highest-priority changed pages.

Do not repeatedly request indexing every day.

## 4. Page indexing report

Review:

- Indexed
- Crawled — currently not indexed
- Discovered — currently not indexed
- Duplicate without user-selected canonical
- Alternate page with proper canonical
- Soft 404
- Blocked by robots.txt
- Excluded by `noindex`

Expected intentional exclusions after this overhaul:

- `/privacy`
- `/quantum-computer-lab/index.html`

The richer canonical Rigetti case study should remain indexable.

## 5. Search performance baseline

Record the prior 28 days before judging impact:

- total clicks;
- total impressions;
- average CTR;
- average position.

Export query and page tables.

Create separate filters for:

### Branded
- arjan singh puniani
- arjan puniani

### Research
- active inference
- quantum active inference
- brain computer interface
- BCI calibration

### Motorsport
- motorsport neurotrauma
- trackside neurotrauma
- motorsport emergency

### Project/product names
- seizefreeze
- reasonos
- vector ekg
- vector tennis

## 6. 30-day review

Check:

- whether `/`, `/about`, and `/research` gain branded impressions;
- whether the new publication records are crawled;
- whether project pages begin receiving long-tail impressions;
- whether Google-selected canonicals are correct;
- whether stale About/Work snapshots have been replaced.

Do not rewrite pages based on a few days of data.

## 7. 60-day review

Compare the current 28 days with the previous 28 days:

- impressions by landing page;
- non-branded query growth;
- CTR on pages with improved titles;
- project pages with impressions but low CTR;
- pages with strong average position but low clicks.

Change titles/descriptions only where query data gives a clear reason.

## 8. 90-day review

Evaluate:

- branded ownership;
- research-page visibility;
- BCI / active-inference long-tail visibility;
- project-page search entrances;
- engaged visits and contact/project actions.

Decide whether one evidence-rich Note/article is justified by actual query demand.

## 9. Core Web Vitals

Open **Experience → Core Web Vitals**.

If sufficient field data exists, record:

- LCP;
- INP;
- CLS;
- affected URL groups.

Do not sacrifice core portfolio interactions based on a synthetic score alone. Fix measured bottlenecks.

## 10. Rich results / structured data

Use Google’s Rich Results Test and Schema.org validator on:

- `/about`
- `/research`
- `/work/vector-ekg-reasonos`
- `/work/bci-calibration`
- `/work/motorsport-neurotrauma-toolkit`

Not every valid Schema.org type produces a Google rich result. The goal is coherent machine-readable identity, not decorative warnings-free markup at any cost.

## 11. Canonical-host checks

Verify:

- `http://arjansinghpuniani.com/` → HTTPS apex
- `http://www.arjansinghpuniani.com/` → HTTPS apex
- `https://www.arjansinghpuniani.com/` → HTTPS apex

Avoid redirect chains.

## 12. Analytics cross-check

Search Console measures Google Search exposure, not all traffic. Compare it with Cloudflare Web Analytics after Cloudflare measurement is enabled/verified.

If Search Console shows clicks but the website analytics shows almost no landings, investigate the analytics setup rather than assuming search traffic vanished.
