"""Validate editorial scope separately from machine-checked source inventory."""
import hashlib, json, re
from datetime import date
from urllib.parse import urlparse
from dossiers import recall_for

STATUSES = {'current-safety-source-reviewed', 'current-model-source-reviewed',
            'published-ifu-reviewed', 'model-limited-source-review',
            'historical-label-reviewed', 'historical-source-reviewed',
            'current-label-not-established', 'investigational'}
FIELDS = ['product_description', 'code_info', 'reason_for_recall', 'action',
          'recall_status', 'event_date_initiated', 'event_date_posted', 'event_date_terminated',
          'pma_numbers', 'k_numbers', 'recalling_firm']

def digest(row):
    return hashlib.sha256(json.dumps({k:row.get(k,'') for k in FIELDS},sort_keys=True,ensure_ascii=False).encode()).hexdigest()

def source_url(url, hosts):
    p=urlparse(url)
    if p.scheme!='https' or p.hostname not in hosts or p.username or p.password or p.port:
        raise ValueError('Unapproved review source URL')

def load_reviews(root, scope, rows):
    labels=json.loads((root/'data/dossier-reviews.json').read_text())
    safety=json.loads((root/'data/dossier-safety-reviews.json').read_text())
    hosts=json.loads((root/'data/source-hosts.json').read_text())
    ids={f['id'] for f in scope}
    if set(labels['entries'])!=ids:raise ValueError('Every explained entry needs an individual label assessment')
    for id,r in labels['entries'].items():
        if r['status'] not in STATUSES or not re.fullmatch(r'\d{4}-\d{2}-\d{2}',r['reviewedAt']):
            raise ValueError('Invalid label review status/date')
        date.fromisoformat(r['reviewedAt'])
        if not r['scope'] or not r['limitations'] or len(r['findings'])<2 or not r['sources']:
            raise ValueError('Review needs scope, findings, sources and explicit limits')
        for s in r['sources']:source_url(s['url'],hosts)
        for f in r['findings']:
            source_url(f['sourceUrl'],hosts)
            if not f['text'] or not f['locator'] or f['sourceUrl'] not in {s['url'] for s in r['sources']}:
                raise ValueError('Finding has no inspected source/locator')
    applications={a['application'] for f in scope for a in f['regulatory']}
    accepted=[r for r in rows if any(recall_for(r,a) for a in applications)]
    accepted_ids={r['cfres_id'] for r in accepted}
    if set(safety['recalls'])!=accepted_ids:
        raise ValueError('Recall snapshot changed; source-scope audit must be renewed')
    for row in accepted:
        if safety['recalls'][row['cfres_id']]['digest']!=digest(row):
            raise ValueError('Recall content changed; previous review cannot be inherited')
    rejected=[r for r in rows if r['cfres_id'] not in accepted_ids]
    if set(safety['unresolvedReferences'])!={r['cfres_id'] for r in rejected}:
        raise ValueError('Unresolved recall references changed; review required')
    for row in rejected:
        assessment=safety['unresolvedReferences'][row['cfres_id']]
        if assessment['digest']!=digest(row):raise ValueError('Unresolved recall content changed; review required')
        source_url(assessment['url'],hosts)
    for n in safety['notices']:
        source_url(n['url'],hosts)
        if not set(n['familyIds'])<=ids or not all(n[k] for k in ['status','scope','finding','limitation','locator','reviewedAt']):
            raise ValueError('Incomplete notice adjudication')
    return labels,safety
