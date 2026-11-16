# Pilot operations and launch checklist

Use this worksheet with the [commercial plan](COMMERCIAL_PLAN.md). The public pilot link uses the same email address as the portfolio contact page. The browser prepares an unsent draft, with a visible address and editable copy path via the buyer’s own client. There are no payment details, tracking calls or buyer records in the app.

## Activation checklist

1. Review a preview at `/atlas/pilot`. Start at the portfolio overview and follow Pilot → brief builder → select two original applications and export → inquiry. At narrow width, do the same with keyboard where applicable. Confirm the live Atlas remains the research entry point.
2. Confirm the public pilot mailbox is monitored and has MFA. A founder-authorized Gmail self-send of the form-generated inquiry reached Inbox, and a reply arrived in the same thread. Delivery from an independent sender was outside that test. Use an independent sender to verify that path when available. No API keys are needed for the pilot. Change `recipient` in `app/pilot/Inquiry.tsx` and regenerate the export if the founder selects a dedicated address. Portfolio `/api/contact` is separate and only delivers if `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, and `CONTACT_TO_EMAIL` are configured on the portfolio host.
3. Inspect the sample, rights and agreement. Confirm commercial permissions for the assets used in public sales, applicable terms and privacy, refund language, business/invoice details, secure payment destination, reviewer availability and escalation owner. The pilot page uses text and source links. The linked Atlas contains separately attributed HRA and MediaPipe artifacts described in [DATA_SOURCES.md](DATA_SOURCES.md) and [BODY_CONTOUR.md](BODY_CONTOUR.md). The pilot does not use the owner's portrait as a demonstration asset.
4. Review and approve the branch. The export and source travel together. To rebuild from `body-atlas-source`: `npm ci --ignore-scripts`, `npm run verify`, `npm run test:browser`, `node scripts/export-static.mjs ../arjan-portfolio/public/atlas`, and `node scripts/check-export.mjs`. From `arjan-portfolio`: `npm ci --ignore-scripts`, `npm run typecheck && npm test && npm run build`, then `npm start -- --hostname 127.0.0.1 --port 3217`. The host rewrites `/atlas/pilot` to the checked-in static HTML. Keep the static export and standalone API deployments separate, and verify host CSP, assets and FDA proxy. The route uses same-origin assets and the customer's email app.
5. Deploy only when approved. Save the currently deployed revision. After deployment, check HTTP status, asset loads, original source links, the draft handoff, the existing portfolio links and Atlas search. Use a hosting rollback if route smoke checks fail. Verify a real receipt via the approved inbox test before founder outreach. Payment verification involves reconciling the agreed invoice to settled funds, no live checkout or merchant account change in this branch.

## Scope and review worksheet

Copy to a private folder or restricted CRM. Keep actual names, quotes, invoice details, and activity out of Git.

- **Inquiry → qualified.** Lead ID, date, organization, source channel, time needed, research question, budget owner, public repositories needed, explicit exclusions and fit decision.
- **Qualified → proposed.** Quoted one-time amount, one U.S. public research question, exact application/model IDs (maximum three), deliverable acceptance and exclusions, cutoff date, turnaround, who approves, quote expiry and signed scope. First sprint deliverables are a one-page decision memo, an editable two-case evidence matrix and source log, a reviewer spot check, one handoff and one factual correction round.
- **Proposed → booked.** Signed scope and confirmed invoice terms. Track invoice identifiers, issued date, due date, amount, payment fee, amount and settled date. If following split terms, only mark collected dollars as each transfer settles.
- **Booked → delivered.** Research time, external reviewer time and cost, date, reviewed claim IDs, corrections, version and customer acceptance. Keep billing access separate from research files.
- **Delivered → repeat or closed.** Thirty-day use check, any open correction, refund or net collection, follow-on question or date to close. Write opt-outs into a suppression list.
- **Stage controls.** No move to qualified without a named budget owner and matching deliverable. No invoice or delivery promise before scope approval. No move to “paid” based on checkout intent, invoice issue or test events. Deduplicate by organization and scoped opportunity. Record rejected, canceled, unpaid, partially collected and refunded explicitly.

### Draft paid pilot quote for founder approval

After the qualification call, replace the brackets and confirm the customer’s intended decision, exact application IDs and acceptable source cutoff. Obtain founder approval of commercial terms before issuing the quote.

> For [team’s decision] on [review date], BODY//ATLAS will compare [two exact U.S. device applications] against [one agreed question] using public records through [source cutoff]. By [agreed delivery date], you will receive a one-page evidence memo, an editable two-case comparison, and a source log. Each material factual claim will include the dated original record and a page or section. The memo will identify gaps that remain open and distinguish original decisions from later records. We will include a qualified reviewer’s spot check, a walkthrough, and one factual correction round. The fixed fee is $1,500 USD, subject to the written agreement. The work is for internal research and excludes clinical or regulatory advice, current-label certification and exhaustive recall checks.

First prospect to screen is Magnetic Tides’ CEO or R&D lead. Confirm that a source comparison is coming up for its external stimulation program, then use the personalized draft in the business plan for founder review. Keep the quote marked unissued until that qualification and approval.

### Magnetic Tides source sample

**Question for the review:** How should the team describe the six-month upper-limb evidence from NICHE and E-FIT without overstating the number of independent analyses?

**Decision memo excerpt:** Both studies considered navigated 1 Hz repetitive transcranial magnetic stimulation (rTMS) before motor rehabilitation. E-FIT retained the stimulation protocol but used an alternative sham coil. Its reported combined analysis incorporated NICHE data. If the review deck already cites NICHE, label the E-FIT combined estimate as drawing on NICHE rather than tallying it as an independent corroboration. The two trials studied rTMS and did not evaluate Magnetic Tides’ kTMP. The sample demonstrates traceability for a related research question. [Magnetic Tides program description](https://www.magnetictides.com/science)

| Case | Same endpoint | What the record supports | Original source and locator |
|---|---|---|---|
| NICHE (2018), navigated 1 Hz rTMS versus sham before motor therapy | At least five points of improvement on the upper-extremity Fugl–Meyer scale at six months. | 67% responded in the active group and 65% in the sham group (p = 0.76). These percentages describe the trial arms. | [Harvey et al., Abstract: Methods and Results](https://pubmed.ncbi.nlm.nih.gov/30354990/) · [Registration NCT02089464](https://clinicaltrials.gov/study/NCT02089464) |
| E-FIT (2023), same stimulation protocol with a different sham coil | Same six-month threshold. | The combined analysis with NICHE did not establish superiority over sham. Posterior mean odds ratio 1.94 with a 96% credible interval of 0.61–4.80. The estimate describes the combined analysis. | [Edwards et al., Abstract: Methods and Results](https://pubmed.ncbi.nlm.nih.gov/37577801/) · [Registration NCT03010462](https://clinicaltrials.gov/study/NCT03010462) |

**Open for the buyer:** Which population, timing after stroke, stimulation approach and outcome matter to the upcoming decision? The team should confirm those before Atlas scopes a paid comparison. Authorization status would require separate official records.


### Source-log template and example

| Claim | Application | Dated source | Locator and review | Scope and limit |
|---|---|---|---|---|
| Original Activa decision | P960009 | [FDA PMA](https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpma/pma.cfm?id=P960009), 1997-07-31, checked 2026-11-15 | Approval order statement | Original unilateral thalamic stimulation. No inference about later models or current labeling. |
| Later Activa decision | P960009/S007 | [FDA supplement SSED](https://www.accessdata.fda.gov/cdrh_docs/pdf/p960009s007b.pdf), 2002-01-14, checked 2026-11-15 | General information and indication sections | Separate supplemental application. No conflation with the original indication. |
| Original ExAblate decision | P150038 | [FDA PMA](https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpma/pma.cfm?id=P150038), 2016-07-11, checked 2026-11-15 | Approval order statement | Model 4000 Type 1.0 and time-of-approval indication. No finding about later models or comparative outcomes. |
| Current label, comparative effectiveness and exhaustive recall status | Both | No complete review | Open | Excluded from the free example and unsupported by overlapping anatomy. |

### Buyer trial before a paid quote

**At the booth:** Ask for the neurodevice R&D lead or contact responsible for an upcoming design, evidence or diligence review. If the booth contact sells to those teams, ask for an introduction. The test uses your laptop with the local preview already open. Connect to Wi-Fi or a hotspot to verify original FDA links. Bring a timer and a clean browser tab. Do not enter confidential, patient-specific or proprietary information.

**Exact ask:**

> I’m testing BODY//ATLAS, a tool for checking FDA evidence before a device review. Do you have five minutes to try it with a real question your team is working on, using only public device information? Pick two devices you actually need to compare. Find one claim you’d want to verify in the original source, write down what still needs checking, and save the worksheet. I’ll watch quietly. You can stop whenever you like.

Start the clock when they take control. Don’t suggest devices, application IDs or controls. If they ask where to click, say “What would you try first?” Record any help you give. At five minutes, ask “How would you use what you just downloaded?” then “What would you still need to add before putting this into your review packet?”

| Verdict | Observed evidence |
|---|---|
| Pass | An R&D lead uses a real upcoming question. Within five minutes and without help, they choose the two intended FDA records, verify one consequential claim against its original FDA source, distinguish the original from any supplement they use, record one meaningfully unresolved check and download the worksheet. They identify a specific review or work product where they would use the export. |
| Fail | An in-scope pair cannot be found or chosen, a record is misidentified, the buyer confuses an original decision with a supplement, the cited claim cannot be verified, they need help to export, or the output would not enter their review. Record the first blocker and their exact words. |
| Inconclusive | The person has no real question yet, the task would expose confidential information, the necessary source site is unreachable, or the session is interrupted. A real application missing from the index is a coverage failure if the question was within the stated scope. |

Record elapsed time, the public application IDs, whether the five checks passed, the buyer’s intended use, and their first obstacle. Ask permission to keep non-sensitive notes. Repeat a failed step after fixing it with a different buyer question. Test success measures utility. Discuss a paid scope separately only if there is a gap the buyer wants help closing.

The worksheet searches original PMA, 510(k) and De Novo decisions by device name or exact ID in the cached snapshot. Reviewed anatomy is available for a smaller group. The worksheet links 85 original PMAs to 6,420 cached supplement records. A user can filter a dossier’s FDA history and include one exact supplement per case in the export with its archive date and source. The workspace identifies reviewed summaries separately from selected archive records and keeps the buyer’s decision notes local. Keep production release pending until a buyer completes the workflow unassisted on a question they brought and confirms the export belongs in their review packet. The quoted pilot adds agreed records beyond the visible set as needed, documented checking of gaps, and a reviewed decision memo. Do not count an export as purchase evidence.

### Dry run and acceptance

Use internal dummy identifier QA-001. Treat the two original tremor decisions as an incoming public-source request and the source table above as the initial evidence register. Draft a $1,500 quote with two applications, mark it **unissued**, and leave actual collected cash empty. Download the public comparison, cross-check the exact PMAs/dates and the separate supplement, and check that findings distinguish hardware placement from intended tissue target. Package as an internal example, capture modeled delivery/review effort separately, and close QA-001 as rehearsal. There is no email submission or customer work in the dry run.

## Baseline and commercial review record

Baseline revision `441b63ec`, live inspection 2026-11-15. The public project overview, Atlas, and validation record returned HTTP 200. The live Atlas comparison displayed the original Activa FDA link and export control with no page errors in headless desktop Chrome. The public validation record dates the snapshot to November 1 UTC and shows three failed jobs and no independent anatomy adjudication. Local source exposes search, brief, cached source and FDA endpoints. The portfolio rewrite serves a static research export plus a separate FDA proxy; domain tests, browser tests and the export digest cover those respective boundaries. Source and license notes remain in the original UI and files. No Atlas accounts, entitlement, billing or prospect tracking were found in the scoped source. Portfolio contact delivery uses Resend, and its live configuration was not tested. Vercel analytics is wired in the portfolio application shell.

| Feature and customer problem | Expected benefit | Estimated implementation effort and acceptance |
|---|---|---|
| Research entry and visible scope. A buyer cannot tell what Atlas will answer or what can be purchased. | Reaches a relevant example and understands the paid result. | 2–3 hours. At both widths, find the research offer, source cutoff, limits and inquiry from the entry. Quote price privately. |
| Tremor comparison shortcut and downloadable brief. A first-time buyer has to learn the Atlas before checking a claim. | Useful evidence result in one click and direct access to primary sources. | 1–2 hours. Validate exact decision IDs and dates, source links and caveats through export. |
| Inquiry draft and handoff. A buyer needs a low-friction way to explain scope. | Founder receives the question, team and timing in one message when sent. | 2–3 hours. Test validation, draft contents and explicit send boundary, including no-JavaScript alternate path. |
| Fulfillment worksheet. Estimates, quotes, receipts and delivered files need to stay distinct. | A testable route from scope to invoicing and delivery with consistent acceptance checks. | 1–2 hours. Run QA-001 using two public applications and no transaction. |

**Customer/business review.** Free FDA and Innolitics search already solve lookup. Narrowed paid scope to a question-specific brief, built the downloadable free example, and canceled subscription scope until repeat demand is demonstrated. Acquisition remains loss-making in the modeled discovery scenarios.

**Product review.** Exercised the example, original PMA dates, comparison, download, offer, validation, empty inquiry and draft states. Added a precise historical-scope check on the export and a direct inquiry link for users without JavaScript. The preview does not receive form contents.

**Engineering/trust review.** Atlas and portfolio typechecks and production builds passed. Atlas ran 68 domain and 41 ingestion tests, and the portfolio ran 303 tests. The standalone and portfolio-mounted export each passed four focused Chromium tests (desktop and mobile, including disabled JavaScript). Axe checks on the pilot detected no violations. The export digest self-test and generated-export check passed. Local smoke checks covered the homepage, contact, Body Atlas and ECG project overviews, validation record, Atlas/pilot routes, export metadata, and invalid FDA proxy input. Existing anatomy, dossier and cached source artifacts are byte-preserved in the diff. The full Atlas browser run exposed six contour assertions on the disabled adapted contour, which are tracked separately from the commercial path. Portfolio install reported pre-existing advisories (2 low, 7 moderate, 13 high). Triage production reachability and upgrade impact separately. No Safari/physical iPhone, invoice, or payment was tested.

**Adversarial review.** The plan specifies separate inexpensive tests for buyer access/pain, actual willingness to pay, and delivery cost/source review. No execution on real prospects was authorized.
