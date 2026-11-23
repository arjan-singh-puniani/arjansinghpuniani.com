from pathlib import Path
import zipfile
root=Path(__file__).resolve().parent.parent
files=[root/'index.html',root/'style.css',root/'championship.css',root/'spatial.css',root/'lab.css',root/'run.command',root/'TESTER-HANDOFF.md',*sorted((root/'dist').rglob('*.js')),*sorted(p for p in (root/'assets').rglob('*') if p.is_file())]
archive=root.parent/'Rally-House-v16-Playtest.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in files:z.write(p,str(Path('Rally-House-v16-Playtest')/p.relative_to(root)))
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 assert any('/assets/characters/' in name for name in z.namelist()),'Playable character assets must travel with the code'
 assert not any(name.endswith('opponent-doh.wav') for name in z.namelist()),'Removed third-party audio cannot re-enter the preview'
print(f'{archive}: {archive.stat().st_size/1024:.0f} KiB; {len(files)} files; CRC verified')
