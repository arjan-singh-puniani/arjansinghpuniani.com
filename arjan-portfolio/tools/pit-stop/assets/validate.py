"""Dependency-free GLB boundary/hierarchy/material self-check. Run from any cwd."""
import struct,json,pathlib,hashlib,math
root=pathlib.Path(__file__).resolve().parents[3]
asset=root/'public/pit-stop-lab/assets'
manifest=json.loads((asset/'provenance.json').read_text())
for name in ['sf26-primary.glb','sf26-runtime.glb']:
 b=(asset/name).read_bytes();magic,version,length=struct.unpack_from('<III',b)
 assert magic==0x46546c67 and version==2 and length==len(b)
 size,kind=struct.unpack_from('<II',b,12);assert kind==0x4e4f534a
 j=json.loads(b[20:20+size]);assert j['asset']['version']=='2.0'
 assert len(b)<8_000_000
 names={n.get('name') for n in j['nodes']};assert {'Bodywork','SF26_reference_study','Wheel_FL','Wheel_FR','Wheel_RL','Wheel_RR'}<=names
 tris=0;minv=[math.inf]*3;maxv=[-math.inf]*3
 for m in j['meshes']:
  for p in m['primitives']:
   assert {'POSITION','NORMAL','TEXCOORD_0'}<=p['attributes'].keys()
   a=j['accessors'][p['attributes']['POSITION']];assert a['count']>0
   assert all(math.isfinite(v) for v in a['min']+a['max'])
   for i in range(3):minv[i]=min(minv[i],a['min'][i]);maxv[i]=max(maxv[i],a['max'][i])
   tris+=j['accessors'][p['indices']]['count']//3
 assert 20_000<tris<180_000
 assert maxv[2]-minv[2]>4.7 and maxv[1]-minv[1]<1.6
 for v in j['bufferViews']:assert v.get('byteOffset',0)+v['byteLength']<=j['buffers'][0]['byteLength']
 assert all('bufferView' in i and 'uri' not in i for i in j['images'])
 assert 'KHR_materials_clearcoat' in j['extensionsUsed']
 assert any('normalTexture' in m for m in j['materials'])
 assert manifest['files'][name]['sha256']==hashlib.sha256(b).hexdigest()
 print(name,json.dumps({'bytes':len(b),'triangles':tris,'meshes':len(j['meshes']),'textures':len(j['images']),'localBounds':[minv,maxv]}))
assert (root/'assets/pit-stop/sf26-reference.blend').stat().st_size>1_000_000
print('Asset boundary, editable source, UVs, normals, embedded textures, hierarchy and provenance checks passed.')
