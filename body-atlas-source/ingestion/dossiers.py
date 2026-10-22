"""Bounded, resumable public-source dossiers. Never infer model/lot applicability."""
import argparse, hashlib, json, os, re, sqlite3, tempfile, time
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlencode, urljoin, urlparse
from urllib.error import HTTPError, URLError
from pipeline import ROOT, connect, fetch, now, date

HOSTS={'api.fda.gov','www.fda.gov'}
LIMIT=100
MAX_PAGES=200
BASE='https://api.fda.gov/device/'
INDEX='https://www.fda.gov/medical-devices/medical-device-safety/'
INDEXES=[INDEX+'safety-communications',INDEX+'medical-device-recalls-and-early-alerts']

def atomic(path, value):
    path.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=path.parent,delete=False) as f:
        f.write(value); temp=f.name
    os.replace(temp,path)

def api(endpoint,query,skip=0,sort=None):
    params={'search':query,'limit':LIMIT,'skip':skip}
    if sort:params['sort']=sort
    return BASE+endpoint+'.json?'+urlencode(params)

def direct_ids(row):
    # openfda.* harmonization can contain firm-wide identifiers; never join on it.
    return {v[:7] for v in row.get('pma_numbers',[]) if re.fullmatch(r'P\d{6}(?:/?S\d{1,4})?',v)} | set(row.get('k_numbers',[]))

def recall_for(row,application):
    return application in direct_ids(row)

def validate_json(data,kind):
    if not isinstance(data,dict):raise ValueError('Expected provider object')
    if data.get('error')=={'code':'NOT_FOUND','message':'No matches found!'} and set(data)=={'error'}:return
    if not isinstance(data.get('results'),list) or not isinstance(data.get('meta',{}).get('results',{}).get('total'),int):
        raise ValueError('Invalid provider results/count')
    key={'pma':'pma_number','recall':'cfres_id','enforcement':'recall_number'}[kind]
    for row in data['results']:
        if not isinstance(row,dict) or not row.get(key):raise ValueError('Missing '+key)
        if kind=='pma':
            if not re.fullmatch(r'P\d{6}',row[key]) or not re.fullmatch(r'(?:S\d{3,4})?',row.get('supplement_number','')):raise ValueError('Invalid PMA identity')
            date(row.get('decision_date',''))
        if kind=='recall':
            if not str(row[key]).isdigit():raise ValueError('Invalid recall identity')
            for field,pattern in [('pma_numbers',r'P\d{6}(?:S\d{3,4})?'),('k_numbers',r'K\d{6}')]:
                values=row.get(field,[])
                if not isinstance(values,list) or any(not isinstance(v,str) or len(v)>80 for v in values):raise ValueError('Invalid direct application identifier schema')
            for field in ['event_date_posted','event_date_initiated']:
                if row.get(field):date(row[field])

class IndexParser(HTMLParser):
    def __init__(self,url):
        super().__init__(convert_charrefs=True);self.url=url;self.rows=[];self.links=[];self.cells=None;self.text=[];self.celllinks=[];self.anchor=None
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='tr':self.cells=[]
        if tag=='td':self.text=[];self.celllinks=[]
        if tag=='a' and attrs.get('href'):self.anchor={'url':urljoin(self.url,attrs['href']),'parts':[]}
    def handle_data(self,data):
        self.text.append(data)
        if self.anchor:self.anchor['parts'].append(data)
    def handle_endtag(self,tag):
        if tag=='a' and self.anchor:
            a={'url':self.anchor['url'],'title':' '.join(''.join(self.anchor['parts']).split())};self.links.append(a);self.celllinks.append(a);self.anchor=None
        if tag=='td' and self.cells is not None:self.cells.append({'text':' '.join(''.join(self.text).split()),'links':self.celllinks[:]})
        if tag=='tr' and self.cells:
            dated=next((c for c in self.cells if re.fullmatch(r'\d{1,2}/\d{1,2}/\d{4}',c['text'])),None)
            linked=next((c for c in self.cells if any(urlparse(a['url']).hostname=='www.fda.gov' for a in c['links'])),None)
            if dated and linked:
                link=next(a for a in linked['links'] if urlparse(a['url']).hostname=='www.fda.gov')
                self.rows.append({'date':dated['text'],'title':link['title'],'url':link['url'],'category':self.cells[2]['text'] if len(self.cells)>2 else ''})
            self.cells=None

