"""Original human refinement; Blender4.0, metres, CC0, substantial AI assistance.
Run Blender -b --factory-startup --python blender/people_presence.py.
Retains canonical39-joint bindings; protects faces/digits and ray-bakes local AO.
"""
import bpy, bmesh, math, json, sys, subprocess, tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist/assets'; REPORT=ROOT/'evidence/people-presence'; REPORT.mkdir(parents=True,exist_ok=True)
ROLES=['doctor','surgeon','nurse','np','pa','imaging','reception','assistant','facilities','pharmacist','neurologist','physio','neurotech']
NAMES=[*('patient-'+str(i).zfill(2) for i in range(1,12)),*('casual-patient-'+str(i).zfill(2) for i in range(1,12)),*('staff-'+r for r in ROLES)]
if '--only' in sys.argv:NAMES=[sys.argv[sys.argv.index('--only')+1]]
if '--parallel' in sys.argv:
    parts=Path(tempfile.mkdtemp(prefix='hospital-presence-'))
    def build_actor(name):
        result=subprocess.run([bpy.app.binary_path,'-b','--factory-startup','-t','1','--python',__file__,'--','--only',name,'--partdir',str(parts)],capture_output=True,text=True)
        (parts/(name+'.log')).write_text(result.stdout+result.stderr)
        assert result.returncode==0 and (parts/(name+'.json')).exists(),(name,result.returncode,str(parts/(name+'.log')))
        report=json.loads((parts/(name+'.json')).read_text())['assets'][0]
        print('PRESENCE_EXPORTED',json.dumps(report),flush=True);return report
    with ThreadPoolExecutor(max_workers=3) as pool:reports=list(pool.map(build_actor,NAMES))
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    for name in NAMES:
        with bpy.data.libraries.load(str(parts/(name+'.blend')),link=False) as (source,target):target.collections=[n for n in source.collections if n.startswith('Presence ')]
        for collection in target.collections:bpy.context.scene.collection.children.link(collection)
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/people_presence.blend'),compress=True)
    (REPORT/'geometry.json').write_text(json.dumps({'blender':bpy.app.version_string,'license':'CC0-1.0','method':'Isolated original actors; protected face/digits, local garment subdivision and folds, body-only reduction,12 deterministic AO rays per vertex. Three worker processes; combined editable source retained.','assets':reports},indent=2))
    print('ALL_ORIGINAL_ACTORS_EXPORTED',len(reports),flush=True)
    sys.exit(0)
scene=bpy.context.scene;scene.unit_settings.system='METRIC'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
reports=[]

def protected_name(n):return n in ['head','jaw','mouth'] or n.startswith(('eyelid.','hand.','finger','thumb'))

def cloth_folds(mesh,arm):
    palette=next(n.image for n in mesh.data.materials[0].node_tree.nodes if n.type=='TEX_IMAGE' and n.image and n.image.size[0]==4)
    pixels=list(palette.pixels);height=palette.size[1];uv=mesh.data.uv_layers[-1];weights={}
    for loop in mesh.data.loops:
        row=max(0,min(height-1,int(uv.data[loop.index].uv.y*height)));rough=pixels[row*16+1]
        weights[loop.vertex_index]=rough>.80
    knee=arm.data.bones['shin.L'].head_local.z;elbow=arm.data.bones['forearm.L'].head_local.z;waist=arm.data.bones['hips'].head_local.z+.14
    bm=bmesh.new();bm.from_mesh(mesh.data);bm.verts.ensure_lookup_table()
    edges=[e for e in bm.edges if all(weights.get(v.index,False) for v in e.verts) and e.calc_length()>.022 and any(abs(e.verts[0].co.z-z)<.065 for z in [waist,knee,elbow])]
    bmesh.ops.subdivide_edges(bm,edges=edges,cuts=1,use_grid_fill=True);bm.to_mesh(mesh.data);bm.free();mesh.data.update()
    uv=mesh.data.uv_layers[-1];cloth=set()
    for loop in mesh.data.loops:
        row=max(0,min(height-1,int(uv.data[loop.index].uv.y*height)))
        if pixels[row*16+1]>.80:cloth.add(loop.vertex_index)
    changed=0;maximum=0
    for v in mesh.data.vertices:
        if v.index not in cloth or v.co.z<.18:continue
        x,y,z=v.co;a=math.atan2(y,x)
        fold=.004*math.cos((z-waist)*95+a*2.5)*math.exp(-((z-waist)/.065)**2)
        fold+=.0032*math.cos((z-knee)*105+a)*math.exp(-((z-knee)/.055)**2)
        if abs(x)>.18:fold+=.003*math.cos((z-elbow)*115+a*2)*math.exp(-((z-elbow)/.055)**2)
        v.co+=v.normal*fold;maximum=max(maximum,abs(fold));changed+=abs(fold)>.0002
    mesh.data.update();return changed,maximum

def split_body(mesh):
    names={g.index:g.name for g in mesh.vertex_groups}
    protected={v.index for v in mesh.data.vertices if sum(g.weight for g in v.groups if protected_name(names[g.group]))>.5}
    keep={f.index for f in mesh.data.polygons if all(v in protected for v in f.vertices)}
    for modifier in list(mesh.modifiers):mesh.modifiers.remove(modifier)
    detail=mesh.copy();detail.data=mesh.data.copy();bpy.context.collection.objects.link(detail)
    for obj,remove in [(mesh,keep),(detail,set(range(len(mesh.data.polygons)))-keep)]:
        bm=bmesh.new();bm.from_mesh(obj.data);bm.faces.ensure_lookup_table()
        bmesh.ops.delete(bm,geom=[bm.faces[i] for i in remove],context='FACES')
        bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS')
        bm.to_mesh(obj.data);bm.free()
    bpy.context.view_layer.objects.active=mesh
    dec=mesh.modifiers.new('Body-only crowd budget','DECIMATE');dec.ratio=.35;dec.use_collapse_triangulate=True
    bpy.ops.object.modifier_apply(modifier=dec.name)
    bpy.ops.object.select_all(action='DESELECT');mesh.select_set(True);detail.select_set(True)
    bpy.context.view_layer.objects.active=mesh;bpy.ops.object.join();return len(keep)

