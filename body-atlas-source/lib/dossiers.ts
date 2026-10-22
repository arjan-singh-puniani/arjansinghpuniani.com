import summaries from "@/data/dossier-summary.json";

export type DossierSummary = typeof summaries.activa;
export const dossiers: Record<string, DossierSummary> = summaries;
export const dossierCoverage = {
  entries: Object.keys(dossiers).length,
  regulatory: Object.values(dossiers).filter(d => d.regulatory.state === "checked").length,
  recalls: Object.values(dossiers).filter(d => d.safety.state === "checked").length,
  labels: Object.values(dossiers).filter(d => d.labeling.documents > 0).length,
};
export function dossierBrief(id: string): string[] {
  const d = dossiers[id];
  return d ? [
    "### Regulatory, labeling and safety dossier",
    `Snapshot: ${d.reviewedAt}. Review status: source inventory; current labeling review ${d.currentLabelReview}.`,
    `Regulatory (${d.regulatory.state}): ${d.regulatory.detail}`,
    `Labeling (${d.labeling.state}): ${d.labeling.detail}`,
    `Safety (${d.safety.state}): ${d.safety.detail}`,
    `Notice review: ${d.noticeReview}; model/lot review: ${d.modelLotReview}.`,
    ...d.sourceLinks.map(s => `[${s.title}](${s.url})`),
    `[Documented dossier and original source links](https://arjansinghpuniani.com/atlas/dossiers/${id}.json)`,
    "",
  ] : [];
}
