"""Refresh provenance hashes and measured GLB geometry/download sizes."""
from pathlib import Path
import gzip,hashlib,json,struct
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'ASSET_MANIFEST.json').read_text())
assets=[]
for p in sorted((root/'dist/assets').glob('*.glb')):
 raw=p.read_bytes();assert raw[:4]==b'glTF'
 doc=json.loads(raw[20:20+struct.unpack_from('<I',raw,12)[0]])
 primitives=[q for m in doc['meshes'] for q in m['primitives']]
 human=bool(doc.get('skins'))
 assert not any('uri' in b for b in doc['buffers'])
 assert not any(i.get('uri','').startswith(('http:','https:')) for i in doc.get('images',[]))
 entry={'file':str(p.relative_to(root)),'bytes':len(raw),'gzipBytes':len(gzip.compress(raw,mtime=0)),'sha256':hashlib.sha256(raw).hexdigest(),'triangles':sum(doc['accessors'][q['indices']]['count']//3 for q in primitives),'primitives':len(primitives),'animations':[a['name'] for a in doc.get('animations',[])],'source':'blender/'+('equipment_lod.py and equipment_lod.blend' if p.stem in ['scan-lod','care-lod','consult-lod'] else 'service_staff.py and service_staff.blend' if p.stem.startswith(('staff-assistant','staff-facilities')) or p.stem=='service-props' else 'lobby.py and lobby.blend' if p.stem=='lobby' else 'staff_roles.py and staff_roles.blend' if p.stem.startswith('staff-') else 'characters.py and characters.blend' if human else 'drape.py and drape.blend' if p.stem=='drape' else 'doors.py and doors.blend' if p.stem=='doors' else 'hospital.py and hospital.blend'),'provenance':'Original geometry, materials and, where present, rig/animation; substantial AI assistance. No downloaded or ripped human/game assets.','license':'CC0-1.0'}
 if human:entry['joints']=len(doc['skins'][0]['joints'])
 assets.append(entry)
manifest['assets']=assets;manifest['updated']='2026-11-01';manifest['patientAppearances']={'manifest':'dist/assets/patient-appearances.json','count':11,'effects':'Visual only; no simulation RNG, ability or care modifiers.'}
(root/'ASSET_MANIFEST.json').write_text(json.dumps(manifest,indent=2)+'\n')
(root/'dist/docs/ASSET_MANIFEST.json').write_text(json.dumps(manifest,indent=2)+'\n')
appearances=json.loads((root/'dist/assets/patient-appearances.json').read_text())['appearances']
initial={*(a['lod'] for a in appearances),'scan-lod.glb','care-lod.glb','consult-lod.glb','rest.glb','drape.glb','doors.glb','clinician-lod.glb','coat-lod.glb','lobby.glb','service-props.glb'}
initial.update('staff-'+role+'-lod.glb' for role in ['doctor','surgeon','nurse','np','pa','imaging','reception','assistant','facilities'])
loaded=[a for a in assets if Path(a['file']).name in initial]
result={'model':'1.0.0-rc2','initialGlbCount':len(loaded),'initialGlbBytes':sum(a['bytes'] for a in loaded),'initialGlbGzipBytes':sum(a['gzipBytes'] for a in loaded),'note':'gzip values measured locally; server transfer encoding and cache behavior may differ. Runtime JS/CSS/vendor are listed separately.','runtimeRawBytes':sum(p.stat().st_size for p in (root/'dist').rglob('*') if p.is_file() and p.suffix in ['.mjs','.js','.css'] and 'replisome' not in p.parts and 'legacy' not in p.parts),'assetCount':len(assets)}
(root/'evidence/asset-sizes-v10.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
