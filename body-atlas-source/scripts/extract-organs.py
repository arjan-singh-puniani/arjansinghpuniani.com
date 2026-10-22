"""Extract registered whole-body organ meshes; preserve hierarchy and source transforms.
Usage: python3 scripts/extract-organs.py /path/to/3d-vh-m-united.glb
"""
import copy, hashlib, json, struct, sys
from pathlib import Path
root=Path(__file__).resolve().parent.parent
raw=Path(sys.argv[1]).read_bytes(); size=struct.unpack_from('<I',raw,12)[0]
gltf=json.loads(raw[20:20+size]); offset=20+size
binary=raw[offset+8:offset+8+struct.unpack_from('<I',raw,offset)[0]]
nodes=gltf['nodes']; selected=set()
def descend(i):
    selected.add(i)
    for j in nodes[i].get('children',[]):descend(j)
for i,n in enumerate(nodes):
    if n.get('name') in ['VH_M_heart','VH_M_lungs','VH_M_liver','VH_M_kidney_capsule_L','VH_M_kidney_capsule_R','VH_M_pancreas','VH_M_small_intestine','VH_M_colon','VH_M_urinary_bladder','VH_M_prostate_gland','VH_M_cornea_L','VH_M_cornea_R','VH_M_sclera_L','VH_M_sclera_R','VH_M_lower_limb','VH_M_pelvis','VH_M_vertebrae','VH_M_aorta','VH_M_urethra','VH_M_larynx']:descend(i)
assert selected, 'Required source structures missing'
mesh_nodes=set(selected)
while True:
    parents={i for i,n in enumerate(nodes) if any(j in selected for j in n.get('children',[]))}
    if parents <= selected:break
    selected |= parents