def parse_index(raw,url):
    p=IndexParser(url);p.feed(raw.decode('utf8'))
    if not p.rows:raise ValueError('FDA index layout changed or no dated rows; not a zero-result search')
    return {'rows':p.rows,'archives':[a for a in p.links if re.search(r'20\d\d.*(?:safety.communications|medical.device.recalls)',a['title'],re.I) and urlparse(a['url']).hostname=='www.fda.gov']}

class Cache:
    def __init__(self,root=ROOT,transport=fetch):
        self.root=root;self.transport=transport;(root/'data').mkdir(parents=True,exist_ok=True);self.db=connect(root/'data/dossiers.sqlite')
        self.db.execute('CREATE TABLE IF NOT EXISTS dossier_results (job TEXT PRIMARY KEY, payload TEXT NOT NULL)')
        self.db.execute("UPDATE jobs SET state='queued' WHERE state='running' AND datetime(updated)<datetime('now','-5 minutes')");self.db.commit()
    def get(self,url,kind,force=False):
        if urlparse(url).hostname not in HOSTS or urlparse(url).scheme!='https' or urlparse(url).username or urlparse(url).port:raise ValueError('Dossier source outside allowlist')
        jid='dossier-v1-'+hashlib.sha256((kind+url).encode()).hexdigest()
        self.db.execute('INSERT OR IGNORE INTO jobs(id,kind,url) VALUES(?,?,?)',(jid,kind,url));self.db.commit()
        job=self.db.execute('SELECT * FROM jobs WHERE id=?',(jid,)).fetchone()
        old=self.db.execute('SELECT payload FROM dossier_results WHERE job=?',(jid,)).fetchone()
        if old and job['state']=='complete' and not force:
            value=json.loads(old['payload']);path=self.root/'public/dossier-sources'/value['source']['file']
            if hashlib.sha256(path.read_bytes()).hexdigest()!=value['source']['sha']:raise ValueError('Cached dossier source checksum mismatch')
            return value
        for attempt in range(2):
            self.db.execute("UPDATE jobs SET state='running',attempts=attempts+1,updated=? WHERE id=?",(now(),jid));self.db.commit()
            try:
                try:raw=self.transport(url,'html' if kind=='index' else kind,allowed_hosts=HOSTS)
                except HTTPError as exc:
                    raw=exc.read(8*1024*1024+1)
                    if exc.code!=404:raise
                    empty=json.loads(raw)
                    if empty.get('error')!={'code':'NOT_FOUND','message':'No matches found!'}:raise
                data=parse_index(raw,url) if kind=='index' else json.loads(raw)
                if kind!='index':validate_json(data,kind)
                sha=hashlib.sha256(raw).hexdigest();filename=sha+('.txt' if kind=='index' else '.json')
                atomic(self.root/'public/dossier-sources'/filename,raw)
                source={'url':url,'sha':sha,'file':filename,'retrievedAt':now(),'providerUpdatedAt':data.get('meta',{}).get('last_updated')}
                value={'data':data,'source':source,'state':'checked'}
                with self.db:
                    self.db.execute('INSERT OR IGNORE INTO artifacts VALUES(?,?,?,?,?,?)',(sha,'public/dossier-sources/'+filename,url,source['retrievedAt'],source['providerUpdatedAt'],jid))
                    self.db.execute('INSERT INTO dossier_results VALUES(?,?) ON CONFLICT(job) DO UPDATE SET payload=excluded.payload',(jid,json.dumps(value)))
                    self.db.execute("UPDATE jobs SET state='complete',updated=?,error=NULL,checkpoint=? WHERE id=?",(now(),sha,jid))
                print(kind,'checked',len(data.get('results',data.get('rows',[]))),flush=True);time.sleep(.35);return value
            except (HTTPError,URLError,TimeoutError,OSError,ValueError,KeyError) as exc:
                retry=isinstance(exc,(URLError,TimeoutError)) and not isinstance(exc,HTTPError) or isinstance(exc,HTTPError) and exc.code in (429,500,502,503,504)
                if retry and attempt==0:time.sleep(2);continue
                with self.db:self.db.execute("UPDATE jobs SET state='failed',updated=?,error=? WHERE id=?",(now(),type(exc).__name__+': '+str(exc)[:180],jid))
                print(kind,'unavailable',type(exc).__name__,flush=True)
                if old:
                    value=json.loads(old['payload']);value['state']='stale';value['error']=type(exc).__name__;return value
                return {'state':'unavailable','error':type(exc).__name__,'source':{'url':url},'data':{}}

