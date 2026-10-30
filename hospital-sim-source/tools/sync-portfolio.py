"""Copy the reviewed build into an existing portfolio checkout; preserve its REPLISOME."""
from pathlib import Path
import hashlib,json,shutil,sys
root=Path(__file__).resolve().parents[1]
portfolio=Path(sys.argv[1]).resolve()
app=portfolio/'arjan-portfolio'
assert (app/'public/replisome/index.html').exists(), 'Expected existing portfolio REPLISOME'
def hashes(directory):
 return {str(p.relative_to(directory)):hashlib.sha256(p.read_bytes()).hexdigest() for p in directory.rglob('*') if p.is_file()}
module_before=hashes(app/'public/replisome')
target=app/'public/hospitalsim';target.mkdir(parents=True,exist_ok=True)
for source in (root/'dist').iterdir():
 if source.name=='replisome':continue
 destination=target/source.name
 if source.is_dir():shutil.copytree(source,destination,dirs_exist_ok=True)
 else:shutil.copy2(source,destination)
source_target=portfolio/'hospital-sim-source';source_target.mkdir(exist_ok=True)
if not (source_target/'dist').exists():(source_target/'dist').symlink_to('../arjan-portfolio/public/hospitalsim',target_is_directory=True)
for name in ['blender','tests','tools','docs']:
 shutil.copytree(root/name,source_target/name,dirs_exist_ok=True,ignore=shutil.ignore_patterns('__pycache__','*.blend1'))
for name in ['README.md','CHANGELOG.md','ASSET_MANIFEST.json','LICENSE','ASSET_LICENSE.md']:
 if (root/name).exists():shutil.copy2(root/name,source_target/name)
for name in ['simulation-results.json','expansion-tests.json','performance-v04.json','release-v04.json','patient-loop-v04-events.json']:
 if (root/'evidence'/name).exists():
  (source_target/'evidence').mkdir(exist_ok=True);shutil.copy2(root/'evidence'/name,source_target/'evidence'/name)
assert module_before==hashes(app/'public/replisome'), 'Existing module changed'
manifest={'game':hashes(target),'preservedReplisome':module_before}
(source_target/'portfolio-files.json').write_text(json.dumps(manifest,indent=2))
print('Copied game and editable sources; preserved',len(module_before),'REPLISOME files byte-for-byte.')
