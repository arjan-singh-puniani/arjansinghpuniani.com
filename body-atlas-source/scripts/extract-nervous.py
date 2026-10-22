"""Extract registered brain and spinal meshes; preserve hierarchy and source transforms.
Usage: python3 scripts/extract-nervous.py /path/to/3d-vh-m-united.glb
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
    if n.get('name') in ['Allen_brain','VH_M_spinal_cord']:descend(i)
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
out={'asset':{'version':'2.0','generator':'BODY//ATLAS registered HRA nervous reference extraction'},'scene':gltf.get('scene',0),'scenes':scenes,'nodes':out_nodes,'meshes':meshes,'accessors':accessors,'bufferViews':views,'buffers':[{'byteLength':len(data)}],'materials':[{'pbrMetallicRoughness':{'baseColorFactor':[.5,.8,.85,1],'metallicFactor':0,'roughnessFactor':.6}}]}
encoded=json.dumps(out,separators=(',',':')).encode()
while len(encoded)%4:encoded+=b' '
while len(data)%4:data.append(0)
body=struct.pack('<III',0x46546c67,2,28+len(encoded)+len(data))+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+struct.pack('<II',len(data),0x004e4942)+data
(root/'public/anatomy/nervous.glb').write_bytes(body)
manifest={'asset':'HRA united male v1.5 — brain and spinal cord','sourceUrl':'https://cdn.humanatlas.io/hra-releases/v2.0/models/3d-vh-m-united.glb.zip','doi':'https://doi.org/10.48539/HBM646.RKKC.257','license':'CC BY 4.0','creators':['Kristen Browne','Heidi Schlehlein'],'sourceGlbSha256':hashlib.sha256(raw).hexdigest(),'sha256':hashlib.sha256(body).hexdigest(),'bytes':len(body),'meshes':len(meshes),'triangles':sum(accessors[p['indices']]['count']//3 for m in meshes for p in m['primitives']),'adaptations':'Extracted original brain and spinal meshes with original hierarchy, node transforms, attributes and indices. Buffer views repacked. Same united reference frame as body surface; shared display centering and uniform scale. No device coordinates or vagus nerve geometry.'}
(root/'public/anatomy/nervous-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps(manifest,indent=2))
