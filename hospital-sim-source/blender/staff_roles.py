"""Original staff wardrobes, CC0-1.0, substantial OpenAI Codex assistance.
Blender4.0: -b --python blender/staff_roles.py
GLBs contain geometry/skin/materials only. Reuse clinician/coat's existing nine clips.
Wardrobes and role abbreviations are game conventions, not universal clinical uniforms.
"""
import bpy,math,json,struct,hashlib,importlib.util,sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'evidence'/'staff-role-assets'
sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location('human_source',ROOT/'blender/characters.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
ROLES=[
 dict(id='doctor',base='coat',code='MD',top=(.055,.12,.22),pants=(.035,.07,.12),accent=(.07,.20,.32),hem=.83),
 dict(id='surgeon',base='clinician',code='SUR',top=(.025,.085,.19),pants=(.020,.055,.13),accent=(.55,.76,.77)),
 dict(id='nurse',base='clinician',code='RN',top=(.035,.40,.43),pants=(.025,.29,.32),accent=(.025,.23,.26)),
 dict(id='np',base='coat',code='NP',top=(.27,.07,.22),pants=(.085,.055,.105),accent=(.34,.07,.25),hem=.94),
 dict(id='pa',base='coat',code='PA',top=(.29,.56,.71),pants=(.065,.15,.21),accent=(.13,.37,.53),hem=.88),
 dict(id='imaging',base='clinician',code='XR',top=(.06,.25,.52),pants=(.055,.075,.095),accent=(.045,.065,.085)),
 dict(id='reception',base='clinician',code='DESK',top=(.49,.19,.12),pants=(.52,.42,.29),accent=(.18,.22,.23)),
]
LABELS={'doctor':'Doctor','surgeon':'Surgeon','nurse':'Nurse','np':'Nurse practitioner','pa':'Physician assistant','imaging':'Imaging technologist','reception':'Reception'}
# Original stroke glyphs; no font asset or dependency.
GLYPHS={
 'M':[[(0,0),(0,1),(.5,.42),(1,1),(1,0)]],
 'D':[[(0,0),(0,1),(.65,1),(1,.75),(1,.25),(.65,0),(0,0)]],
 'S':[[(1,1),(0,1),(0,.53),(1,.47),(1,0),(0,0)]],
 'U':[[(0,1),(0,.15),(.2,0),(.8,0),(1,.15),(1,1)]],
 'R':[[(0,0),(0,1),(.8,1),(1,.8),(1,.6),(.8,.5),(0,.5)],[(.55,.5),(1,0)]],
 'N':[[(0,0),(0,1),(1,0),(1,1)]],
 'P':[[(0,0),(0,1),(1,1),(1,.53),(0,.53)]],
 'A':[[(0,0),(.5,1),(1,0)],[(.22,.43),(.78,.43)]],
 'X':[[(0,0),(1,1)],[(0,1),(1,0)]],
 'E':[[(1,1),(0,1),(0,0),(1,0)],[(0,.5),(.8,.5)]],
 'K':[[(0,0),(0,1)],[(1,1),(0,.45),(1,0)]],
}

def color(mat,c):
    mat.diffuse_color=(*c,1);mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(*c,1)

def stripe(name,a,b,width,mat,bone='spine'):
    a,b=Vector(a),Vector(b);d=b-a;side=Vector((-d.z,0,d.x)).normalized()*width/2
    return m.mesh_object(name,[a-side,a+side,b+side,b-side],[(0,1,2,3)],mat,bone)

def lettering(code,x,y,z,width,height,mat):
    glyph_width=width/(len(code)*1.45-.45)
    for index,ch in enumerate(code):
        for path in GLYPHS[ch]:
            for a,b in zip(path,path[1:]):
                stripe('Original '+code+' badge ink',(x+index*glyph_width*1.45+a[0]*glyph_width,y,z+a[1]*height),(x+index*glyph_width*1.45+b[0]*glyph_width,y,z+b[1]*height),.0016,mat)

def badge(code,x,y,z,accent,width=.080):
    white=m.material('Role badge ivory',(.90,.93,.90),.68)
    ink=m.material('Role badge charcoal',(.020,.038,.045),.82)
    m.box('Visible '+code+' role badge',(x,y,z),(width,.008,.047),white,'spine',.003)
    m.box('Role band',(x,y-.005,z+.020),(width-.006,.002,.006),accent,'spine',.001)
    lettering(code,x-width*.39,y-.006,z-.014,width*.78,.024,ink)

def recolor(mesh,role):
    for mat in mesh.data.materials:
        if ' · fabric trim'in mat.name:color(mat,role['top']if role['base']=='coat'else role['accent'])
        elif ' · fabric'in mat.name:color(mat,(.88,.91,.89)if role['base']=='coat'else role['top'])
        elif ' · seam'in mat.name:color(mat,tuple(c*.78 for c in role['top']))
    pants=m.material('Role trousers '+role['id'],role['pants'],.90);mesh.data.materials.append(pants);slot=len(mesh.data.materials)-1
    for face in mesh.data.polygons:
        name=mesh.data.materials[face.material_index].name
        leg_source=(' · fabric trim'in name)if role['base']=='coat'else(' · fabric'in name and 'trim'not in name)
        if leg_source and max(mesh.data.vertices[v].co.z for v in face.vertices)<1.005:face.material_index=slot
    if role['base']=='coat'and role['hem']>.83:
        white_vertices={v for face in mesh.data.polygons if ' · fabric'in mesh.data.materials[face.material_index].name and 'trim'not in mesh.data.materials[face.material_index].name for v in face.vertices}
        for v in mesh.data.vertices:
            if .829<v.co.z<1.04 and abs(v.co.x)<.205:
                white=v.index in white_vertices
                button=.032<v.co.x<.058 and v.co.y<-.095
                if white or button:v.co.z=role['hem']+(v.co.z-.83)*(1.04-role['hem'])/.21

def accessories(role):
    accent=m.material('Role accent '+role['id'],role['accent'],.85)
    base_y=m.cloth_front_y(-.078,1.329,role['base']=='coat')-.010
    badge(role['code'],-.078,base_y,1.329,accent,.088 if role['code']=='DESK'else .080)
    if role['id']=='doctor':
        rubber=m.material('Stethoscope matte rubber',(.035,.055,.07),.82)
        steel=m.material('Stethoscope satin metal',(.40,.47,.49),.35,.65)
        points=[(-.044,-.053,1.45),(-.042,-.090,1.40),(-.031,-.123,1.30),(-.028,-.137,1.23),(-.025,-.140,1.205),(.015,-.141,1.205),(.042,-.138,1.23),(.055,-.124,1.32),(.052,-.08,1.41),(.040,-.052,1.45)]
        m.curve('Recognizable stethoscope loop',points,.004,rubber,'spine')
        m.curve('Stethoscope chest branch',[(.014,-.142,1.205),(.035,-.145,1.18),(.055,-.145,1.18)],.003,rubber,'spine')
        m.ellipsoid('Stethoscope diaphragm',(.056,-.147,1.18),(.019,.006,.019),steel,'spine',12,8)
    if role['id']=='surgeon':
        cap=m.material('Navy surgical cap',(.035,.11,.24),.92)
        mask=m.material('Pale medical face covering',(.58,.76,.76),.94)
        m.surface('Soft surgical cap',[(1.632,.083,.079,.007),(1.67,.089,.085,.007),(1.713,.075,.073,.007),(1.745,.044,.043,.007),(1.753,.002,.002,.007)],cap,'head',24)
        m.curve('Cap stitched rim',[(.084*math.cos(i*2*math.pi/24),.007+.080*math.sin(i*2*math.pi/24),1.633)for i in range(25)],.002,accent,'head')
        vertices=[]
        for z in [1.544,1.563,1.589,1.601]:
            for i in range(9):
                x=(i-4)/4*.061;vertices.append((x,-.122+.050*(abs(x)/.061)**1.7,z-.004*(abs(x)/.061)))
        m.mesh_object('Contoured surgical mask',vertices,[(j*9+i,j*9+i+1,(j+1)*9+i+1,(j+1)*9+i)for j in range(3)for i in range(8)],mask,'head',.002)
        for sign in [-1,1]:m.curve('Mask ear loop',[(sign*.059,-.075,1.594),(sign*.085,.003,1.593),(sign*.059,-.075,1.548)],.0015,mask,'head')
    if role['id']in ['np','pa']:
        for sign in [-1,1]:
            m.mesh_object('Colored practitioner lapel facing',[(sign*.045,-.066,1.432),(sign*.096,-.108,1.348),(sign*.048,-.124,1.22)],[(0,1,2)],accent,'spine',.002)
    if role['id']=='imaging':
        for sign in [-1,1]:
            m.mesh_object('Charcoal utility panel',[(sign*.075,-.107,1.36),(sign*.152,-.077,1.34),(sign*.137,-.083,1.08),(sign*.070,-.109,1.06)],[(0,1,2,3)],accent,'spine',.006)
        m.box('Imaging utility pouch',(.16,-.095,1.055),(.065,.04,.095),accent,'spine',.008)
        m.box('Fictional equipment badge',(.11,-.13,1.285),(.028,.008,.045),m.material('Indicator slate',(.67,.79,.83),.62),'spine',.003)
    if role['id']=='reception':
        sand=m.material('Sand casual collar',(.62,.51,.36),.90)
        for sign in [-1,1]:m.mesh_object('Casual folded collar',[(sign*.045,-.055,1.437),(sign*.087,-.094,1.384),(sign*.027,-.105,1.35)],[(0,1,2)],sand,'spine',.003)
        stripe('Left lanyard',(-.037,-.057,1.437),(-.018,-.126,1.17),.008,accent)
        stripe('Right lanyard',(.037,-.057,1.437),(.018,-.126,1.17),.008,accent)
        badge('DESK',0,-.133,1.15,accent,.102)

def snapshot_originals():
    paths=[ROOT/'blender/characters.py',ROOT/'blender/characters.blend']
    paths+=list((ROOT/'dist/assets').glob('patient*.glb'))
    paths+=[ROOT/'dist/assets'/(name+suffix+'.glb')for name in ['clinician','coat']for suffix in ['','-lod']]
    return {str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest()for p in paths}

def build():
    OUT.mkdir(parents=True,exist_ok=True);original=snapshot_originals()
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    # Geometry uses the canonical rig; browser reuses shared clips rather than downloading duplicates.
    m.animate=lambda *args:None
    characters=[];report={'blender_version':bpy.app.version_string,'license':'CC0-1.0','provenance':'Original procedural wardrobes; substantial OpenAI Codex assistance','roles':{}}
    bpy.context.scene.render.fps=30
    for role in ROLES:
        arm,mesh=m.character(role['base']);recolor(mesh,role);m.PARTS=[];accessories(role)
        bpy.ops.object.select_all(action='DESELECT');mesh.select_set(True)
        for part in m.PARTS:part.select_set(True)
        bpy.context.view_layer.objects.active=mesh;bpy.ops.object.join()
        arm.name='staff-'+role['id'];mesh.name=arm.name+'_skin';arm['role']=role['id'];arm['shared_clip_base']=role['base'];arm['license']='CC0-1.0'
        assert len(arm.pose.bones)==39
        results=[]
        for suffix,ratio in [('',1),('-lod',.32)]:
            browser=m.export_mesh(mesh,ratio)
            bpy.ops.object.select_all(action='DESELECT');arm.select_set(True);browser.select_set(True);bpy.context.view_layer.objects.active=arm
            path=ROOT/'dist/assets'/('staff-'+role['id']+suffix+'.glb')
            bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_animations=False,export_skins=True,export_yup=True,export_extras=True,export_colors=True)
            raw=path.read_bytes();n=struct.unpack_from('<I',raw,12)[0];d=json.loads(raw[20:20+n]);primitives=[p for g in d['meshes']for p in g['primitives']]
            tris=d['accessors'][primitives[0]['indices']]['count']//3
            assert not d.get('animations')and len(primitives)==1 and len(d['skins'][0]['joints'])==39
            assert tris<(5000 if suffix else 15500)
            assert all('uri'not in b for b in d['buffers'])and len(d.get('images',[]))==1
            results.append({'file':path.name,'triangles':tris,'bytes':len(raw),'primitives':1,'clips':0,'sha256':hashlib.sha256(raw).hexdigest()})
            data=browser.data;bpy.data.objects.remove(browser,do_unlink=True);bpy.data.meshes.remove(data)
        collection=bpy.data.collections.new(arm.name);bpy.context.scene.collection.children.link(collection)
        for ob in [arm,mesh]:
            for old in list(ob.users_collection):old.objects.unlink(ob)
            collection.objects.link(ob)
        collection.hide_viewport=role['id']!='nurse';collection.hide_render=role['id']!='nurse'
        characters.append((role,arm,mesh));report['roles'][role['id']]={'base':role['base'],'code':role['code'],'assets':results}
        print('STAFF_ROLE_EXPORTED',role['id'],results,flush=True)
    # Retain shared actions once in editable source for preview; they never enter wardrobe GLBs.
    with bpy.data.libraries.load(str(ROOT/'blender/characters.blend'),link=False)as(source,target):target.actions=[name for name in source.actions if name.endswith(('__clinician','__coat'))]
    for action in target.actions:action.use_fake_user=True
    for role,arm,mesh in characters:
        arm.animation_data_create();arm.animation_data.action=bpy.data.actions.get('Idle__'+role['base'])
    bpy.context.scene.frame_set(1)
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/staff_roles.blend'),compress=True)
    assert snapshot_originals()==original,'Canonical original assets changed'
    report['original_sources_and_assets_unchanged']=original
    (OUT/'asset-checks.json').write_text(json.dumps(report,indent=2)+'\n')
    manifest={'version':1,'license':'CC0-1.0','provenance':report['provenance'],'boneCount':39,'embeddedClips':0,'sharedClipNames':list(m.CLIPS),'wardrobeNote':'Original game role conventions; real clinical uniforms vary.','roles':[{'key':r['id'],'label':LABELS[r['id']],'base':r['base'],'high':'staff-'+r['id']+'.glb','lod':'staff-'+r['id']+'-lod.glb'}for r in ROLES]}
    (ROOT/'dist/assets/staff-roles.json').write_text(json.dumps(manifest,indent=2)+'\n')
    if '--render'in sys.argv:render(characters)
    print('STAFF_ROLES_BUILD_PASS',flush=True)

