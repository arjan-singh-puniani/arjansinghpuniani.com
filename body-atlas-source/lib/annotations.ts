import { familyMappings, structures, descendants } from "./atlas";
import regionDefinitions from "@/data/body-regions.json";
import organRegions from "@/public/anatomy/organ-regions.json";
import displayAnchors from "@/public/anatomy/display-anchors.json";
import { interventionNames } from "./intervention-view";
import type { Family, Mapping } from "./types";

export interface InterventionAnnotation {
  familyId: string;
  name: string;
  title: string;
  mapping: Mapping;
  regionName: string;
  role: string;
}
const brain = [
  "UBERON:0000955",
  "UBERON:0000956",
  "UBERON:0001897",
  "UBERON:0001906",
];
const titles: Record<string, string> = {
  neuralink:'Neuralink · brain–computer interface',
  tms: "Magnetic stimulation",
  rns: "Responsive stimulation",
  activa: "DBS · Activa",
  brio: "DBS · Brio",
  vns: "Vagus stimulation",
  exablate: "Focused ultrasound",
  precision: "Spinal stimulation",
  braingate: "Intracortical recording",
  cooling: "Cortical cooling",
};
const roles: Record<Mapping["type"], string> = {
  implantation_site: "Implanted",
  tissue_interface: "Contacts",
  measurement_site: "Records",
  physiological_target: "Targets",
  therapeutic_action_site: "Acts on",
  delivery_location: "Delivers",
  external_placement: "External",
  unlocalized: "Unlocalized",
  indication_context: "Source mentions",
};
const priority = [
  "physiological_target",
  "therapeutic_action_site",
  "tissue_interface",
  "measurement_site",
  "implantation_site",
  "external_placement",
  "delivery_location",
  "indication_context",
];
export function interventionAnnotations(
  families: Family[],
  region: string,
): InterventionAnnotation[] {
  return families.flatMap((f) => {
    const accepted = familyMappings(f.id).filter(
      (m) => m.structureId && (["Verified", "Supported"].includes(m.state) || (m.type === "indication_context" && m.state === "Provisional")),
    );
    const regional =
      region === "all"
        ? accepted
        : accepted.filter(
            (m) =>
              m.structureId === region ||
              descendants(region).includes(m.structureId!),
          );
    const mapping = [...regional].sort(
      (a, b) => priority.indexOf(a.type) - priority.indexOf(b.type),
    )[0];
    if (!mapping) return [];
    return [
      {
        familyId: f.id,
        name: f.name,
        title: titles[f.id] || interventionNames[f.id] || f.name,
        mapping,
        regionName:
          structures.find((s) => s.id === mapping.structureId)?.name ||
          mapping.structureId!,
        role: roles[mapping.type],
      },
    ];
  });
}
export const referenceSurfaceAnchors:Record<string,(typeof displayAnchors.anchors)['BODY:heart']> = displayAnchors.anchors;
const regionByNode = new Map(Object.entries(referenceSurfaceAnchors).flatMap(([id,a])=>a.nodes.map(name=>[name,id] as const)));
export function referenceRegionsForNode(node:{name:string;parent:unknown}):string[]{
  const regions:string[]=[];
  for(let current:typeof node|null=node;current;current=current.parent as typeof node|null){const id=regionByNode.get(current.name);if(id)regions.push(id);}
  return regions;
}
export function anchorDescription(id:string){
  return Object.hasOwn(referenceSurfaceAnchors,id)?'Representative reference surface':'Approximate region · detailed geometry unavailable';
}
// Display locators share the original reference frame; none are device placement coordinates.
export const humanRegionLocators: Record<string, [number, number, number]> = {
  "UBERON:0000955": [0.12, 2.58, 0.25],
  "UBERON:0000956": [0.12, 2.58, 0.25],
  "UBERON:0001897": [0.12, 2.58, 0.25],
  "UBERON:0001906": [0.12, 2.58, 0.25],
  "UBERON:0003129": [0.12, 2.58, 0.25],
  "BODY:external-head": [0.12, 2.58, 0.25],
  "UBERON:0001759": [-0.2, 1.94, 0.18],
  "BODY:chest-wall": [0.4, 1.17, 0.2],
  "UBERON:0002240": [-0.1, 0.45, -0.2],
  "BODY:spinal-epidural": [-0.1, 0.45, -0.2],
  ...Object.fromEntries(regionDefinitions.filter(r=>r.locator).map(r=>[r.id,r.locator as [number,number,number]])),
  ...Object.fromEntries(Object.entries(organRegions).map(([id,region])=>[id,region.center as [number,number,number]])),
  ...Object.fromEntries(Object.entries(referenceSurfaceAnchors).map(([id,a])=>[id,a.position as [number,number,number]])),
};
for(const [child,parent] of [['UBERON:0000956','UBERON:0000955'],['BODY:retina','BODY:eye'],['BODY:lens','BODY:eye']]){
  humanRegionLocators[child]=humanRegionLocators[parent];
}

export interface LabelProjection {
  width: number;
  height: number;
  regions: string[];
  points: Record<string, [number, number]>;
}
