# Security boundaries

This repository is a public-data research preview. It has no authentication and is **not suitable for private multi-user data**. Development and production scripts bind to 127.0.0.1. The user-requested read-only website snapshot is served at `/atlas`; it exposes no ingestion or private workspace. DNS and credentials are unchanged.

- The browser and APIs read only the explicit public snapshot. `data/private/` and `.env*` are ignored. There are no API keys in this implementation.
- No browser/API request can trigger ingestion, invoke a shell, execute a language model, write database rows, or fetch a supplied remote URL.
- Search query length, brief IDs/year, and immutable source hashes are validated. Source reads require manifest membership and a strict hash; traversal is rejected.
- React escapes source text. Raw HTML and Markdown are not executed. Brief generation strips Markdown control characters from source titles/assertions. The browser links only to allowed HTTPS evidence hosts with noopener/noreferrer.
- CSP restricts network, scripts, object embedding, forms, and framing. `wasm-unsafe-eval` permits the geometry ecosystem's WebAssembly initialization without enabling general JavaScript eval. `unsafe-inline` remains for framework hydration/style; nonce-based strict CSP is a production hardening task.
- Ingestion URLs are code-owned and allowlisted; TLS verification remains enabled. Responses have timeout and byte caps, sequential pacing, and bounded retries. Whole-batch validation precedes database updates. Failed providers cannot erase earlier records.
- Source text is untrusted content. Deterministic retrieval has no tools or instruction channel, so external documents cannot command the assistant.

Before a hosted private workspace: implement authentication, per-user authorization, CSRF protections for writes, encryption/access policy, redacted logging, secrets management, rate limits, dependency scanning, and recovery drills. Do not expose an ingestion process or writable database through the public server.

Report vulnerabilities privately to the repository owner; do not attach credentials or private source records to public issues. See SECURITY_REVIEW.md for this execution's findings and residual risks.

The whole-body index contains authentic public source text only. Catalogue generation runs offline through CLI; browser actions cannot initiate scraping. New source-context matches remain untrusted quoted data. No private workspace or owner project records are included.
