import summaries from "@/data/dossier-summary.json";

export type LabelReview = {
  reviewedAt: string; status: string; scope: string; revision: string | null; models: string[];
  findings: { text: string; sourceUrl: string; locator: string }[];
  sources: { url: string; title: string; locator: string; accessedAt: string; method: string }[];
  limitations: string[];
};
export type DossierSummary = Omit<typeof summaries.activa, "labelReview"> & { labelReview: LabelReview };
export const dossiers: Record<string, DossierSummary> = summaries;
export const reviewLabels: Record<string, string> = {
  "current-safety-source-reviewed": "Public safety reviewed",
  "current-model-source-reviewed": "Model source reviewed",
  "published-ifu-reviewed": "Published label reviewed",
  "model-limited-source-review": "Model scope limited",
  "historical-label-reviewed": "Historical label reviewed",
  "historical-source-reviewed": "Historical source reviewed",
  "current-label-not-established": "Label gap",
  investigational: "Research only",
};
export const reviewMeanings: Record<string, string> = {
  "current-safety-source-reviewed": "Public manufacturer safety summary; the complete package IFU and latest revision are not certified.",
  "current-model-source-reviewed": "Warnings depend on the exact model and components. Permissions for one version do not extend to another.",
  "published-ifu-reviewed": "A published IFU was reviewed. Its document revision is identified where known; a newer revision may exist.",
  "model-limited-source-review": "Model or configuration coverage is limited. Only explicitly supported warnings and permissions can be assigned to the indexed device.",
  "historical-label-reviewed": "These warnings come from historical labeling. Later revisions may change restrictions or permissions.",
  "historical-source-reviewed": "Historical regulatory evidence supplies limited safety context; it is not a current package IFU.",
  "current-label-not-established": "The complete product-specific label is missing. Known restrictions are shown; the gap remains open.",
  investigational: "Research evidence is shown. No commercial labeling or marketing authorization is established here.",
};
export function matchesRecall(r: { product_description: string; code_info: string; product_res_number: string }, query: string): boolean {
  const q = query.trim().slice(0, 120).toLocaleLowerCase();
  return !q || [r.product_description, r.code_info, r.product_res_number].some(v => v.toLocaleLowerCase().includes(q));
}
export function scopeExcerpt(text: string, query: string): string {
  const at = query.trim() ? text.toLocaleLowerCase().indexOf(query.trim().slice(0, 120).toLocaleLowerCase()) : -1;
  const start = Math.max(0, at - 90), end = Math.min(text.length, start + 450);
  return `${start ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
}
export const dossierCoverage = {
  entries: Object.keys(dossiers).length,
  regulatory: Object.values(dossiers).filter(d => d.regulatory.state === "checked").length,
  recalls: Object.values(dossiers).filter(d => d.safety.state === "checked").length,
  labels: Object.values(dossiers).filter(d => d.labeling.documents > 0).length,
  assessed: Object.values(dossiers).filter(d => d.labelReview).length,
  labelGaps: Object.values(dossiers).filter(d => d.currentLabelReview === "current-label-not-established").length,
  publishedLabels: Object.values(dossiers).filter(d => d.currentLabelReview === "published-ifu-reviewed").length,
};
export function dossierBrief(id: string): string[] {
  const d = dossiers[id];
  return d ? [
    "### Regulatory, labeling and safety dossier",
    `FDA snapshot: ${d.reviewedAt}. Source assessment: ${d.labelReview.reviewedAt} · ${reviewLabels[d.currentLabelReview]}.`,
    reviewMeanings[d.currentLabelReview],
    `Scope: ${d.labelReview.scope} Document: ${d.labelReview.revision || "Revision not established"}.`,
    ...(d.labelReview.models.length ? [`Models compared (not interchangeable): ${d.labelReview.models.join("; ")}.`] : []),
    ...d.labelReview.findings.map(f => `- ${f.text} [Original source](${f.sourceUrl}) · ${f.locator}.`),
    ...d.labelReview.limitations.map(l => `Open limit: ${l}`),
    `Regulatory (${d.regulatory.state}): ${d.regulatory.detail}`,
    `Labeling (${d.labeling.state}): ${d.labeling.detail}`,
    `Safety (${d.safety.state}): ${d.safety.detail}`,
    `Notice review: ${d.noticeReview}; model/lot review: ${d.modelLotReview}.`,
    "Recall source fields are audited; patient/unit applicability and exhaustive current-label certification are not established.",
    ...d.sourceLinks.map(s => `[${s.title}](${s.url})`),
    `[Documented dossier and original source links](https://arjansinghpuniani.com/atlas/dossiers/${id}.json)`,
    "",
  ] : [];
}
