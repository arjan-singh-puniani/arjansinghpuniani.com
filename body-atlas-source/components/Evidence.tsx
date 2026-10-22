"use client";
import { ArrowUpRight } from "lucide-react";
import { atlasBasePath, atlasPath } from "@/lib/deployment";
import { recordById } from "@/lib/atlas";
import type { AtlasRecord, EvidenceState } from "@/lib/types";
export function External({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  let valid = false;
  try {
    const u = new URL(href);
    valid =
      u.protocol === "https:" &&
      [
        "www.accessdata.fda.gov",
        "api.fda.gov",
        "clinicaltrials.gov",
        "pubmed.ncbi.nlm.nih.gov",
        "www.ncbi.nlm.nih.gov",
        "reporter.nih.gov",
        "doi.org",
        "humanatlas.io",
        "creativecommons.org",
        "obophenotype.github.io",
      ].includes(u.hostname);
  } catch {}
  return valid ? (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <ArrowUpRight size={13} />
    </a>
  ) : (
    <span>{children} (source URL unavailable)</span>
  );
}
export function State({ value }: { value: EvidenceState }) {
  return (
    <span className={`evidence-state state-${value.toLowerCase()}`}>
      <span />
      {value}
    </span>
  );
}
export function SourceRecord({ record: r }: { record: AtlasRecord }) {
  return (
    <article className="source-record">
      <div className="eyebrow">
        {r.kind === "trial"
          ? "ClinicalTrials.gov"
          : r.kind === "publication"
            ? "PubMed"
            : r.kind === "grant"
              ? "NIH RePORTER"
              : "FDA"}{" "}
        · {r.id}
      </div>
      <h4>
        <External href={r.url}>{r.title}</External>
      </h4>
      <p>{r.status || r.publicationDate || r.definition || r.projectNumber}</p>
      {(r.decisionDate || r.firstPosted) && (
        <p>Event date: {r.decisionDate || r.firstPosted}</p>
      )}
      {r.applicant && <p>Applicant in snapshot: {r.applicant}</p>}
      {r.productCode && (
        <p>
          FDA product code:{" "}
          <External
            href={
              "https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpcd/classification.cfm?ID=" +
              r.productCode
            }
          >
            {r.productCode}
          </External>
          {recordById("FDA:" + r.productCode)?.deviceClass
            ? " · Classification " +
              recordById("FDA:" + r.productCode)?.deviceClass
            : ""}
        </p>
      )}
      {r.deviceClass && (
        <p>
          Classification: {r.deviceClass}. Classification alone does not
          establish authorization.
        </p>
      )}
      {r.sponsor && <p>Registry sponsor: {r.sponsor}</p>}
      {r.organization && <p>Funded organization: {r.organization}</p>}
      {!!r.investigators?.length && (
        <p>Investigators: {r.investigators.join("; ")}</p>
      )}
      {r.journal && <p>{r.journal}</p>}
      {r.statement && (
        <details>
          <summary>Original approval / decision statement</summary>
          <blockquote>{r.statement}</blockquote>
          <p>
            Historical source text. Check subsequent supplements for current
            labeling.
          </p>
        </details>
      )}
      <details>
        <summary>Provenance and cached source</summary>
        <dl>
          <dt>Extraction</dt>
          <dd>Structured public API fields; identifiers preserved</dd>
          <dt>Retrieved (UTC)</dt>
          <dd>{r.retrievedAt}</dd>
          <dt>Provider update</dt>
          <dd>{r.providerUpdatedAt || "Not supplied in this response"}</dd>
          <dt>SHA-256</dt>
          <dd className="hash">{r.sourceSha}</dd>
        </dl>
        <a
          href={atlasBasePath ? atlasPath(`/sources/${r.sourceSha}.json`) : `/api/source/${r.sourceSha}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open authentic cached response <ArrowUpRight size={13} />
        </a>
      </details>
    </article>
  );
}
