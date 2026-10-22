import { familyMappings, recordById } from "./atlas";
import type { AtlasRecord, Family } from "./types";

// Display labels summarize existing curated source assertions; they add no graph edges.
import catalogue from "@/data/catalogue.json";
export const interventionNames: Record<string, string> = {
  ...Object.fromEntries(catalogue.families.map(f=>[f.id,f.name])),
  tms: "Transcranial magnetic stimulation",
  rns: "Responsive neurostimulation",
  activa: "Deep brain stimulation",
  brio: "Deep brain stimulation · STN / VIM",
  vns: "Vagus nerve stimulation",
  exablate: "Focused ultrasound ablation",
  precision: "Spinal cord stimulation",
  cochlear: "Cochlear implant",
  braingate: "Intracortical recording",
  cooling: "Focal cortical cooling",
};
export function primaryRecords(f: Family): AtlasRecord[] {
  const ids = f.regulatoryIds.length
    ? f.regulatoryIds
    : f.studyIds.length
      ? f.studyIds
      : f.publicationIds;
  return ids.map(recordById).filter((r): r is AtlasRecord => !!r);
}
export function primaryLabel(r: AtlasRecord): string {
  return r.application
    ? `FDA ${r.application}`
    : r.id.replace(/^PMID:/, "PubMed ");
}
export function regionRoles(f: Family, region: string): string[] {
  const roles: Record<string, string> = {
    implantation_site: "Implant placement",
    tissue_interface: "Tissue contact",
    measurement_site: "Recording",
    physiological_target: "Intended target",
    therapeutic_action_site: "Action site",
    delivery_location: "Delivery",
    external_placement: "External placement",
    unlocalized: "Location unreviewed",
    indication_context: "Source context · Unreviewed",
  };
  const matches = familyMappings(f.id).filter(
    (m) =>
      region === "all" ||
      m.structureId === region ||
      (region === "UBERON:0000955" &&
        ["UBERON:0000956", "UBERON:0001897", "UBERON:0001906"].includes(
          m.structureId || "",
        )),
  );
  return [...new Set(matches.map((m) => roles[m.type]))];
}

export const interventionActions: Record<string, string> = {
  ...Object.fromEntries(catalogue.families.map(f=>[f.id,f.description])),
  tms: "An external coil uses magnetic pulses to induce electrical currents in cerebral cortex.",
  rns: "Records brain electrical activity and delivers responsive electrical stimulation near epileptic foci.",
  activa: "Implanted electrodes stimulate thalamic VIM for tremor suppression.",
  brio: "Electrical stimulation targets STN or VIM in the original FDA indications.",
  vns: "Delivers electrical pulses through a lead at the left vagus nerve; the generator sits in the chest.",
  exablate:
    "External focused ultrasound thermally ablates thalamic VIM tissue.",
  precision:
    "Epidural leads deliver electrical stimulation; the spinal cord is the broad intended target.",
  cochlear:
    "Historical hearing prosthesis. Component placement is awaiting source review.",
  braingate:
    "Investigational sensors record activity from speech-related cortex.",
  cooling:
    "Investigational cooling of the cortical surface during functional brain mapping.",
};