def pages(cache,endpoint,query,sort,key,force=False):
    result=[];sources=[];complete=True;total=None;provider=None
    for page in range(MAX_PAGES):
        value=cache.get(api(endpoint,query,page*LIMIT,sort),endpoint,force)
        sources.append({**value['source'],'state':value['state']})
        if value['state']!='checked':complete=False
        data=value['data'];rows=data.get('results',[])
        expected=data.get('meta',{}).get('results',{}).get('total',0)
        updated=value['source'].get('providerUpdatedAt')
        if total is not None and (total!=expected or provider!=updated):complete=False
        total=expected;provider=updated;result.extend(rows)
        if not rows or len(result)>=total or value['state']=='unavailable':break
    unique={key(r):r for r in result}
    complete=complete and len(unique)==total
    return {'rows':list(unique.values()),'sources':sources,'complete':complete,'expected':total,'retrieved':len(unique),'providerUpdatedAt':provider}

def acquire(cache,scope,force=False):
    codes=sorted({r['application'] for f in scope for r in f['regulatory']});pmas=[x for x in codes if x.startswith('P')];ks=[x for x in codes if x.startswith('K')]
    history=pages(cache,'pma','pma_number:('+ ' OR '.join(pmas)+')','pma_number:asc,supplement_number:asc',lambda r:r['pma_number']+r.get('supplement_number',''),force)
    query='pma_numbers:('+ ' OR '.join(a+'*' for a in pmas)+') OR k_numbers:('+ ' OR '.join(ks)+')'
    recalls=pages(cache,'recall',query,None,lambda r:r['cfres_id'],force)
    indexes=[];queue=INDEXES[:];seen=set()
    while queue and len(seen)<30:
        url=queue.pop(0)
        if url in seen:continue
        seen.add(url);v=cache.get(url,'index',force);indexes.append(v)
        queue.extend(a['url'] for a in v['data'].get('archives',[]) if a['url'] not in seen)
    return history,recalls,indexes

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('command',choices=['acquire']);p.add_argument('--force',action='store_true');args=p.parse_args()
    scope=json.loads((ROOT/'data/dossier-scope.json').read_text());cache=Cache();history,recalls,indexes=acquire(cache,scope,args.force)
    output={'createdAt':now(),'history':history,'recalls':recalls,'indexes':indexes}
    atomic(ROOT/'data/dossier-acquisition.json',(json.dumps(output,indent=2)+'\n').encode())
    manifest={**output,'history':{k:v for k,v in history.items() if k!='rows'},'recalls':{k:v for k,v in recalls.items() if k!='rows'},'indexes':[{'source':v['source'],'state':v['state']} for v in indexes]}
    atomic(ROOT/'data/dossier-acquisition-index.json',(json.dumps(manifest,indent=2)+'\n').encode())
    print(json.dumps({'history':{k:v for k,v in history.items() if k not in ('rows','sources')},'recalls':{k:v for k,v in recalls.items() if k not in ('rows','sources')},'indexes':len(indexes)},indent=2))
