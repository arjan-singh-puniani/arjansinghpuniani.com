"""Original service-team wardrobes/props, CC0-1.0; substantial OpenAI Codex assistance.
Blender4.0: -b --python blender/service_staff.py
Unchanged clinician39-joint binds; reuse its nine clips, none embedded in these GLBs.
Appearances are visual only. Tools are separate floor-centered props, never carried by the rig.
"""
import bpy,math,json,struct,hashlib,importlib.util,sys
from pathlib import Path
from mathutils import Vector
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'evidence/service-staff-asset'
def load(name,file):
    spec=importlib.util.spec_from_file_location(name,ROOT/'blender'/file);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module
sr=load('wardrobe_helpers','staff_roles.py');m=sr.m;lp=load('prop_helpers','lobby.py')
sr.GLYPHS.update({'F':[[(0,0),(0,1),(1,1)],[(0,.5),(.8,.5)]],'C':[[(1,1),(.2,1),(0,.8),(0,.2),(.2,0),(1,0)]]})
ROLES=[dict(id='assistant',code='MA',top=(.29,.64,.54),pants=(.34,.53,.68),accent=(.055,.31,.28),skin=(.64,.42,.28),hair=(.035,.025,.020)),
       dict(id='facilities',code='FAC',top=(.075,.095,.105),pants=(.055,.072,.080),accent=(.48,.30,.075),skin=(.40,.25,.15),hair=(.105,.085,.065))]

def originals():
    files=[p for p in(ROOT/'dist/assets').glob('*.glb')if not p.name.startswith(('staff-assistant','staff-facilities','service-props'))]
    files+=[ROOT/'blender'/name for name in ['characters.py','characters.blend','staff_roles.py','staff_roles.blend','lobby.py','lobby.blend']]
    return {str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest()for p in files}

def wardrobe(mesh,role):
    for mat in mesh.data.materials:
        if ' · fabric trim'in mat.name:sr.color(mat,role['accent'])
        elif ' · fabric'in mat.name:sr.color(mat,role['top'])
        elif ' · seam'in mat.name:sr.color(mat,tuple(c*.8 for c in role['top']))
        elif ' · skin'in mat.name:sr.color(mat,role['skin'])
        elif ' · lip'in mat.name:sr.color(mat,tuple(c*f for c,f in zip(role['skin'],[.83,.68,.66])))
        elif ' · hair / rubber'in mat.name:sr.color(mat,role['hair'])
        elif ' · hair detail'in mat.name:sr.color(mat,tuple(c*1.25 for c in role['hair']))
    pants=m.material('Service trousers '+role['id'],role['pants'],.92);mesh.data.materials.append(pants);pants_index=len(mesh.data.materials)-1
    names={group.index:group.name for group in mesh.vertex_groups}
    def groups(index):return {names[g.group]for g in mesh.data.vertices[index].groups if g.weight>.001}
    for face in mesh.data.polygons:
        material=mesh.data.materials[face.material_index]
        if ' · fabric'in material.name and 'trim'not in material.name and all(any(g.startswith(('hips','thigh.','shin.'))for g in groups(i))for i in face.vertices):face.material_index=pants_index
    if role['id']=='assistant':
        for vertex in mesh.data.vertices:
            if .954<vertex.co.z<1.04 and 'spine'in groups(vertex.index):vertex.co.z=.925+(vertex.co.z-.955)*.115/.085
    else:
        gloves=m.material('Matte facilities work gloves',(.28,.22,.13),.93);mesh.data.materials.append(gloves);index=len(mesh.data.materials)-1
        for face in mesh.data.polygons:
            if ' · skin'in mesh.data.materials[face.material_index].name and all(any(g.startswith(('hand.','finger','thumb'))for g in groups(i))for i in face.vertices):face.material_index=index
        for vertex in mesh.data.vertices:
            if 1.51<vertex.co.z<1.575 and any(g in groups(vertex.index)for g in ['jaw','head']):vertex.co.x*=1+.04*math.sin(math.pi*(vertex.co.z-1.51)/.065)**2

