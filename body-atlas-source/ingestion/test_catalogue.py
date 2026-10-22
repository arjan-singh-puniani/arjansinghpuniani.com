import json,unittest
from pathlib import Path
from urllib.parse import urlparse,parse_qs
from acquire import whole_body_plan
from build_catalogue import contexts
from pipeline import validate
ROOT=Path(__file__).resolve().parent.parent
class CatalogueTests(unittest.TestCase):
 def setUp(self):self.regions=json.loads((ROOT/'data/body-regions.json').read_text())
 def hits(self,text,kind='510k'):
  record={'kind':kind,'title':text,'statement':text if kind=='pma' else ''}
  return [m['region']['id'] for m in contexts(record,self.regions)[0]]
 def test_bounded_official_acquisition(self):
  jobs=whole_body_plan();self.assertEqual(len(jobs),18);self.assertEqual(len({j[0] for j in jobs}),18)
  for _,_,url in jobs:
   self.assertEqual(urlparse(url).hostname,'api.fda.gov');self.assertLessEqual(int(parse_qs(urlparse(url).query)['limit'][0]),500)
  ortho=next(j for j in jobs if 'OR-quoted' in j[0]);self.assertEqual(parse_qs(urlparse(ortho[2]).query)['search'],['advisory_committee:"OR"'])
  self.assertIn('pma_number:P*',parse_qs(urlparse(jobs[1][2]).query)['search'][0])
 def test_incidental_words_do_not_become_anatomy(self):
  self.assertNotIn('BODY:hand',self.hits('Hand-held dental curing light'))
  self.assertIn('BODY:dental',self.hits('Hand-held dental curing light'))
  self.assertNotIn('BODY:foot',self.hits('Oxygen tubing 50 feet long'))
  self.assertNotIn('BODY:foot',self.hits('Oxygen tubing 6 foot long'))
  self.assertNotIn('BODY:hand',self.hits('Handpiece for dental use'))
  self.assertNotIn('BODY:eye',self.hits('Visible to the naked eye'))
 def test_product_features_are_not_anatomical_targets(self):
  self.assertEqual(self.hits('Shiley Oral RAE Tracheal Tube Cuffed, Murphy Eye'),['BODY:airway'])
  self.assertNotIn('BODY:eye',self.hits('Needle eye for surgical suture'))
  self.assertIn('BODY:eye',self.hits('Ophthalmic instrument for the eye'))
  self.assertNotIn('BODY:aorta',self.hits('Transcatheter aortic valve replacement'))
  self.assertIn('BODY:heart-valves',self.hits('Transcatheter aortic valve replacement'))
 def test_cortical_bone_and_pulmonary_valve_are_not_brain_or_lung(self):
  self.assertNotIn('UBERON:0000956',self.hits('Cortical bone screw'))
  self.assertNotIn('BODY:lung',self.hits('Pulmonary valve replacement for severe pulmonary stenosis'))
  self.assertIn('BODY:heart-valves',self.hits('Pulmonary valve replacement for severe pulmonary stenosis'))
 def test_specimen_and_negated_context_abstains(self):
  self.assertEqual(self.hits('In vitro heart failure assay'),[])
  self.assertNotIn('BODY:knee',self.hits('Not indicated for knee surgery','pma'))
 def test_explicit_context_keeps_child_and_abstains_from_parent_duplicate(self):
  self.assertEqual(self.hits('Coronary stent'),['BODY:coronary'])
  self.assertIn('BODY:knee',self.hits('Knee replacement implant'))
  self.assertEqual(self.hits('Medical software with no anatomical phrase'),[])
 def test_expanded_region_patterns_retain_anatomical_specificity(self):
  self.assertIn('BODY:lower-limb-vessels',self.hits('Stent for above-the-knee femoropopliteal arteries'))
  self.assertNotIn('BODY:knee',self.hits('Stent for above-the-knee femoropopliteal arteries'))
  self.assertIn('BODY:esophagus',self.hits('Gastroesophageal reflux disease','pma'))
  self.assertIn('BODY:skin',self.hits('Subdermal implantation for facial folds','pma'))
  self.assertIn('BODY:liver',self.hits('Unresectable hepatocellular carcinoma','pma'))
 def test_legacy_nda_identifier_never_relabelled_pma(self):
  with self.assertRaises(ValueError):validate('pma',{'results':[{'pma_number':'N123456','supplement_number':'','decision_date':'19990101','decision_code':'APPR'}]})
 def test_generated_snapshot_relationships_are_exact_and_unreviewed(self):
  data=json.loads((ROOT/'data/catalogue.json').read_text());records={r['id']:r for r in json.loads((ROOT/'data/atlas.json').read_text())['records']}
  self.assertGreaterEqual(len(data['mappings']),600)
  for m in data['mappings']:
   e=m['evidence'];r=records[e['recordId']];text=r[e['field']]
   self.assertEqual(text[slice(*e['span'])],e['quote']);self.assertEqual(e['quote'],m['assertion'])
   self.assertEqual(m['type'],'indication_context');self.assertEqual(m['state'],'Provisional');self.assertEqual(e['sourceSha'],r['sourceSha'])
if __name__=='__main__':unittest.main()
