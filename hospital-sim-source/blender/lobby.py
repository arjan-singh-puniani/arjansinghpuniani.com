"""Original hospital lobby props, CC0-1.0; substantial OpenAI Codex assistance.
Blender4.0: -b --python blender/lobby.py
Metres; floor/center origins. Front -Y Blender => +Z browser. No external assets.
"""
import bpy,math,json,struct,hashlib,sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'evidence/lobby-asset';PARTS=[]

def material(name,color,roughness,metallic=0):
    mat=bpy.data.materials.new(name);mat.diffuse_color=(*color,1);mat.use_nodes=True
    p=mat.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=roughness;p.inputs['Metallic'].default_value=metallic
    return mat

def finish(obj,name,mat,bevel=0,segments=2):
    obj.name=name;obj.data.materials.append(mat);PARTS.append(obj)
    if bevel:
        modifier=obj.modifiers.new('Manufactured edge radius','BEVEL');modifier.width=bevel;modifier.segments=segments
        bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=modifier.name)
        obj.data.use_auto_smooth=True
        modifier=obj.modifiers.new('Weighted surface normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=modifier.name)
    return obj

def box(name,loc,size,mat,bevel=.01,segments=2):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);obj=bpy.context.object;obj.scale=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(obj,name,mat,bevel,segments)

def rod(name,a,b,radius,mat,vertices=10):
    a,b=Vector(a),Vector(b);d=b-a
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=d.length,location=(a+b)/2)
    obj=bpy.context.object;obj.rotation_euler=d.to_track_quat('Z','Y').to_euler()
    for face in obj.data.polygons:face.use_smooth=len(face.vertices)==4
    return finish(obj,name,mat)

def line(name,points,radius,mat):
    data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.bevel_depth=radius;data.bevel_resolution=0;data.use_fill_caps=True
    spline=data.splines.new('POLY');spline.points.add(len(points)-1)
    for point,p in zip(spline.points,points):point.co=(*p,1)
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);obj.data.materials.append(mat)
    bpy.context.view_layer.objects.active=obj;obj.select_set(True);bpy.ops.object.convert(target='MESH');obj=bpy.context.object;PARTS.append(obj);return obj

def mesh(name,vertices,faces,mat,thickness=0):
    data=bpy.data.meshes.new(name);data.from_pydata(vertices,[],faces);data.update()
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);finish(obj,name,mat)
    if thickness:
        modifier=obj.modifiers.new('Paper thickness','SOLIDIFY');modifier.thickness=thickness;modifier.offset=0
        bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=modifier.name)
    return obj

def combine(name,target_size=None):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in PARTS:obj.select_set(True)
    bpy.context.view_layer.objects.active=PARTS[0];bpy.ops.object.join();obj=bpy.context.object;obj.name=name
    bpy.context.scene.cursor.location=(0,0,0);bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
    points=[v.co for v in obj.data.vertices];minimum=Vector([min(v[i]for v in points)for i in range(3)]);maximum=Vector([max(v[i]for v in points)for i in range(3)])
    center=Vector(((minimum.x+maximum.x)/2,(minimum.y+maximum.y)/2,minimum.z));scale=Vector((1,1,1))
    if target_size:scale=Vector([target_size[i]/(maximum[i]-minimum[i])for i in range(3)])
    for vertex in obj.data.vertices:vertex.co=Vector([(vertex.co[i]-center[i])*scale[i]for i in range(3)])
    obj['license']='CC0-1.0';obj['provenance']='Original procedural geometry; substantial OpenAI Codex assistance';obj['front']='-Y Blender; +Z browser';obj['origin']='floor, bounding-center X/Z browser'
    obj.data.validate();obj.data.update();PARTS.clear();return obj

