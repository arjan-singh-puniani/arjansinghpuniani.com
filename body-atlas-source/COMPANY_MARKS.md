# Company marks

Reviewed on 2026-11-19. Marks identify the named FDA applicant or study sponsor;
they do not establish endorsement, device ownership today, or clinical validity.
The exact source-record identity remains visible beside the artwork.

## Coverage and verification

`lib/company-marks.json` records each artwork source, exact accepted identities,
and additional identity evidence where needed. `public/company-marks` contains
only self-hosted SVG paths and vector primitives. No remote logo service, embedded
bitmap, external font, executable SVG, or generated imitation is used at runtime.

The current registry has **169 marks**, covering **1,002 of 2,435 original FDA
applications** and **338 of 663 intervention entries**. These are application and
catalog-entry counts, not distinct device models. Uncovered identities retain
their text labels. Full-catalog logo coverage has not been achieved.

Recalculate the coverage and enumerate every remaining identity/application:

```sh
node --import tsx scripts/company-mark-coverage.ts > /tmp/atlas-company-mark-gaps.json
node --import tsx --test tests/company-marks.test.ts
```

Only explicit normalized aliases are accepted. Similar names, acquisitions, and
parent-company relationships are not inferred. For example, Ophtec BV and
Ophtecs Corporation are different companies. A person named as a study sponsor
does not automatically acquire an institution's or a device manufacturer's logo.

## This batch

- **Shenzhen TPH:** traced from its original bilingual company header. Its public
  artwork source currently uses HTTP; the shipped SVG is served locally over the
  website's HTTPS connection and makes no request to that HTTP source.
- **CMT Health:** native vector paths and gradients from its own product brochure.
  The complete symbol and wordmark are retained, with browser-checked bounds.
- **Shenzhen Root Innovation:** the indexed Momcozy devices use the **Momcozy
  brand** mark. FDA K260538 identifies the applicant and brand. The image's
  accessible name explicitly identifies it as a brand logo; the applicant text
  still says Shenzhen Root Innovation Technology Co., Ltd.
- **Bard Peripheral Vascular:** native manufacturer paths from the VIDA brochure,
  corroborated against historical FDA labeling. This is the Bard Peripheral
  Vascular wordmark, rather than a substituted BD parent-company mark.
- **MicroVention:** Terumo Neuro artwork with an explicit brand label and the
  manufacturer's September 2024 rebranding announcement as identity evidence.

Other additions cover diagnostics, dental, cardiovascular, ophthalmic and
orthopedic manufacturers. Entries with `artwork: "vector trace ..."` are locally
traced from the cited publisher's artwork; they are **not publisher-issued SVGs**.
Traces were rendered against their source and inspected before inclusion.
Native paths are preferred. Blank assets, unrelated partner logos, and traces
that failed fidelity checks were rejected.

## Rights and operations

Source verification establishes artwork provenance and identity, not a commercial
license. Trademarks and artwork rights remain with their owners. No manufacturer
partnership or endorsement is asserted. Commercial reuse terms require review
where the publisher reserves logo or trademark rights.

The shared component is used in the main Atlas, source records, and pilot
comparisons. The static export copies the same assets; export checks include
their bytes so stale or missing marks fail validation. Logo loading does not
depend on manufacturer servers being available during a demonstration.

This work does not establish 99.999% uptime. A production availability claim
requires a defined measurement window, external monitoring, incident records,
and recovery evidence. A successful build or one HTTP response cannot establish
that service level.
