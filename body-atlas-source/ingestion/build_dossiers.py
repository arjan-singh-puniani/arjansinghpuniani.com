"""Reproducible dossier export from validated, immutable FDA snapshots."""
import hashlib, json, re
from pathlib import Path
from dossiers import ROOT, atomic, recall_for, validate_json, parse_index
from dossier_reviews import load_reviews

PMA_PAGE='https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpma/pma.cfm?id='
RECALL_PAGE='https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfres/res.cfm?id='
# Title screening creates candidates, never a device/model applicability assertion.
NOTICE_TERMS={
 'P060040':['heartmate'], 'P130008':['inspire'], 'P020056':['breast implant'],
 'P030017':['spinal cord stimulat'], 'P130028':['spinal cord stimulat'],
 'P840024':['cochlear'], 'P000025':['cochlear'], 'P970003':['vagus nerve'],
 'P210007':['vagus nerve'], 'P100026':['neuropace','rns system'],
 'P960009':['deep brain stimulat','activa'], 'P140009':['deep brain stimulat','brio'],
 'P040033':['birmingham','metal-on-metal'], 'P100018':['pipeline'],
 'P130013':['watchman'], 'P140031':['sapien'], 'P150033':['micra'],
 'P100009':['mitraclip'], 'P180002':['zephyr'], 'P200029':['therasphere'],
 'P990065':['sir-sphere'], 'P100049':['linx'], 'K250173':['shiley'],
}

def read_source(root,source):
    if not re.fullmatch(r'[a-f0-9]{64}\.(?:json|txt)',source.get('file','')):raise ValueError('Invalid source file')
    raw=(root/'public/dossier-sources'/source['file']).read_bytes()
    if hashlib.sha256(raw).hexdigest()!=source['sha']:raise ValueError('Source checksum mismatch')
    return raw

def source_rows(root,section,kind,key):
    provenance={}
    for source in section['sources']:
        if not source.get('sha'):continue
        raw=read_source(root,source)
        data=json.loads(raw);validate_json(data,kind)
        for row in data.get('results',[]):provenance[key(row)]=source['sha']
    return provenance

