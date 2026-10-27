"""Derive smooth shading and self-occlusion from unchanged source surfaces.
Blender 4.0: --background --factory-startup --python tools/blender/bake_shoulder_study.py
Candidate outputs stay in Documentation until visually and geometrically validated.
"""
import bpy
import json
import hashlib
import struct
import sys
import shutil
from pathlib import Path
from mathutils import Vector
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "Documentation/shoulder-conference-qa/blender"
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT / "Documentation/reference-renders/shoulder-master.blend"))
bpy.context.preferences.filepaths.save_version = 0
CUFF = ["FJ1506", "FJ1500", "FJ1508", "FJ1504"]
BONES = ["FJ3384", "FJ3362", "FJ3368"]
meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
def geometry_digest(obj):
    data = [[list(v.co) for v in obj.data.vertices], [list(p.vertices) for p in obj.data.polygons]]
    return hashlib.sha256(json.dumps(data).encode()).hexdigest()
original = {o.name: geometry_digest(o) for o in meshes}
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene.render.resolution_x = 1100
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
scene.world.use_nodes = True
scene.world.node_tree.nodes.get("Background").inputs[0].default_value = (.18,.18,.16,1)
scene.world.node_tree.nodes.get("Background").inputs[1].default_value = .5
scene.view_settings.view_transform = "AgX"
scene.render.image_settings.file_format = "PNG"
for name,loc,power,size in [("Key",(-3,-4,5),450,4),("Fill",(4,-1,2),230,5),("Rim",(-2,3,3),350,3)]:
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size
    obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=loc
    obj.rotation_euler=(Vector((0,0,.2))-obj.location).to_track_quat('-Z','Y').to_euler()
camdata=bpy.data.cameras.new("Comparison camera");cam=bpy.data.objects.new("Comparison camera",camdata)
scene.collection.objects.link(cam);scene.camera=cam;camdata.lens=48

def render(label):
    for o in meshes: o.hide_render = o.name not in CUFF+BONES
    for view,loc in [("posterior",(-1.2,3.6,.9)),("anterior",(-1.2,-3.6,.9))]:
        cam.location=loc;cam.rotation_euler=(Vector((0,0,.2))-cam.location).to_track_quat('-Z','Y').to_euler()
        scene.render.filepath=str(OUT / f"{label}-{view}.png")
        bpy.ops.render.render(write_still=True)
render("source-normals")
report=[]
for id in CUFF:
    obj=bpy.data.objects[id]
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True);bpy.context.view_layer.objects.active=obj
    # Remove shading discontinuities only. No coordinates, faces or anatomical landmarks move.
    if obj.data.has_custom_normals: bpy.ops.mesh.customdata_custom_splitnormals_clear()
    obj.data.use_auto_smooth=False
    for polygon in obj.data.polygons: polygon.use_smooth=True
    obj.data.update()
    # OBJ seams duplicate coincident vertices. Share shading normals without welding geometry.
    summed = {}
    for polygon in obj.data.polygons:
        for vertex_index in polygon.vertices:
            key = tuple(obj.data.vertices[vertex_index].co)
            summed.setdefault(key, Vector((0,0,0)))
            summed[key] += polygon.normal * polygon.area
    loop_normals = []
    for loop in obj.data.loops:
        vertex = obj.data.vertices[loop.vertex_index]
        normal = summed[tuple(vertex.co)]
        loop_normals.append(tuple(normal.normalized() if normal.length > 1e-10 else vertex.normal))
    obj.data.normals_split_custom_set(loop_normals)
    obj.data.use_auto_smooth=True
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=1.151917, island_margin=.035)
    bpy.ops.object.mode_set(mode='OBJECT')
    obj.data.uv_layers.active.name="DerivedSelfOcclusionUV"
    image=bpy.data.images.new(id+"_derived_self_occlusion",width=512,height=512,alpha=False)
    image.colorspace_settings.name="Non-Color"
    mat=obj.data.materials[0];tree=mat.node_tree
    texture=tree.nodes.new('ShaderNodeTexImage');texture.image=image
    tree.nodes.active=texture
    for other in meshes: other.hide_render=other != obj
    scene.render.bake.margin=12
    scene.render.bake.use_selected_to_active=False
    bpy.ops.object.bake(type='AO')
    image.filepath_raw=str(OUT / (id+"-self-occlusion.png"));image.file_format='PNG';image.save();image.pack()
    group=bpy.data.node_groups.get('glTF Material Output')
    if not group:
        group=bpy.data.node_groups.new('glTF Material Output','ShaderNodeTree')
        group.interface.new_socket(name='Occlusion',in_out='INPUT',socket_type='NodeSocketFloat')
    output=tree.nodes.new('ShaderNodeGroup');output.node_tree=group
    tree.links.new(texture.outputs['Color'],output.inputs['Occlusion'])
    # Match the candidate web occlusion strength in Blender's visual comparison.
    bs=tree.nodes.get('Principled BSDF');base=tuple(bs.inputs['Base Color'].default_value)
    mix=tree.nodes.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=.35;mix.inputs[1].default_value=base
    tree.links.new(texture.outputs['Color'],mix.inputs[2]);tree.links.new(mix.outputs[0],bs.inputs['Base Color'])
    obj['derivedShading']='Area-weighted normals shared across exact coincident vertices + isolated self-occlusion bake. No fiber, tendon or activation data.'
    report.append({'id':id,'geometrySha256Before':original[id],'geometrySha256After':geometry_digest(obj),'sourceVertices':len(obj.data.vertices),'sourceFaces':len(obj.data.polygons),'uniquePositions':len(summed),'derivedUV':True,'derivedTexture':id+'-self-occlusion.png','resolution':[512,512],'occlusionStrength':.35})
