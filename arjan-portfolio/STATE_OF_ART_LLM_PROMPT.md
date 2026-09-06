# Prompt: search visibility + AI crawler access + Pit Stop Lab experiential audio

You are a senior technical SEO engineer, Cloudflare/Next.js specialist, web performance engineer, information architect, interaction designer, and browser-audio engineer working on an existing production portfolio.

Repository: https://github.com/arjan-singh-puniani/arjansinghpuniani.com
Live site: https://arjansinghpuniani.com/
Project root: arjan-portfolio/

## Non-negotiable goal

Increase legitimate search-engine and AI-search discoverability while preserving the site's current visual design and content boundaries. Separately, deepen the Pit Stop Lab's experiential density with crisp procedural mechanical audio synchronized to the existing mechanical sequence. Do not redesign the site or replace working interactions.

## First: establish facts

Before editing, inspect current main, git status, robots.ts, sitemap.ts, metadata, JSON-LD, public routes, Cloudflare-related configuration, analytics, and Pit Stop Lab source. Verify the deployed homepage, robots.txt, sitemap.xml, and key pages. Search the public web for the canonical domain and for "Arjan Singh Puniani". Distinguish crawlability, indexing, ranking, and AI retrieval. Do not infer that one generative-AI answer proves the site is technically blocked.

Use current official documentation when evaluating crawler behavior. In particular:
- Google AI Overviews / AI Mode use normal Search indexing and Googlebot access. Do not claim Google-Extended controls Search ranking or Search inclusion.
- OAI-SearchBot is the relevant crawler for ChatGPT Search discovery. GPTBot is a separate training control.
- Cloudflare can prepend managed robots directives or block/challenge bots at WAF/Bot layers; repository robots.txt cannot override a CDN-level 403/challenge.

## SEO / AI discovery changes

Make only high-confidence, low-risk changes. Preserve all existing canonicals, metadata, structured data, sitemap improvements, About page, Vector Tennis, SeizeFreeze, Pit Stop Lab, and visual design.

Audit and, where justified:
- explicitly allow Googlebot, Google-Extended, Bingbot, and OAI-SearchBot in origin robots.txt;
- preserve the sitemap declaration;
- keep indexable content server-rendered and textual;
- verify every important page has a unique title, useful description, self-canonical, internal inbound links, and consistent structured data;
- preserve truthful evidence boundaries;
- add a concise `llms.txt` only as an experimental supplementary discovery file, never as a replacement for standard SEO;
- do not add fake AI schema, FAQ spam, keyword blocks, doorway pages, or low-value generated content;
- document Cloudflare dashboard actions that cannot be performed in code.

## Pit Stop Lab audio goal

The existing 3.05-second Formula-style center-lock wheel sequence is visually strong. Add sound without external copyrighted audio assets. Prefer Web Audio API synthesis so the project remains self-contained.

Audio must feel crisp, mechanical, compressed, and spatially coherent:
- pneumatic hiss when air systems engage;
- rapid impact-gun chatter during nut loosening;
- distinct retained-nut metallic release;
- wheel/hub thud as the outgoing wheel clears;
- subtle transfer movement cue;
- positive wheel seating clack;
- tighter, slightly higher-pitched impact-gun burst during final tightening;
- short tool-clear hiss;
- jack-release air dump plus low mechanical clunk at car release.

Requirements:
- no sound before a user gesture because of browser autoplay rules;
- first Play/Space interaction resumes AudioContext;
- visible sound toggle, on by default but easy to mute;
- M keyboard shortcut toggles sound;
- no looping soundtrack;
- no external requests or audio packages;
- audio cues stay synchronized with the sequence thresholds;
- avoid clipping via a master gain and dynamics compressor;
- keep sound optional and non-blocking if Web Audio is unavailable;
- preserve screenshots/demo query parameters and all current camera/mechanics controls.

## Experiential density

Increase density through meaningful multimodal feedback rather than UI clutter. The simulation should reward inspection: visual motion, mechanical sound, phase text, timing, labels, camera presets, and optional cutaway/exploded views should reinforce the same physical event. Do not turn it into a menu-heavy game.

## Validation

Run:
- npm run typecheck
- npm run build
- changed-file ESLint
- node --check public/pit-stop-lab/main.js
- git diff --check

Test at desktop and narrow widths. Verify homepage, About, Research, Work, Playground, Vector Tennis, SeizeFreeze, and Pit Stop Lab still work. Verify Pit Stop Lab runs with sound on and muted, and produces no console errors.

## Deliverable

Implement directly if write access exists. Otherwise produce one guarded ZIP patch with an installer script that refuses to overwrite unrelated tracked changes. Include exact files changed, validation commands, and Cloudflare/Search Console owner actions. Do not promise rankings.