def details(role):
    accent=m.material('Service role accent '+role['id'],role['accent'],.88)
    sr.badge(role['code'],-.078,-.144 if role['id']=='facilities'else m.cloth_front_y(-.078,1.329)-.011,1.329,accent,.086)
    if role['id']=='assistant':
        pocket=m.material('Mint reinforced pen pocket',role['top'],.92)
        m.mesh_object('Assistant pen pocket',[(.050,-.103,1.25),(.118,-.091,1.25),(.118,-.091,1.315),(.050,-.103,1.315)],[(0,1,2,3)],pocket,'spine',.0025)
        ink=m.material('Original pocket pens',(.055,.09,.13),.50)
        for x in [.075,.095]:m.tube('Pocket pen',(x,-.108,1.292),(x,-.108,1.35),[(0,.0023,.0023),(1,.0023,.0023)],ink,'spine',8)
    else:
        graphite=m.material('Graphite utility binding',(.04,.055,.063),.94)
        for sign in [-1,1]:
            m.mesh_object('Ochre utility vest panel',[(sign*.055,-.117,1.39),(sign*.155,-.080,1.35),(sign*.143,-.09,1.05),(sign*.055,-.119,1.03)],[(0,1,2,3)],accent,'spine',.006)
            m.mesh_object('Workshirt folded collar',[(sign*.042,-.054,1.438),(sign*.088,-.094,1.385),(sign*.026,-.108,1.35)],[(0,1,2)],accent,'spine',.003)
            cuff=m.surface('Protective glove cuff',[(.952,.033,.030,-.012),(.973,.033,.030,-.012)],graphite,'hand.'+('L'if sign>0 else'R'),12);cuff.location.x=sign*.255
            m.box('Empty utility belt pouch',(sign*.173,-.018,.953),(.058,.065,.095),graphite,'hips',.008)
        vertices=[];n=24
        for z in [.988,1.015]:
            for i in range(n):a=i/n*2*math.pi;vertices.append((.169*math.cos(a),.117*math.sin(a),z))
        m.mesh_object('Broad utility belt',vertices,[(i,(i+1)%n,(i+1)%n+n,i+n)for i in range(n)],graphite,'hips',.003)
        m.box('Satin utility belt buckle',(0,-.122,1.001),(.040,.008,.027),m.material('Belt buckle metal',(.36,.40,.41),.38,.55),'hips',.003)

def packed_prop_copies(sources,M):
    mat,palette=lp.browser_material(M);copies=[]
    for source in sources:
        name=source.name;source.name=name+'_source';obj=source.copy();obj.data=source.data.copy();bpy.context.collection.objects.link(obj);obj.name=name
        for uv in list(obj.data.uv_layers):obj.data.uv_layers.remove(uv)
        obj.data.color_attributes.new(name='Color',type='BYTE_COLOR',domain='CORNER');obj.data.uv_layers.new(name='PBR palette')
        colors=obj.data.color_attributes['Color'];uv=obj.data.uv_layers['PBR palette']
        for face in obj.data.polygons:
            old=obj.data.materials[face.material_index];row=palette.index(old)
            for loop in face.loop_indices:colors.data[loop].color=old.diffuse_color;uv.data[loop].uv=(.5,(row+.5)/len(palette))
            face.material_index=0
        obj.data.materials.clear();obj.data.materials.append(mat);copies.append(obj)
    return copies

