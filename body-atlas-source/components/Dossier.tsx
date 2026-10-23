"use client";
import { useEffect, useMemo, useState } from "react";
import { atlasPath } from "@/lib/deployment";
import { dossiers, matchesRecall, reviewLabels, scopeExcerpt, type LabelReview } from "@/lib/dossiers";
import { External, SourceRecord } from "./Evidence";
import type { AtlasRecord } from "@/lib/types";

type Source = { url?: string; sha?: string; file?: string; retrievedAt?: string; providerUpdatedAt?: string; state?: string; originalSnapshot?: boolean; method?: string };
type Decision = { application: string; supplement: string; date: string; decision: string; tradeName: string; applicant: string; statement: string; reason: string; url: string; sourceSha: string };
type ScopeAudit = { state: string; reviewedAt: string; scopeKind: string; flags: string[]; unitApplicability: string };
type Notice = { url: string; status: string; scope: string; finding: string; limitation: string; locator: string; reviewedAt: string };
type Recall = { scopeAudit: ScopeAudit; cfres_id: string; product_res_number: string; product_description: string; code_info: string; reason_for_recall: string; action: string; recall_status: string; event_date_initiated: string; event_date_posted: string; event_date_terminated: string; recalling_firm: string; url: string; sourceSha: string };
type Label = { sections?: { title: string; pdfPage: number; sourceLine: number; method: string }[]; title?: string; application: string; url: string | null; state: string; method: string; pages?: number | null; checkedAt: string; accessNote?: string };
export type DossierData = {
  familyId: string; name: string; reviewedAt: string; applications: string[]; researchEvidence: AtlasRecord[]; labelReview: LabelReview;
  regulatory: { state: string; detail: string; rows: Decision[]; sources: Source[] };
  labeling: { state: string; detail: string; rows: Label[]; changeIds: string[]; inventory: Source; pages: { application: string; sourceUrl: string; locator: string }[] };
  safety: { state: string; detail: string; rows: Recall[]; sources: Source[]; noticeReviews: Notice[]; noticeCandidates: { date: string; title: string; url: string; review: string; matchedTerms: string[]; sourceSha: string }[]; screenedTerms: string[]; indexes: { source: Source; state: string; rows: number }[]; limits: string[]; unresolvedReferences: { url: string; identifiers: string[]; assessment: { scope: string; finding: string } }[] };
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
  const [decisions, setDecisions] = useState(15), [recalls, setRecalls] = useState(5), [labelOnly, setLabelOnly] = useState(false), [scopeQuery, setScopeQuery] = useState("");
  const summary = dossiers[familyId];
  useEffect(() => {
    const controller = new AbortController();
    setData(null);setError(false);setDecisions(15);setRecalls(5);setLabelOnly(false);setScopeQuery("");
    if (!summary) return () => controller.abort();
    fetch(atlasPath(summary.path), { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error("Dossier unavailable");
      const text = await response.text();
      if (text.length > 8 * 1024 * 1024) throw new Error("Dossier exceeds limit");
      const d = JSON.parse(text) as DossierData;
      if (d.familyId !== familyId || !Array.isArray(d.regulatory?.rows) || !Array.isArray(d.labeling?.rows) || !Array.isArray(d.safety?.rows) || !Array.isArray(d.review?.next) || !Array.isArray(d.labelReview?.findings) || !Array.isArray(d.safety.noticeReviews) || d.safety.rows.some(r => !r.scopeAudit || typeof r.code_info !== "string")) throw new Error("Invalid dossier");
      if (!controller.signal.aborted) setData(d);
    }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [familyId, summary, retry]);
  const scopeRows = useMemo(() => data?.safety.rows.filter(r => matchesRecall(r, scopeQuery)) || [], [data, scopeQuery]);
  if (!summary) return <p>No dossier prepared for this unreviewed catalogue entry.</p>;
  if (error) return <div role="alert"><p>Dossier could not be loaded. Coverage has not been reset.</p><button onClick={() => setRetry(r => r + 1)}>Retry dossier</button></div>;
  if (!data || data.familyId !== familyId) return <p role="status">Loading sourced dossier…</p>;
  const rows = labelOnly ? data.regulatory.rows.filter(r => data.labeling.changeIds.includes(r.application + r.supplement)) : data.regulatory.rows;
  return <article className="dossier" aria-label={`${data.name} regulatory, labeling and safety dossier`}>
    <h3>Regulatory, labeling & safety</h3>
    <section className="dossier-essentials" aria-label="Safety essentials">
      <div className="dossier-review-line"><span className="review-status" data-review-status={data.labelReview.status}>{reviewLabels[data.labelReview.status]}</span><time dateTime={data.labelReview.reviewedAt}>{data.labelReview.reviewedAt}</time></div>
      <p className="dossier-model-scope">{data.labelReview.scope}</p>{data.labelReview.revision && <small>Document: {data.labelReview.revision}</small>}
      <ol className="dossier-findings">{data.labelReview.findings.map((f, i) => <li key={i}><p>{f.text}</p><External href={f.sourceUrl}>Original source</External><small>{f.locator}</small></li>)}</ol>
      <details className="dossier-open-limits" open={data.labelReview.status === "current-label-not-established"}><summary>What remains unresolved</summary><ul>{data.labelReview.limitations.map(l => <li key={l}>{l}</li>)}</ul></details>
      <details><summary>Review sources & method</summary>{data.labelReview.sources.map(s => <div className="dossier-source" key={s.url}><External href={s.url}>{s.title}</External><small>{s.locator} · accessed {s.accessedAt}</small><small>{s.method}</small></div>)}<p>{data.review.method}</p></details>
    </section>
    {!!data.safety.noticeReviews.length && <section aria-label="Reviewed safety notices"><h4>Safety notices <span>{data.safety.noticeReviews.length} scope decisions</span></h4>{data.safety.noticeReviews.map(n => <details className="dossier-record" key={n.url}><summary><span className="notice-disposition">{n.status.replaceAll("-", " ")}</span>{n.scope}</summary><p>{n.finding}</p><p className="dossier-caution">{n.limitation}</p><External href={n.url}>Original FDA notice</External><small>{n.locator} · reviewed {n.reviewedAt}</small></details>)}</section>}
    {!!data.researchEvidence.length && <details><summary>Research sources</summary><p>Registry and publication evidence does not establish marketing authorization or successful treatment. Program-related papers are not presumed to report the linked trial.</p>{data.researchEvidence.map(r => <SourceRecord key={r.id} record={r} />)}</details>}
    <section aria-label="Safety review">
      <h4>Affected models & lots <span>{data.safety.rows.length} FDA records</span></h4><p>{data.safety.detail}</p>
      {!!data.safety.rows.length && <><label className="dossier-scope-search">Find a model, lot, serial or recall number<input type="search" maxLength={120} value={scopeQuery} onChange={e => { setScopeQuery(e.target.value);setRecalls(5); }} placeholder="e.g. 64001, VA368G3 or Z-…" /></label><p className="dossier-caution">Literal text search; ranges and wildcards are not evaluated. No match does not establish that a unit is unaffected.</p><p role="status">{scopeRows.length} matching records</p></>}
      {scopeRows.slice(0, recalls).map(r => <details key={r.cfres_id} className="dossier-record">
        <summary>{r.event_date_posted || "Date not supplied"} · {r.product_res_number || r.cfres_id}<small>{r.product_description.slice(0, 125)}{r.product_description.length > 125 ? "…" : ""}</small></summary>
        <p><strong>FDA-reported product</strong> {r.product_description}</p>
        <p className="dossier-lot"><strong>Model / lot / serial</strong> {scopeExcerpt(r.code_info, scopeQuery) || "Not supplied"}</p>
        {r.code_info.length > 450 && <small>Excerpt shown; the full {r.code_info.length.toLocaleString()}-character scope is preserved in the dossier download and original FDA record. Search checks the full text.</small>}
        <p><strong>Reason</strong> {r.reason_for_recall === "XXX" ? "Not provided: FDA supplies the placeholder ‘XXX’." : r.reason_for_recall || "Not supplied"}</p>
        {!!r.scopeAudit.flags.length && <ul className="dossier-caution">{r.scopeAudit.flags.map(flag => <li key={flag}>{flag}</li>)}</ul>}
        <details><summary>FDA action & dates</summary><p>{r.action || "Not supplied"}</p><p>Initiated {r.event_date_initiated || "not supplied"} · posted {r.event_date_posted || "not supplied"}{r.event_date_terminated && ` · terminated ${r.event_date_terminated}`}. Status in FDA snapshot: {r.recall_status}.</p></details>
        <small>Source fields audited {r.scopeAudit.reviewedAt} · {r.scopeAudit.scopeKind.replaceAll("-", " ")}. Individual unit applicability is not determined.</small><External href={r.url}>Original FDA recall record</External><small>Source SHA-256: <code className="hash">{r.sourceSha}</code></small>
      </details>)}
      {scopeRows.length > recalls && <button onClick={() => setRecalls(n => n + 15)}>Show more recalls ({Math.min(recalls, scopeRows.length)} / {scopeRows.length})</button>}
      {!!data.safety.unresolvedReferences.length && <details><summary>{data.safety.unresolvedReferences.length} source identifier problem(s) reviewed</summary>{data.safety.unresolvedReferences.map(r => <div className="dossier-record" key={r.url}><External href={r.url}>{r.identifiers.join(", ")}</External><p>{r.assessment.scope}</p><p>{r.assessment.finding}</p><small>Excluded from accepted application joins.</small></div>)}</details>}
      {data.safety.noticeCandidates.filter(c => !data.safety.noticeReviews.some(n => n.url === c.url)).map(c => <p key={c.url}><External href={c.url}>{c.title}</External> · candidate, scope unreviewed</p>)}
      <details><summary>Safety search coverage & gaps</summary><ul>{data.safety.limits.map(l => <li key={l}>{l}</li>)}</ul><p>Notice title terms: {data.safety.screenedTerms.join(", ") || "No product-specific rule; absence of notices is not established."}</p>{data.safety.sources.map((source, i) => <SourceLinks key={i} source={source} />)}{data.safety.indexes.map((v, i) => <div key={i}><p>{v.state} · {v.rows} index rows</p><SourceLinks source={v.source} /></div>)}</details>
    </section>
    <details className="dossier-archive"><summary>FDA decision history · {data.regulatory.rows.length} records</summary><section aria-label="Regulatory history">
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
    </section></details>
    <details className="dossier-archive"><summary>Original label archive · {summary.labeling.documents} links</summary><section aria-label="Labeling review">
      <h4>Labeling <span>{data.labeling.state}</span></h4><p>{data.labeling.detail}</p>
      {data.labeling.rows.map((r, i) => <div className="dossier-record" key={i}>{r.url ? <External href={r.url}>{r.application} · {r.state === "summary-only" ? "510(k) summary" : (r.title || "Original labeling")}</External> : <p>{r.application} · labeling retrieval unavailable</p>}<div className="dossier-label-sections">{r.url && r.sections?.map(s => <External key={s.title} href={`${r.url}#page=${s.pdfPage}`}>{s.title} · PDF p. {s.pdfPage}</External>)}</div>{r.sections?.length ? <small>Historical document headings; see the model-scoped findings for reviewed content and revision limits.</small> : null}{r.pages && <small>{r.pages} PDF pages · original document</small>}{r.accessNote && <small>{r.accessNote}</small>}</div>)}
      {data.labeling.pages.filter(p => !data.labeling.rows.some(d => d.application === p.application && d.url)).map(p => <p key={p.application}><External href={p.sourceUrl}>{p.application} original document index</External> · {p.locator}</p>)}
      <p>Archive links and located headings are distinct from the model-scoped source review above.</p>
      <details><summary>Label discovery provenance</summary><p>{data.labeling.inventory.method}</p><SourceLinks source={data.labeling.inventory} /></details>
    </section></details>
    <details><summary>Remaining review</summary><p>{data.review.method}</p><ul>{data.review.next.map(n => <li key={n}>{n}</li>)}</ul></details>
    <footer className="dossier-footer"><a href={atlasPath(summary.path)} download={`${familyId}-dossier.json`}>Download dossier with source references (JSON)</a><a href={`${atlasPath("/")}?entry=${encodeURIComponent(familyId)}`}>Link to this entry</a><small>FDA snapshot {data.reviewedAt.slice(0, 10)}. Research preview; source review does not certify a device or authorize treatment.</small></footer>
  </article>;
}
