"""SQLite-backed, bounded, resumable ingestion. Python standard library only."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import sqlite3
import ssl
import time
import tempfile
from datetime import datetime, timezone
from urllib.request import Request, build_opener, HTTPRedirectHandler, HTTPSHandler
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from acquire import plan, whole_body_plan

ROOT = Path(__file__).resolve().parent.parent
ALLOWED = {'api.fda.gov', 'clinicaltrials.gov', 'eutils.ncbi.nlm.nih.gov', 'api.reporter.nih.gov'}
MAX_BYTES = 8 * 1024 * 1024

def now():
    return datetime.now(timezone.utc).isoformat()

def connect(path=None):
    db = sqlite3.connect(path or ROOT / 'data/atlas.sqlite', timeout=10)
    db.row_factory = sqlite3.Row
    db.executescript('''
      PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY, kind TEXT NOT NULL, url TEXT NOT NULL,
        state TEXT NOT NULL DEFAULT 'queued', attempts INTEGER NOT NULL DEFAULT 0,
        updated TEXT, error TEXT, checkpoint TEXT);
      CREATE TABLE IF NOT EXISTS artifacts (
        sha TEXT PRIMARY KEY, path TEXT NOT NULL, url TEXT NOT NULL,
        retrieved TEXT NOT NULL, provider_updated TEXT, job_id TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS records (
        id TEXT PRIMARY KEY, kind TEXT NOT NULL, payload TEXT NOT NULL,
        sha TEXT NOT NULL REFERENCES artifacts(sha), job_id TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS record_versions (
        id TEXT NOT NULL, sha TEXT NOT NULL, payload TEXT NOT NULL,
        PRIMARY KEY(id, sha));
    ''')
    return db

def validate(kind, data):
    if not isinstance(data, dict):
        raise ValueError('Expected an object')
    if kind in ('510k', 'pma', 'classification'):
        rows = data.get('results')
        required = {'510k':'k_number', 'pma':'pma_number', 'classification':'product_code'}[kind]
        if not isinstance(rows, list) or not rows:
            raise ValueError('Missing or empty FDA results; previous records retained')
        for row in rows:
            if not isinstance(row, dict) or not row.get(required):
                raise ValueError('Provider schema changed: missing '+required)
            if kind != 'classification':
                if not row.get('decision_date') or not row.get('decision_code'):
                    raise ValueError('Missing decision date/code')
                date(row['decision_date'])
                # The device/510k endpoint also carries De Novo records. Route
                # these by identifier and decision, never label them clearances.
                pattern = r'(K\d{6}|DEN\d{6})' if kind == '510k' else r'P\d{6}'
                if not re.fullmatch(pattern, row[required]):
                    raise ValueError('Malformed application identifier')
        return [(('FDA:'+r[required]+(':'+r.get('supplement_number','') if kind=='pma' else '')), r) for r in rows]
    if kind == 'trial':
        rows = data.get('studies')
        if not isinstance(rows, list) or not rows:
            raise ValueError('Empty or malformed study response; previous records retained')
        result = []
        for r in rows:
            nct = r.get('protocolSection',{}).get('identificationModule',{}).get('nctId','')
            if not re.fullmatch(r'NCT\d{8}', nct):
                raise ValueError('Missing/invalid NCT identifier')
            result.append((nct, r))
        return result
    if kind == 'publication':
        result = data.get('result',{})
        ids = result.get('uids')
        if not isinstance(ids,list) or not ids:
            raise ValueError('Missing PubMed UIDs')
        return [('PMID:'+uid,result[uid]) for uid in ids if uid.isdigit() and result.get(uid,{}).get('title')]
    if kind == 'grant':
        rows = data.get('results')
        if not isinstance(rows,list) or not rows:
            raise ValueError('Missing NIH results')
        if any(not r.get('appl_id') for r in rows):
            raise ValueError('Missing NIH application identity')
        return [('NIH:'+str(r['appl_id']),r) for r in rows]
    if kind == 'pubmed-search':
        ids = data.get('esearchresult',{}).get('idlist')
        if not isinstance(ids,list) or not ids or any(not x.isdigit() for x in ids):
            raise ValueError('Missing PubMed search identifiers')
        return []
    raise ValueError('Unsupported source kind')

def date(value):
    value = str(value)
    fmt = '%Y%m%d' if len(value)==8 else '%Y-%m-%d'
    return datetime.strptime(value,fmt).date().isoformat()

def fetch(url, kind, allowed_hosts=ALLOWED):
    parsed = urlparse(url)
    if parsed.scheme != 'https' or parsed.hostname not in allowed_hosts or parsed.username or parsed.port:
        raise ValueError('Source URL outside allowlist')
    payload = None
    if kind == 'grant':
        payload = json.dumps({'criteria':{'advanced_text_search':{'operator':'and','search_field':'projecttitle','search_text':'brain computer interface'}},'offset':0,'limit':5}).encode()
    req = Request(url, data=payload, headers={'User-Agent':'BodyAtlas/0.1 (bounded public research snapshot)', 'Accept':'text/html' if kind=='html' else 'application/json', 'Content-Type':'application/json'})
    # python.org macOS builds may lack their own CA bundle. Keep TLS verification
    # enabled and use the OS CA store if OpenSSL's default bundle is absent.
    cafile = os.environ.get('SSL_CERT_FILE')
    if not cafile and ssl.get_default_verify_paths().cafile is None and Path('/etc/ssl/cert.pem').exists():
        cafile = '/etc/ssl/cert.pem'
    class SourceRedirects(HTTPRedirectHandler):
        def redirect_request(self, request, fp, code, msg, headers, newurl):
            target=urlparse(newurl)
            if target.scheme!='https' or target.hostname not in allowed_hosts or target.username or target.port:
                raise ValueError('Redirect outside allowlist')
            return super().redirect_request(request,fp,code,msg,headers,newurl)
    opener=build_opener(SourceRedirects(),HTTPSHandler(context=ssl.create_default_context(cafile=cafile)))
    with opener.open(req,timeout=25) as response:
        if urlparse(response.url).hostname not in allowed_hosts:
            raise ValueError('Redirect outside allowlist')
        raw = response.read(MAX_BYTES+1)
    if len(raw)>MAX_BYTES:
        raise ValueError('Source exceeded bounded response size')
    return raw

def persist(db, job, raw, root=ROOT):
    data = json.loads(raw)
    rows = validate(job['kind'],data)  # validate entire batch before any state change
    sha = hashlib.sha256(raw).hexdigest()
    relative = 'data/sources/'+sha+'.json'
    path = root / relative
    path.parent.mkdir(parents=True,exist_ok=True)
    if not path.exists():
        with tempfile.NamedTemporaryFile(dir=path.parent,delete=False,suffix='.tmp') as handle:
            handle.write(raw)
            tmp=handle.name
        os.replace(tmp,path)
    retrieved = now()
    provider_updated = data.get('meta',{}).get('last_updated')
    with db:
        db.execute('INSERT OR IGNORE INTO artifacts VALUES (?,?,?,?,?,?)',(sha,relative,job['url'],retrieved,provider_updated,job['id']))
        for rid, row in rows:
            payload = json.dumps(row,sort_keys=True)
            db.execute('INSERT OR IGNORE INTO record_versions VALUES (?,?,?)',(rid,sha,payload))
            db.execute('INSERT INTO records VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload, sha=excluded.sha, job_id=excluded.job_id',(rid,job['kind'],payload,sha,job['id']))
        db.execute("UPDATE jobs SET state='complete',updated=?,error=NULL,checkpoint=? WHERE id=?",(retrieved,sha,job['id']))
        if job['kind']=='pubmed-search':
            ids = data['esearchresult']['idlist']
            url = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?'+urlencode({'db':'pubmed','id':','.join(ids),'retmode':'json','tool':'BodyAtlas'})
            dynamic_id = 'pubmed-summary-'+hashlib.sha256(','.join(ids).encode()).hexdigest()[:12]
            db.execute('INSERT OR IGNORE INTO jobs (id,kind,url) VALUES (?,?,?)',(dynamic_id,'publication',url))
    return len(rows)

def enqueue(db, force=False, scope="neuro"):
    selected_plan = whole_body_plan() if scope == "whole-body" else plan()
    with db:
        for jid,kind,url in selected_plan:
            db.execute('INSERT OR IGNORE INTO jobs (id,kind,url) VALUES (?,?,?)',(jid,kind,url))
        if force:
            db.executemany("UPDATE jobs SET state='queued', attempts=0 WHERE id=? AND state IN ('complete','failed')", [(jid,) for jid,_,_ in selected_plan])
        # Expired leases become resumable after a process crash, not while another worker is active.
        db.execute("UPDATE jobs SET state='queued' WHERE state='running' AND datetime(updated)<datetime('now','-5 minutes')")

def worker(db):
    while True:
        with db:
            db.execute('BEGIN IMMEDIATE')
            job = db.execute("SELECT * FROM jobs WHERE state='queued' ORDER BY id LIMIT 1").fetchone()
            if job is None:
                return
            db.execute("UPDATE jobs SET state='running',attempts=attempts+1,updated=? WHERE id=?",(now(),job['id']))
        try:
            raw = fetch(job['url'],job['kind'])
            count = persist(db,job,raw)
            print(job['id'], 'complete', count, flush=True)
        except (HTTPError, URLError, TimeoutError, ValueError, KeyError, OSError) as exc:
            attempts = job['attempts']+1
            retryable = isinstance(exc,(URLError,TimeoutError,OSError)) and not isinstance(exc,HTTPError) or isinstance(exc,HTTPError) and exc.code in (429,500,502,503,504)
            state = 'queued' if retryable and attempts<3 else 'failed'
            with db:
                db.execute('UPDATE jobs SET state=?,updated=?,error=? WHERE id=?',(state,now(),type(exc).__name__+': '+str(exc)[:180],job['id']))
            print(job['id'],state, type(exc).__name__,flush=True)
            if state=='queued':
                time.sleep(min(2**attempts,8))
        time.sleep(0.4)

def export(db):
    artifacts = {r['sha']:dict(r) for r in db.execute('SELECT * FROM artifacts')}
    output = {'schemaVersion':1,'exportedAt':now(),'mode':'Cached authentic snapshot','records':[], 'sources':list(artifacts.values()),'jobs':[dict(r) for r in db.execute('SELECT * FROM jobs ORDER BY id')]}
    for row in db.execute('SELECT * FROM records ORDER BY id'):
        raw = json.loads(row['payload'])
        kind = row['kind']
        src = artifacts[row['sha']]
        common = {'id':row['id'],'kind':kind,'sourceSha':row['sha'],'retrievedAt':src['retrieved'],'providerUpdatedAt':src['provider_updated'],'sourceUrl':src['url']}
        if kind in ('510k','pma'):
            app = raw.get('k_number') or raw['pma_number']
            supp = raw.get('supplement_number','')
            code = raw['decision_code']
            denovo = app.startswith('DEN')
            status = 'De Novo authorization' if denovo and code=='DENG' else '510(k) clearance' if kind=='510k' and not denovo and code in ('SESE','SESU','SESD') else 'PMA approval' if kind=='pma' and code=='APPR' and not supp else 'PMA supplement' if kind=='pma' and supp else 'Regulatory decision (review source)'
            if denovo: common['kind']='de_novo'
            common.update({'title':raw.get('device_name') or raw.get('trade_name') or app, 'applicant':raw['applicant'],'application':app,'supplement':supp,'productCode':raw['product_code'],'decisionDate':date(raw['decision_date']),'decisionCode':code,'status':status,'statement':raw.get('ao_statement') or raw.get('decision_description',''),'genericName':raw.get('generic_name') or raw.get('openfda',{}).get('device_name',''),'medicalSpecialty':raw.get('advisory_committee_description') or raw.get('advisory_committee',''),'url':('https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID='+app) if kind=='510k' else ('https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpma/pma.cfm?id='+app+(supp or ''))})
            if denovo:
                common['url']='https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/denovo.cfm?ID='+app
        elif kind=='classification':
            common.update({'title':raw['device_name'],'productCode':raw['product_code'],'deviceClass':raw.get('device_class'),'definition':raw.get('definition',''),'url':'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpcd/classification.cfm?ID='+raw['product_code']})
        elif kind=='trial':
            p = raw['protocolSection']; ident = p['identificationModule']; stat = p['statusModule']
            common.update({'title':ident.get('briefTitle',''),'status':stat.get('overallStatus',''),'firstPosted':stat.get('studyFirstPostDateStruct',{}).get('date'),'interventions':p.get('armsInterventionsModule',{}).get('interventions',[]),'sponsor':p.get('sponsorCollaboratorsModule',{}).get('leadSponsor',{}).get('name',''),'summary':p.get('descriptionModule',{}).get('briefSummary',''),'url':'https://clinicaltrials.gov/study/'+row['id']})
        elif kind=='publication':
            common.update({'title':raw['title'],'publicationDate':raw.get('pubdate',''),'authors':[a['name'] for a in raw.get('authors',[])],'journal':raw.get('fulljournalname',''),'url':'https://pubmed.ncbi.nlm.nih.gov/'+raw['uid']+'/','identifiers':raw.get('articleids',[])})
        elif kind=='grant':
            common.update({'title':raw.get('project_title',''),'organization':raw.get('organization',{}).get('org_name',''),'investigators':[p.get('full_name','') for p in raw.get('principal_investigators',[])],'projectNumber':raw.get('project_num',''),'fiscalYear':raw.get('fiscal_year'),'url':raw.get('project_detail_url') or 'https://reporter.nih.gov/search/'+str(raw['appl_id'])+'/project-details'})
        output['records'].append(common)
    dest = ROOT / 'data/atlas.json'
    tmp = dest.with_suffix('.tmp')
    tmp.write_text(json.dumps(output,indent=2)+'\n')
    os.replace(tmp,dest)
    print('Exported',len(output['records']),'records;',sum(j['state']=='failed' for j in output['jobs']),'failed jobs',flush=True)

def restore(db):
    """Reconstruct SQLite from checked-in immutable responses and their manifest."""
    manifest = json.loads((ROOT/'data/atlas.json').read_text())
    for src in sorted(manifest['sources'],key=lambda s:s['retrieved']):
        path = ROOT/src['path']
        raw = path.read_bytes()
        if hashlib.sha256(raw).hexdigest()!=src['sha']:
            raise ValueError('Snapshot checksum mismatch')
        jobs = {j['id']:j for j in manifest['jobs']}
        job = jobs[src['job_id']]
        with db:
            db.execute('INSERT OR IGNORE INTO jobs (id,kind,url) VALUES (?,?,?)',(job['id'],job['kind'],job['url']))
        persist(db,job,raw)
        with db:
            db.execute('UPDATE artifacts SET retrieved=?,provider_updated=? WHERE sha=?',(src['retrieved'],src['provider_updated'],src['sha']))
    # Include failed inquiries with no artifact and retain original attempt/error
    # state. Restoring bytes must not rewrite the historical ingestion outcome.
    with db:
        for job in manifest['jobs']:
            db.execute('INSERT OR REPLACE INTO jobs (id,kind,url,state,attempts,updated,error,checkpoint) VALUES (?,?,?,?,?,?,?,?)',tuple(job.get(k) for k in ['id','kind','url','state','attempts','updated','error','checkpoint']))
    print('Restored source snapshots; no network requests')

if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('command',choices=['refresh','export','restore','status']); parser.add_argument('--force',action='store_true'); parser.add_argument('--scope',choices=['neuro','whole-body'],default='neuro'); args=parser.parse_args()
    (ROOT/'data').mkdir(exist_ok=True)
    db=connect()
    if args.command=='refresh': enqueue(db,args.force,args.scope); worker(db); export(db)
    elif args.command=='restore': restore(db)
    elif args.command=='export': export(db)
    else:
        for r in db.execute('SELECT id,state,attempts,error FROM jobs'): print(dict(r))
