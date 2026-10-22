# Arjan Singh Puniani portfolio

Production-ready Next.js portfolio for `arjansinghpuniani.com`. Content is structured, evidence-audited, responsive, accessible, and deployable to Vercel.

## Prerequisites

Node.js 20 or later and npm 10 or later.

## Install and run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validation

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Edit content

- Biography and headline: `src/content/profile.ts`
- Projects: `src/content/projects.ts`
- Publications: `src/content/publications.ts`
- Experience: `src/content/experience.ts`
- Education: `src/content/education.ts`
- Links and résumé path: `src/content/links.ts`

Add a project by appending a typed object to `projects`. Its route is generated from `slug`.

## Images

Place approved assets in `public/images/`. Use descriptive filenames and meaningful alternative text. No fabricated clinical, laboratory, award, or affiliation imagery belongs on this site.

## Résumé

Replace `public/documents/arjan-singh-puniani-resume.pdf`, then update `src/content/links.ts` if the filename changes.

## Contact delivery

Copy `.env.example` to `.env.local`. Set a Resend API key, verified sender, and destination email. Without those values, the form returns a clear fallback message and the direct email link remains available.

## Analytics

No analytics load by default. Add a privacy-conscious provider only after consent and privacy review. The `NEXT_PUBLIC_ANALYTICS_ID` variable is reserved but unused.

## Deploy to Vercel

1. Push this folder to GitHub.
2. Import the repository in Vercel.
3. Add the optional contact environment variables.
4. Deploy.
5. In Vercel Domains, add `arjansinghpuniani.com` and `www.arjansinghpuniani.com`.
6. Follow Vercel’s DNS instructions. The code permanently redirects `www` to the apex domain.

Preview deployments do not change canonical URLs. Canonicals always point to the production domain.


## Search visibility / Google Search Console

The site already exposes crawlable HTML, canonical URLs, `robots.txt`, `sitemap.xml`, Person/WebSite/ProfilePage structured data, and Google verification metadata. Ranking for a new personal domain still depends on discovery, indexing, and external authority.

After deployment:

1. Add `arjansinghpuniani.com` as a **Domain property** in Google Search Console and verify it by DNS.
2. If you use the HTML-tag verification method instead, set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` in Vercel to the token value only, then redeploy.
3. Submit `https://arjansinghpuniani.com/sitemap.xml` in Search Console → Sitemaps.
4. Use URL Inspection on the homepage and `/about`, test the live URL, then request indexing.
5. Confirm `site:arjansinghpuniani.com` begins returning the homepage and key pages. Indexing can take days or weeks and submission does not guarantee ranking.
6. Where appropriate, link this official domain from authoritative profiles and publications that already identify Arjan Singh Puniani. Do not create spammy or purchased backlinks.

The homepage intentionally uses the exact full name in the primary heading and the site uses consistent `Arjan Singh Puniani` / `Arjan Puniani` entity markup. Do not add keyword-stuffed hidden text or duplicate doorway pages for name variants.

## Known limitations

- Curated portrait and project imagery are integrated. Confirm institutional and participant permissions before public deployment.
- The 2025 publication metadata is verified from the supplied publisher PDF. The BCI manuscript remains labeled as a manuscript/preprint.
- Contact delivery needs environment variables.
- Automated browser testing is limited to component-level interaction tests; no Playwright dependency is included.

## BODY//ATLAS portfolio integration

`/work/body-atlas` uses the shared project case-study route and appears in the Work filters and generated sitemap. The homepage features an optimized screenshot linked to that case study. It imports no atlas code, 3D assets, database, or new dependencies. The interactive atlas remains separately hosted/developed; no localhost or unverified deployment URL is exposed to visitors.

The screenshot is an actual October 19, 2026 local capture, converted to WebP. Its HRA geometry attribution and CC BY 4.0 adaptations are recorded in the project caption and source links. `/documents/body-atlas-validation.json` records the authentic snapshot scope and historical local checks; provisional anatomical context is not presented as validated placement.

Verify the portfolio with `npm run typecheck`, `npm test`, `npm run build`, then run `node tests/body-atlas.browser.mjs http://127.0.0.1:3210` against a local production server. No production hosting, DNS, atlas ingestion, or existing interactive projects need to change for this integration.

Integration verification: 95 portfolio tests, TypeScript and the production build passed. Desktop and mobile-emulated Chrome checks passed the homepage-to-case-study flow, Work filtering, canonical metadata, public scope record and sitemap; 12 existing routes returned HTTP 200. The case study had zero reported automated WCAG A/AA violations in those two inspected states, no page errors or horizontal overflow, and no atlas geometry requests. Physical-device and universal external-source availability checks remain outside this integration.
