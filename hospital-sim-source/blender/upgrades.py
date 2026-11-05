"""Original medical equipment packages, CC0; substantial AI assistance.
Run: Blender --background --python blender/upgrades.py
Room-local metres, Y-up exports, three independent component pivots per package.
No downloaded models, branding, or real patient imagery.
"""
import bpy,json,math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];CAT=json.loads((ROOT/'blender/upgrade_catalog.json').read_text())
ASSETS=ROOT/'dist/assets';bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.context.scene.unit_settings.system='METRIC'
M={};pieces=[]
for key,color,rough,metal in [('white',(.86,.91,.92),.46,0),('blue',(.025,.28,.45),.52,0),('metal',(.44,.52,.56),.34,.75),('fabric',(.13,.40,.43),.92,0),('linen',(.73,.83,.82),.97,0),('rubber',(.025,.037,.046),.87,0),('glass',(.008,.045,.062),.25,.1),('trace',(.13,.72,.65),.55,0)]:
 m=bpy.data.materials.new(key);m.use_nodes=True;m.diffuse_color=(*color,1);p=m.node_tree.nodes['Principled BSDF'];p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;M[key]=m
 if key=='trace':p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=.25

def xyz(p):return(p[0],-p[2],p[1])
def finish(o,name,mat,bevel=0):
 o.name=name;o.data.materials.append(M[mat]);pieces.append(o)
 if bevel:
  mod=o.modifiers.new('Manufactured edge radius','BEVEL');mod.width=bevel;mod.segments=3
  o.data.use_auto_smooth=True;o.modifiers.new('Weighted surface normals','WEIGHTED_NORMAL')
 return o

def box(n,p,d,mat='white',r=.018):
 bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(p));o=bpy.context.object;o.dimensions=(d[0],d[2],d[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return finish(o,n,mat,r)
def rod(n,a,b,r=.018,mat='metal'):
 a,b=Vector(xyz(a)),Vector(xyz(b));v=b-a;bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=r,depth=v.length,location=(a+b)/2);o=bpy.context.object;o.rotation_euler=v.to_track_quat('Z','Y').to_euler();return finish(o,n,mat)
def ball(n,p,r=.035,mat='metal'):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=6,radius=r,location=xyz(p));o=bpy.context.object
 for f in o.data.polygons:f.use_smooth=True
 return finish(o,n,mat)