def build(root=ROOT):
    scope=json.loads((root/'data/dossier-scope.json').read_text())
    acquired=json.loads((root/'data/dossier-acquisition-index.json').read_text())
    for field,kind,key in [('history','pma',lambda r:r['pma_number']+r.get('supplement_number','')),('recalls','recall',lambda r:r['cfres_id'])]:
        section=acquired[field];rows={}
        for source in section['sources']:
            if not source.get('sha'):continue
            raw=read_source(root,source);data=json.loads(raw);validate_json(data,kind)
            for row in data.get('results',[]):rows[key(row)]=row
        section['rows']=list(rows.values())
        if len(rows)!=section['expected']:raise ValueError('Acquisition count mismatch')
    for v in acquired['indexes']:
        v['data']=parse_index(read_source(root,v['source']),v['source']['url']) if v['state']=='checked' else {}
    labels=json.loads((root/'data/dossier-label-inventory.json').read_text())
    history=acquired['history'];recalls=acquired['recalls'];indexes=acquired['indexes']
    if not history['complete'] or not recalls['complete']:raise ValueError('Incomplete refresh; previously published dossiers retained')
    label_reviews,safety_reviews=load_reviews(root,scope,recalls['rows'])
    hkey=lambda r:r['pma_number']+r.get('supplement_number','')
    hsha=source_rows(root,history,'pma',hkey)
    rsha=source_rows(root,recalls,'recall',lambda r:r['cfres_id'])
    labelbytes=(json.dumps(labels,indent=2)+'\n').encode();labelsha=hashlib.sha256(labelbytes).hexdigest()
    atomic(root/'public/dossier-sources'/(labelsha+'.json'),labelbytes)
    inventory={'file':labelsha+'.json','sha':labelsha,'retrievedAt':labels['checkedAt'],'method':labels['method']}
    all_notices={r['url']:{**r,'sourceSha':v['source']['sha']} for v in indexes if v['state']=='checked' for r in v['data']['rows']}
    summaries={}
    for f in scope:
        assessed=label_reviews['entries'][f['id']]
        applications=[r['application'] for r in f['regulatory']]
        pmas=[a for a in applications if a.startswith('P')]
        records=[];identity=True
        for r in f['regulatory']:
            if r['kind']=='pma':
                original=next((h for h in history['rows'] if h['pma_number']==r['application'] and not h.get('supplement_number')),None)
                identity=identity and bool(original and original['decision_date']==r['decisionDate'] and original['decision_code']=='APPR')
            else:
                identity=identity and r['status']=='510(k) clearance' and r['decisionCode'] in ('SESE','SESP')
                records.append({'application':r['application'],'supplement':'','date':r['decisionDate'],'decision':r['status'],'tradeName':r['title'],'applicant':r['applicant'],'statement':r['statement'],'reason':'Original clearance; PMA supplements do not apply','url':r['url'],'sourceSha':r['sourceSha']})
        for r in history['rows']:
            if r['pma_number'] in pmas:
                records.append({'application':r['pma_number'],'supplement':r.get('supplement_number',''),'date':r['decision_date'],'decision':'PMA approval' if r['decision_code']=='APPR' else 'FDA decision code '+r['decision_code'],'tradeName':r.get('trade_name',''),'applicant':r.get('applicant',''),'statement':r.get('ao_statement',''),'reason':r.get('supplement_reason',''),'type':r.get('supplement_type',''),'url':PMA_PAGE+r['pma_number']+r.get('supplement_number',''),'sourceSha':hsha[hkey(r)]})
        records.sort(key=lambda r:(r['date'],r['application'],r['supplement']),reverse=True)
        changes=[r for r in records if r['supplement'] and re.search(r'\blabel(?:ing|ling)?\b',r['reason']+' '+r['statement'],re.I)]
        documents=[d for d in labels['documents'] if d['application'] in applications]
        located=[d for d in documents if d.get('url')]
        for r in f['regulatory']:
            if r['kind']=='510k':
                summary=next((m['sourceUrl'] for m in json.loads((root/'data/dossier-description-documents.json').read_text()) if m['application']==r['application']),None)
                if summary:documents.append({'application':r['application'],'url':summary,'state':'summary-only','method':'Previously inspected FDA 510(k) summary; not a complete instruction for use','checkedAt':r['retrievedAt']})
        labelpages=[p for p in labels['pages'] if p['application'] in applications]
        rrows=[]
        for r in recalls['rows']:
            matched=[a for a in applications if recall_for(r,a)]
            if not matched:continue
            keep={k:r.get(k,'') for k in ['cfres_id','product_res_number','product_description','code_info','reason_for_recall','action','recall_status','event_date_initiated','event_date_posted','event_date_terminated','recalling_firm','root_cause_description']}
            rrows.append({**keep,'applications':matched,'url':RECALL_PAGE+r['cfres_id'],'sourceSha':rsha[r['cfres_id']],'scopeAudit':safety_reviews['recalls'][r['cfres_id']]})
        rrows.sort(key=lambda r:r['event_date_posted'],reverse=True)
        unresolved=[{'url':RECALL_PAGE+r['cfres_id'],'identifiers':r.get('pma_numbers',[])} for r in recalls['rows'] if any(v.startswith(a) for v in r.get('pma_numbers',[]) for a in pmas) and not any(recall_for(r,a) for a in pmas)]
        terms=sorted({t for a in applications for t in NOTICE_TERMS.get(a,[])})
        candidates=[{**r,'matchedTerms':[t for t in terms if t in r['title'].lower()],'review':'Candidate: title or class context only; model/application applicability not established'} for r in all_notices.values() if any(t in r['title'].lower() for t in terms)]
        notice_reviews=[n for n in safety_reviews['notices'] if f['id'] in n['familyIds']]
        for c in candidates:
            decision=next((n for n in notice_reviews if n['url']==c['url']),None)
            if decision:c['review']=decision['status']+': '+decision['scope']+' '+decision['limitation']
        for u in unresolved:
            u['assessment']=safety_reviews['unresolvedReferences'][u['url'].split('=')[-1]]
        regstate='checked' if applications and identity and (not pmas or history['complete']) else 'partial' if applications else 'not-established'
        regdetail=(f"{len(records)} FDA decision records indexed; original identity/date checked. Public PMA history inventory reconciled to provider count." if pmas else 'Original 510(k) clearance and source identity checked; PMA supplement history does not apply.') if applications else 'No public FDA marketing application established in this collection. Trial registration/publication is not authorization.'
        labelstate='located' if located else 'summary-only' if applications and not pmas else 'unavailable' if applications else 'not-applicable'
        labeldetail=f"{len(located)} original labeling link(s); {len(changes)} labeling-related FDA decisions. Findings and remaining revision gaps are documented in the model-scoped review." if applications else 'No commercial labeling assigned to this investigational entry; protocol/publication evidence is separate.'
        safety_state='checked' if applications and recalls['complete'] else 'partial' if applications else 'not-established'
        safety_detail=(f"{len(rrows)} application-linked recall record(s): source fields audited, exact FDA model/lot text preserved. Individual unit applicability is not determined." if rrows else 'No direct application-linked recall record found in the checked FDA snapshot. This does not establish absence of recalls or safety.') if applications else 'No reliable application-based recall join is available; no safety clearance is inferred.'
        notice_state='screened-candidates-reviewed' if all(any(n['url']==c['url'] for n in notice_reviews) for c in candidates) else 'partial'
        summary={'familyId':f['id'],'name':f['name'],'reviewedAt':acquired['createdAt'],'regulatory':{'state':regstate,'detail':regdetail,'records':len(records)},'labeling':{'state':labelstate,'detail':labeldetail,'documents':len(located),'changes':len(changes)},'safety':{'state':safety_state,'detail':safety_detail,'recalls':len(rrows)},'labelReview':assessed,'currentLabelReview':assessed['status'],'noticeReview':notice_state,'modelLotReview':'source-fields-audited' if rrows else 'not-established','sourceLinks':[{'title':'Research evidence: '+r['id'],'url':r['url']} for r in f['studies']+f['publications']]+[{'title':'Original FDA decision','url':r['url']} for r in f['regulatory']]+[{'title':'Original labeling','url':d['url']} for d in located]+[{'title':'Application-linked recall (FDA-reported scope)','url':r['url']} for r in rrows[:1]],'path':'/dossiers/'+f['id']+'.json'}
        summary['sourceLinks']=[dict(title=s['title'],url=s['url']) for s in assessed['sources']]+[dict(title='Reviewed FDA safety notice',url=n['url']) for n in notice_reviews]+summary['sourceLinks']
        summary['sourceLinks']=list({s['url']:s for s in reversed(summary['sourceLinks'])}.values())
        dossier={**summary,'applications':applications,'researchEvidence':f['studies']+f['publications'],'regulatory':{**summary['regulatory'],'identityChecked':identity if applications else False,'rows':records,'sources':[s for s in history['sources'] if s.get('sha') in {r['sourceSha'] for r in records}] if pmas else [{'url':r['sourceUrl'],'sha':r['sourceSha'],'file':r['sourceSha']+'.json','retrievedAt':r['retrievedAt'],'providerUpdatedAt':r['providerUpdatedAt'],'originalSnapshot':True} for r in f['regulatory']]},'labeling':{**summary['labeling'],'rows':documents,'pages':labelpages,'changeIds':[r['application']+r['supplement'] for r in changes],'inventory':inventory},'safety':{**summary['safety'],'rows':rrows,'sources':recalls['sources'] if applications else [],'noticeCandidates':candidates,'noticeReviews':notice_reviews,'unresolvedReferences':unresolved,'screenedTerms':terms,'indexes':[{'source':v['source'],'state':v['state'],'rows':len(v['data'].get('rows',[]))} for v in indexes],'limits':['Recall API coverage begins in 2002; earlier recalls are not exhaustively covered. Malformed direct identifiers are excluded from accepted joins and shown separately for review.','Only root pma_numbers/k_numbers used for joins; recognized PMA supplements normalize to their parent application. Harmonized manufacturer identifiers and name similarity are excluded.','FDA notice index pages for 2023–2026 screened by explicit product/class terms; pre-2023 web archives and manufacturer notices not exhaustively reviewed.','Source-field audits and notice-scope decisions are distinct from clinical signoff or patient/unit matching. FDA recall status is as reported in the dated snapshot. MAUDE and enforcement reconciliation are outside this review.']}}
        dossier['review']={'method':label_reviews['method'],'next':assessed['limitations']+['Reconcile the exact package/model IFU and any newer manufacturer actions before clinical use. Historical recall termination does not certify every implanted unit as safe.']}
        atomic(root/'public/dossiers'/(f['id']+'.json'),(json.dumps(dossier,ensure_ascii=False,indent=2)+'\n').encode())
        summaries[f['id']]=summary
    if len(summaries)!=91:raise ValueError('Expected all 91 explained entries')
    atomic(root/'data/dossier-summary.json',(json.dumps(summaries,indent=2)+'\n').encode())
    print(json.dumps({'dossiers':len(summaries),'regulatoryChecked':sum(s['regulatory']['state']=='checked' for s in summaries.values()),'recallSearchChecked':sum(s['safety']['state']=='checked' for s in summaries.values()),'labelLinks':sum(s['labeling']['documents'] for s in summaries.values()),'historyRecords':len(history['rows']),'recallRecords':len(recalls['rows']),'noticeIndexRows':len(all_notices)},indent=2))

if __name__=='__main__':build()
