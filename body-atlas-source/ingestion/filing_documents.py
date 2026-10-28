"""Collect exact-application FDA document links and immutable bytes for review.

No inferred anatomy or current-label certification; sources stay in ignored staging.
"""
import argparse, hashlib, json, re, time
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse
from pipeline import ROOT, connect, fetch, now
from dossiers import atomic

HOSTS={'www.accessdata.fda.gov'}

def page_url(application):
    prefix='cfpma/pma' if application.startswith('P') else 'cfpmn/pmn'
    return 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/'+prefix+'.cfm?ID='+application

class Documents(HTMLParser):
    def __init__(self, application):
        super().__init__(convert_charrefs=True);self.application=application;self.links=[];self.anchor=None
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='a' and attrs.get('href'):self.anchor={'url':urljoin(page_url(self.application),attrs['href']),'text':[]}
    def handle_data(self,value):
        if self.anchor:self.anchor['text'].append(value)
    def handle_endtag(self,tag):
        if tag!='a' or not self.anchor:return
        a=self.anchor;self.anchor=None;p=urlparse(a['url'])
        if p.scheme!='https' or p.hostname not in HOSTS or p.username or p.port or p.query or p.fragment:return
        if not re.fullmatch(r'/cdrh_docs/pdf\d*/'+self.application+r'(?:S\d{3,4})?(?:[A-Z]\d*)?\.pdf',p.path,re.I):return
        self.links.append({'url':a['url'],'title':' '.join(''.join(a['text']).split()) or 'FDA document'})

def document_links(application,raw):
    parser=Documents(application);parser.feed(raw.decode('utf8'))
    links=list({r['url']:r for r in parser.links}.values())
    if not links:raise ValueError('No exact-application document links found; not a complete empty review')
    return links

class Collector:
    def __init__(self,root=ROOT,transport=fetch):
        self.root=Path(root);self.transport=transport;self.db=connect(self.root/'data/filing-documents.sqlite')
        self.db.execute("UPDATE jobs SET state='queued' WHERE state='running' AND datetime(updated)<datetime('now','-5 minutes')")
        self.db.commit()
    def get(self,url,kind,force=False):
        jid='document-'+hashlib.sha256(url.encode()).hexdigest()
        with self.db:self.db.execute('INSERT OR IGNORE INTO jobs(id,kind,url) VALUES(?,?,?)',(jid,kind,url))
        old=self.db.execute('SELECT * FROM artifacts WHERE job_id=? ORDER BY retrieved DESC LIMIT 1',(jid,)).fetchone()
        if old and not force:
            raw=(self.root/old['path']).read_bytes()
            if hashlib.sha256(raw).hexdigest()!=old['sha']:raise ValueError('Cached document checksum mismatch')
            return raw,{**dict(old),'bytes':len(raw)}
        error=None
        for attempt in range(2):
            with self.db:self.db.execute("UPDATE jobs SET state='running',attempts=attempts+1,updated=? WHERE id=?",(now(),jid))
            try:
                raw=self.transport(url,'html' if kind=='html' else 'pdf',allowed_hosts=HOSTS)
                if kind=='pdf' and not raw.startswith(b'%PDF-'):raise ValueError('Document is not a PDF')
                if kind=='html' and b'<html' not in raw[:10000].lower():raise ValueError('Invalid FDA document index')
                sha=hashlib.sha256(raw).hexdigest();relative='data/filing-documents/'+sha+('.pdf' if kind=='pdf' else '.html')
                atomic(self.root/relative,raw);retrieved=now()
                with self.db:
                    self.db.execute('INSERT OR IGNORE INTO artifacts VALUES(?,?,?,?,?,?)',(sha,relative,url,retrieved,None,jid))
                    self.db.execute("UPDATE jobs SET state='complete',updated=?,checkpoint=?,error=NULL WHERE id=?",(retrieved,sha,jid))
                return raw,{'sha':sha,'path':relative,'url':url,'retrieved':retrieved,'bytes':len(raw)}
            except (OSError,ValueError) as exc:
                error=type(exc).__name__+': '+str(exc)[:160]
                if attempt==0 and isinstance(exc,OSError):time.sleep(1);continue
                break
        with self.db:self.db.execute("UPDATE jobs SET state='failed',updated=?,error=? WHERE id=?",(now(),error,jid))
        # Keep the last good artifact and make the incomplete refresh explicit.
        if old:
            raw=(self.root/old['path']).read_bytes()
            if hashlib.sha256(raw).hexdigest()!=old['sha']:raise ValueError('Cached document checksum mismatch')
            return raw,{**dict(old),'stale':True,'error':error}
        raise ValueError(error)
    def collect(self,application,force=False):
        allowed=json.loads((self.root/'data/fda-applications.json').read_text())
        if application not in allowed:raise ValueError('Application is outside reviewed scope')
        raw,index=self.get(page_url(application),'html',force)
        links=document_links(application,raw);documents=[];failures=[]
        # Bounded first three original documents; report uncollected links explicitly.
        for link in links[:3]:
            try:
                _,artifact=self.get(link['url'],'pdf',force)
                documents.append({**link,**artifact})
            except ValueError as exc:failures.append({'url':link['url'],'error':str(exc)})
            time.sleep(.4)
        return {'application':application,'index':index,'documents':documents,'failures':failures,'linksFound':len(links),'linksNotCollected':max(0,len(links)-3),'completeWithinBound':not failures and not index.get('stale') and all(not d.get('stale') for d in documents),'reviewStatus':'Acquired for review; content and current-label status not adjudicated'}

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('applications',nargs='+');parser.add_argument('--force',action='store_true');args=parser.parse_args()
    if len(args.applications)>20:parser.error('Maximum 20 exact applications per run; use resumable batches')
    collector=Collector();rows=[]
    for application in dict.fromkeys(args.applications):
        try:rows.append(collector.collect(application,args.force))
        except ValueError as exc:rows.append({'application':application,'completeWithinBound':False,'error':str(exc)})
    report={'retrievedAt':now(),'entries':rows,'automaticAnatomicalAcceptance':False}
    atomic(ROOT/'data/filing-documents/report.json',(json.dumps(report,indent=2)+'\n').encode())
    print(json.dumps(report,indent=2))
    if any(not r.get('completeWithinBound') for r in rows):raise SystemExit(1)