def cable(n,points,r=.006,mat='rubber'):
 c=bpy.data.curves.new(n,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=1;s=c.splines.new('POLY');s.points.add(len(points)-1)
 for v,p in zip(s.points,points):v.co=(*xyz(p),1)
 o=bpy.data.objects.new(n,c);bpy.context.collection.objects.link(o);o.data.materials.append(M[mat]);pieces.append(o);return o

def casters():
 for x in [-.19,.19]:
  for z in [-.16,.16]:
   rod('Caster swivel',(x,.055,z),(x,.14,z),.018)
   bpy.ops.mesh.primitive_torus_add(major_segments=12,minor_segments=6,location=xyz((x,.055,z)),major_radius=.035,minor_radius=.013,rotation=(math.pi/2,0,0));finish(bpy.context.object,'Rubber caster','rubber')
def cart(drawers=True):
 casters();box('Lower shelf',(0,.18,0),(.46,.035,.39),'metal')
 for x in [-.21,.21]:
  for z in [-.17,.17]:rod('Rounded cart frame',(x,.13,z),(x,.83,z),.018)
 box('Satin working top',(0,.85,0),(.53,.05,.43),'blue',.025)
 if drawers:
  box('Drawer cabinet',(0,.48,0),(.40,.54,.34))
  for y in [.32,.48,.64]:box('Drawer front',(0,y,.181),(.36,.12,.018));rod('Drawer pull',(-.09,y,.21),(.09,y,.21),.009)
 rod('Push handle',(-.22,.96,-.17),(.22,.96,-.17),.014)
 for x in [-.22,.22]:rod('Handle upright',(x,.83,-.17),(x,.96,-.17),.014)

def display(h=1.42):
 box('Counterweighted base',(0,.035,0),(.49,.07,.35),'metal',.025);rod('Display mast',(0,.06,0),(0,h-.15,0),.031)
 rod('Swivel arm',(0,h-.15,0),(.05,h,.03),.022);ball('Monitor hinge',(.05,h,.03),.045)
 box('Medical display housing',(0,h,0),(.57,.36,.06),'white',.025);box('Screen glass',(0,h,.034),(.515,.30,.008),'glass',.009)
 for i in range(3):cable('Fictional signal',[(x*.024-.24,h-.095+i*.085+.018*math.sin(x*1.4+i),.042)for x in range(21)],.0025,'trace')
 cable('Protected display lead',[(0,h-.2,-.045),(.035,.6,-.035),(0,.12,-.04)],.006)

def make(shape):
 if shape in ['trolley','diagnostic','document','tablet']:
  cart()
  if shape=='trolley':
   box('Instrument tray',(0,.91,0),(.36,.07,.25),'metal',.018)
   for x in [-.1,0,.1]:rod('Original fictional instrument',(x,.965,-.06),(x,.965,.08),.007)
  elif shape=='diagnostic':
   box('Assessment device',(0,.98,-.02),(.28,.22,.23),'white',.03);box('Fictional status screen',(0,1.015,.102),(.20,.11,.008),'glass',.006)
   cable('Cuff lead',[(.1,.97,.05),(.23,.84,.14),(.16,.90,.16)],.008);box('Folded assessment cuff',(-.16,.91,.07),(.10,.06,.16),'rubber',.025)
  elif shape=='document':
   box('Fold-out work surface',(0,.91,0),(.55,.05,.42),'white',.025);box('Unbranded form',(0,.942,0),(.30,.007,.22),'linen',.002)
   for z in [-.06,0,.06]:rod('Fictional form rule',(-.1,.947,z),(.1,.947,z),.002,'blue')
  else:
   rod('Tablet swivel',(0,.88,-.08),(0,1.15,-.03),.02);box('Tilt console housing',(0,1.19,-.02),(.35,.26,.045),'white',.02);box('Fictional console screen',(0,1.19,.006),(.30,.21,.008),'glass',.006)
 elif shape=='cabinet':
  box('Raised cabinet base',(0,.055,0),(.49,.11,.40),'metal');box('Powder-coated storage',(0,.48,0),(.52,.78,.42),'white',.03)
  for x in [-.126,.126]:box('Flush door',(x,.48,.221),(.245,.69,.018));rod('Satin pull',(x,.45,.25),(x,.60,.25),.009)
  box('Rounded cabinet top',(0,.90,0),(.57,.055,.46),'blue',.025)
 elif shape=='plinth':
  box('Examination base',(0,.12,0),(.43,.18,1.45),'white',.04);rod('Height actuator',(0,.18,0),(0,.62,0),.063)
  box('Adjustable support',(0,.67,0),(.60,.10,1.90),'metal',.025);box('Upholstered examination surface',(0,.75,0),(.60,.12,1.85),'fabric',.055)
  box('Padded head section',(0,.84,-.70),(.57,.12,.42),'fabric',.045)
  for x in [-.31,.31]:rod('Foldable side rail',(x,.76,-.23),(x,.76,.25),.018)
 elif shape=='chair':
  box('Thick upholstered seat',(0,.48,0),(.52,.12,.49),'fabric',.045);box('Upholstered back',(0,.80,-.21),(.52,.55,.10),'fabric',.05)
  for x in [-.27,.27]:
   rod('Arm support',(x,.43,.12),(x,.67,.12),.021);box('Soft arm rest',(x,.70,0),(.07,.055,.38),'rubber',.023)
   for z in [-.18,.18]:rod('Chair leg',(x*.8,.04,z),(x*.8,.44,z),.023)
 elif shape=='lamp':
  box('Weighted light base',(0,.035,0),(.29,.07,.29),'metal',.025);rod('Task light upright',(0,.06,0),(0,1.40,0),.022)
  ball('Elbow hinge',(0,1.4,0),.045);rod('Articulated upper arm',(0,1.4,0),(-.25,1.68,.05),.018);ball('Wrist hinge',(-.25,1.68,.05),.035)
  box('Rounded LED housing',(-.30,1.65,.08),(.32,.065,.20),'white',.025);box('Low-glare diffuser',(-.30,1.61,.08),(.275,.012,.155),'linen',.018)
 elif shape=='screen':
  for z in [-.35,.35]:rod('Privacy frame',(0,.04,z),(0,1.55,z),.018);box('Stable screen foot',(0,.035,z),(.32,.07,.13),'metal')
  box('Matte acoustic panel',(0,.85,0),(.045,1.30,.75),'linen',.015)
  for z in [-.3,-.2,-.1,0,.1,.2,.3]:box('Fabric pleat',(.025,.85,z),(.018,1.24,.018),'fabric',.005)
 elif shape=='display':display()
 else:raise ValueError(shape)

for room,kits in CAT['rooms'].items():
 for kit in kits:
  col=bpy.data.collections.new(room+' level '+str(kit['level']));bpy.context.scene.collection.children.link(col)
  for item in kit['items']:
   pieces=[];make(item['shape']);root=bpy.data.objects.new(item['id'],None);bpy.context.collection.objects.link(root);root.location=xyz(item['position']);root.rotation_euler.z=item.get('rotation',0);root['license']='CC0-1.0';root['item']=item['name']
   # Apply bevels and merge each component by material, retaining its independent pivot.
   for o in pieces:
    if o.type=='CURVE':bpy.context.view_layer.objects.active=o;bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.ops.object.convert(target='MESH')
    bpy.context.view_layer.objects.active=o
    for mod in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
   merged=[]
   for mat in M.values():
    group=[o for o in pieces if o.type=='MESH'and o.data.materials[0]==mat]
    if not group:continue
    pieces=[o for o in pieces if o not in group]
    bpy.ops.object.select_all(action='DESELECT')
    for o in group:o.select_set(True)
    bpy.context.view_layer.objects.active=group[0]
    if len(group)>1:bpy.ops.object.join()
    ob=group[0];ob.parent=root;merged.append(ob)
   for o in [root,*merged]:
    for c in list(o.users_collection):c.objects.unlink(o)
    col.objects.link(o)
  print('BUILT_PACKAGE',room,kit['level'],flush=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/equipment_upgrades.blend'))
bpy.ops.export_scene.gltf(filepath=str(ASSETS/'equipment-upgrades.glb'),export_format='GLB',export_yup=True,export_apply=True,export_extras=True,export_animations=False)
(ROOT/'dist/upgrades.mjs').write_text('// Generated from blender/upgrade_catalog.json by blender/upgrades.py.\nexport const UPGRADE_CATALOG='+json.dumps(CAT,separators=(',',':'))+';\nexport const roomKits=type=>UPGRADE_CATALOG.rooms[UPGRADE_CATALOG.aliases[type]||type]||[];\n')
print('EXPORTED_ORIGINAL_UPGRADE_ASSETS',flush=True)
