# Security review

## Scope and disposition

Code inspection, endpoint tests, escaped rendering review, dependency advisory scan, tracked-file inspection, and local browser execution. This is not a penetration test or a proof of security. No private authenticated workspace is implemented; public hosting is not certified.

## Findings and mitigations

| Severity | Finding | Fix / evidence |
| --- | --- | --- |
| High | An unrestricted source-file endpoint would expose arbitrary files. | Implemented only manifest-listed 64-hex artifact lookups under data/sources. Unknown hash and traversal/brief input tests reject requests. No generic file endpoint exists. |
| High | Private workspace without authorization would expose owner data. | Private workspace omitted from public routes. No owner files imported. Local-only private directory and env files ignored. Authentication is a required future gate, not a cosmetic login. |
| Medium | Ingestion/resource exhaustion from user-triggered provider fetches. | Ingestion is CLI-only, fixed allowlisted plan, response/time caps, sequential pacing, at most three transient retries. Public APIs do not issue remote source requests. Hosted request-rate limits remain a deployment task. |
| Medium | Source HTML or document instructions could be executed. | React escaped text; no dangerouslySetInnerHTML, eval, tool execution, or LLM pipeline. Source links allowlisted HTTPS; noopener/noreferrer. Markdown exports sanitize source control characters. |
| Medium | Missing Python CA store could motivate TLS bypass. | Use OS CA trust when the Python distribution has no bundle. TLS stays verified. |
| Medium | Initial CSP blocked Three.js ecosystem WebAssembly initialization. | Added wasm-unsafe-eval only; general JavaScript unsafe-eval remains disallowed. Reran page-error checks. |
| Medium | Inline script CSP weakens XSS defense-in-depth. | Documented residual framework requirement; strict nonce/hash CSP remains production hardening. Escaped text and no HTML execution remain primary controls. |

All SQL values use parameter binding; API search operates on a bounded in-memory public snapshot. No remote SQL endpoint or mutable request path exists. No API keys, credentials, academic records, legal material, or personal owner documents were added to the application. Public FDA sponsor/applicant contact information in original API responses is public source material; it is not owner workspace data.

`npm audit --omit=dev --json` was executed against the registry: zero reported production dependency vulnerabilities at the time checked. This does not establish absence of unknown vulnerabilities. Exact final results and API/browser checks are in validation artifacts and DEMO_VERIFICATION.md.

## Residual risk and required gates

Hosted denial-of-service limits, authentication/authorization, write CSRF policy, secrets management, private notes storage, strict CSP, retention/backup testing, cross-user isolation, and external document sandboxing must be assessed before exposing private or mutable functions. Current code has none of those mutable/private features, and scripts bind loopback. A malicious trusted-source response is still untrusted data; rights and factual accuracy require curation as well as technical controls.

The intervention overlay reads local curated relationships and separately marked generated source contexts; it does not execute source text or fetch external documents while orbiting. Original-source anchors open with `noopener noreferrer`. DOM text is rendered through React, and SVG paths contain only projected numeric coordinates. No device or anatomy coordinates are accepted from user input. Existing API boundaries are unchanged.

Whole-body additions retain the same public-only boundaries. No new remote-fetch API, upload, document execution, LLM tool channel or writable endpoint is introduced. Generated quotes and source names render as escaped React text. Dot positions derive solely from code-owned numeric regional locators and camera projection. Source hash/record membership and exact-span tests cover the larger collection. A larger client snapshot and geometry increase resource use; list pagination and demand rendering bound ordinary interaction, while hosted rate limits remain unimplemented.


## Dossier milestone — 2026-10-22

The dossier path adds no authentication, keys, server mutation endpoint or executable external content. Existing default source allowlists remain intact; the FDA-only override is checked across redirects and final responses. Security regressions cover arbitrary hosts, credentials/ports, source tampering and failure isolation. JSON/HTML response size, page counts and retries are bounded; external HTML is published as `.txt`. Dependencies are unchanged. See [DOSSIERS.md](DOSSIERS.md).
