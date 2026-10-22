import contextlib, hashlib, io, json, shutil, tempfile, unittest
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError
from dossiers import Cache, HOSTS, direct_ids, pages, parse_index, recall_for, validate_json
from pipeline import fetch
from build_dossiers import ROOT, build

class DossierTests(unittest.TestCase):
    def test_offline_rebuild_is_identical_and_incomplete_refresh_cannot_erase_it(self):
        with tempfile.TemporaryDirectory() as t,contextlib.redirect_stdout(io.StringIO()):
            root=Path(t);(root/'data').mkdir()
            for file in ['dossier-scope.json','dossier-acquisition-index.json','dossier-label-inventory.json','dossier-description-documents.json']:
                shutil.copyfile(ROOT/'data'/file,root/'data'/file)
            shutil.copytree(ROOT/'public/dossier-sources',root/'public/dossier-sources')
            with patch('dossiers.fetch',side_effect=AssertionError('Offline rebuild must not use network')):build(root)
            for file in (ROOT/'public/dossiers').glob('*.json'):
                self.assertEqual(file.read_bytes(),(root/'public/dossiers'/file.name).read_bytes())
            self.assertEqual((ROOT/'data/dossier-summary.json').read_bytes(),(root/'data/dossier-summary.json').read_bytes())
            index=root/'data/dossier-acquisition-index.json';value=json.loads(index.read_text());value['history']['complete']=False;index.write_text(json.dumps(value))
            before=(root/'public/dossiers/activa.json').read_bytes()
            with self.assertRaisesRegex(ValueError,'Incomplete refresh'):build(root)
            self.assertEqual(before,(root/'public/dossiers/activa.json').read_bytes())
    def test_only_direct_identifiers_establish_recall_join(self):
        row={'pma_numbers':['P960009/S9','P100026S041'],'k_numbers':['K130233'],'openfda':{'pma_number':['P140009'],'k_number':['K250173']}}
        self.assertEqual(direct_ids(row),{'P960009','P100026','K130233'})
        self.assertFalse(recall_for(row,'P140009'));self.assertFalse(recall_for(row,'K250173'))
        self.assertEqual(direct_ids({'pma_numbers':['P100040/P070','P050052/SO52','P960009OTHER']}),set())
    def test_schema_and_dates_are_validated_but_malformed_strings_preserved(self):
        validate_json({'meta':{'results':{'total':1}},'results':[{'cfres_id':'3','pma_numbers':['P100040/P070']}]},'recall')
        for data in [[],{}, {'meta':{'results':{'total':'0'}},'results':[]}, {'meta':{'results':{'total':1}},'results':[{'cfres_id':'3','pma_numbers':'P100026'}]}]:
            with self.assertRaises(ValueError):validate_json(data,'recall')
        with self.assertRaises(ValueError):validate_json({'meta':{'results':{'total':1}},'results':[{'pma_number':'P100026','supplement_number':'S041','decision_date':'2026-02-30'}]},'pma')
    def test_empty_search_is_a_specific_provider_response(self):
        validate_json({'error':{'code':'NOT_FOUND','message':'No matches found!'}},'recall')
        for error in [{'code':'NOT_FOUND','message':'Changed schema'},{'code':'SERVER_ERROR','message':'No matches found!'}]:
            with self.assertRaises(ValueError):validate_json({'error':error},'recall')
    def test_archived_notice_columns_can_be_reversed(self):
        raw=b'<table><tr><td>10/21/2026</td><td><a href="/medical-devices/a">A notice</a></td></tr><tr><td><a href="/medical-devices/b">B notice</a></td><td>1/2/2023</td></tr></table>'
        self.assertEqual([r['date'] for r in parse_index(raw,'https://www.fda.gov/index')['rows']],['10/21/2026','1/2/2023'])
        with self.assertRaises(ValueError):parse_index(b'<html>Maintenance</html>','https://www.fda.gov/index')
    def test_cache_is_idempotent_and_outage_retains_old_evidence(self):
        raw=json.dumps({'meta':{'last_updated':'2026-10-19','results':{'total':1}},'results':[{'cfres_id':'12','pma_numbers':['P100026']}]}).encode()
        with tempfile.TemporaryDirectory() as t,patch('dossiers.time.sleep'):
            calls=[]
            def transport(url,kind,allowed_hosts):calls.append(url);return raw
            cache=Cache(Path(t),transport);url='https://api.fda.gov/device/recall.json?search=pma_numbers:P100026'
            a=cache.get(url,'recall');b=cache.get(url,'recall');self.assertEqual(a,b);self.assertEqual(len(calls),1)
            self.assertEqual(a['source']['sha'],hashlib.sha256(raw).hexdigest())
            def outage(*args,**kwargs):raise HTTPError(url,503,'Provider unavailable',{},io.BytesIO(b'error'))
            cache.transport=outage;stale=cache.get(url,'recall',True)
            self.assertEqual(stale['state'],'stale');self.assertEqual(stale['data'],a['data']);self.assertEqual(stale['source'],a['source'])
            self.assertEqual(cache.db.execute('SELECT count(*) FROM artifacts').fetchone()[0],1)
            self.assertEqual(cache.db.execute('SELECT state FROM jobs').fetchone()[0],'failed');cache.db.close()
    def test_cache_tampering_is_not_used_or_silently_refetched(self):
        with tempfile.TemporaryDirectory() as t,patch('dossiers.time.sleep'):
            cache=Cache(Path(t),lambda *a,**k:b'{"meta":{"results":{"total":0}},"results":[]}')
            url='https://api.fda.gov/device/recall.json';v=cache.get(url,'recall')
            (Path(t)/'public/dossier-sources'/v['source']['file']).write_text('tampered')
            with self.assertRaises(ValueError):cache.get(url,'recall')
            cache.db.close()
    def test_http_404_and_failure_are_not_interchangeable(self):
        with tempfile.TemporaryDirectory() as t,patch('dossiers.time.sleep'):
            def empty(url,*a,**k):raise HTTPError(url,404,'Not Found',{},io.BytesIO(b'{"error":{"code":"NOT_FOUND","message":"No matches found!"}}'))
            cache=Cache(Path(t),empty);v=cache.get('https://api.fda.gov/device/recall.json','recall');self.assertEqual(v['state'],'checked');cache.db.close()
        with tempfile.TemporaryDirectory() as t,patch('dossiers.time.sleep'):
            def outage(url,*a,**k):raise HTTPError(url,404,'Not Found',{},io.BytesIO(b'<html>Not found</html>'))
            cache=Cache(Path(t),outage);v=cache.get('https://api.fda.gov/device/recall.json','recall');self.assertEqual(v['state'],'unavailable');cache.db.close()
    def test_unique_count_and_provider_snapshot_must_reconcile(self):
        class Fake:
            def __init__(self,duplicate=False,changed=False):self.n=0;self.duplicate=duplicate;self.changed=changed
            def get(self,*args):
                self.n+=1
                return {'state':'checked','source':{'providerUpdatedAt':'2026-10-19' if self.n==1 or not self.changed else '2026-10-20'},'data':{'meta':{'results':{'total':3}},'results':[{'id':1},{'id':2}] if self.n==1 else [{'id':2 if self.duplicate else 3}]}}
        for duplicate,changed,expected in [(False,False,True),(True,False,False),(False,True,False)]:
            with patch('dossiers.LIMIT',2):self.assertEqual(pages(Fake(duplicate,changed),'recall','x',None,lambda r:r['id'])['complete'],expected)
    def test_source_host_override_keeps_redirect_and_credentials_protection(self):
        class Response:
            url='https://www.fda.gov/medical-devices/test'
            def __enter__(self):return self
            def __exit__(self,*args):pass
            def read(self,*args):return b'FDA text'
        with patch('pipeline.build_opener') as opener:
            opener.return_value.open.return_value=Response()
            self.assertEqual(fetch(Response.url,'html',allowed_hosts=HOSTS),b'FDA text')
            redirects=opener.call_args.args[0]
            with self.assertRaises(ValueError):redirects.redirect_request(None,None,302,'',{},'https://evil.example/test')
        for url in ['https://user:secret@www.fda.gov/test','https://www.fda.gov:8443/test','http://www.fda.gov/test']:
            with self.assertRaises(ValueError):fetch(url,'html',allowed_hosts=HOSTS)

if __name__=='__main__':unittest.main()
