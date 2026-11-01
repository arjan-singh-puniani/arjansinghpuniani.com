import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import path from 'node:path';
import { families, mappings, records, coverage } from "../lib/atlas";
import { regionalMetric } from "../components/Topography";
import {hasExplanation} from '../lib/intervention-view';
import {dossierCoverage} from '../lib/dossiers';
import {deviceActions} from '../lib/device-action';
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

if(process.argv[2]){
 const destination=path.resolve(process.argv[2]);
 if(path.basename(destination)!=='body-atlas-validation.json'||path.basename(path.dirname(destination))!=='documents'||path.basename(path.dirname(path.dirname(destination)))!=='public')throw new Error('Use the portfolio public/documents/body-atlas-validation.json report');
 const previous=JSON.parse(readFileSync(destination,'utf8'));
 const neuralink= families.find(f=>f.id==='neuralink')!;
 const studies=neuralink.studyIds.map(id=>records.find(r=>r.id===id)!);
 writeFileSync(destination,JSON.stringify({...previous,...report,
   historicalMilestoneNote:'Dated explanationExpansion, dossierMilestone and labelSafetyReview sections record earlier milestones. currentRelease and top-level source counts describe the current export.',
   interactivePreview:{path:'/atlas',delivery:'Cached reviewed index plus bounded live exact-application FDA decision checks. No unattended hosted document-ingestion worker or private workspace.'},
   currentRelease:{recordedDate:'2026-10-31',explainedEntries:families.filter(hasExplanation).length,dossiers:dossierCoverage.entries,mechanisms:Object.keys(deviceActions).length,independentAnatomicalValidation:false,
     neuralink:{studyIds:neuralink.studyIds,postedRegistryResults:studies.filter(s=>s.hasResults===true).length,marketingAuthorizationEstablished:false,sourceReviewDate:'2026-10-31',hardwareRevisionCrosswalkEstablished:false},
     latestIfuGaps:dossierCoverage.labelGaps,scope:'Source-grounded research preview. New Neuralink registry/publication records do not refresh older FDA records. Manufacturer reports, registry facts and historical publications remain distinct.'}
 },null,2)+'\n');
}

// Deterministic, region-balanced review queue, not adjudicated ground truth.
const queue = mappings.filter(m=>m.type==='indication_context');
const buckets=new Map<string,typeof queue>();for(const m of queue)buckets.set(m.structureId!,[...buckets.get(m.structureId!)||[],m]);
const sample:typeof rows=[];let position=0;
while(sample.length<Math.min(150,queue.length)){for(const bucket of buckets.values()){if(bucket[position]&&sample.length<150)sample.push({...bucket[position],independentReviewer:'',adjudication:'unreviewed'});}position++;}
writeFileSync('validation/catalogue-review-queue.json',JSON.stringify({method:'Round-robin across source-mentioned regions; deterministic convenience sample, no independent adjudication or accuracy estimate.',rows:sample},null,2)+'\n');
