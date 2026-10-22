import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from pipeline import connect, date, enqueue, fetch, persist, validate, worker

class PipelineTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name);self.db=connect(self.root/'test.sqlite')
        self.job={'id':'sample','kind':'510k','url':'https://api.fda.gov/device/510k.json?limit=1'}
        self.db.execute('INSERT INTO jobs (id,kind,url) VALUES (?,?,?)',tuple(self.job.values()));self.db.commit()
        self.raw={'meta':{'last_updated':'2026-10-05'},'results':[{'k_number':'K123456','decision_date':'20260101','decision_code':'SESE','device_name':'External EEG','applicant':'Example public fixture','product_code':'GWF'}]}
    def tearDown(self):
        self.db.close();self.tmp.cleanup()
    def test_idempotent_and_versioned_writes(self):
        raw=json.dumps(self.raw).encode();persist(self.db,self.job,raw,self.root);persist(self.db,self.job,raw,self.root)
        self.assertEqual(self.db.execute('SELECT count(*) FROM records').fetchone()[0],1)
        self.assertEqual(self.db.execute('SELECT count(*) FROM record_versions').fetchone()[0],1)
        self.raw['results'][0]['device_name']='Updated identity';persist(self.db,self.job,json.dumps(self.raw).encode(),self.root)
        self.assertEqual(self.db.execute('SELECT count(*) FROM record_versions').fetchone()[0],2)
        self.assertEqual(self.db.execute('SELECT count(*) FROM records').fetchone()[0],1)
    def test_schema_drift_and_partial_batch_never_overwrite_good_data(self):
        persist(self.db,self.job,json.dumps(self.raw).encode(),self.root)
        self.raw['results'].append({'device_name':'missing identity'})
        with self.assertRaises(ValueError):persist(self.db,self.job,json.dumps(self.raw).encode(),self.root)
        self.assertEqual(self.db.execute('SELECT count(*) FROM records').fetchone()[0],1)
        self.assertEqual(self.db.execute('SELECT count(*) FROM artifacts').fetchone()[0],1)
    def test_missing_or_empty_source_does_not_erase_previous_records(self):
        persist(self.db,self.job,json.dumps(self.raw).encode(),self.root)
        for data in [{},{'results':[]},{'results':'schema changed'}]:
            with self.assertRaises(ValueError):persist(self.db,self.job,json.dumps(data).encode(),self.root)
        self.assertEqual(self.db.execute('SELECT count(*) FROM records').fetchone()[0],1)
    def test_malformed_identifier_and_impossible_event_date_rejected(self):
        for id in ['K12345','K123456/../../','X123456']:
            self.raw['results'][0]['k_number']=id
            with self.assertRaises(ValueError):validate('510k',self.raw)
        with self.assertRaises(ValueError):date('2026-02-30')
        self.assertEqual(date('20131114'),'2013-11-14')
    def test_denovo_identity_is_preserved(self):
        self.raw['results'][0]['k_number']='DEN250026';self.raw['results'][0]['decision_code']='DENG'
        self.assertEqual(validate('510k',self.raw)[0][0],'FDA:DEN250026')
    def test_pma_supplements_have_separate_identifiers(self):
        data={'results':[{'pma_number':'P100026','supplement_number':'','decision_date':'2013-11-14','decision_code':'APPR'},{'pma_number':'P100026','supplement_number':'S041','decision_date':'2016-02-05','decision_code':'OK30'}]}
        self.assertEqual([r[0] for r in validate('pma',data)],['FDA:P100026:','FDA:P100026:S041'])
    def test_url_allowlist_rejects_local_credentials_and_arbitrary_sources(self):
        for url in ['http://api.fda.gov/device/pma.json','https://127.0.0.1/admin','file:///etc/passwd','https://api.fda.gov.evil.test','https://user:pass@api.fda.gov/data','https://api.fda.gov:1234/data']:
            with self.assertRaises(ValueError):fetch(url,'510k')
    def test_source_outage_preserves_snapshot_and_records_failed_job(self):
        persist(self.db,self.job,json.dumps(self.raw).encode(),self.root)
        self.db.execute("UPDATE jobs SET state='queued'");self.db.commit()
        with patch('pipeline.fetch',side_effect=HTTPError(self.job['url'],503,'outage',{},None)),patch('pipeline.time.sleep'):
            worker(self.db)
        job=self.db.execute('SELECT * FROM jobs').fetchone()
        self.assertEqual(job['state'],'failed');self.assertEqual(job['attempts'],3)
        self.assertEqual(self.db.execute('SELECT count(*) FROM records').fetchone()[0],1)
    def test_forced_scope_does_not_refetch_unrelated_jobs(self):
        enqueue(self.db,scope='whole-body')
        self.db.execute("UPDATE jobs SET state='complete'");self.db.commit()
        enqueue(self.db,force=True,scope='whole-body')
        self.assertEqual(self.db.execute("SELECT state FROM jobs WHERE id='sample'").fetchone()[0],'complete')
        self.assertEqual(self.db.execute("SELECT count(*) FROM jobs WHERE state='queued'").fetchone()[0],18)
    def test_expired_worker_lease_recovers(self):
        self.db.execute("UPDATE jobs SET state='running', updated='2020-01-01T00:00:00+00:00'");self.db.commit();enqueue(self.db)
        self.assertEqual(self.db.execute("SELECT state FROM jobs WHERE id='sample'").fetchone()[0],'queued')
    def test_non_retryable_schema_failure_is_isolated(self):
        with patch('pipeline.fetch',return_value=b'{"results": []}'),patch('pipeline.time.sleep'):worker(self.db)
        self.assertEqual(self.db.execute('SELECT attempts FROM jobs').fetchone()[0],1)
        self.assertEqual(self.db.execute('SELECT state FROM jobs').fetchone()[0],'failed')

if __name__=='__main__':unittest.main()
