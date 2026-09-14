from pathlib import Path
import zipfile
root=Path(__file__).resolve().parent.parent
files=[root/'index.html',root/'style.css',root/'run.command',root/'TESTER-HANDOFF.md',*sorted((root/'dist').rglob('*.js'))]
archive=root.parent/'Rally-House-v16-Playtest.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in files:z.write(p,str(Path('Rally-House-v16-Playtest')/p.relative_to(root)))
with zipfile.ZipFile(archive) as z:assert z.testzip() is None
print(f'{archive}: {archive.stat().st_size/1024:.0f} KiB; {len(files)} files; CRC verified')
