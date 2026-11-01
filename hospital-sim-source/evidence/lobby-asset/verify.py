"""Read-only GLB roundtrip/bounds/material checks; renders the actual exported meshes."""
import bpy,json,struct,math,sys,importlib.util
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];OUT=Path(__file__).resolve().parent
path=ROOT/'dist/assets/lobby.glb';raw=path.read_bytes();length=struct.unpack_from('<I',raw,12)[0];doc=json.loads(raw[20:20+length])
expected={'WaitingBench':(2,.65,.9194514155),'PaperAccordion':(.28,.10,.12),'IntakeTray':(.22,.28,.06),'ReceptionCounter':(1,.48,.965)}
assert len(raw)<200000 and not doc.get('animations')and not doc.get('cameras')and not doc.get('skins')
assert len(doc['nodes'])==4 and {n['name']for n in doc['nodes']}==set(expected)
assert all('uri'not in b for b in doc['buffers'])and len(doc['images'])==1 and 'bufferView'in doc['images'][0]
for mesh in doc['meshes']:
    assert len(mesh['primitives'])==1
    p=mesh['primitives'][0];assert 'TEXCOORD_0'in p['attributes']and 'TEXCOORD_1'not in p['attributes']
    material=doc['materials'][p['material']]['pbrMetallicRoughness'];assert 'metallicRoughnessTexture'in material and material['metallicRoughnessTexture'].get('texCoord',0)==0
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(path))
objects=[o for o in bpy.data.objects if o.type=='MESH'];assert len(objects)==4
results={}
for obj in objects:
    assert obj.name in expected
    assert obj.location.length<1e-6 and max(abs(obj.scale[i]-1)for i in range(3))<1e-6
    points=[obj.matrix_world@v.co for v in obj.data.vertices]
    lo=[min(p[i]for p in points)for i in range(3)];hi=[max(p[i]for p in points)for i in range(3)]
    dims=[hi[i]-lo[i]for i in range(3)]
    assert max(abs(dims[i]-expected[obj.name][i])for i in range(3))<2e-5,(obj.name,dims)
    assert abs(lo[2])<1e-5 and abs((lo[0]+hi[0])/2)<1e-5 and abs((lo[1]+hi[1])/2)<1e-5
    results[obj.name]={'reimport_dimensions_blender':dims,'floor_origin_confirmed':True,'finite_vertices':all(math.isfinite(v)for point in points for v in point)}
(OUT/'roundtrip-checks.json').write_text(json.dumps({'blender_version':bpy.app.version_string,'raw_bytes':len(raw),'nodes':results,'embedded_materials':True,'single_correct_pbr_uv':True},indent=2)+'\n')
sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location('lobby_source',ROOT/'blender/lobby.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
module.render(objects)
print('LOBBY_ROUNDTRIP_PASS',json.dumps(results),flush=True)