def bench(M):
    box('Rounded ivory seat shell',(0,0,.325),(2,.65,.08),M['ivory'],.032)
    back=box('Rounded structural back shell',(0,.23,.65),(2,.10,.54),M['ivory'],.035);back.rotation_euler.x=-.14
    for x in [-.64,0,.64]:
        box('Teal woven seat cushion',(x,-.055,.4075),(.615,.47,.085),M['teal'],.030)
        back=box('Teal lumbar back cushion',(x,.158,.665),(.615,.066,.38),M['teal'],.030);back.rotation_euler.x=-.14
        line('Seat welt seam',[(x-.265,-.289,.407),(x+.265,-.289,.407)],.0013,M['seam'])
        line('Back cushion welt',[(x-.265,.118,.794),(x+.265,.118,.794)],.0013,M['seam'])
    for x in [-.76,.76]:
        for y in [-.205,.205]:
            box('Non-marking foot pad',(x,y,.006),(.070,.065,.012),M['rubber'],.005,1)
            rod('Brushed aluminium leg',(x,y,.012),(x,y*.94,.293),.023,M['metal'])
        for y in [-.26,.22]:rod('Recessed attachment cap',(x,y,.329),(x,y,.341),.011,M['metal'],8)
    for y in [-.193,.193]:rod('Seat frame cross rail',(-.84,y,.287),(.84,y,.287),.018,M['metal'])
    for sign in [-1,1]:
        box('Rounded ivory armrest',(sign*.96,-.015,.575),(.075,.50,.055),M['ivory'],.022)
        box('Armrest structural bracket',(sign*.96,.12,.455),(.038,.045,.20),M['metal'],.008,1)
    obj=combine('WaitingBench');obj['seat_height_metres']=.45;obj['seat_centers_blender']=[[-.64,-.055,.45],[0,-.055,.45],[.64,-.055,.45]]
    return obj

def accordion(M):
    vertices=[];segments=12
    for i in range(segments+1):
        z=.010 if i%2==0 else .120;x=-.14+.28*i/segments
        vertices.extend([(x,-.05,z),(x,.05,z)])
    mesh('Original folded-paper accordion',vertices,[(i*2,i*2+2,i*2+3,i*2+1)for i in range(segments)],M['paper'],.0008)
    for i in range(segments):
        a=Vector(vertices[i*2]);b=Vector(vertices[(i+1)*2]);direction=b-a;normal=Vector((-direction.z,0,direction.x)).normalized()
        for y in [-.029,0,.029]:
            aa=a.lerp(b,.15)+normal*.00055;bb=a.lerp(b,.85)+normal*.00055;aa.y=y;bb.y=y
            mesh('Fictional blank form rule',[aa+Vector((0,-.0005,0)),aa+Vector((0,.0005,0)),bb+Vector((0,.0005,0)),bb+Vector((0,-.0005,0))],[(0,1,2,3)],M['rule'])
    return combine('PaperAccordion',(.28,.10,.12))

def tray(M):
    box('Rounded intake tray base',(0,0,.005),(.22,.28,.010),M['ivory'],.004)
    for x in [-.104,.104]:box('Tray side rail',(x,0,.0325),(.012,.268,.055),M['ivory'],.004,1)
    box('Tray back wall',(0,.134,.035),(.22,.012,.05),M['ivory'],.004,1)
    for x in [-.077,.077]:box('Open finger-grip front lip',(x,-.134,.018),(.066,.012,.026),M['ivory'],.004,1)
    box('Teal non-slip tray liner',(0,0,.012),(.19,.245,.003),M['teal'],.001,1)
    for z,y in [(.015,0),(.017,-.006)]:box('Blank fictional intake sheet',(0,y,z),(.17,.21,.001),M['paper'],0)
    for y in [-.06,-.03,0,.03]:box('Fictional form line',(0,y,.0176),(.12,.0007,.00015),M['rule'],0)
    return combine('IntakeTray')

def counter(M):
    box('Ivory counter plinth',(0,0,.0275),(1,.48,.055),M['ivory'],.018)
    for x in [-.46,.46]:box('Rounded counter sidewall',(x,0,.375),(.08,.46,.64),M['ivory'],.018)
    box('Counter back panel',(0,.215,.37),(.84,.03,.63),M['ivory'],.012,1)
    box('Upper front frame',(0,-.225,.665),(1,.03,.075),M['ivory'],.012,1)
    box('Lower front frame',(0,-.225,.105),(1,.03,.055),M['ivory'],.010,1)
    box('Inset pale-blue face',(0,-.209,.376),(.83,.018,.48),M['pale'],.012)
    box('Thick rounded writing top',(0,0,.7325),(1,.48,.035),M['ivory'],.016)
    rod('Brushed metal kickrail',(-.39,-.225,.10),(.39,-.225,.10),.011,M['metal'],12)
    for x in [-.32,.32]:rod('Kickrail support',(x,-.197,.10),(x,-.225,.10),.006,M['metal'],8)
    box('Integrated monitor foot',(.22,.045,.754),(.17,.10,.008),M['metal'],.003,1)
    box('Integrated monitor support',(.22,.060,.797),(.035,.035,.086),M['metal'],.005,1)
    box('Rounded integrated monitor bezel',(.22,.045,.885),(.26,.028,.16),M['rubber'],.011)
    box('Fictional check-in display',(.22,.0295,.885),(.232,.001,.132),M['screen'],.005,1)
    for x,z,w in [(.167,.925,.08),(.21,.897,.15),(.192,.870,.115),(.18,.848,.09)]:box('Fictional status bar',(x,.0287,z),(w,.0006,.003),M['pale'],0)
    obj=combine('ReceptionCounter');obj['writing_top_height_metres']=.75;return obj