render("derived-shading")
# Export uses the ordinary tissue color, with AO carried in the glTF occlusion channel.
for id in CUFF:
    tree=bpy.data.objects[id].data.materials[0].node_tree
    bs=tree.nodes.get('Principled BSDF')
    for link in list(bs.inputs['Base Color'].links): tree.links.remove(link)
for obj in meshes: obj.hide_render=False; obj.select_set(True)
for obj in scene.objects:
    if obj.type != 'MESH': obj.select_set(False)
path=OUT/'shoulder-study.glb'
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_extras=True,export_normals=True,export_tangents=True,export_yup=True,export_cameras=False,export_lights=False)
# glTF Material Output has no AO-strength socket; set the standard scalar explicitly.
data=path.read_bytes();length=struct.unpack_from('<I',data,12)[0];gltf=json.loads(data[20:20+length])
for material in gltf.get('materials',[]):
    if 'occlusionTexture' in material: material['occlusionTexture']['strength']=.35
payload=json.dumps(gltf,separators=(',',':')).encode();payload+=b' '*((-len(payload))%4)
rest=data[20+length:];path.write_bytes(struct.pack('<4sII',b'glTF',2,20+len(payload)+len(rest))+struct.pack('<II',len(payload),0x4e4f534a)+payload+rest)
for obj in meshes: assert geometry_digest(obj)==original[obj.name], obj.name
assert all(row['geometrySha256Before']==row['geometrySha256After'] for row in report)
(OUT/'bake-report.json').write_text(json.dumps({'blender':bpy.app.version_string,'method':'Coincident-position area-weighted shading normals and per-object AO from original geometry; no remesh, subdivision, displacement or invented anatomy','geometryUnchangedForAll20':True,'structures':report,'bytes':path.stat().st_size},indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'derived-study.blend'))
# Export a normals-only comparison too: no texture memory or UV seam overhead.
for id in CUFF:
    obj=bpy.data.objects[id]
    tree=obj.data.materials[0].node_tree
    for node in list(tree.nodes):
        if node.type in {'GROUP','TEX_IMAGE','MIX_RGB'}: tree.nodes.remove(node)
    for uv in list(obj.data.uv_layers): obj.data.uv_layers.remove(uv)
    obj['derivedShading']='Area-weighted normals shared across exact coincident positions. Original geometry unchanged.'
smooth_path=OUT/'shoulder-smooth.glb'
bpy.ops.export_scene.gltf(filepath=str(smooth_path),export_format='GLB',use_selection=True,export_extras=True,export_normals=True,export_yup=True,export_cameras=False,export_lights=False)
if '--publish' in sys.argv:
    assets=ROOT/'public/holoanatomy/shoulder/assets'
    shutil.copyfile(smooth_path,assets/'shoulder-lod0.glb')
    provenance=json.loads((assets/'provenance.json').read_text())
    operation='LOD0: Blender area-weighted shading normals shared across exact coincident positions; no vertex/face changes. No derived textures shipped.'
    for part in provenance['structures']:
        if part['id'] in CUFF:
            if operation not in part['derivedOperations']: part['derivedOperations'].append(operation)
            part['runtimeShading']={'lod0':'Derived area-weighted normals; source geometry unchanged','lod1And2':'Original source normals','textures':[]}
    provenance['lods'][0]['operation']='Original topology; cuff shading normals derived across coincident positions'
    (assets/'provenance.json').write_text(json.dumps(provenance,indent=2,ensure_ascii=False)+'\n')

print('DERIVED_SHADING_COMPLETE',path)
