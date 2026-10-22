import { writeFileSync, mkdirSync } from "node:fs";
import { families, mappings, records, coverage } from "../lib/atlas";
import { regionalMetric } from "../components/Topography";
const rows = mappings.filter(m=>m.type!=="indication_context").map((m) => ({
  ...m,
  independentReviewer: "",
  adjudication: "unreviewed",
}));
mkdirSync("validation", { recursive: true });
writeFileSync(
  "validation/curated-anatomy-sample.json",
  JSON.stringify(rows, null, 2) + "\n",
);
const report = {
  generatedAt: new Date().toISOString(),
  snapshotExportedAt: coverage.exportedAt,
  recordCounts: Object.fromEntries(
    [...new Set(records.map((r) => r.kind))].map((kind) => [
      kind,
      records.filter((r) => r.kind === kind).length,
    ]),
  ),
  curatedEntries: families.filter(f=>f.collection!=="catalogue").length,
  curatedAssertions: rows.length,
  localizedAssertions: rows.filter((m) => m.structureId !== null).length,
  explicitAbstentions: mappings.filter((m) => m.state === "Unknown").length,
  sourceContextEntries: families.filter(f=>f.collection==="catalogue").length,
  sourceContextAssertions: mappings.filter(m=>m.type==="indication_context").length,
  automaticallyAcceptedMappings: 0,
  independentlyAdjudicatedMappings: 0,
  precision: null,
  confidenceInterval: null,
  reason:
    "No independent ground truth adjudication. Curator assertions and regression checks are not a precision estimate.",
  jobStates: Object.fromEntries(
    [...new Set(coverage.jobs.map((j) => j.state))].map((state) => [
      state,
      coverage.jobs.filter((j) => j.state === state).length,
    ]),
  ),
  thalamusTopography: {
    families: regionalMetric("UBERON:0001897", "families", 2026),
    regulatory: regionalMetric("UBERON:0001897", "regulatory", 2026),
    grants: regionalMetric("UBERON:0001897", "funding", 2026),
  },
};
writeFileSync(
  "validation/data-integrity-report.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));

// Deterministic, region-balanced review queue, not adjudicated ground truth.
const queue = mappings.filter(m=>m.type==='indication_context');
const buckets=new Map<string,typeof queue>();for(const m of queue)buckets.set(m.structureId!,[...buckets.get(m.structureId!)||[],m]);
const sample:typeof rows=[];let position=0;
while(sample.length<Math.min(150,queue.length)){for(const bucket of buckets.values()){if(bucket[position]&&sample.length<150)sample.push({...bucket[position],independentReviewer:'',adjudication:'unreviewed'});}position++;}
writeFileSync('validation/catalogue-review-queue.json',JSON.stringify({method:'Round-robin across source-mentioned regions; deterministic convenience sample, no independent adjudication or accuracy estimate.',rows:sample},null,2)+'\n');
