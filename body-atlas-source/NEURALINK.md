# Neuralink evidence and implementation — 2026-10-31

Neuralink belongs in an intracortical BCI atlas, with a clear boundary between investigational evidence and marketed device authorization. The application now links one research entry to six exact Neuralink Corp-sponsored studies and one earlier platform publication. Neither trial registration nor a sponsor-reported IDE establishes FDA marketing approval.

## Original sources and interpretation

| Source | Supports / boundary |
| --- | --- |
| [PRIME NCT06429735](https://clinicaltrials.gov/study/NCT06429735) | Research identity, N1/R1 system and skull-mounted electronics. First posted May 28, 2024; actual study start January 9, 2024. Posting is not invention or implantation date. |
| [CONVOY NCT06710626](https://clinicaltrials.gov/study/NCT06710626) | External assistive-device control study involving PRIME participants; no invented independent participant cohort. |
| [CAN-PRIME NCT06700304](https://clinicaltrials.gov/study/NCT06700304), [UAE-PRIME NCT06992596](https://clinicaltrials.gov/study/NCT06992596), [GB-PRIME NCT07127172](https://clinicaltrials.gov/study/NCT07127172), [VOICE NCT07224256](https://clinicaltrials.gov/study/NCT07224256) | Separate registry identities and scope. Speech investigation is not conflated with established treatment or demonstrated speech restoration. |
| [UCLH, July 31, 2025](https://www.uclh.nhs.uk/news/uclh-evaluate-safety-and-functionality-neuralinks-brain-computer-interface-bci-technology) | Cortical recording threads, wireless decoding and external computer control; R1 inserts threads and is not an implanted component. Describes 128 threads × 8 electrodes. |
| [Original PRIME brochure](https://neuralink.com/pdfs/PRIME-Study-Brochure.pdf) | Describes 64 threads × 16 electrodes. Revision date not established here. This difference does not establish a chronological hardware crosswalk or a universal participant configuration. |
| [Manufacturer May 8, 2024 report](https://neuralink.com/updates/prime-study-progress-update-user-experience/) | Sponsor reports thread retraction, fewer effective electrodes and software changes. Not an FDA recall, independently adjudicated outcome or cohort risk estimate. |
| [2019 paper, PMID31642810](https://pubmed.ncbi.nlm.nih.gov/31642810/) / [original journal](https://www.jmir.org/2019/10/e16194/) | Earlier preclinical platform. Not clinical results for the present N1 trials. |
| [Manufacturer trial status](https://neuralink.com/trials/) | Investigational status and absence of FDA marketing approval. |

All six retrieved trial responses have `hasResults: false`. The UI reports 0/6 posted registry results, not zero publications worldwide. Enrollment values retain the registry's ESTIMATED/ACTUAL designation. Source publication, first-posted, last-updated and retrieval dates remain distinct. Full original API responses are content addressed, hash checked and publicly inspectable. Manufacturer pages/PDF are linked and reviewed; their complete copyrighted contents are not republished. Acquisition hashes/times are in `validation/neuralink-source-review-20261031.json`; the review date uses the local October 31 date while downloads after midnight UTC are November 1.

## Anatomical and visual boundaries

Three Supported, region-level assertions distinguish skull implantation, cortical tissue contact, and cortical measurement. None has patient-specific coordinates, laterality, gyrus targeting or a stimulation claim. The R1 robot is not assigned an implant site. The brain outline remains a licensed reference; the adjacent mechanism is explicitly an illustrative inset, not Neuralink CAD or surgical placement. Six drawn thread paths illustrate direction, not electrode inventory. Stage selection and qualitative playback show recording → wireless decoding → external command use. Reduced-motion preferences disable playback. All twelve mechanism entries use selectable stages and accessible text alternatives.

The source-grounded frontier question concerns stable usable recording and decoder adaptation; it does not infer that absent indexed comparative evidence proves absent research. BrainGate comparison retains the two systems' independent evidence and investigational status; no unsupported collaboration or equivalence is inferred.

## Reproduction

From the atlas source directory:

```sh
SSL_CERT_FILE=/etc/ssl/cert.pem python3 ingestion/pipeline.py restore
SSL_CERT_FILE=/etc/ssl/cert.pem python3 ingestion/pipeline.py refresh --scope neuralink
npm run dossiers:scope
npm run dossiers:build
node --import tsx scripts/validate.ts ../arjan-portfolio/public/documents/body-atlas-validation.json
npm run typecheck
npm test
npm run test:ingestion
npm run build -- --webpack
npm run test:browser
```

Refresh is a bounded, resumable two-job CLI operation, not a hosted unattended feed. Exact expected NCT identities and sponsor are validated before any replacement. A broad sponsor/collaborator discovery query returned NCT07407725, but its lead sponsor is not Neuralink Corp, so it is excluded. Failed/incomplete or changed-identity responses preserve last-good records. Older FDA source timestamps are unchanged by this export. Existing three historical failed jobs remain visible; they are not fabricated successes or new Neuralink acquisition failures.

## Remaining limits

No independent scientific adjudication, patient-specific reconstruction, complete clinical consent/device manual review, universal hardware revision crosswalk, current exhaustive notice inventory, or clinical effectiveness certification is claimed. Registry metadata is a dated snapshot and can change. Three unrelated manufacturer-IFU gaps persist. Public FDA live checks remain bounded exact-application checks for the existing 89 applications; Neuralink has no fabricated FDA application assigned.
