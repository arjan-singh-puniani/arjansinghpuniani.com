"""Persist compact browser evidence without machine-specific paths or traces."""
import base64
import json
import shutil
from pathlib import Path

root=Path(__file__).resolve().parent.parent
result=json.loads((root/'test-results/browser-results.json').read_text())
tests=[];performance=[]
for suite in result['suites']:
    for spec in suite.get('specs',[]):
        for test in spec['tests']:
            tests.append({'title':spec['title'],'project':test['projectName'],'outcome':test['status'],'results':[{'status':r['status'],'durationMs':r['duration']} for r in test['results']]})
            for r in test['results']:
                for a in r.get('attachments',[]):
                    if a['name']=='performance.json' and a.get('body'):
                        performance.append({'project':test['projectName'],**json.loads(base64.b64decode(a['body']))})
summary={'runStarted':result['config'].get('metadata',{}),'stats':result['stats'],'tests':tests,'note':'Installed Google Chrome; mobile viewport/touch emulation, not physical Safari.'}
(root/'validation/browser-summary.json').write_text(json.dumps(summary,indent=2)+'\n')
(root/'validation/browser-performance.json').write_text(json.dumps(performance,indent=2)+'\n')
(root/'validation/screenshots').mkdir(exist_ok=True)
for name in ['desktop-atlas.png','mobile-atlas.png']:
    shutil.copy2(root/'test-results'/name,root/'validation/screenshots'/name)
assert all(t['outcome']=='expected' for t in tests)
print(len(tests),'expected browser results')
for p in performance:
    m=p['metrics'];print(p['project'],'FCP ms',next(x['startTime'] for x in m['paint'] if x['name']=='first-contentful-paint'),'GLB ms',m['resources'][0]['duration'],'heap bytes',m['heap'])
