"""Original Common Good equipment. Blender 4.0: blender -b --python blender/hospital.py.
Metres, Z up, equipment faces -Y. All geometry/materials generated here, CC0.
"""
import bpy, math, os, json
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist/assets'; OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
for m in list(bpy.data.materials): bpy.data.materials.remove(m)
bpy.context.scene.unit_settings.system='METRIC'

def mat(name,color,rough=.45,metal=0):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Roughness'].default_value=rough; p.inputs['Metallic'].default_value=metal
    return m
M={
 'housing':mat('Powder coat • warm porcelain',(.86,.92,.93),.38),
 'blue':mat('Satin cobalt plastic',(.025,.32,.57),.32),
 'pale':mat('Pale blue polymer',(.40,.70,.84),.48),
 'metal':mat('Brushed aluminium',(.48,.58,.62),.32,.72),
 'dark':mat('Rubber and screen bezel',(.022,.055,.075),.69),
 'teal':mat('Matte woven drape',(.12,.49,.46),.92),
 'linen':mat('Linen upholstery',(.65,.82,.79),.9),
 'screen':mat('Diagnostic glass • fictional',(.014,.075,.10),.22,.12),
 'light':mat('Warm task diffuser',(.94,.91,.78),.5),
 'peach':mat('Warm clay accent',(.76,.39,.26),.7),
 'leaf':mat('Sage foliage',(.23,.43,.31),.85),
 'white':mat('Cabinet ivory',(.87,.87,.81),.59),
}
TEXTURES=ROOT/'blender/textures';TEXTURES.mkdir(parents=True,exist_ok=True)
def source_texture(name,size,fn,material):
    image=bpy.data.images.new(name,width=size,height=size,alpha=True)
    image.colorspace_settings.name='Non-Color'
    image.pixels=[v for y in range(size) for x in range(size) for v in (*fn(x,y),1)]
    image.filepath_raw=str(TEXTURES/(name+'.png'));image.file_format='PNG';image.save();image.pack()
    export=OUT/'textures';export.mkdir(exist_ok=True)
    import shutil;shutil.copy2(TEXTURES/(name+'.png'),export/(name+'.png'))
    nodes=M[material].node_tree.nodes;node=nodes.new('ShaderNodeTexImage');node.image=image
    M[material].node_tree.links.new(node.outputs['Color'],nodes.get('Principled BSDF').inputs['Base Color'])
source_texture('original-woven-drape',128,lambda x,y:tuple(c*(.96+.04*((x%3==0)+(y%3==0))/2) for c in (.12,.49,.46)),'teal')
def fictional_screen(x,y):
    grid=x%16==0 or y%16==0
    r=math.hypot(x-64,y-66)
    ring=abs(r-30)<1.5 or abs(r-18)<1
    return (.10,.40,.46) if ring else ((.025,.11,.14) if grid else (.012,.055,.073))
source_texture('fictional-diagnostic-phantom',128,fictional_screen,'screen')
parts=[]
def finish(o,n,material,bevel=0):
    o.name=n; o.data.materials.append(M[material]);parts.append(o)
    if bevel:
        mod=o.modifiers.new('Manufactured edge radius','BEVEL');mod.width=bevel;mod.segments=3
        o.data.use_auto_smooth=True
        mod=o.modifiers.new('Weighted surface normals','WEIGHTED_NORMAL')
    return o
def box(n,loc,scale,ma='housing',bev=.025):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.dimensions=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,n,ma,bev)
def uv(n,loc,scale,ma='housing',seg=24,rings=12):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg,ring_count=rings,location=loc);o=bpy.context.object;o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    for p in o.data.polygons:p.use_smooth=True
    return finish(o,n,ma)
def rod(n,a,b,r=.02,ma='metal',vertices=16):
    d=Vector(b)-Vector(a);bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=d.length,location=(Vector(a)+Vector(b))/2)
    o=bpy.context.object;o.rotation_euler=d.to_track_quat('Z','Y').to_euler()
    for p in o.data.polygons:p.use_smooth=True
    return finish(o,n,ma,.006 if r>.03 else 0)
