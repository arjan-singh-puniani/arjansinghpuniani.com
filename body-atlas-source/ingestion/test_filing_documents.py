import hashlib,json,tempfile,unittest
from pathlib import Path
from filing_documents import Collector,document_links

HTML=b'<html><a href="/cdrh_docs/pdf10/P100026B.pdf">Summary</a><a href="https://evil.test/P100026C.pdf">bad</a><a href="/cdrh_docs/pdf/P970003B.pdf">wrong</a><a href="http://www.accessdata.fda.gov/cdrh_docs/pdf10/P100026C.pdf">insecure</a></html>'
class DocumentTests(unittest.TestCase):
    def test_links_are_exact_application_https_documents(self):
        rows=document_links('P100026',HTML);self.assertEqual(len(rows),1);self.assertTrue(rows[0]['url'].endswith('P100026B.pdf'))
        with self.assertRaises(ValueError):document_links('P960009',HTML)
    def test_durable_resume_versions_and_failed_refresh_preserve_bytes(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);(root/'data').mkdir();(root/'data/fda-applications.json').write_text(json.dumps(['P100026']))
            calls=[]
            def transport(url,kind,**kw):calls.append(url);return HTML if kind=='html' else b'%PDF-1.7\noriginal'
            c=Collector(root,transport);a=c.collect('P100026');self.assertTrue(a['completeWithinBound']);self.assertEqual(len(calls),2)
            c.collect('P100026');self.assertEqual(len(calls),2)
            c.transport=lambda *a,**kw:b'not a pdf'
            b=c.collect('P100026',True);self.assertFalse(b['completeWithinBound']);self.assertTrue(b['documents'][0]['stale'])
            p=root/a['documents'][0]['path'];self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(),a['documents'][0]['sha'])
            self.assertEqual(c.db.execute("SELECT count(*) FROM jobs WHERE state='failed'").fetchone()[0],2)
            with self.assertRaises(ValueError):c.collect('https://localhost')
    def test_missing_links_fail_rather_than_claiming_zero_documents(self):
        with self.assertRaises(ValueError):document_links('P100026',b'<html>Access denied</html>')