def props():
    M={key:lp.material(name,color,rough,metal)for key,name,color,rough,metal in [
      ('ochre','Ochre bucket polymer',(.48,.31,.065),.62,0),('dark','Rubber wheels and grips',(.025,.040,.045),.86,0),('metal','Brushed utility metal',(.46,.51,.52),.36,.7),('cloth','Teal cleaning pad',(.055,.34,.32),.95,0),('coffee','Amber fictional coffee spill',(.32,.105,.022),.19,0)]}
    lp.PARTS=[];vertices=[(0,0,.01),(0,0,0)];n=32
    for z,scale in [(.0015,1),(.006,.82),(0,1)]:
        for i in range(n):a=2*math.pi*i/n;r=.285*(1+.06*math.sin(3*a)+.035*math.cos(5*a));vertices.append((r*math.cos(a)*scale,r*math.sin(a)*scale,z))
    faces=[]
    for i in range(n):
        j=(i+1)%n;faces.extend([(0,2+n+i,2+n+j),(2+i,2+j,2+n+j,2+n+i),(1,2+2*n+j,2+2*n+i),(2+i,2+2*n+i,2+2*n+j,2+j)])
    spill=lp.mesh('Thin organic amber puddle',vertices,faces,M['coffee'])
    for face in spill.data.polygons:face.use_smooth=True
    spill=lp.combine('FloorSpill',(.60,.60,.01))
    for x in [-.14,.14]:
        for y in [-.09,.09]:lp.rod('Caddy rubber wheel',(x-.011,y,.035),(x+.011,y,.035),.035,M['dark'],8)
    lp.box('Compact trolley base',(0,0,.065),(.32,.25,.020),M['dark'],.008,1)
    vertices=[];n=16
    for width,depth,radius,z in [(.22,.17,.018,.09),(.254,.214,.022,.323),(.226,.186,.015,.312),(.194,.146,.012,.105)]:
        for corner,(sx,sy)in enumerate([(1,1),(-1,1),(-1,-1),(1,-1)]):
            for j in range(4):
                a=corner*math.pi/2+j*math.pi/6;vertices.append((sx*(width/2-radius)+radius*math.cos(a),sy*(depth/2-radius)+radius*math.sin(a),z))
    faces=[]
    for ring in range(3):
        for i in range(n):j=(i+1)%n;faces.append((ring*n+i,ring*n+j,(ring+1)*n+j,(ring+1)*n+i))
    faces.extend([tuple(range(n-1,-1,-1)),tuple(range(3*n,4*n))])
    bucket=lp.mesh('Original tapered rounded bucket',vertices,faces,M['ochre'])
    for face in bucket.data.polygons:face.use_smooth=True
    for x in [-.12,.12]:lp.rod('Caddy bail upright',(x,0,.29),(x,0,.474),.006,M['metal'],8)
    lp.rod('Caddy carry handle',(-.12,0,.474),(.12,0,.474),.006,M['dark'],8)
    lp.box('Folded original cleaning cloth',(.055,-.104,.303),(.075,.014,.043),M['cloth'],.004,1)
    caddy=lp.combine('CleaningCaddy')
    lp.box('Flat mop cloth pad',(0,0,.009),(.30,.12,.018),M['cloth'],.006,1)
    lp.box('Mop head structural plate',(0,0,.023),(.25,.085,.012),M['dark'],.005,1)
    lp.rod('Upright original mop handle',(0,0,.029),(0,0,1.243),.007,M['metal'],8)
    lp.box('Mop upper grip',(0,0,1.16),(.020,.022,.18),M['ochre'],.008,1)
    mop=lp.combine('Mop');sources=[spill,caddy,mop];copies=packed_prop_copies(sources,M)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in copies:obj.select_set(True)
    path=ROOT/'dist/assets/service-props.glb';bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_animations=False,export_colors=True,export_yup=True,export_extras=True)
    for obj in copies:data=obj.data;bpy.data.objects.remove(obj,do_unlink=True);bpy.data.meshes.remove(data)
    for obj in sources:obj.name=obj.name.removesuffix('_source')
    return sources,path