def tube(n,coords,r=.012,ma='dark'):
    c=bpy.data.curves.new(n,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=2
    p=c.splines.new('BEZIER');p.bezier_points.add(len(coords)-1)
    for b,co in zip(p.bezier_points,coords):b.co=co;b.handle_left_type='AUTO';b.handle_right_type='AUTO'
    o=bpy.data.objects.new(n,c);bpy.context.collection.objects.link(o);o.data.materials.append(M[ma]);parts.append(o);return o
def ring(n,x,y,z,outer,inner,depth,ma):
    verts=[];faces=[];N=80
    for yy,rr in [(y-depth/2,outer),(y+depth/2,outer),(y-depth/2,inner),(y+depth/2,inner)]:
        for i in range(N):
            a=2*math.pi*i/N;verts.append((x+math.cos(a)*rr,yy,z+math.sin(a)*rr))
    for i in range(N):
        j=(i+1)%N
        for a,b in [(0,N),(2*N,0),(N,3*N),(3*N,2*N)]:faces.append((a+i,a+j,b+j,b+i))
    mesh=bpy.data.meshes.new(n);mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new(n,mesh);bpy.context.collection.objects.link(o)
    for p in mesh.polygons:p.use_smooth=True
    return finish(o,n,ma,.025)
def wheels(x,y,w,d):
    for dx in [-w/2,w/2]:
      for dy in [-d/2,d/2]:
        rod('Caster axle',(x+dx,y+dy,.10),(x+dx,y+dy,.19),.022)
        rod('Rubber caster',(x+dx-.025,y+dy,.075),(x+dx+.025,y+dy,.075),.065,'dark',20)
def monitor(x,y,z,w=.62,h=.40):
    box('Monitor articulated bezel',(x,y,z),(w,.065,h),'housing',.023)
    box('Fictional diagnostic screen',(x,y-.037,z),(w-.055,.012,h-.055),'screen',.009)
    # Original schematic graphics, no real anatomy or patient information.
    for i in range(4):
      yy=y-.045
      tube('Synthetic signal '+str(i),[(x-w*.38+j*w*.073,yy,z+h*.22-i*h*.14+(.032 if (j+i)%5==0 else .006*math.sin(j*2))) for j in range(11)],.0035,'pale')
    box('Status light',(x+w*.38,y-.039,z-h*.39),(.024,.008,.009),'teal',.002)
def keyboard(x,y,z):
    box('Keyboard tray',(x,y,z),(.47,.17,.022),'dark',.009)
    for i in range(4):
      for j in range(12): box('Keycap',(x-.21+j*.038,y-.06+i*.035,z+.015),(.026,.024,.007),'pale',.002)
def workstation(x,y):
    box('Workstation desktop',(x,y,.79),(.92,.58,.06),'housing')
    for dx in [-.37,.37]:rod('Workstation leg',(x+dx,y+.17,.08),(x+dx,y+.17,.77),.025)
    box('Console pedestal',(x,y+.08,.96),(.09,.10,.30),'metal',.012)
    monitor(x,y+.10,1.22,.72,.45);keyboard(x,y-.15,.83)
    box('Diagnostic computer',(x+.25,y+.10,.48),(.22,.38,.45),'housing')
    for i in range(7):box('Vent',(x+.363,y-.03+i*.035,.50),(.005,.017,.19),'dark',.002)
def chair(x,y):
    rod('Chair column',(x,y,.12),(x,y,.42),.04)
    for a in range(5):
      ang=a*math.tau/5;rod('Chair star leg',(x,y,.15),(x+.24*math.cos(ang),y+.24*math.sin(ang),.10),.018)
    box('Chair seat',(x,y,.47),(.44,.42,.095),'blue',.07)
    box('Chair back',(x,y+.18,.72),(.43,.09,.40),'blue',.06)
def plant(x,y):
    bpy.ops.mesh.primitive_cone_add(vertices=32,radius1=.16,radius2=.21,depth=.36,location=(x,y,.19));finish(bpy.context.object,'Ceramic planter','white',.018)
    for i in range(9):
      a=i*2.4;r=.13 if i%2 else .21
      rod('Stem',(x,y,.35),(x+r*math.cos(a),y+r*math.sin(a),.65+(i%3)*.10),.007,'leaf')
      o=uv('Leaf',(x+r*math.cos(a),y+r*math.sin(a),.65+(i%3)*.10),(.07,.15,.022),'leaf',16,8);o.rotation_euler=(.6,0,a)
def cabinet(x,y,w=1.5):
    box('Cabinet plinth',(x,y,.07),(w,.50,.10),'dark',.01)
    box('Storage carcass',(x,y,.48),(w,.55,.79),'white',.018)
    box('Stone counter',(x,y,.91),(w+.04,.59,.05),'housing',.018)
    for i in range(3):
      dx=x-w/2+(i+.5)*w/3;box('Storage door',(dx,y-.286,.48),(w/3-.015,.018,.72),'housing',.01)
      rod('Pull handle',(dx+.08,y-.315,.55),(dx+.08,y-.315,.72),.009)
def scanner():
    box('Scanner structural foot',(-.55,.72,.13),(1.62,.91,.26),'housing',.10)
    ring('Satin rear gantry',-.55,.84,1.09,.99,.385,.59,'blue')
    ring('Rounded porcelain gantry',-.55,.49,1.09,.91,.38,.19,'housing')
    ring('Bore inner liner',-.55,.62,1.09,.405,.35,.65,'pale')
    ring('Bore rim highlight',-.55,.375,1.09,.43,.39,.035,'housing')
    box('Gantry lower shroud',(-.55,.61,.31),(1.50,.91,.46),'housing',.12)
    # Table top aligns to centre of bore, on telescopic structural pedestal.
    box('Table floor foot',(-.55,-.62,.10),(.72,1.46,.18),'housing',.05)
    box('Table lift outer',(-.55,-.62,.42),(.46,.76,.55),'housing',.045)
    box('Telescopic lift',(-.55,-.62,.67),(.32,.60,.27),'metal',.02)
    box('Carbon fibre patient cradle',(-.55,-.58,.84),(.60,1.98,.09),'dark',.035)
    box('Blue patient cushion',(-.55,-.57,.91),(.55,1.94,.085),'blue',.035)
    box('Head cushion',(-.55,.15,.96),(.39,.27,.065),'linen',.04)
    for dx in [-.36,.36]:
      rod('Linear table rail',(-.55+dx,-1.35,.77),(-.55+dx,.20,.77),.018)
      box('Rail carriage',(-.55+dx,-.6,.74),(.065,.45,.09),'metal',.01)
    for x in [-1.18,.08]:
      box('Gantry control inset',(x,.366,1.22),(.14,.018,.25),'pale',.015)
      for i in range(3):uv('Tactile control',(x,.35,1.15+i*.055),(.018,.008,.018),'blue',12,6)
    box('Scan activity indicator',(-.55,.365,1.91),(.27,.012,.025),'teal',.008)
    workstation(1.0,.72);chair(1.0,.02)
    tube('Console umbilical',[(1.1,.9,.08),(.6,1.35,.04),(-.1,1.2,.05)],.018)
def trolley(x,y):
    wheels(x,y,.52,.38)
    for dx in [-.28,.28]:
      for dy in [-.20,.20]:rod('Trolley upright',(x+dx,y+dy,.16),(x+dx,y+dy,.91),.018)
    for z in [.26,.55,.90]:
      box('Instrument trolley tray',(x,y,z),(.60,.45,.035),'metal',.018)
      for dy in [-.22,.22]:rod('Tray retaining rail',(x-.29,y+dy,z+.05),(x+.29,y+dy,z+.05),.009)
    box('Sterile tray liner',(x,y,.925),(.48,.34,.012),'teal',.004)
    for i in range(4):rod('Fictional instrument',(x-.17+i*.10,y-.11,.945),(x-.17+i*.10,y+.10,.945),.006)
    box('Sterile packet',(x+.12,y+.03,.96),(.12,.13,.025),'housing',.006)
def care():
    box('Procedure table base',(0,0,.115),(.82,1.23,.20),'housing',.06)
    box('Table hydraulic column',(0,.02,.44),(.37,.49,.56),'metal',.035)
    box('Adjustable table chassis',(0,0,.71),(.69,1.98,.11),'housing',.035)
    for y,l in [(-.74,.44),(-.13,.75),(.65,.73)]:
      o=box('Articulated mattress section',(0,y,.81),(.64,l,.12),'linen',.045)
      if y>.5:o.rotation_euler.x=-.09
    box('Linen pillow',(0,.80,.92),(.47,.28,.12),'housing',.065)
    for x in [-.41,.41]:
      rod('Side accessory rail',(x,-.75,.75),(x,.68,.75),.017)
      box('Rail support',(x,.0,.70),(.07,.12,.12),'metal',.01)
    # Drape is a continuous folded mesh with a human-sized raised silhouette.
    vs=[];fs=[];nx=24;ny=36
    for j in range(ny+1):
      y=-.92+j*1.49/ny
      for i in range(nx+1):
        x=-.50+i/ nx
        center=.91+.16*math.exp(-(x/.23)**2)*(.85+.15*math.sin(y*3))
        edge=max(0,abs(x)-.30)*1.1
        z=center-edge+.012*math.sin(x*39+y*17)+.008*math.cos(y*31)
        vs.append((x,y,z))
    for j in range(ny):
      for i in range(nx):a=j*(nx+1)+i;fs.append((a,a+1,a+nx+2,a+nx+1))
    mesh=bpy.data.meshes.new('Drape folds');mesh.from_pydata(vs,[],fs);mesh.update();o=bpy.data.objects.new('Patient drape',mesh);bpy.context.collection.objects.link(o);finish(o,'Patient drape','teal')
    uv_layer=mesh.uv_layers.new(name='Drape weave UV')
    for poly in mesh.polygons:
      for loop in poly.loop_indices:
        v=mesh.vertices[mesh.loops[loop].vertex_index].co;uv_layer.data[loop].uv=(v.x+.5,(v.y+.92)/1.49)
    for p in o.data.polygons:p.use_smooth=True
    sol=o.modifiers.new('Fabric thickness','SOLIDIFY');sol.thickness=.006
    trolley(.99,-.98)
    # Articulated diagnostic monitor stand.
    wheels(-1.22,.29,.45,.43);box('Monitor stand foot',(-1.22,.29,.14),(.58,.53,.08),'housing')
    rod('Monitor column',(-1.22,.29,.18),(-1.22,.29,1.37),.035)
    rod('Monitor arm first',(-1.22,.29,1.25),(-.89,.29,1.49),.028)
    rod('Monitor arm second',(-.89,.29,1.49),(-1.02,.23,1.65),.023)
    for x,y,z in [(-1.22,.29,1.25),(-.89,.29,1.49)]:uv('Arm pivot',(x,y,z),(.048,.048,.048),'housing',16,8)
    monitor(-1.06,.22,1.77,.65,.43)
    box('Anaesthesia housing',(-1.25,-.45,.65),(.43,.47,.80),'housing',.04)
    monitor(-1.25,-.70,.96,.34,.22)
    for i in range(3):rod('Supply cylinder',(-1.40+i*.13,-.44,.25),(-1.40+i*.13,-.44,.59),.052,'pale',20)
    tube('Equipment cable',[(-1.14,-.45,.92),(-.85,-.48,.57),(-.57,-.12,.79),(-.27,.17,.93)],.013)
    tube('Floor power cable',[(-1.23,.3,.2),(-1.55,.15,.02),(-1.53,-.64,.02),(-1.25,-.5,.32)],.012)
    rod('Task lamp mast',(.98,.92,.02),(.98,.92,1.96),.029,'housing')
    rod('Task lamp boom',(.98,.92,1.96),(.26,.22,2.08),.024,'metal')
    rod('Task lamp neck',(.26,.22,2.08),(.16,.09,1.94),.022,'housing')
    uv('Task light housing',(.16,.09,1.92),(.25,.19,.055),'housing')
    uv('Task light diffuser',(.16,.09,1.88),(.22,.16,.018),'light')
def consult():
    cabinet(.72,1.12,1.72)
    workstation(.77,.26)
    # Small fabrication enclosure, with clearly visible structural parts.
    box('Fabrication base',(-.52,1.14,.96),(.55,.50,.09),'blue')
    box('Fabrication roof',(-.52,1.14,1.52),(.55,.50,.07),'housing')
    for x in [-.76,-.28]:
      for y in [.92,1.36]:rod('Fabrication frame',(x,y,1.0),(x,y,1.48),.012)
    rod('Printer X gantry',(-.75,1.12,1.38),(-.29,1.12,1.38),.015)
    box('Printer carriage',(-.50,1.12,1.32),(.09,.10,.10),'blue',.008)
    for i in range(4):ring('Fabricated phantom layer',-.52,1.08,1.09+i*.025,.08,.04,.025,'peach')
    box('Anatomy discussion table',(-.61,-.41,.93),(.75,.56,.055),'housing')
    for dx in [-.30,.30]:rod('Discussion table leg',(-.61+dx,-.41,.03),(-.61+dx,-.41,.90),.021)
    # Abstract original branching anatomical phantom, not a clinical image.
    rod('Phantom mounting pin',(-.61,-.41,.97),(-.61,-.41,1.07),.012)
    for i in range(7):
      a=i*2.4;o=uv('Anatomical phantom lobe',(-.61+math.cos(a)*.075,-.41+math.sin(a)*.045,1.14+(i%3)*.035),(.073,.058,.086),'peach',20,10)
    rod('Model branch',(-.61,-.41,1.10),(-.53,-.44,1.28),.015,'pale')
    chair(.78,-.48);plant(1.39,-1.25)
    box('Fictional case folder',(-.80,-.44,.975),(.17,.24,.012),'pale',.008)
def lounge():
    box('Sofa base',(0,.43,.24),(1.95,.74,.40),'linen',.12)
    box('Sofa back',(0,.74,.63),(1.95,.18,.66),'linen',.09)
    for x in [-.91,.91]:box('Sofa arm',(x,.43,.53),(.16,.76,.42),'linen',.07)
    for x in [-.45,.45]:box('Seat cushion',(x,.35,.50),(.85,.58,.11),'teal',.07)
    box('Coffee table',(0,-.47,.40),(1.05,.53,.055),'white',.06)
    for x in [-.4,.4]:rod('Coffee table leg',(x,-.47,.03),(x,-.47,.37),.02)
    for x in [-.21,.21]:
      rod('Mug',(x,-.47,.45),(x,-.47,.53),.04,'peach',20)
    plant(-1.20,.51)

def export_zone(name,build):
    global parts;parts=[]
    collection=bpy.data.collections.new(name);bpy.context.scene.collection.children.link(collection)
    build()
    for o in parts:
      for c in list(o.users_collection):c.objects.unlink(o)
      collection.objects.link(o)
    # Apply manufacturing modifiers then join per material: retains separate interactive modules.
    for o in list(parts):
      bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
      bpy.ops.object.convert(target='MESH')
    groups={}
    for o in parts:groups.setdefault(o.data.materials[0].name,[]).append(o)
    merged=[]
    for material,objects in groups.items():
      bpy.ops.object.select_all(action='DESELECT')
      for o in objects:o.select_set(True)
      bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();o=bpy.context.object
      bpy.context.scene.cursor.location=(0,0,0);bpy.ops.object.origin_set(type='ORIGIN_CURSOR');o.name=name+'__'+material;merged.append(o)
    bpy.ops.object.select_all(action='DESELECT')
    for o in merged:o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'.glb')),export_format='GLB',use_selection=True,export_yup=True,export_extras=True)
    collection.hide_render=True;collection.hide_viewport=True
    return collection
collections=[export_zone(n,f) for n,f in [('scan',scanner),('care',care),('consult',consult),('rest',lounge)]]
for c in collections:c.hide_render=False;c.hide_viewport=False
# Lay out editable source for inspection; exported assets keep local metre origins.
for c,loc in zip(collections,[(-3,2,0),(-3,-2,.0),(1.7,1,0),(1.7,-3,0)]):
  for o in c.objects:o.location+=Vector(loc)
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=32
scene.world.color=(.8,.8,.8)
bpy.ops.object.light_add(type='AREA',location=(-3,-4,9));bpy.context.object.data.energy=1800;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=7
bpy.ops.object.camera_add(location=(12,-16,13));camera=bpy.context.object;camera.rotation_euler=(Vector((0,0,.5))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=15;scene.camera=camera
scene.view_settings.view_transform='AgX'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/hospital.blend'))
print('EQUIPMENT_EXPORT_COMPLETE',str(OUT))
