import unittest,tempfile,json
from pathlib import Path
from pipeline import ROOT,connect,persist
from acquire import neuralink_plan,NEURALINK_TRIALS

class NeuralinkScopeTests(unittest.TestCase):
    def test_plan_is_bounded_and_exact(self):
        plan=neuralink_plan();self.assertEqual(len(plan),2)
        self.assertIn('pageSize=20',plan[0][2]);self.assertEqual(len(NEURALINK_TRIALS),6)
        self.assertIn('31642810',plan[1][2])
    def test_wrong_sponsor_or_missing_study_never_replaces_good_batch(self):
        manifest=json.loads((ROOT/'data/atlas.json').read_text())
        src=next(s for s in manifest['sources'] if s['job_id']=='neuralink-trials')
        raw=(ROOT/src['path']).read_bytes();good=json.loads(raw)
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);db=connect(root/'atlas.sqlite');job={'id':'neuralink-trials','kind':'trial','url':neuralink_plan()[0][2]}
            db.execute('INSERT INTO jobs(id,kind,url) VALUES(?,?,?)',tuple(job.values()));db.commit()
            self.assertEqual(persist(db,job,raw,root),6)
            for change in ['sponsor','membership','missing-results','invalid-results']:
                bad=json.loads(raw)
                if change=='sponsor':bad['studies'][0]['protocolSection']['sponsorCollaboratorsModule']['leadSponsor']['name']='Another organization'
                elif change=='membership':bad['studies'].pop()
                elif change=='missing-results':bad['studies'][0].pop('hasResults')
                else:bad['studies'][0]['hasResults']='false'
                with self.assertRaises(ValueError):persist(db,job,json.dumps(bad).encode(),root)
                self.assertEqual(db.execute('SELECT count(*) FROM records').fetchone()[0],6)
                self.assertEqual(db.execute('SELECT count(*) FROM artifacts').fetchone()[0],1)
