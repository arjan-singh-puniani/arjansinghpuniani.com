"""Validate actual GLB packages and render original/LOD at the gameplay camera angle."""
import bpy,json,struct,hashlib,math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];OUT=Path(__file__).resolve().parent
def read(path):
    raw=path.read_bytes();n=struct.unpack_from('<I',raw,12)[0];return json.loads(raw[20:20+n]),raw[28+n:]
def images(doc,binary):
    result=[]
    for image in doc.get('images',[]):
        view=doc['bufferViews'][image['bufferView']];start=view.get('byteOffset',0);result.append(hashlib.sha256(binary[start:start+view['byteLength']]).hexdigest())
    return result
def clear():
    for obj in list(bpy.context.scene.objects):bpy.data.objects.remove(obj,do_unlink=True)
def studio():
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=8;scene.cycles.use_denoising=True;scene.render.resolution_x=480;scene.render.resolution_y=400;scene.render.resolution_percentage=100;scene.view_settings.view_transform='AgX'
    if scene.world is None:scene.world=bpy.data.worlds.new('Comparison studio')
    scene.world.use_nodes=True;bg=scene.world.node_tree.nodes.get('Background');bg.inputs['Color'].default_value=(.65,.65,.62,1);bg.inputs['Strength'].default_value=.65
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.01));floor=bpy.context.object;mat=bpy.data.materials.new('QA only platform surface');mat.diffuse_color=(.88,.89,.86,1);floor.data.materials.append(mat)
    target=Vector((0,.10,.90));bpy.ops.object.camera_add();camera=bpy.context.object;camera.location=target+Vector((16,-23,16.35))*.28;camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=4.6;scene.camera=camera
    for loc,power,size in [((-3,-4,7),700,5),((4,3,5),350,4)]:
        bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.data.energy=power;light.data.size=size;light.rotation_euler=(target-light.location).to_track_quat('-Z','Y').to_euler()
    return scene
results={'blender_version':bpy.app.version_string,'camera':{'gameplay_direction_three':[16,16.35,23],'blender_direction':[16,-23,16.35],'orthographic_scale':4.6,'resolution':[480,400]},'zones':{}}
for name,limit in [('scan',22000),('care',18000),('consult',24000)]:
    original,ob=read(ROOT/'dist/assets'/(name+'.glb'));lod,lb=read(ROOT/'dist/assets'/(name+'-lod.glb'))
    assert lod['nodes']==original['nodes']and lod.get('materials')==original.get('materials')and lod.get('textures')==original.get('textures')and lod.get('samplers')==original.get('samplers')
    assert images(lod,lb)==images(original,ob)and not lod.get('animations')and all('uri'not in b for b in lod['buffers'])
    count=sum(lod['accessors'][p['indices']]['count']//3 for m in lod['meshes']for p in m['primitives']);assert count<=limit
    bounds={}
    for version in ['original','lod']:
        clear();file=name+('-lod'if version=='lod'else'')+'.glb';bpy.ops.import_scene.gltf(filepath=str(ROOT/'dist/assets'/file));bpy.context.view_layer.update()
        meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];assert len(meshes)==len(original['meshes'])
        points=[obj.matrix_world@v.co for obj in meshes for v in obj.data.vertices]
        assert all(math.isfinite(v)for p in points for v in p)
        bounds[version]={'min_blender':[min(p[i]for p in points)for i in range(3)],'max_blender':[max(p[i]for p in points)for i in range(3)]}
        scene=studio();scene.render.filepath=str(OUT/(name+'-'+version+'.png'));bpy.ops.render.render(write_still=True)
    drift=max(abs(bounds['original'][edge][i]-bounds['lod'][edge][i])for edge in ['min_blender','max_blender']for i in range(3))
    assert drift<.03,(name,drift)
    results['zones'][name]={'node_transforms_exact':True,'material_definitions_exact':True,'embedded_texture_sha256':images(lod,lb),'triangle_count':count,'bounds':bounds,'maximum_bounds_drift_metres':drift,'actual_glbs_reimported':True}
    print('EQUIPMENT_PAIR_RENDERED',name,flush=True)
baseline=json.loads((OUT/'checks.json').read_text())['original_file_hashes_unchanged'];assert all(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h for name,h in baseline.items())
results['original_files_unchanged']=True;(OUT/'roundtrip-checks.json').write_text(json.dumps(results,indent=2)+'\n');print('EQUIPMENT_LOD_ROUNDTRIP_PASS',flush=True)
