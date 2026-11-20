// Component references support these qualitative drawings, not dimensions or surgical placement.
export const deviceIllustrations: Record<string, {
  title: string;
  parts: [string, string, string];
  sourceUrl: string;
  locator: string;
}> = {
  rns: { title: 'Cranial sensing and stimulation', parts: ['Cranial neurostimulator', 'Cortical strip lead', 'Depth lead'], sourceUrl: 'https://www.accessdata.fda.gov/cdrh_docs/pdf10/P100026B.pdf', locator: 'Device description, implanted components' },
  neuralink: { title: 'Recording to external control', parts: ['Recording implant', 'Illustrative threads', 'External computer'], sourceUrl: 'https://neuralink.com/pdfs/PRIME-Study-Brochure.pdf', locator: 'N1 Implant and external-device control; thread count is not represented' },
  activa: { title: 'Deep brain stimulation', parts: ['Pulse generator', 'Extension', 'DBS lead contacts'], sourceUrl: 'https://www.accessdata.fda.gov/cdrh_docs/pdf/P960009B.pdf', locator: 'Section 5, device description' },
  vns: { title: 'Vagus nerve stimulation', parts: ['Pulse generator', 'Lead', 'Helical nerve interface'], sourceUrl: 'https://www.accessdata.fda.gov/cdrh_docs/pdf/P970003b.pdf', locator: 'Section 5.4, helical electrodes and anchor tether' },
  precision: { title: 'Spinal cord stimulation', parts: ['Pulse generator', 'Lead', 'Epidural contacts'], sourceUrl: 'https://www.accessdata.fda.gov/cdrh_docs/pdf3/P030017B.pdf', locator: 'Device description; epidural lead placement' },
  tms: { title: 'External magnetic stimulation', parts: ['External coil', 'Head reference', 'Cortical target context'], sourceUrl: 'https://www.accessdata.fda.gov/cdrh_docs/pdf13/K130233.pdf', locator: 'Device description; external magnetic stimulation' },
  exablate: { title: 'Focused ultrasound ablation', parts: ['External transducer', 'Illustrative beam paths', 'Target context'], sourceUrl: 'https://www.accessdata.fda.gov/cdrh_docs/pdf15/P150038B.pdf', locator: 'Device description; hemispherical transducer' },
  'source-fda-p060040': { title: 'Axial-flow ventricular assistance', parts: ['Inflow connection', 'Axial pump', 'Outflow graft'], sourceUrl: 'https://www.accessdata.fda.gov/cdrh_docs/pdf6/P060040B.pdf', locator: 'Device description; HeartMate II pump and conduits' },
  'source-fda-p140031': { title: 'Transcatheter aortic valve', parts: ['Expandable frame', 'Tissue leaflets', 'Valve opening'], sourceUrl: 'https://www.accessdata.fda.gov/cdrh_docs/pdf14/P140031B.pdf', locator: 'Device description; SAPIEN 3 frame and valve' },
  'source-fda-p180002': { title: 'One-way bronchial valve', parts: ['Retainer', 'Silicone membrane', 'Duckbill valve'], sourceUrl: 'https://www.accessdata.fda.gov/cdrh_docs/pdf18/P180002C.pdf', locator: 'Section 1.0, figure 1; one-way duckbill valve' },
  'source-fda-p220023': { title: 'Catheter-based renal denervation', parts: ['Catheter shaft', 'Balloon and transducer', 'Arterial / nerve context'], sourceUrl: 'https://www.accessdata.fda.gov/cdrh_docs/pdf22/P220023C.pdf', locator: 'Section 1, distal balloon and ultrasound transducer' },
  'source-fda-p040033': { title: 'Hip resurfacing articulation', parts: ['Acetabular cup', 'Femoral head cap', 'Retained femoral neck'], sourceUrl: 'https://www.accessdata.fda.gov/cdrh_docs/pdf4/P040033c.pdf', locator: 'Device description; resurfacing components and hybrid fixation' },
};
