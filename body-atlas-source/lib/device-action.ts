import { familyMappings, familyById } from './atlas';
import { interventionSummaries } from './intervention-summaries';
import { humanRegionLocators } from './annotations';
import organs from '../public/anatomy/organ-regions.json';

export interface DeviceAction {
  kind: 'recording' | 'electrode' | 'coil' | 'ultrasound' | 'valve' | 'pump' | 'joint';
  region: string;
  steps: [string, string, string];
  sourceUrl: string;
  locator: string;
  limit: string;
}
const source = (id: string) => familyMappings(id)[0];
const neuro = (id: string, kind: DeviceAction['kind'], region: string, steps: DeviceAction['steps'], limit: string): DeviceAction => ({
  kind, region, steps, sourceUrl: source(id).sourceUrl, locator: source(id).locator, limit,
});
// Schematic mechanisms, never CAD models, electrical/thermal fields or implant coordinates.
export const deviceActions: Record<string, DeviceAction> = {
  rns: neuro('rns', 'recording', 'UBERON:0000955', ['Sense brain electrical activity', 'Detect configured activity patterns', 'Deliver responsive stimulation'], 'Historical RNS configuration. Foci and lead paths are patient-specific; the diagram does not predict seizure control.'),
  tms: neuro('tms', 'coil', 'UBERON:0000956', ['Coil contacts the external head', 'Brief magnetic pulses are delivered', 'Electrical currents are induced in cortex'], 'No hemisphere, gyrus, field distribution or treatment dose is modeled.'),
  activa: neuro('activa', 'electrode', 'UBERON:0001897', ['Implanted generator supplies pulses', 'Extension connects to the DBS lead', 'Electrodes stimulate thalamic VIM'], 'Original unilateral tremor indication. Whole-body view marks the brain region; VIM requires the dedicated brain view.'),
  vns: neuro('vns', 'electrode', 'UBERON:0001759', ['Generator is implanted in the left chest', 'Lead connects to the left vagus nerve', 'Electrical pulses stimulate the nerve'], 'The neck locator is regional. Neither the vagus nerve nor a surgical lead path is reconstructed.'),
  exablate: neuro('exablate', 'ultrasound', 'UBERON:0001897', ['External transducer emits ultrasound', 'Energy is focused at thalamic VIM', 'Target tissue is thermally ablated'], 'Beam lines are explanatory. No acoustic propagation, temperature, dose or treatment planning is simulated.'),
  precision: neuro('precision', 'electrode', 'UBERON:0002240', ['Generator supplies electrical pulses', 'Leads sit in the epidural space', 'Electrical stimulation acts on spinal pathways'], 'Epidural placement does not mean spinal cord penetration. Vertebral level and lead trajectory are not assigned.'),
};
const wholeBody: [string, DeviceAction['kind'], string, DeviceAction['steps'], string][] = [
  ['source-fda-p060040', 'pump', 'BODY:heart', ['An implanted assist system supports circulation', 'A pump assists the failing left ventricle', 'Original indication: bridge to transplantation'], 'Historical HeartMate II indication. Pump position, cannula path and blood flow are not reconstructed.'],
  ['source-fda-p140031', 'valve', 'BODY:heart-valves', ['A replacement valve is delivered by catheter', 'The prosthesis replaces the stenotic aortic valve', 'Valve function supports forward blood flow'], 'The available mesh is the whole heart, not an aortic-valve model. No catheter path or deployment dynamics is claimed.'],
  ['source-fda-p180002', 'valve', 'BODY:lung', ['A bronchoscopic procedure places a valve', 'The implant treats a selected emphysematous region', 'Eligibility depends on collateral ventilation'], 'The lungs are the reference region. Individual bronchi, treated lobes and airflow are not reconstructed.'],
  ['source-fda-p220023', 'ultrasound', 'BODY:kidney', ['A renal-denervation system delivers ultrasound', 'The intervention acts on renal sympathetic nerves', 'It is an adjunctive hypertension treatment'], 'Kidneys provide regional context. Renal arteries, nerve positions and energy distribution are not modeled.'],
  ['source-fda-p040033', 'joint', 'BODY:hip', ['A femoral-head component is cemented', 'An acetabular component is cementless', 'The resurfaced joint articulates'], 'The pelvis is a regional reference. The schematic is not the Birmingham implant shape, dimensions or a patient-specific reconstruction.'],
];
for (const [id, kind, region, steps, limit] of wholeBody) {
  const summary = interventionSummaries[id];
  const mapping = source(id);
  deviceActions[id] = { kind, region, steps, limit, sourceUrl: summary.sourceUrl || mapping.sourceUrl, locator: summary.locator };
}

const parentGeometry: Record<string, string> = {
  'UBERON:0000956':'UBERON:0000955', 'UBERON:0001897':'UBERON:0000955', 'UBERON:0001906':'UBERON:0000955',
  'BODY:spinal-epidural':'UBERON:0002240',
  'BODY:heart-valves': 'BODY:heart', 'BODY:coronary': 'BODY:heart',
  'BODY:cornea': 'BODY:eye', 'BODY:retina': 'BODY:eye', 'BODY:lens': 'BODY:eye',
};
export function anatomyFocus(id: string) {
  if (!familyById(id)) return null;
  const accepted = familyMappings(id).filter(m => m.structureId && m.state !== 'Unknown');
  const preferred = deviceActions[id]?.region || interventionSummaries[id]?.regions[0] ||
    accepted.find(m => ['physiological_target', 'therapeutic_action_site', 'tissue_interface'].includes(m.type))?.structureId || accepted[0]?.structureId;
  if (!preferred) return null;
  const referenceRegion = parentGeometry[preferred] || preferred;
  if (!humanRegionLocators[referenceRegion]) return null;
  return { region: referenceRegion, intendedRegion: preferred, geometry: Object.hasOwn(organs, referenceRegion)||['UBERON:0000955','UBERON:0002240'].includes(referenceRegion), broaderReference: referenceRegion !== preferred };
}