node_map={old:i for i,old in enumerate(sorted(selected))}
accessors=[];views=[];data=bytearray();remap={};meshes=[];mesh_map={}
for i in sorted(mesh_nodes):
    if 'mesh' not in nodes[i]:continue
    old=nodes[i]['mesh']
    if old in mesh_map:continue
    mesh=copy.deepcopy(gltf['meshes'][old])
    for primitive in mesh['primitives']:
        for key,index in [('indices',primitive['indices']),*primitive['attributes'].items()]:
            if index not in remap:
                a=copy.deepcopy(gltf['accessors'][index]);v=gltf['bufferViews'][a['bufferView']]
                assert 'sparse' not in a
                width={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']]*{5120:1,5121:1,5122:2,5123:2,5125:4,5126:4}[a['componentType']]
                stride=v.get('byteStride',width);start=v.get('byteOffset',0)+a.get('byteOffset',0)
                payload=binary[start:start+a['count']*width] if stride==width else b''.join(binary[start+j*stride:start+j*stride+width] for j in range(a['count']))
                while len(data)%4:data.append(0)
                a['byteOffset']=0;a['bufferView']=len(views)
                views.append({'buffer':0,'byteOffset':len(data),'byteLength':len(payload)})
                data.extend(payload);remap[index]=len(accessors);accessors.append(a)
            if key=='indices':primitive[key]=remap[index]
            else:primitive['attributes'][key]=remap[index]
        primitive['material']=0
    mesh_map[old]=len(meshes);meshes.append(mesh)
out_nodes=[]
for old in sorted(selected):
    n=copy.deepcopy(nodes[old])
    if 'children' in n:n['children']=[node_map[j] for j in n['children'] if j in selected]
    if 'mesh' in n:n['mesh']=mesh_map[n['mesh']]
    out_nodes.append(n)
scenes=[{'nodes':[node_map[i] for i in s['nodes'] if i in selected]} for s in gltf['scenes']]
out={'asset':{'version':'2.0','generator':'BODY//ATLAS registered HRA whole-body reference extraction'},'scene':gltf.get('scene',0),'scenes':scenes,'nodes':out_nodes,'meshes':meshes,'accessors':accessors,'bufferViews':views,'buffers':[{'byteLength':len(data)}],'materials':[{'pbrMetallicRoughness':{'baseColorFactor':[.5,.8,.85,1],'metallicFactor':0,'roughnessFactor':.6}}]}
encoded=json.dumps(out,separators=(',',':')).encode()
while len(encoded)%4:encoded+=b' '
while len(data)%4:data.append(0)
body=struct.pack('<III',0x46546c67,2,28+len(encoded)+len(data))+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+struct.pack('<II',len(data),0x004e4942)+data
(root/'public/anatomy/organs.glb').write_bytes(body)
# Region metadata comes from source nodes; no fabricated mesh or patient registration.
region_groups={'BODY:heart':'VH_M_heart','BODY:lung':'VH_M_lungs','BODY:liver':'VH_M_liver','BODY:kidney':'VH_M_kidney','BODY:pancreas':'VH_M_pancreas','BODY:intestine':'VH_M_small_intestine','BODY:colon':'VH_M_colon','BODY:bladder':'VH_M_urinary_bladder','BODY:prostate':'VH_M_prostate_gland','BODY:eye':'VH_M_eyes','BODY:hip':'VH_M_pelvis','BODY:knee':'VH_M_patella_L','BODY:vertebral':'VH_M_vertebrae','BODY:aorta':'VH_M_aorta','BODY:urethra':'VH_M_urethra','BODY:airway':'VH_M_larynx'}
# This release has no node transforms. Fail rather than assume this in another source.
assert not any(any(k in n for k in ['matrix','translation','rotation','scale']) for n in nodes)
body_node=next(n for n in nodes if n.get('extras',{}).get('ontologyid')=='UBERON:0002097')
position=gltf['accessors'][gltf['meshes'][body_node['mesh']]['primitives'][0]['attributes']['POSITION']]
center=[(a+b)/2 for a,b in zip(position['min'],position['max'])];scale=6/(position['max'][1]-position['min'][1])
source_regions={}
for rid,name in region_groups.items():
    indices=[]
    def walk(i):
        if i in mesh_nodes and 'mesh' in nodes[i]:indices.append(nodes[i]['mesh'])
        for j in nodes[i].get('children',[]):walk(j)
    original=next(i for i,n in enumerate(nodes) if n.get('name')==name);walk(original)
    mins=[];maxs=[]
    for mi in indices:
        for p in gltf['meshes'][mi]['primitives']:
            a=gltf['accessors'][p['attributes']['POSITION']];mins.append(a['min']);maxs.append(a['max'])
    if not mins:continue
    lo=[min(p[i] for p in mins) for i in range(3)];hi=[max(p[i] for p in maxs) for i in range(3)]
    source_regions[rid]={'sourceNode':name,'center':[((lo[i]+hi[i])/2-center[i])*scale for i in range(3)],'size':[(hi[i]-lo[i])*scale for i in range(3)],'sourceMin':lo,'sourceMax':hi}
(root/'public/anatomy/organ-regions.json').write_text(json.dumps(source_regions,indent=2)+'\n')
manifest={'asset':'HRA united male v1.5 — whole-body organs and skeletal reference','sourceUrl':'https://cdn.humanatlas.io/hra-releases/v2.0/models/3d-vh-m-united.glb.zip','doi':'https://doi.org/10.48539/HBM646.RKKC.257','license':'CC BY 4.0','creators':['Kristen Browne','Heidi Schlehlein'],'sourceGlbSha256':hashlib.sha256(raw).hexdigest(),'sha256':hashlib.sha256(body).hexdigest(),'bytes':len(body),'meshes':len(meshes),'triangles':sum(accessors[p['indices']]['count']//3 for m in meshes for p in m['primitives']),'adaptations':'Extracted original whole-body organ meshes with original hierarchy, node transforms, attributes and indices. Buffer views repacked. Same united reference frame as body surface; shared display centering and uniform scale. No device coordinates or vagus nerve geometry.'}
(root/'public/anatomy/organs-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps(manifest,indent=2))
