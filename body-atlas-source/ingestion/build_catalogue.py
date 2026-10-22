"""Build inspectable source-context entries. Never infer device placement from a name.
PMA statement and 510(k) name matches are PROVISIONAL anatomical context only.
Original records, exact text spans, exclusions and rule version remain auditable.
"""
import json,re
from pathlib import Path
from collections import Counter
ROOT=Path(__file__).resolve().parent.parent
VERSION='anatomical-context-v1'
IVD=re.compile(r'\b(in[ -]?vitro|assays?|specimens?|genotyp\w*|reagents?|immunoassay|polymerase|dna|rna|serum|plasma samples?|sequencing|diagnostic kits?|cell analyzer|chemistry analyzer)\b',re.I)
NEGATED=re.compile(r'(not (?:intended|indicated|recommended)|contraindicated|excluding|except for|non[- ])[^.;:]{0,55}$',re.I)

def incidental(text,match):
    before=text[max(0,match.start()-60):match.start()]
    after=text[match.end():match.end()+35]
    word=match.group().lower()
    if word in ['foot','feet'] and re.search(r'\d+(?:\.\d+)?\s*$',before):return True
    if word in ['hand','hands'] and re.match(r'[ -]?(held|operated|piece)',after,re.I):return True
    if word in ['finger','fingers'] and re.match(r'[ -]?stick',after,re.I):return True
    if word=='pulmonary' and re.match(r'\s+valve',after,re.I):return True
    if word in ['eye','eyes'] and re.search(r'naked\s*$',before,re.I):return True
    return False

def contexts(record,regions):
    text=record.get('statement','') if record['kind']=='pma' else record['title']
    field='statement' if record['kind']=='pma' and text else 'title'
    text=text or record['title']
    if IVD.search(' '.join([record['title'],record.get('genericName',''),text])):return [],'in-vitro/specimen context excluded'
    result=[]
    for region in regions:
        for pattern in region['patterns']:
            match=next((m for m in re.finditer(r'\b(?:'+pattern+r')\b',text,re.I) if not NEGATED.search(text[max(0,m.start()-75):m.start()]) and not incidental(text,m)),None)
            if not match:continue
            start=max(0,text.rfind('.',0,match.start())+1)
            end=text.find('.',match.end())
            end=len(text) if end<0 else end+1
            # Long FDA sentences retain an exact window around the match.
            start=max(start,match.start()-130);end=min(end,match.end()+230)
            if start>0 and not text[start-1].isspace() and not text[start].isspace():
                boundary=text.find(' ',start,match.start())
                if boundary>=0:start=boundary+1
            if end<len(text) and not text[end-1].isspace() and not text[end].isspace():
                boundary=text.rfind(' ',match.end(),end)
                if boundary>=0:end=boundary
            while start<match.start() and text[start].isspace():start+=1
            quote=text[start:end].strip();end=start+len(quote)
            result.append({'region':region,'matchedText':match.group(),'quote':quote,'span':[start,end],'field':field,'ruleId':VERSION+':'+region['id']})
            break
    parents={r['region']['parent'] for r in result}
    return [r for r in result if r['region']['id'] not in parents],None

def build():
    snapshot=json.loads((ROOT/'data/atlas.json').read_text());regions=json.loads((ROOT/'data/body-regions.json').read_text())
    curated={'FDA:K130233','FDA:P100026:','FDA:P960009:','FDA:P140009:','FDA:P970003:','FDA:P150038:','FDA:P030017:','FDA:P840024:'}
    entries=[];mappings=[];excluded=[]
    for record in snapshot['records']:
        if record['kind'] not in ['pma','510k','de_novo'] or record['id'] in curated:continue
        if record.get('supplement') or record.get('status') not in ['PMA approval','510(k) clearance','De Novo authorization']:continue
        matches,reason=contexts(record,regions)
        if not matches:
            excluded.append({'id':record['id'],'reason':reason or 'no explicit anatomical phrase'});continue
        fid='source-'+record['id'].lower().replace(':','-').rstrip('-')
        for match in matches:
            rid=match['region']['id']
            mappings.append({'id':fid+'-'+rid.replace(':','-'),'familyId':fid,'component':'FDA indication text' if match['field']=='statement' else 'FDA device-name text','structureId':rid,'type':'indication_context','state':'Provisional','precision':'region','laterality':'unspecified','assertion':match['quote'],'sourceUrl':record['url'],'locator':match['field']+'; characters '+str(match['span'][0])+'–'+str(match['span'][1]),'method':VERSION+'; exact phrase match; not independently reviewed','limitations':'Source-text anatomical context only. Does not establish implantation, tissue interface, clinical effectiveness, current labeling or a unique product family.','reviewedAt':'not independently reviewed','evidence':{'recordId':record['id'],'sourceSha':record['sourceSha'],**{k:v for k,v in match.items() if k!='region'}}})
        quote=matches[0]['quote']
        entries.append({'id':fid,'name':record['title'],'description':quote,'modalities':['Unknown'],'regulatoryIds':[record['id']],'studyIds':[],'publicationIds':[],'topics':[record.get('genericName',''),record.get('medicalSpecialty',''),*[m['region']['name'] for m in matches]],'limitations':'Automatically indexed FDA anatomical context; unreviewed. An application is not necessarily one distinct device family. Historical decision; check current labeling separately.','collection':'catalogue','sourceField':matches[0]['field']})
    result={'schemaVersion':1,'ruleVersion':VERSION,'snapshotExportedAt':snapshot['exportedAt'],'families':entries,'mappings':mappings,'excluded':excluded,'coverage':{'sourceRecords':len(snapshot['records']),'catalogueEntries':len(entries),'contextRelationships':len(mappings),'regions':dict(Counter(m['structureId'] for m in mappings)),'excluded':len(excluded),'independentlyReviewed':0}}
    (ROOT/'data/catalogue.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result['coverage'],indent=2))
if __name__=='__main__':build()
