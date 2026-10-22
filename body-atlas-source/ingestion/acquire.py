"""Bounded acquisition plan. All URLs are code-owned, never supplied by the browser."""
from urllib.parse import urlencode

FDA = 'https://api.fda.gov/device/'

def fda(endpoint, **params):
    return FDA + endpoint + '.json?' + urlencode(params)

PMAS = ['P960009', 'P100026', 'P970003', 'P030017', 'P150038', 'P840024', 'P140009']

def plan():
    jobs = [('fda-510k-neurology', '510k', fda('510k', search='advisory_committee:NE', limit=100, sort='decision_date:desc'))]
    jobs.append(('tms-original', '510k', fda('510k', search='k_number:K061053', limit=1)))
    jobs.append(('tms-labeling-2013', '510k', fda('510k', search='k_number:K130233', limit=1)))
    for code in PMAS:
        jobs.append(('pma-'+code, 'pma', fda('pma', search='pma_number:'+code, limit=1, sort='decision_date:asc')))
    for code in ['GZB', 'GWF', 'MHY', 'PFN', 'LYJ', 'NHL', 'GZL', 'MCM', 'PKP', 'QCI']:
        jobs.append(('classification-'+code, 'classification', fda('classification', search='product_code:'+code, limit=1)))
    for name, term in [('rns', '"NeuroPace"'), ('bci', '"BrainGate"'), ('cooling', '"cortical cooling"'), ('dbs', '"deep brain stimulation"')]:
        jobs.append(('trials-'+name, 'trial', 'https://clinicaltrials.gov/api/v2/studies?'+urlencode({'query.term':term, 'pageSize':5, 'format':'json'})))
    jobs.append(('rns-pivotal', 'trial', 'https://clinicaltrials.gov/api/v2/studies?'+urlencode({'filter.ids':'NCT00264810','format':'json'})))
    for name,term in [('cooling','"focal cortical cooling"'),('bci','"BrainGate"'),('rns','"responsive cortical stimulation" Morrell')]:
        jobs.append(('pubmed-search-'+name, 'pubmed-search', 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?'+urlencode({'db':'pubmed','term':term,'retmode':'json','retmax':3,'sort':'relevance','tool':'BodyAtlas'})))
    jobs.append(('pubmed-search', 'pubmed-search', 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?'+urlencode({'db':'pubmed','term':'("responsive neurostimulation" OR "intracortical brain computer interface" OR "focal cortical cooling")','retmode':'json','retmax':12,'tool':'BodyAtlas'})))
    jobs.append(('nih-neuro', 'grant', 'https://api.reporter.nih.gov/v2/projects/search'))
    return jobs

# Bounded, original PMA approvals plus a recent cross-specialty 510(k) sample.
# Individual applications are not deduplicated into asserted unique product families.
def whole_body_plan():
    jobs=[]
    for skip in [0,500]:
        jobs.append((('whole-body-pma-canonical-' if skip else 'whole-body-pma-original-')+str(skip),'pma',fda('pma',search='decision_code:APPR AND supplement_number:""'+(' AND pma_number:P*' if skip else ''),limit=500,skip=skip,sort='decision_date:desc')))
    for panel in ['AN','CH','CV','DE','EN','GU','HE','HO','IM','MI','NE','OB','OP','OR','PA','RA']:
        jobs.append(('whole-body-510k-'+panel+('-quoted' if panel=='OR' else ''),'510k',fda('510k',search='advisory_committee:'+ ('"OR"' if panel=='OR' else panel),limit=100,sort='decision_date:desc')))
    return jobs