def inspect(path):
    raw=path.read_bytes();n=struct.unpack_from('<I',raw,12)[0];doc=json.loads(raw[20:20+n]);nodes={}
    assert not doc.get('animations')and all('uri'not in b for b in doc['buffers'])
    for node in doc['nodes']:
        if 'mesh'not in node:continue
        primitive=doc['meshes'][node['mesh']]['primitives'];assert len(primitive)==1;primitive=primitive[0]
        assert 'TEXCOORD_0'in primitive['attributes']and 'TEXCOORD_1'not in primitive['attributes']
        positions=doc['accessors'][primitive['attributes']['POSITION']]
        nodes[node['name']]={'triangles':doc['accessors'][primitive['indices']]['count']//3,'min_browser':positions['min'],'max_browser':positions['max']}
    return {'file':path.name,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'joints':len(doc.get('skins',[{'joints':[]}])[0]['joints']),'embedded_clips':0,'nodes':nodes}

def build():
    OUT.mkdir(parents=True,exist_ok=True);baseline=originals();bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False);bpy.context.scene.render.fps=30;bpy.context.scene.unit_settings.system='METRIC';m.animate=lambda *args:None
    models=[];report={'blender_version':bpy.app.version_string,'license':'CC0-1.0','provenance':'Original procedural service wardrobes/props; substantial OpenAI Codex assistance','human_base':'clinician','appearance_visual_only':True,'humans':{},'original_hashes':baseline}
    for role in ROLES:
        arm,mesh=m.character('clinician');wardrobe(mesh,role);m.PARTS=[];details(role)
        bpy.ops.object.select_all(action='DESELECT');mesh.select_set(True)
        for part in m.PARTS:part.select_set(True)
        bpy.context.view_layer.objects.active=mesh;bpy.ops.object.join();arm.name='staff-'+role['id'];mesh.name=arm.name+'_skin';arm['shared_clip_base']='clinician';arm['appearance_visual_only']=True;arm['license']='CC0-1.0'
        results=[]
        for suffix,ratio in [('',1),('-lod',.29)]:
            browser=m.export_mesh(mesh,ratio)
            material=browser.data.materials[0];nodes=material.node_tree.nodes;image=next(n.image for n in nodes if n.type=='TEX_IMAGE');pixels=[]
            for original in mesh.data.materials:
                shader=original.node_tree.nodes.get('Principled BSDF');pixels.extend([1,shader.inputs['Roughness'].default_value,shader.inputs['Metallic'].default_value,1]*4)
            image.pixels.foreach_set(pixels);image.pack();split=next(n for n in nodes if n.type=='SEPRGB');material.node_tree.links.new(split.outputs['B'],nodes.get('Principled BSDF').inputs['Metallic'])
            for uv in list(browser.data.uv_layers):
                if uv.name!='MaterialRoughness':browser.data.uv_layers.remove(uv)
            browser.data.uv_layers.active_index=0;browser.data.uv_layers[0].active_render=True
            bpy.ops.object.select_all(action='DESELECT');arm.select_set(True);browser.select_set(True);bpy.context.view_layer.objects.active=arm
            path=ROOT/'dist/assets'/('staff-'+role['id']+suffix+'.glb');bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_animations=False,export_skins=True,export_yup=True,export_extras=True,export_colors=True)
            results.append(inspect(path));assert results[-1]['joints']==39
            data=browser.data;bpy.data.objects.remove(browser,do_unlink=True);bpy.data.meshes.remove(data)
        report['humans'][role['id']]={'code':role['code'],'base':'clinician','assets':results};models.append((role,arm,mesh))
    source_props,path=props();report['props']=inspect(path)
    assert report['props']['bytes']<50000
    report['human_lod_combined_bytes']=sum(role['assets'][1]['bytes']for role in report['humans'].values());assert report['human_lod_combined_bytes']<600000
    report['all_four_human_files_bytes']=sum(a['bytes']for role in report['humans'].values()for a in role['assets'])
    with bpy.data.libraries.load(str(ROOT/'blender/characters.blend'),link=False)as(source,target):target.actions=[name for name in source.actions if name.endswith('__clinician')]
    for action in target.actions:action.use_fake_user=True
    for role,arm,mesh in models:arm.animation_data_create();arm.animation_data.action=bpy.data.actions.get('Idle__clinician')
    for name,objects in [('Assistant',[models[0][1],models[0][2]]),('Facilities',[models[1][1],models[1][2]])]+[(obj.name,[obj])for obj in source_props]:
        collection=bpy.data.collections.new(name);bpy.context.scene.collection.children.link(collection)
        for obj in objects:
            for old in list(obj.users_collection):old.objects.unlink(obj)
            collection.objects.link(obj)
        collection.hide_viewport=name!='Assistant';collection.hide_render=name!='Assistant'
    bpy.context.scene.frame_set(1);bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/service_staff.blend'),compress=True)
    assert originals()==baseline
    (OUT/'asset-checks.json').write_text(json.dumps(report,indent=2)+'\n');print('SERVICE_STAFF_BUILD_PASS',json.dumps(report['humans']),report['props'],flush=True)

if __name__=='__main__':build()
