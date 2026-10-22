"""Generate auditable, UNACCEPTED anatomy candidates from genuine record fields.

This is triage, not an anatomical classifier. No candidate reaches the accepted
curation layer without review of original placement evidence.
"""
import argparse
import csv
import json
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parent.parent
TERMS=[(r'\b(thalam\w*|VIM)\b','UBERON:0001897'),(r'\bsubthalamic\b','UBERON:0001906'),(r'\b(cortic\w*|cortex)\b','UBERON:0000956'),(r'\bvag(us|al)\b','UBERON:0001759'),(r'\bspinal cord\b','UBERON:0002240'),(r'\bcochle\w*\b','UBERON:0001844'),(r'\bbrain\b','UBERON:0000955')]

def candidate(record):
    text=' '.join([record.get('title',''),record.get('statement','')])
    hits=[(oid,m.group(0)) for pattern,oid in TERMS for m in [re.search(pattern,text,re.I)] if m]
    return {'recordId':record['id'],'sourceUrl':record['url'],'sourceSha':record['sourceSha'],
      'candidateStructureIds':';'.join(oid for oid,_ in hits),'matchedText':';'.join(t for _,t in hits),
      'relationshipType':'unlocalized','spatialPrecision':'unlocalized',
      'evidenceState':'Provisional' if hits else 'Unknown','automaticallyAccepted':False,
      'reviewStatus':'unreviewed','reviewer':'','reviewNotes':'Names and indications alone cannot establish physical placement.',
      'acceptedStructureId':'','acceptedRelationshipType':'','placementSource':'','placementLocator':''}

def validate_review(row):
    if row['reviewStatus'] not in ('unreviewed','accepted','rejected','abstain'):
        raise ValueError('Invalid review status')
    if row['reviewStatus']=='accepted':
        for field in ['reviewer','acceptedStructureId','acceptedRelationshipType','placementSource','placementLocator']:
            if not row.get(field):raise ValueError('Accepted review requires '+field)
        if row['acceptedRelationshipType'] not in ['implantation_site','tissue_interface','measurement_site','physiological_target','therapeutic_action_site','delivery_location','external_placement']:
            raise ValueError('Unknown relationship type')
        if not row['placementSource'].startswith('https://'):raise ValueError('Placement needs original evidence URL')
    return True

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--validate',type=Path);args=parser.parse_args()
    if args.validate:
        with args.validate.open() as f:
            rows=list(csv.DictReader(f))
        for row in rows:validate_review(row)
        print(len(rows),'review rows valid; accepted',sum(r['reviewStatus']=='accepted' for r in rows))
    else:
        data=json.loads((ROOT/'data/atlas.json').read_text())
        rows=[candidate(r) for r in data['records'] if r['kind'] in ('510k','pma','de_novo')]
        dest=ROOT/'validation/anatomical-review-queue.csv';dest.parent.mkdir(exist_ok=True)
        with dest.open('w',newline='') as f:
            w=csv.DictWriter(f,fieldnames=list(rows[0]),lineterminator='\n');w.writeheader();w.writerows(rows)
        print(len(rows),'review candidates; 0 automatically accepted')
