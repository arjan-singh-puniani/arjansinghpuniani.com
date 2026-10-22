import unittest
from mapping_queue import candidate,validate_review
class MappingQueueTests(unittest.TestCase):
    def row(self,title):return candidate({'id':'FDA:K123456','title':title,'url':'https://www.accessdata.fda.gov/','sourceSha':'a'*64})
    def test_software_never_becomes_an_intracranial_implant(self):
        r=self.row('Brain EEG Analysis Software');self.assertEqual(r['relationshipType'],'unlocalized');self.assertFalse(r['automaticallyAccepted'])
    def test_external_eeg_not_assigned_to_intracardiac_or_cortical_tissue(self):
        r=self.row('External EEG System');self.assertEqual(r['evidenceState'],'Unknown');self.assertEqual(r['candidateStructureIds'],'')
    def test_anatomical_word_is_a_candidate_only(self):
        r=self.row('Vagus Nerve Stimulator');self.assertEqual(r['evidenceState'],'Provisional');self.assertEqual(r['spatialPrecision'],'unlocalized');self.assertFalse(r['automaticallyAccepted'])
    def test_multi_component_location_cannot_be_collapsed(self):
        r=self.row('Brain stimulator with chest generator');self.assertEqual(r['relationshipType'],'unlocalized');self.assertFalse(r['automaticallyAccepted'])
    def test_acceptance_requires_evidence_and_attributed_review(self):
        r=self.row('Brain stimulator');r['reviewStatus']='accepted'
        with self.assertRaises(ValueError):validate_review(r)
    def test_rejection_is_preserved_without_placement(self):
        r=self.row('Brain stimulator');r['reviewStatus']='rejected';self.assertTrue(validate_review(r))
