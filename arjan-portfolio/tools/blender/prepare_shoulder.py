"""Deterministic, no-remesh BodyParts3D -> glTF. Run with Blender --background --python.
Source axes: +X left, +Y posterior, +Z superior. Blender retains these axes;
glTF exporter applies its standard Z-up to Y-up rotation. No landmark displacements.
"""
import bpy, bmesh, json, math, sys, hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'public/holoanatomy/shoulder/assets'
REPORT=ROOT/'Documentation/reference-renders'
CENTER=Vector((-130,-45,1275)); SCALE=.01
COLORS={'skeleton':(.64,.59,.47,1),'muscles':(.34,.09,.075,1),'arteries':(.40,.055,.04,1),'veins':(.08,.13,.22,1)}
CUFF={'FJ1506':(.52,.23,.12,1),'FJ1500':(.38,.095,.075,1),'FJ1508':(.42,.18,.18,1),'FJ1504':(.42,.15,.105,1)}
PARTS=json.loads((ROOT/'Documentation/shoulder-baseline/mesh-inventory.json').read_text())
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
collection=bpy.data.collections.new('Right shoulder — BodyParts3D 4.0');bpy.context.scene.collection.children.link(collection)
report=[]
for p in PARTS:
    verts=[]; norms=[]; uvs=[]; faces=[]; face_tokens=[]
    for line in (ROOT/'public/holoanatomy/anatomy'/p['file']).read_text().splitlines():
        q=line.split()
        if not q: continue
        if q[0]=='v': verts.append(tuple((Vector(tuple(map(float,q[1:4])))-CENTER)*SCALE))
        elif q[0]=='vn': norms.append(tuple(map(float,q[1:4])))
        elif q[0]=='vt': uvs.append(tuple(map(float,q[1:3])))
        elif q[0]=='f':
            tokens=[t.split('/') for t in q[1:]]
            faces.append([int(t[0])-1 if int(t[0])>0 else len(verts)+int(t[0]) for t in tokens]); face_tokens.append(tokens)
    mesh=bpy.data.meshes.new(p['id']);mesh.from_pydata(verts,[],faces);mesh.update()
    if uvs:
        layer=mesh.uv_layers.new(name='SourceUV')
        for poly,tokens in zip(mesh.polygons,face_tokens):
            for loop,t in zip(poly.loop_indices,tokens):
                if len(t)>1 and t[1]:layer.data[loop].uv=uvs[int(t[1])-1]
    for poly in mesh.polygons: poly.use_smooth=True
    if norms:
        loop_normals=[]
        for tokens in face_tokens:
            for t in tokens:loop_normals.append(norms[int(t[2])-1] if len(t)>2 and t[2] else (0,0,0))
        mesh.normals_split_custom_set(loop_normals);mesh.use_auto_smooth=True
    obj=bpy.data.objects.new(p['id'],mesh);collection.objects.link(obj)
    obj['structureId']=p['id'];obj['anatomicalName']=p['name'];obj['FMA']=p['fma'];obj['license']='CC BY 4.0';obj['source']='BodyParts3D / ISA Release 4.0'
    material=bpy.data.materials.new(p['name']);material.use_nodes=True
    bs=material.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=CUFF.get(p['id'],COLORS[p['layer']]);bs.inputs['Roughness'].default_value=.72;bs.inputs['Metallic'].default_value=0
    mesh.materials.append(material)
    bm=bmesh.new();bm.from_mesh(mesh)
    nonmanifold=sum(not e.is_manifold for e in bm.edges);bm.free()
    report.append({**p,'sourceSha256':hashlib.sha256((ROOT/'public/holoanatomy/anatomy'/p['file']).read_bytes()).hexdigest(),'normalizedBounds':{'min':[min(v.co[i] for v in mesh.vertices) for i in range(3)],'max':[max(v.co[i] for v in mesh.vertices) for i in range(3)]},'nonManifoldEdges':nonmanifold,'zeroNormals':sum(Vector(n).length<.5 for n in norms),'derivedOperations':['Rigid translation by -(-130,-45,1275), uniform scale 0.01','Standard Blender glTF axis conversion: (x,y,z) -> (x,z,-y)','Preserve polygon topology and source split normals; no smoothing modifier, remesh or subdivision'],'reviewStatus':'Source identity and topology checked; no independent clinical review'})
OUT.mkdir(parents=True,exist_ok=True);REPORT.mkdir(parents=True,exist_ok=True)
def export(name):
    bpy.ops.export_scene.gltf(filepath=str(OUT/name),export_format='GLB',use_selection=False,export_extras=True,export_normals=True,export_tangents=True,export_yup=True,export_cameras=False,export_lights=False)
export('shoulder-lod0.glb')
# Preserve scarce cuff detail. Only scapula is reduced in optional context LODs.
for level,ratio in [(1,.65),(2,.35)]:
    obj=bpy.data.objects['FJ3384'];mod=obj.modifiers.new('Documented context LOD','DECIMATE');mod.ratio=ratio
    bpy.ops.export_scene.gltf(filepath=str(OUT/f'shoulder-lod{level}.glb'),export_format='GLB',export_apply=True,export_extras=True,export_yup=True,export_normals=True,export_tangents=True)
    obj.modifiers.remove(mod)
(OUT/'provenance.json').write_text(json.dumps({'schemaVersion':1,'sourceAxes':'+X left, +Y posterior, +Z superior','runtimeAxes':'+X left, +Y superior, +Z anterior','sourceCenter':list(CENTER),'scale':SCALE,'structures':report,'lods':[{'level':0,'url':'shoulder-lod0.glb','operation':'Original topology'},{'level':1,'url':'shoulder-lod1.glb','operation':'Scapula-only decimate ratio .65; all cuff meshes unchanged; optional context use'},{'level':2,'url':'shoulder-lod2.glb','operation':'Scapula-only decimate ratio .35; all cuff meshes unchanged; optional context use'}]},indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(REPORT/'shoulder-master.blend'))
# Reference renders use the exact same normalized source meshes; no added anatomy.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=1100;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.world.color=(.13,.13,.13);scene.view_settings.view_transform='AgX'
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
for name,loc,power,size in [('Key',(-3,-4,5),450,4),('Fill',(4,-1,2),230,5),('Rim',(-2,3,3),350,3)]:
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;ob=bpy.data.objects.new(name,data);scene.collection.objects.link(ob);ob.location=loc;ob.rotation_euler=(Vector((0,0,.2))-ob.location).to_track_quat('-Z','Y').to_euler()
camdata=bpy.data.cameras.new('Reference camera');cam=bpy.data.objects.new('Reference camera',camdata);scene.collection.objects.link(cam);scene.camera=cam;camdata.lens=48
hero=set(['FJ3384','FJ3362','FJ3368',*CUFF])
for p in PARTS:bpy.data.objects[p['id']].hide_render=p['id'] not in hero
views={'posterior-cuff':(-1.5,3.6,1.0),'anterior-cuff':(-1.5,-3.6,1.0),'superior-cuff':(-.8,-.7,4.0),'lateral-insertion':(-4,0,.8),'exploded-cuff':(-1.5,3.8,1.0)}
for name,loc in views.items():
    cam.location=loc;cam.rotation_euler=(Vector((0,0,.2))-cam.location).to_track_quat('-Z','Y').to_euler()
    if name=='exploded-cuff':
        for i,id in enumerate(CUFF):bpy.data.objects[id].location.x-=.3+i*.13
    scene.render.filepath=str(REPORT/(name+'.png'));bpy.ops.render.render(write_still=True)
print('SHOULDER_PIPELINE_COMPLETE',len(report),'structures')
