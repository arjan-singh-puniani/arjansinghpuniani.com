"""Extract the unchanged, ontology-tagged skin mesh from the official HRA GLB.
Usage: python3 scripts/extract-body.py /path/to/3d-vh-m-united.glb
No mesh resampling or anatomical registration is performed.
"""
import copy
import hashlib
import json
from pathlib import Path
import struct
import sys

root=Path(__file__).resolve().parent.parent
raw=Path(sys.argv[1]).read_bytes()
size=struct.unpack_from('<I',raw,12)[0]
gltf=json.loads(raw[20:20+size])
offset=20+size
binary=raw[offset+8:offset+8+struct.unpack_from('<I',raw,offset)[0]]
source_node=next(n for n in gltf['nodes'] if n.get('extras',{}).get('ontologyid')=='UBERON:0002097')
mesh=copy.deepcopy(gltf['meshes'][source_node['mesh']])
accessors=[];views=[];data=bytearray();remap={}
for primitive in mesh['primitives']:
    # Keep the original attributes, indices and normals byte-for-byte.
    for key,index in [('indices',primitive['indices']),*primitive['attributes'].items()]:
        if index not in remap:
            accessor=copy.deepcopy(gltf['accessors'][index])
            view=copy.deepcopy(gltf['bufferViews'][accessor['bufferView']])
            while len(data)%4:data.append(0)
            # HRA shares large buffer views across organs. Extract just this
            # accessor, respecting interleaving, rather than copying the corpus.
            components={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}
            width=components[accessor['type']]*{5120:1,5121:1,5122:2,5123:2,5125:4,5126:4}[accessor['componentType']]
            stride=view.get('byteStride',width)
            start=view.get('byteOffset',0)+accessor.get('byteOffset',0)
            payload=binary[start:start+accessor['count']*width] if stride==width else b''.join(binary[start+i*stride:start+i*stride+width] for i in range(accessor['count']))
            accessor['byteOffset']=0
            view={'buffer':0,'byteOffset':len(data),'byteLength':len(payload),**({'target':view['target']} if 'target' in view else {})}
            data.extend(payload)
            accessor['bufferView']=len(views);views.append(view)
            remap[index]=len(accessors);accessors.append(accessor)
        if key=='indices':primitive[key]=remap[index]
        else:primitive['attributes'][key]=remap[index]
    primitive['material']=0
node=copy.deepcopy(source_node);node['mesh']=0
assert not any('children' in n and gltf['nodes'].index(source_node) in n['children'] and any(k in n for k in ['matrix','translation','rotation','scale']) for n in gltf['nodes']), 'Parent transforms need explicit preservation'
out={'asset':{'version':'2.0','generator':'BODY//ATLAS HRA surface extraction; original mesh unchanged'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[node],'meshes':[mesh],'accessors':accessors,'bufferViews':views,'buffers':[{'byteLength':len(data)}],'materials':[{'name':'HRA skin reference','pbrMetallicRoughness':{'baseColorFactor':[0.4,0.7,0.75,1],'metallicFactor':0,'roughnessFactor':0.8}}]}
encoded=json.dumps(out,separators=(',',':')).encode()
while len(encoded)%4:encoded+=b' '
while len(data)%4:data.append(0)
body=struct.pack('<III',0x46546c67,2,28+len(encoded)+len(data))+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+struct.pack('<II',len(data),0x004e4942)+data
dest=root/'public/anatomy/body.glb';dest.write_bytes(body)
manifest={'asset':'HRA male united v1.5 — skin surface','sourceUrl':'https://cdn.humanatlas.io/hra-releases/v2.0/models/3d-vh-m-united.glb.zip','doi':'https://doi.org/10.48539/HBM646.RKKC.257','license':'CC BY 4.0','creators':['Kristen Browne','Heidi Schlehlein'],'sourceNode':source_node['name'],'ontologyId':'UBERON:0002097','sourceGlbSha256':hashlib.sha256(raw).hexdigest(),'sha256':hashlib.sha256(body).hexdigest(),'bytes':len(body),'triangles':accessors[mesh['primitives'][0]['indices']]['count']//3,'adaptations':'Isolated original skin mesh and retained original vertex/index buffers and metadata. Runtime color, contour shading, view centering and uniform scaling. Region links are UI locators, not registered device coordinates.'}
(root/'public/anatomy/body-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(manifest,indent=2))
