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

## Known limitations

- Curated portrait and project imagery are integrated. Confirm institutional and participant permissions before public deployment.
- The 2025 publication metadata is verified from the supplied publisher PDF. The BCI manuscript remains labeled as a manuscript/preprint.
- Contact delivery needs environment variables.
- Automated browser testing is limited to component-level interaction tests; no Playwright dependency is included.