def browser_material(M):
    palette=list(M.values());mat=bpy.data.materials.new('Lobby browser PBR');mat.use_nodes=True;nodes=mat.node_tree.nodes;p=nodes.get('Principled BSDF')
    colors=nodes.new('ShaderNodeVertexColor');colors.layer_name='Color';mat.node_tree.links.new(colors.outputs['Color'],p.inputs['Base Color'])
    image=bpy.data.images.new('Original lobby roughness-metallic palette',width=4,height=len(palette),alpha=False);image.colorspace_settings.name='Non-Color';pixels=[]
    for source in palette:
        shader=source.node_tree.nodes.get('Principled BSDF');pixels.extend([1,shader.inputs['Roughness'].default_value,shader.inputs['Metallic'].default_value,1]*4)
    image.pixels.foreach_set(pixels);image.pack()
    texture=nodes.new('ShaderNodeTexImage');texture.image=image;texture.interpolation='Closest';split=nodes.new('ShaderNodeSeparateRGB');mat.node_tree.links.new(texture.outputs['Color'],split.inputs[0]);mat.node_tree.links.new(split.outputs['G'],p.inputs['Roughness']);mat.node_tree.links.new(split.outputs['B'],p.inputs['Metallic'])
    return mat,palette

def main():
    OUT.mkdir(parents=True,exist_ok=True);bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    bpy.context.scene.unit_settings.system='METRIC'
    M={key:material(name,color,rough,metal)for key,name,color,rough,metal in [
      ('ivory','Powder-coated warm ivory',(.86,.89,.85),.48,0),('teal','Matte teal woven upholstery',(.045,.35,.37),.94,0),('seam','Upholstery welt thread',(.035,.27,.29),.96,0),
      ('metal','Brushed aluminium structure',(.47,.54,.56),.33,.75),('rubber','Non-marking rubber',(.035,.052,.060),.86,0),('paper','Uncoated warm-white paper',(.92,.90,.83),.94,0),
      ('rule','Fictional pale form rules',(.27,.43,.51),.90,0),('pale','Pale-blue inset powder coat',(.38,.65,.75),.51,0),('screen','Fictional monitor glass',(.018,.065,.075),.25,.08) ]}
    originals=[bench(M),accordion(M),tray(M),counter(M)];mat,palette=browser_material(M);copies=[]
    for source in originals:
        name=source.name;source.name=name+'_source';obj=source.copy();obj.data=source.data.copy();bpy.context.collection.objects.link(obj);obj.name=name
        for layer in list(obj.data.uv_layers):obj.data.uv_layers.remove(layer)
        colors=obj.data.color_attributes.new(name='Color',type='BYTE_COLOR',domain='CORNER');uv=obj.data.uv_layers.new(name='PBR palette')
        colors=obj.data.color_attributes['Color'];uv=obj.data.uv_layers['PBR palette']
        for face in obj.data.polygons:
            original=obj.data.materials[face.material_index];index=palette.index(original)
            for loop in face.loop_indices:colors.data[loop].color=original.diffuse_color;uv.data[loop].uv=(.5,(index+.5)/len(palette))
            face.material_index=0
        obj.data.materials.clear();obj.data.materials.append(mat);copies.append(obj)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in copies:obj.select_set(True)
    path=ROOT/'dist/assets/lobby.glb';bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_animations=False,export_cameras=False,export_lights=False,export_yup=True,export_extras=True,export_colors=True)
    raw=path.read_bytes();length=struct.unpack_from('<I',raw,12)[0];d=json.loads(raw[20:20+length]);report={'blender_version':bpy.app.version_string,'license':'CC0-1.0','provenance':'Original procedural geometry; substantial OpenAI Codex assistance','bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'front_browser':'+Z','nodes':{}}
    assert not d.get('animations')and not d.get('cameras')and all('uri'not in b for b in d['buffers'])
    assert len(d.get('images',[]))==1 and all('bufferView'in i for i in d['images'])
    for node in d['nodes']:
        if 'mesh'not in node:continue
        mesh_data=d['meshes'][node['mesh']];assert len(mesh_data['primitives'])==1
        primitive=mesh_data['primitives'][0];assert 'TEXCOORD_0'in primitive['attributes']and 'TEXCOORD_1'not in primitive['attributes']
        position=d['accessors'][primitive['attributes']['POSITION']];tris=d['accessors'][primitive['indices']]['count']//3
        assert abs(position['min'][1])<1e-5
        report['nodes'][node['name']]={'min_browser':position['min'],'max_browser':position['max'],'triangles':tris,'primitives':1}
    assert set(report['nodes'])=={'WaitingBench','PaperAccordion','IntakeTray','ReceptionCounter'}
    report['triangles']=sum(n['triangles']for n in report['nodes'].values());assert report['triangles']<15000
    report['bench_seat_height_metres']=.45;report['counter_writing_top_height_metres']=.75
    report['bench_seat_centers_browser']=[[-.64,.45,.055],[0,.45,.055],[.64,.45,.055]]
    for obj in copies:data=obj.data;bpy.data.objects.remove(obj,do_unlink=True);bpy.data.meshes.remove(data)
    for source in originals:source.name=source.name.removesuffix('_source')
    for source in originals:
        collection=bpy.data.collections.new(source.name);bpy.context.scene.collection.children.link(collection)
        for old in list(source.users_collection):old.objects.unlink(source)
        collection.objects.link(source);collection.hide_viewport=source.name!='WaitingBench';collection.hide_render=source.name!='WaitingBench'
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/lobby.blend'),compress=True)
    (OUT/'checks.json').write_text(json.dumps(report,indent=2)+'\n')
    if '--no-render'not in sys.argv:render(originals)
    print('LOBBY_ASSET_PASS',json.dumps(report),flush=True)

def render(objects):
    # Preview transforms are never saved/exported; the four source roots remain at floor zero.
    placements={'WaitingBench':(-.70,0,0),'ReceptionCounter':(1.10,0,0),'PaperAccordion':(1.24,-.13,.75),'IntakeTray':(.85,-.02,.75)}
    for obj in objects:obj.users_collection[0].hide_viewport=False;obj.users_collection[0].hide_render=False
    for obj in objects:obj.location=placements[obj.name]
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=True;scene.render.resolution_x=960;scene.render.resolution_y=680;scene.render.resolution_percentage=100
    if scene.world is None:scene.world=bpy.data.worlds.new('Warm-white QA studio')
    scene.world.use_nodes=True;nodes=scene.world.node_tree.nodes;links=scene.world.node_tree.links
    fill=nodes.get('Background');fill.inputs['Color'].default_value=(.28,.29,.28,1);fill.inputs['Strength'].default_value=.55
    camera_background=nodes.new('ShaderNodeBackground');camera_background.inputs['Color'].default_value=(.91,.90,.86,1)
    light_path=nodes.new('ShaderNodeLightPath');mix=nodes.new('ShaderNodeMixShader');links.new(light_path.outputs['Is Camera Ray'],mix.inputs[0]);links.new(fill.outputs[0],mix.inputs[1]);links.new(camera_background.outputs[0],mix.inputs[2]);links.new(mix.outputs[0],nodes.get('World Output').inputs['Surface'])
    bpy.ops.object.camera_add();camera=bpy.context.object;target=Vector((0,0,.48));camera.location=target+Vector((4.2,-6,3.7));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=3.85;scene.camera=camera
    for loc,power,size in [((-3,-4,5),450,4),((4,2,4),300,3)]:
        bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.data.energy=power;light.data.size=size;light.rotation_euler=(target-light.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(OUT/'lobby-preview.png');bpy.ops.render.render(write_still=True)

if __name__=='__main__':main()
