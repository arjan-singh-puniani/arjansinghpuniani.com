# Search and AI discovery owner checklist

## What the code patch can and cannot do

The origin `robots.ts` already allows general crawling. This patch adds explicit Allow groups for Googlebot, Google-Extended, Bingbot, and OAI-SearchBot so the intended policy is unambiguous. This is not a ranking trick and does not override a CDN/WAF block.

The live homepage is publicly fetchable and contains server-rendered textual content. One generative-AI answer saying it could not access the site does not prove the domain is technically blocked. Crawlability, indexing, ranking, and retrieval are separate stages.

Google states that AI Overviews and AI Mode use the normal Google Search index and Googlebot controls Search crawling. There is no special AI-search schema or file required. `Google-Extended` is separate from normal Google Search.

OpenAI states that sites should allow `OAI-SearchBot` and ensure the host/CDN permits OpenAI searchbot traffic. `GPTBot` is a separate training control.

`llms.txt` in this patch is experimental and supplementary only. Neither Google Search nor OpenAI documents it as a requirement for inclusion.

## Cloudflare — highest priority

1. Open Cloudflare Dashboard → your domain → **AI Crawl Control**.
2. In **Crawlers**, make sure crawlers you want for discovery are not set to Block. For ChatGPT Search, prioritize **OAI-SearchBot**.
3. Open **Directives** and inspect the effective `robots.txt` served at the edge. Cloudflare can prepend managed directives before your origin file.
4. If managed `robots.txt` is adding `Disallow: /` for a crawler you want to permit, change that Cloudflare policy. Repository code cannot reliably override an edge policy.
5. Open Security/Bots settings. If **Block AI Bots** is enabled, disable it if broad AI crawler access is your goal.
6. Review WAF/custom rules for managed challenges or blocks affecting verified/search crawlers. A robots `Allow` cannot override an HTTP 403/challenge.
7. In AI Crawl Control → Directives, watch for unsuccessful robots requests and crawler violations.

Official Cloudflare references:
- https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/
- https://developers.cloudflare.com/ai-crawl-control/features/track-robots-txt/
- https://developers.cloudflare.com/bots/additional-configurations/custom-rules/

## Google Search Console

1. Submit `https://arjansinghpuniani.com/sitemap.xml`.
2. URL Inspection → **Test live URL** for:
   - `/`
   - `/about`
   - `/research`
   - `/work`
   - `/work/bci-calibration`
   - `/work/seizefreeze`
   - `/playground/pit-stop`
3. Confirm the live test reports crawl allowed, HTTP 200, and the expected canonical.
4. Request indexing for the highest-value pages after deployment.
5. Check Page Indexing and Crawl Stats over time. Google explicitly says meeting technical requirements does not guarantee indexing.

Official Google references:
- https://developers.google.com/search/docs/appearance/ai-features
- https://developers.google.com/search/docs/essentials/technical
- https://developers.google.com/search/docs/fundamentals/how-search-works

## ChatGPT Search

1. Verify the effective live `robots.txt` does not disallow `OAI-SearchBot`.
2. Verify Cloudflare allows OpenAI's published searchbot traffic rather than challenging it.
3. After deployment, monitor inbound referrals containing `utm_source=chatgpt.com`.

Official OpenAI references:
- https://help.openai.com/en/articles/12627856-publishers-and-developers-faq
- https://help.openai.com/en/articles/9237897-chatgpt-search

## Authority and external discovery

Code cannot manufacture authority. Where you control legitimate profiles, add the canonical site URL if the platform supports it:

- GitHub profile
- University/lab profile if editable
- Physics World contributor/profile if an author bio link can be updated
- Competition/innovation profiles with a website field
- Professional association profiles

Prioritize a small number of real, high-authority identity links over directory spam or paid backlinks.

## Post-deploy live checks

Open these in a normal browser:

- https://arjansinghpuniani.com/robots.txt
- https://arjansinghpuniani.com/sitemap.xml
- https://arjansinghpuniani.com/llms.txt
- https://arjansinghpuniani.com/playground/pit-stop

If the live robots response contains Cloudflare-injected `Disallow` rules not present in the repository, fix Cloudflare.