def bake_local_shading(mesh):
    mesh.data.update();vertices=[v.co.copy() for v in mesh.data.vertices]
    tree=BVHTree.FromPolygons(vertices,[list(p.vertices) for p in mesh.data.polygons])
    shades=[]
    for v in mesh.data.vertices:
        n=v.normal.normalized();u=n.cross(Vector((0,0,1)))
        if u.length<.1:u=n.cross(Vector((0,1,0)))
        u.normalize();w=n.cross(u);blocked=0
        for i in range(12):
            z=math.sqrt((i+.5)/12);r=math.sqrt(1-z*z);a=i*2.399963229728653
            direction=(u*(r*math.cos(a))+w*(r*math.sin(a))+n*z).normalized()
            hit,normal,index,distance=tree.ray_cast(v.co+n*.0015,direction,.14)
            if hit is not None:blocked+=1-distance/.14
        shades.append(1-.35*blocked/12)
    # Smooth sample noise, retaining geometric contact darkening.
    neighbors=[set() for v in vertices]
    for edge in mesh.data.edges:
        a,b=edge.vertices;neighbors[a].add(b);neighbors[b].add(a)
    for _ in range(2):shades=[.5*s+.5*sum(shades[j] for j in neighbors[i])/len(neighbors[i]) if neighbors[i] else s for i,s in enumerate(shades)]
    color=mesh.data.color_attributes.active_color
    assert color is not None,'Original vertex colours must survive refinement'
    for loop in mesh.data.loops:
        c=color.data[loop.index].color;shade=shades[loop.vertex_index]
        color.data[loop.index].color=(c[0]*shade,c[1]*shade,c[2]*shade,c[3])
    return min(shades),sum(shades)/len(shades)

for name in NAMES:
    before=set(scene.objects);bpy.ops.import_scene.gltf(filepath=str(OUT/(name+'.glb')))
    imported=[o for o in scene.objects if o not in before]
    arm=next(o for o in imported if o.type=='ARMATURE')
    mesh=next(o for o in imported if o.type=='MESH' and o.parent==arm)
    for track in arm.animation_data.nla_tracks if arm.animation_data else []:track.mute=True
    if arm.animation_data:arm.animation_data.action=None
    for bone in arm.pose.bones:bone.matrix_basis.identity()
    bpy.context.view_layer.update()
    # Keep animation names authoritative; earlier Walk/Sit are replaced by the existing stride package.
    if arm.animation_data:
        for track in list(arm.animation_data.nla_tracks):
            if track.name in ['Walk','Sit']:arm.animation_data.nla_tracks.remove(track)
    folds,displacement=cloth_folds(mesh,arm)
    protected=split_body(mesh)
    modifier=mesh.modifiers.new('Canonical human binding','ARMATURE');modifier.object=arm
    low,mean=bake_local_shading(mesh)
    arm['asset_provenance']='Original hospitalSIM geometry; feature-preserving reduction and12-ray local AO; substantial AI assistance; CC0-1.0'
    mesh['detail_policy']='Face, ears, eyes, hands and articulated digits protected; only body reduced.'
    collection=bpy.data.collections.new('Presence '+name);scene.collection.children.link(collection)
    for obj in [arm,mesh]:
        for old in list(obj.users_collection):old.objects.unlink(obj)
        collection.objects.link(obj)
    # glTF names come from NLA tracks, not Blender's globally unique action names.
    for track in arm.animation_data.nla_tracks if arm.animation_data else []:track.mute=False
    bpy.ops.object.select_all(action='DESELECT');arm.select_set(True);mesh.select_set(True);bpy.context.view_layer.objects.active=arm
    path=OUT/('people-'+name+'.glb')
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_animations=name.startswith('patient-'),export_nla_strips=True,export_anim_single_armature=False,export_anim_slide_to_zero=True,export_force_sampling=True,export_skins=True,export_colors=True,export_extras=True,export_yup=True)
    tris=sum(len(p.vertices)-2 for p in mesh.data.polygons)
    reports.append({'name':name,'triangles':tris,'protectedPolygons':protected,'clothFoldVertices':folds,'maximumClothDisplacementMetres':displacement,'minimumAoFactor':low,'meanAoFactor':mean,'bytes':path.stat().st_size})
    print('PRESENCE_EXPORTED',json.dumps(reports[-1]),flush=True)
    for track in arm.animation_data.nla_tracks if arm.animation_data else []:track.mute=track.name!='Idle'
    collection.hide_viewport=True;collection.hide_render=True

partdir=Path(sys.argv[sys.argv.index('--partdir')+1]) if '--partdir' in sys.argv else None
bpy.ops.wm.save_as_mainfile(filepath=str(partdir/(NAMES[0]+'.blend') if partdir else ROOT/'blender/people_presence.blend'),compress=True)
(partdir/(NAMES[0]+'.json') if partdir else REPORT/'geometry.json').write_text(json.dumps({'blender':bpy.app.version_string,'license':'CC0-1.0','method':'Original high-detail GLBs, protected head/digits, body-only reduction,12 deterministic hemisphere rays per vertex, two adjacency-smoothing steps, AO embedded in original vertex colours. No new third-party assets.','assets':reports},indent=2))
