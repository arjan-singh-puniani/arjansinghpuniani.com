"use client";
import { useEffect, useState } from "react";
import { atlasPath } from "@/lib/deployment";
import { dossiers } from "@/lib/dossiers";
import { External, SourceRecord } from "./Evidence";
import type { AtlasRecord } from "@/lib/types";

type Source = { url?: string; sha?: string; file?: string; retrievedAt?: string; providerUpdatedAt?: string; state?: string; originalSnapshot?: boolean; method?: string };
type Decision = { application: string; supplement: string; date: string; decision: string; tradeName: string; applicant: string; statement: string; reason: string; url: string; sourceSha: string };
type Recall = { cfres_id: string; product_res_number: string; product_description: string; code_info: string; reason_for_recall: string; action: string; recall_status: string; event_date_initiated: string; event_date_posted: string; event_date_terminated: string; recalling_firm: string; url: string; sourceSha: string };
type Label = { sections?: { title: string; pdfPage: number; sourceLine: number; method: string }[]; title?: string; application: string; url: string | null; state: string; method: string; pages?: number | null; checkedAt: string; accessNote?: string };
export type DossierData = {
  familyId: string; name: string; reviewedAt: string; applications: string[]; researchEvidence: AtlasRecord[];
  regulatory: { state: string; detail: string; rows: Decision[]; sources: Source[] };
  labeling: { state: string; detail: string; rows: Label[]; changeIds: string[]; inventory: Source; pages: { application: string; sourceUrl: string; locator: string }[] };
  safety: { state: string; detail: string; rows: Recall[]; sources: Source[]; noticeCandidates: { date: string; title: string; url: string; review: string; matchedTerms: string[]; sourceSha: string }[]; screenedTerms: string[]; indexes: { source: Source; state: string; rows: number }[]; limits: string[]; unresolvedReferences: { url: string; identifiers: string[] }[] };
  review: { method: string; next: string[] };
};
function SourceLinks({ source }: { source: Source }) {
  return <div className="dossier-source">
    {source.url && <External href={source.url}>Original source / query</External>}
    {source.sha && /^[a-f0-9]{64}\.(json|txt)$/.test(source.file || "") && <a target="_blank" rel="noopener noreferrer" href={atlasPath(`/${source.originalSnapshot ? "sources" : "dossier-sources"}/${source.file}`)}>Cached evidence</a>}
    {source.retrievedAt && <small>Retrieved {source.retrievedAt.slice(0, 10)}{source.providerUpdatedAt && ` · FDA update ${source.providerUpdatedAt}`}</small>}
    {source.sha && <details><summary>SHA-256</summary><code className="hash">{source.sha}</code></details>}
  </div>;
}
export default function Dossier({ familyId }: { familyId: string }) {
  const [data, setData] = useState<DossierData | null>(null), [error, setError] = useState(false), [retry, setRetry] = useState(0);
  const [decisions, setDecisions] = useState(15), [recalls, setRecalls] = useState(10), [labelOnly, setLabelOnly] = useState(false);
  const summary = dossiers[familyId];
  useEffect(() => {
    const controller = new AbortController();
    setData(null);setError(false);setDecisions(15);setRecalls(10);setLabelOnly(false);
    if (!summary) return () => controller.abort();
    fetch(atlasPath(summary.path), { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error("Dossier unavailable");
      const text = await response.text();
      if (text.length > 8 * 1024 * 1024) throw new Error("Dossier exceeds limit");
      const d = JSON.parse(text) as DossierData;
      if (d.familyId !== familyId || !Array.isArray(d.regulatory?.rows) || !Array.isArray(d.labeling?.rows) || !Array.isArray(d.safety?.rows) || !Array.isArray(d.review?.next)) throw new Error("Invalid dossier");
      if (!controller.signal.aborted) setData(d);
    }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [familyId, summary, retry]);
  if (!summary) return <p>No dossier prepared for this unreviewed catalogue entry.</p>;
  if (error) return <div role="alert"><p>Dossier could not be loaded. Coverage has not been reset.</p><button onClick={() => setRetry(r => r + 1)}>Retry dossier</button></div>;
  if (!data || data.familyId !== familyId) return <p role="status">Loading sourced dossier…</p>;
  const rows = labelOnly ? data.regulatory.rows.filter(r => data.labeling.changeIds.includes(r.application + r.supplement)) : data.regulatory.rows;
  return <article className="dossier" aria-label={`${data.name} regulatory, labeling and safety dossier`}>
    <h3>Regulatory, labeling & safety</h3>
    <p className="dossier-date">Snapshot acquired {data.reviewedAt.slice(0, 10)} · source inventory checked</p>
    {!!data.researchEvidence.length && <details><summary>Research sources</summary><p>Registry and publication evidence does not establish marketing authorization or successful treatment. Program-related papers are not presumed to report the linked trial.</p>{data.researchEvidence.map(r => <SourceRecord key={r.id} record={r} />)}</details>}
    <section aria-label="Regulatory history">
      <h4>Regulatory history <span>{data.regulatory.state}</span></h4><p>{data.regulatory.detail}</p>
      <label className="dossier-filter"><input type="checkbox" checked={labelOnly} onChange={e => { setLabelOnly(e.target.checked);setDecisions(15); }} />Only records mentioning labeling ({data.labeling.changeIds.length})</label>
      <p>{rows.length} records · newest decision first</p>
      {rows.slice(0, decisions).map(r => <details key={r.application + r.supplement} className="dossier-record">
        <summary>{r.date} · {r.application}{r.supplement} · {r.decision}</summary>
        <p>{r.tradeName}</p><p>Applicant in FDA snapshot: {r.applicant}</p>{r.reason && <p>Change reason: {r.reason}</p>}
        {r.statement && <blockquote>{r.statement}</blockquote>}
        <External href={r.url}>Original FDA decision</External><small>Source SHA-256: <code className="hash">{r.sourceSha}</code></small>
      </details>)}
      {rows.length > decisions && <button onClick={() => setDecisions(n => n + 30)}>Show more decisions ({Math.min(decisions, rows.length)} / {rows.length})</button>}
      {!!data.regulatory.sources.length && <details><summary>History sources, dates & checksums</summary>{data.regulatory.sources.map((s, i) => <SourceLinks key={i} source={s} />)}</details>}
    </section>
    <section aria-label="Labeling review">
      <h4>Labeling <span>{data.labeling.state}</span></h4><p>{data.labeling.detail}</p>
      {data.labeling.rows.map((r, i) => <div className="dossier-record" key={i}>{r.url ? <External href={r.url}>{r.application} · {r.state === "summary-only" ? "510(k) summary" : (r.title || "Original labeling")}</External> : <p>{r.application} · labeling retrieval unavailable</p>}<div className="dossier-label-sections">{r.url && r.sections?.map(s => <External key={s.title} href={`${r.url}#page=${s.pdfPage}`}>{s.title} · PDF p. {s.pdfPage}</External>)}</div>{r.sections?.length ? <small>Original-document headings located; section content and current revision review pending.</small> : null}{r.pages && <small>{r.pages} PDF pages · original document</small>}{r.accessNote && <small>{r.accessNote}</small>}</div>)}
      {data.labeling.pages.filter(p => !data.labeling.rows.some(d => d.application === p.application && d.url)).map(p => <p key={p.application}><External href={p.sourceUrl}>{p.application} original document index</External> · {p.locator}</p>)}
      <p><strong>Current labeling review: {summary.currentLabelReview}.</strong> Locating an original label does not establish its current revision.</p>
      <details><summary>Label discovery provenance</summary><p>{data.labeling.inventory.method}</p><SourceLinks source={data.labeling.inventory} /></details>
    </section>
    <section aria-label="Safety review">
      <h4>FDA recalls <span>{data.safety.state === "checked" ? "search checked" : data.safety.state}</span></h4><p>{data.safety.detail}</p>
      {data.safety.rows.slice(0, recalls).map(r => <details key={r.cfres_id} className="dossier-record">
        <summary>{r.event_date_posted || "Date not supplied"} · {r.product_res_number || r.cfres_id} · {r.recall_status}</summary>
        <p><strong>Affected product</strong> {r.product_description}</p><p><strong>Model / lot / serial</strong> {r.code_info || "Not supplied"}</p>
        <p><strong>Reason</strong> {r.reason_for_recall || "Not supplied"}</p><p><strong>FDA-reported action</strong> {r.action || "Not supplied"}</p>
        <p>Initiated {r.event_date_initiated || "not supplied"} · posted {r.event_date_posted || "not supplied"}{r.event_date_terminated && ` · terminated ${r.event_date_terminated}`}. Status as reported in this snapshot.</p>
        <p>Application-linked record; applicability to this entry’s specific model/lot remains unreviewed.</p><External href={r.url}>Original FDA recall record</External><small>Source SHA-256: <code className="hash">{r.sourceSha}</code></small>
      </details>)}
      {data.safety.rows.length > recalls && <button onClick={() => setRecalls(n => n + 15)}>Show more recalls ({Math.min(recalls, data.safety.rows.length)} / {data.safety.rows.length})</button>}
      {!!data.safety.unresolvedReferences.length && <details><summary>{data.safety.unresolvedReferences.length} malformed source references need review</summary>{data.safety.unresolvedReferences.map(r => <p key={r.url}><External href={r.url}>{r.identifiers.join(", ")}</External> · excluded from accepted application joins</p>)}</details>}
      <h4>Safety communications & early alerts <span>partial</span></h4>
      <p>{data.safety.noticeCandidates.length} title-screened candidates. These are separate from application-linked recalls.</p>
      {data.safety.noticeCandidates.map(n => <details className="dossier-record" key={n.url}><summary>{n.date} · {n.title}</summary><External href={n.url}>Read original FDA notice</External><p>{n.review}</p><small>Screening terms: {n.matchedTerms.join(", ")} · index source SHA-256: <code className="hash">{n.sourceSha}</code></small></details>)}
      <details><summary>Safety search coverage & gaps</summary><ul>{data.safety.limits.map(l => <li key={l}>{l}</li>)}</ul><p>Notice title terms: {data.safety.screenedTerms.join(", ") || "No explicit product/class title rule prepared; notice applicability unreviewed."}</p>{data.safety.sources.map((s, i) => <SourceLinks key={i} source={s} />)}{data.safety.indexes.map((v, i) => <div key={i}><p>{v.state} · {v.rows} index rows</p><SourceLinks source={v.source} /></div>)}</details>
    </section>
    <details><summary>Remaining review</summary><p>{data.review.method}</p><ul>{data.review.next.map(n => <li key={n}>{n}</li>)}</ul></details>
    <a href={atlasPath(summary.path)} download={`${familyId}-dossier.json`}>Download dossier with source references (JSON)</a>
  </article>;
}
