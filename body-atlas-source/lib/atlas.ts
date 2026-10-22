import { dossierBrief } from "./dossiers";
import snapshot from "@/data/atlas.json";
import { families as curatedFamilies, frontier, mappings as curatedMappings, structures as curatedStructures } from "./curation";
import catalogue from "@/data/catalogue.json";
import { interventionSummaries } from "./intervention-summaries";
import regionDefinitions from "@/data/body-regions.json";
import type { AtlasRecord, Family, HistoricalEvent, Mapping, Structure } from "./types";
export const families:Family[]=[...curatedFamilies,...catalogue.families as Family[]];
export const mappings:Mapping[]=[...curatedMappings,...(catalogue.mappings as Mapping[]).filter(m => !interventionSummaries[m.familyId] || interventionSummaries[m.familyId].regions.includes(m.structureId || ""))];
export const structures:Structure[]=[...curatedStructures,...regionDefinitions.filter(s=>!curatedStructures.some(c=>c.id===s.id))];
export const catalogueCoverage=catalogue.coverage;
export const records = snapshot.records as AtlasRecord[];
export const coverage = {
  exportedAt: snapshot.exportedAt,
  mode: snapshot.mode,
  jobs: snapshot.jobs,
  sources: snapshot.sources,
};
const recordIndex=new Map(records.map(r=>[r.id,r])),familyIndex=new Map(families.map(f=>[f.id,f]));
const mappingIndex=new Map<string,Mapping[]>();for(const m of mappings)mappingIndex.set(m.familyId,[...mappingIndex.get(m.familyId)||[],m]);
export const recordById = (id: string) => recordIndex.get(id);
export const familyById = (id: string) => familyIndex.get(id);
export const familyMappings = (id: string) => mappingIndex.get(id)||[];
export const relationshipLabels: Record<string, string> = {
  implantation_site: "Physical implantation",
  tissue_interface: "Physical tissue interface",
  measurement_site: "Measurement site",
  physiological_target: "Physiological target",
  therapeutic_action_site: "Intended action site",
  delivery_location: "Delivery location",
  external_placement: "External placement",
  unlocalized: "Unlocalized",
  indication_context: "FDA source context (unreviewed)",
};
const descendantCache=new Map<string,string[]>();
export function descendants(id: string): string[] {
  if(descendantCache.has(id))return descendantCache.get(id)!;
  const result = [
    id,
    ...structures
      .filter((s) => s.parent === id)
      .flatMap((s) => descendants(s.id)),
  ];
  descendantCache.set(id,result);return result;
}
export function matchesRegion(f: Family, id: string) {
  if (id === "all") return true;
  const ids = descendants(id);
  return familyMappings(f.id).some(
    (m) => m.structureId && ids.includes(m.structureId),
  );
}
export const authorized = (f: Family) =>
  f.regulatoryIds.some((id) =>
    ["PMA approval", "510(k) clearance", "De Novo authorization"].includes(
      recordById(id)?.status || "",
    ),
  );
export const statusOf = (f: Family) =>
  f.regulatoryIds
    .map((id) => recordById(id)?.status)
    .filter(Boolean)
    .join(", ") || "Investigational / research";
