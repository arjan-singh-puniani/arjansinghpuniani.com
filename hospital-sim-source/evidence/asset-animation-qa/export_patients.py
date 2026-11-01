"""Isolated Blender exports avoid repeatedly sampling every retained character rig."""
import subprocess,concurrent.futures,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];OUT=Path(__file__).resolve().parent
BLENDER='/Applications/Blender.app/Contents/MacOS/Blender'
def export(index):
    name=f'patient-{index:02d}';log=OUT/(name+'-export.log')
    with log.open('w')as stream:
        result=subprocess.run([BLENDER,'-b','-t','2','--python-exit-code','1','--python',str(ROOT/'blender/characters.py'),'--','--patient',name],stdout=stream,stderr=subprocess.STDOUT)
    assert result.returncode==0,(name,log.read_text()[-1000:])
    print('ISOLATED_EXPORT_PASS',name,flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=2)as pool:list(pool.map(export,range(1,12)))
with (OUT/'source-only-build.log').open('w')as stream:
    result=subprocess.run([BLENDER,'-b','-t','2','--python-exit-code','1','--python',str(ROOT/'blender/characters.py'),'--','--source-only'],stdout=stream,stderr=subprocess.STDOUT)
assert result.returncode==0
print('EDITABLE_SOURCE_REBUILT',flush=True)