def render(characters):
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=4;scene.cycles.use_denoising=True;scene.render.resolution_x=420;scene.render.resolution_y=640;scene.render.resolution_percentage=100;scene.world.color=(.5,.5,.5)
    bpy.ops.mesh.primitive_plane_add(size=200);plane=bpy.context.object
    material=m.material('QA warm white',(.83,.85,.82),.95);plane.data.materials.append(material)
    bpy.ops.object.camera_add();camera=bpy.context.object;camera.data.type='ORTHO';camera.data.ortho_scale=2.08;scene.camera=camera
    target=Vector((0,0,.9));camera.location=target+Vector((2,-4,1.1));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
    for location,power in [((-2,-3,5),500),((3,2,4),300)]:
        bpy.ops.object.light_add(type='AREA',location=location);light=bpy.context.object;light.data.energy=power;light.data.size=4;light.rotation_euler=(target-light.location).to_track_quat('-Z','Y').to_euler()
    for role,arm,mesh in characters:
        for r,a,s in characters:a.users_collection[0].hide_render=r['id']!=role['id'];a.users_collection[0].hide_viewport=r['id']!=role['id']
        scene.frame_set(2);scene.frame_set(1);bpy.context.view_layer.update()
        scene.render.filepath=str(OUT/('staff-'+role['id']+'.png'));bpy.ops.render.render(write_still=True)

if __name__=='__main__':build()
