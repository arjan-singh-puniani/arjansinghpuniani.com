export type EvidenceState =
  | "Verified"
  | "Supported"
  | "Provisional"
  | "Unknown";
export type RelationshipType =
  | "implantation_site"
  | "tissue_interface"
  | "measurement_site"
  | "physiological_target"
  | "therapeutic_action_site"
  | "delivery_location"
  | "external_placement"
  | "unlocalized"
  | "indication_context";
export type Modality =
  | "Electrical stimulation"
  | "Electrophysiological recording"
  | "Acoustic intervention"
  | "Thermal modulation"
  | "Magnetic stimulation"
  | "Computational analysis"
  | "Unknown";
export interface AtlasRecord {
  id: string;
  kind: string;
  title: string;
  url: string;
  sourceUrl: string;
  sourceSha: string;
  retrievedAt: string;
  providerUpdatedAt: string | null;
  applicant?: string;
  application?: string;
  supplement?: string;
  productCode?: string;
  decisionDate?: string;
  decisionCode?: string;
  status?: string;
  statement?: string;
  genericName?: string;
  medicalSpecialty?: string;
  firstPosted?: string;
  publicationDate?: string;
  authors?: string[];
  journal?: string;
  summary?: string;
  sponsor?: string;
  organization?: string;
  investigators?: string[];
  projectNumber?: string;
  fiscalYear?: number;
  definition?: string;
  deviceClass?: string;
  interventions?: { name: string; description?: string; type: string }[];
}
export interface Structure {
  id: string;
  name: string;
  parent: string | null;
  synonyms: string[];
  region: string;
  laterality: string;
  species: string;
  source: string;
  geometry: string | null;
}
export interface Mapping {
  id: string;
  familyId: string;
  component: string;
  structureId: string | null;
  type: RelationshipType;
  state: EvidenceState;
  precision: "region" | "structure" | "unlocalized";
  laterality: string;
  assertion: string;
  sourceUrl: string;
  locator: string;
  method: string;
  limitations: string;
  reviewedAt: string;
  evidence?: {recordId:string;sourceSha:string;matchedText:string;quote:string;span:number[];field:string;ruleId:string};
}
export interface Family {
  collection?: "reviewed" | "catalogue";
  sourceField?: string;
  id: string;
  name: string;
  description: string;
  modalities: Modality[];
  regulatoryIds: string[];
  studyIds: string[];
  publicationIds: string[];
  topics: string[];
  limitations: string;
}
export interface HistoricalEvent {
  id: string;
  familyId: string;
  date: string;
  label: string;
  kind: string;
  sourceUrl: string;
  recordId: string;
  state: EvidenceState;
}
