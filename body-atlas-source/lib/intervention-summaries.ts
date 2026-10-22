import wholeBodyExplanations from "./whole-body-explanations.json";
// Editorial explanations are record-specific; never apply them by name similarity.
export const interventionSummaries: Record<string, {
  title: string; product: string; purpose: string; relevance: string;
  regions: string[]; recordId: string; sourceUrl?: string; locator: string;
}> = {
  ...wholeBodyExplanations,
  'source-fda-k250173': {
    title: 'Airway management during surgery', product: 'Shiley oral / nasal RAE tracheal tubes',
    purpose: 'Preformed breathing tubes provide airway access during head, neck or mouth surgery. Their shape directs breathing-circuit connections away from the surgical field and reduces kinking.',
    relevance: 'Tracheal tubes belong to the airway. “Murphy eye” is part of the tube’s product name; it does not establish an ocular application.',
    regions: ['BODY:airway'], recordId: 'FDA:K250173', sourceUrl: 'https://www.accessdata.fda.gov/cdrh_docs/pdf25/K250173.pdf',
    locator: 'FDA 510(k) summary, PDF pages 4, 7 and 8; indications, device description and intended use',
  },
  'source-fda-p130008': {
    title: 'Stimulation for obstructive sleep apnea', product: 'Inspire II upper airway stimulator',
    purpose: 'An implanted hypoglossal-nerve stimulation system for a defined subset of patients with obstructive sleep apnea who cannot use or do not respond to positive airway pressure.',
    relevance: 'The original indication concerns upper-airway obstruction. This regional association does not locate the generator or sensing lead.',
    regions: ['BODY:airway'], recordId: 'FDA:P130008:', locator: 'Original FDA approval order statement; eligibility restrictions apply',
  },
  'source-fda-p010047': {
    title: 'Sealing air leaks after lung surgery', product: 'Progel pleural air leak sealant',
    purpose: 'Applied to the lung’s outer covering after sutures or staples during open lung resection, to seal visible air leaks of at least 2 mm.',
    relevance: 'The original indication explicitly identifies visceral pleura and lung resection. It describes a lung-surface application, not an airway implant.',
    regions: ['BODY:lung'], recordId: 'FDA:P010047:', locator: 'Original FDA approval order statement',
  },
  'source-fda-p130013': {
    title: 'Left atrial appendage closure', product: 'WATCHMAN LAA closure technology',
    purpose: 'Closes the left atrial appendage to reduce thromboembolism risk in a specified group of patients with non-valvular atrial fibrillation. The original indication includes stroke-risk, warfarin-suitability and treatment-selection requirements.',
    relevance: 'The left atrial appendage is part of the heart. This is an appendage-closure intervention, not a coronary stent or heart-valve replacement.',
    regions: ['BODY:heart'], recordId: 'FDA:P130013:', locator: 'Original FDA approval order statement',
  },
  'source-fda-p140031': {
    title: 'Transcatheter aortic valve replacement', product: 'Edwards SAPIEN 3 heart valve',
    purpose: 'A replacement aortic valve for severe native calcific aortic stenosis. The original approval covered symptomatic patients judged at high or greater risk for open surgery.',
    relevance: 'The treated structure is the aortic heart valve. “Aortic” here does not establish a separate intervention in the wall of the aorta.',
    regions: ['BODY:heart-valves'], recordId: 'FDA:P140031:', locator: 'Original FDA approval order statement; original risk criteria',
  },
  'source-fda-p020023': {
    title: 'Dermal filling for facial folds', product: 'Restylane injectable gel',
    purpose: 'Placed in the mid-to-deep dermis to correct moderate to severe facial wrinkles and folds, including nasolabial folds, under the original indication.',
    relevance: 'The source explicitly identifies the dermis: the relevant anatomy is skin, not a neurological target.',
    regions: ['BODY:skin'], recordId: 'FDA:P020023:', locator: 'Original FDA approval order statement',
  },
};
