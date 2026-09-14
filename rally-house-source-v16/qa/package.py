from pathlib import Path
import hashlib,json,zipfile
root=Path(__file__).resolve().parent.parent
files=sorted(p for p in root.rglob('*') if p.is_file() and not any(x in p.relative_to(root).parts for x in ['node_modules','.git','__pycache__']) and p.name not in ['.DS_Store','RELEASE-MANIFEST.json','legacy-fixture-path.txt'])
manifest={'release':'Rally House v16 — Presence & Acting; development candidate','files':{str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}}
(root/'RELEASE-MANIFEST.json').write_text(json.dumps(manifest,indent=2))
files.append(root/'RELEASE-MANIFEST.json')
archive=root.parent/'Rally-House-Presence-v16.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in files:z.write(p,str(Path(root.name)/p.relative_to(root)))
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 assert len(z.namelist())==len(files)
print(str(archive));print(f'{len(files)} files; {archive.stat().st_size/1048576:.1f} MiB; ZIP CRC verified')
# Neutral tester package excludes design documents, personalities and QA answers.
tester=[root/'index.html',root/'style.css',root/'run.command',root/'TESTER-HANDOFF.md',*sorted((root/'dist').rglob('*.js'))]
small=root.parent/'Rally-House-v16-Playtest.zip'
with zipfile.ZipFile(small,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in tester:z.write(p,str(Path('Rally-House-v16-Playtest')/p.relative_to(root)))
with zipfile.ZipFile(small) as z:assert z.testzip() is None
print(f'{small}: {small.stat().st_size/1048576:.2f} MiB; ZIP CRC verified')