const eventCache=new Map<string,HistoricalEvent[]>();
function familyEvents(f:Family):HistoricalEvent[]{
 if(eventCache.has(f.id))return eventCache.get(f.id)!;
 const events:HistoricalEvent[]=[];
 for(const id of f.regulatoryIds){const r=recordById(id);if(r?.decisionDate)events.push({id:r.id,familyId:f.id,date:r.decisionDate,label:`${f.name} — ${r.status}`,kind:'Regulatory decision',sourceUrl:r.url,recordId:r.id,state:'Verified'});}
 for(const id of f.studyIds){const r=recordById(id);if(r?.firstPosted)events.push({id:r.id,familyId:f.id,date:r.firstPosted,label:r.title,kind:'Study first posted',sourceUrl:r.url,recordId:r.id,state:'Supported'});}
 for(const id of f.publicationIds){const r=recordById(id),d=r?.publicationDate&&publicationDate(r.publicationDate);if(r&&d)events.push({id:r.id,familyId:f.id,date:d,label:r.title,kind:`Publication (${d.length===10?'day':d.length===7?'month':'year'} precision)`,sourceUrl:r.url,recordId:r.id,state:'Supported'});}
 events.sort((a,b)=>a.date.localeCompare(b.date));eventCache.set(f.id,events);return events;
}
export function timeline(familyIds:string[]):HistoricalEvent[]{return familyIds.flatMap(id=>{const f=familyById(id);return f?familyEvents(f):[];}).sort((a,b)=>a.date.localeCompare(b.date));}
export function publicationDate(value: string): string | null {
  const match = value.match(
    /^(\d{4})(?: (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(?: (\d{1,2}))?)?$/,
  );
  if (!match) return null;
  const [, year, month, day] = match;
  if (!month) return year;
  const mm = String(
    [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ].indexOf(month) + 1,
  ).padStart(2, "0");
  if (!day) return `${year}-${mm}`;
  const iso = `${year}-${mm}-${day.padStart(2, "0")}`;
  return new Date(iso + "T00:00:00Z").toISOString().slice(0, 10) === iso
    ? iso
    : null;
}
export function firstEventYear(f: Family) {
  return Number(familyEvents(f)[0]?.date.slice(0, 4) || 9999);
}

const stop = new Set(
  "which what are is the a an and of for to with have has humanity attempted measure repair modify augment at particular anatomical location evidence exists remains unresolved authorized approved cleared devices technologies associated currently involve system research tell me about on in there".split(
    " ",
  ),
);
export function tokens(text: string) {
  return (
    text
      .toLowerCase()
      .replace(/[-/]/g, " ")
      .match(/[\p{L}\p{N}]+/gu)
      ?.filter((t) => t.length > 1 && !stop.has(t)) || []
  );
}
const searchTextCache=new Map<string,string>();
export function searchFamilies(
  query: string,
  region = "all",
  modality = "all",
  authorization = "all",
  year = 2026,
) {
  const terms = tokens(query);
  const requiresAuthorization =
    authorization === "authorized" ||
    /\b(authorized|approved|cleared)\b/i.test(query);
  return families
    .map((f) => {
      if(!terms.length)return {family:f,score:0};
      const text = searchTextCache.get(f.id) || [
        f.name,
        f.description,
        interventionSummaries[f.id]?.title || "",
        interventionSummaries[f.id]?.purpose || "",
        ...f.topics,
        ...f.modalities,
        ...familyMappings(f.id).map(
          (m) => structures.find((s) => s.id === m.structureId)?.name || "",
        ),
        ...f.regulatoryIds.map((id) => {
          const r = recordById(id);
          return r ? `${r.application} ${r.applicant}` : "";
        }),
      ]
        .join(" ")
        .toLowerCase();
      searchTextCache.set(f.id,text);
      const words = new Set(text.match(/[\p{L}\p{N}]+/gu) || []);
      const score = terms.reduce(
        (sum, t) =>
          sum + (words.has(t) || words.has(t.replace(/s$/, "")) ? 1 : 0),
        0,
      );
      return { family: f, score };
    })
    .filter(
      ({ family: f, score }) =>
        (!terms.length || score >= Math.min(2, terms.length)) &&
        matchesRegion(f, region) &&
        (modality === "all" || f.modalities.includes(modality as never)) &&
        (!requiresAuthorization || authorized(f)) &&
        (authorization !== "research" || !authorized(f)) &&
        firstEventYear(f) <= year,
    )
    .sort((a,b)=>b.score-a.score || Number(a.family.collection==='catalogue')-Number(b.family.collection==='catalogue') || Number(b.family.sourceField==='statement')-Number(a.family.sourceField==='statement') || (a.family.collection==='catalogue'?(recordById(b.family.regulatoryIds[0])?.decisionDate||'').localeCompare(recordById(a.family.regulatoryIds[0])?.decisionDate||''):0));
}
export function retrieve(query: string) {
  if (query.length > 500)
    return {
      answer: "Query exceeds the 500-character limit.",
      families: [],
      records: [],
    };
  const relationQuery = /\b(interface|interfaces|implanted|implantation|contacts|target|targets)\b/i.test(query);
  const hits = searchFamilies(query).filter(h=>!relationQuery||h.family.collection!=="catalogue").slice(0, 5);
  const terms = tokens(query);
  if (!terms.length)
    return {
      answer:
        "Enter a target, modality, application identifier, or scientific topic.",
      families: [],
      records: [],
    };
  const ids = new Set(
    hits.flatMap((h) => [
      ...h.family.regulatoryIds,
      ...h.family.studyIds,
      ...h.family.publicationIds,
    ]),
  );
  const fundingQuery = /\b(NIH|funding|grants?|laborator(?:y|ies))\b/i.test(
    query,
  );
  const fundingStop = new Set(
    "nih funding grant grants laboratory laboratories labs relevant received receive funded which who".split(
      " ",
    ),
  );
  const fundingTerms = terms.filter((t) => !fundingStop.has(t));
  const recordHits = records
    .filter(
      (r) =>
        ids.has(r.id) ||
        (fundingQuery &&
          r.kind === "grant" &&
          fundingTerms.every((t) => r.title.toLowerCase().includes(t))) ||
        terms.every((t) =>
          [
            r.title,
            r.applicant,
            r.organization,
            ...(r.investigators || []),
            r.projectNumber,
            r.application,
          ]
            .join(" ")
            .toLowerCase()
            .includes(t),
        ),
    )
    .slice(0, 20);
  return {
    answer: recordHits.length
      ? `Retrieved ${recordHits.length} indexed source records. Statements below describe this cached collection; they do not establish completeness or clinical superiority. FDA text-context matches remain Provisional and do not establish device placement.`
      : "Insufficient indexed evidence. No supported answer was found in this bounded collection.",
    families: hits.map((h) => ({
      ...h.family,
      description: interventionSummaries[h.family.id]?.purpose || (h.family.collection === "catalogue" ? "Purpose not established in indexed evidence. This result is a source-text match only." : h.family.description),
      score: h.score,
      criteria:
        "Count of query terms present in indexed names, topics, modalities, anatomy, or regulatory identity. Unreviewed source context does not establish a physical relationship.",
    })),
    records: recordHits,
  };
}
const md = (text: string) =>
  text.replace(/[\[\]<>`*_\\]/g, "").replace(/[\r\n]+/g, " ");
export function brief(ids: string[], year = 2026): string {
  const fs = ids.map(familyById).filter((f): f is Family => !!f);
  const lines = [
    "# BODY//ATLAS — research brief",
    "",
    `Cached evidence snapshot exported ${coverage.exportedAt}. Timeline cutoff: ${year}.`,
    `Scope: ${fs.map((f) => f.name).join("; ")}. Per-entry dossiers show labeling and safety review status.`,
    `This brief is a reproducible extract of indexed sources. It is not a clinical recommendation.`,
    "",
  ];
  for (const f of fs) {
    lines.push(
      `## ${md(f.name)}`,
      md(interventionSummaries[f.id]?.purpose || (f.collection === "catalogue" ? "Purpose not established in indexed evidence; source text below is not a functional explanation." : f.description)),
      ...(interventionSummaries[f.id] ? [`Anatomical relevance: ${md(interventionSummaries[f.id].relevance)} [Explanation source](${interventionSummaries[f.id].sourceUrl || recordById(f.regulatoryIds[0])!.url}) (${md(interventionSummaries[f.id].locator)}).`] : []),
      `Regulatory evidence: ${statusOf(f)}.`,
      `Modalities: ${f.modalities.join("; ")}.`,
      "",
      "### Component and target relationships",
    );
    for (const m of familyMappings(f.id))
      lines.push(
        `- **${relationshipLabels[m.type]} — ${md(m.component)}**: ${md(m.assertion)} [${m.state}; ${m.precision}; ${m.laterality}]. [Source](${m.sourceUrl}) (${md(m.locator)}). Limitation: ${md(m.limitations)}`,
      );
    lines.push("", "### Linked records");
    for (const id of [...f.regulatoryIds, ...f.studyIds, ...f.publicationIds]) {
      const r = recordById(id);
      if (r)
        lines.push(
          `- [${md(r.title)}](${r.url}) — ${r.id}; ${r.status || r.publicationDate || "publication"}; ${r.decisionDate || r.firstPosted || ""}; retrieved ${r.retrievedAt}; SHA-256 ${r.sourceSha}.`,
        );
    }
    lines.push("", ...dossierBrief(f.id), `Limits: ${md(f.limitations)}`, "");
  }
  lines.push(
    "## Documented events",
    ...timeline(ids)
      .filter((e) => Number(e.date.slice(0, 4)) <= year)
      .map(
        (e) =>
          `- ${e.date}: ${md(e.label)} (${e.kind}). [Source](${e.sourceUrl})`,
      ),
    "",
    "## Questions for further investigation",
  );
  for (const item of frontier.filter((item) =>
    item.families.some((id) => ids.includes(id)),
  ))
    lines.push(
      `### ${item.title}`,
      item.question,
      `Known: ${item.known}`,
      `Uncertain: ${item.uncertain}`,
      `Challenges: ${item.challenges}`,
      ...item.sources.map((s, i) => `[Evidence ${i + 1}](${s})`),
      "",
    );
  lines.push(
    "The collection does not provide a systematic comparative evidence review. Confirm current labeling, selection criteria, follow-up, and relevant unindexed studies before drawing conclusions.",
  );
  return lines.join("\n");
}

export function briefDataUrl(ids: string[], year = 2026): string {
  return `data:text/markdown;charset=utf-8,${encodeURIComponent(brief(ids, year))}`;
}
