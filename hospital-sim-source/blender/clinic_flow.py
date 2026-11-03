"""Original clinic rooms and everyday wardrobes, CC0; substantial AI assistance.
Blender4.0: blender -b --python blender/clinic_flow.py
Source stations: dist/clinic.mjs (emit CLINIC_DEPARTMENTS to clinic-stations.json first).
Metres, canonical39-joint rigs, embedded palettes, no third-party models.
"""
import bpy,math,json,importlib.util,sys,hashlib
from pathlib import Path
from mathutils import Vector
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1];ASSETS=ROOT/'dist/assets';REPORT=ROOT/'evidence/clinic-flow-assets';REPORT.mkdir(parents=True,exist_ok=True)
def module(name,path):
 spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
human=module('clinic_humans',ROOT/'blender/characters.py')
roles=module('clinic_roles',ROOT/'blender/staff_roles.py')
def clear():
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def recolor(mat,c):
 mat.diffuse_color=(*c,1);mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(*c,1)
def character_export(arm,mesh,name):
 for suffix,ratio in [('',1),('-lod',.32)]:
  ob=human.export_mesh(mesh,ratio);bpy.ops.object.select_all(action='DESELECT');arm.select_set(True);ob.select_set(True);bpy.context.view_layer.objects.active=arm
  bpy.ops.export_scene.gltf(filepath=str(ASSETS/(name+suffix+'.glb')),export_format='GLB',use_selection=True,export_animations=False,export_skins=True,export_yup=True,export_extras=True,export_colors=True)
  data=ob.data;bpy.data.objects.remove(ob,do_unlink=True);bpy.data.meshes.remove(data)
def wardrobes():
 clear();human.animate=lambda *args:None
 original_box=human.box
 def casual_box(name,*args,**kwargs):
  if name in ['Name badge','Badge stripe']:return None
  return original_box(name,*args,**kwargs)
 human.box=casual_box
 colors=[(.48,.19,.11),(.18,.34,.45),(.35,.31,.12),(.38,.19,.34),(.16,.32,.27),(.67,.44,.25),(.22,.28,.46),(.54,.30,.32),(.32,.36,.24),(.22,.40,.42),(.49,.39,.28)]
 for i,profile in enumerate(human.PATIENT_PROFILES):
  p={**profile,'gown':colors[i]};arm,mesh=human.character('clinician',p);arm.name='casual-'+profile['id'];mesh.name=arm.name+'_skin';arm['license']='CC0-1.0'
  denim=human.material('Everyday denim '+profile['id'],(.045+i%3*.025,.08+i%2*.025,.13+i%3*.025),.91);mesh.data.materials.append(denim);slot=len(mesh.data.materials)-1
  for face in mesh.data.polygons:
   if ' · fabric'in mesh.data.materials[face.material_index].name and max(mesh.data.vertices[v].co.z for v in face.vertices)<1.0:face.material_index=slot
  character_export(arm,mesh,arm.name)
  col=bpy.data.collections.new(arm.name);bpy.context.scene.collection.children.link(col)
  for ob in [arm,mesh]:
   for c in list(ob.users_collection):c.objects.unlink(ob)
   col.objects.link(ob)
  col.hide_render=i!=0;col.hide_viewport=i!=0
  print('CASUAL_EXPORTED',arm.name,flush=True)
 human.box=original_box
 roles.GLYPHS['T']=[[(0,1),(1,1)],[(.5,1),(.5,0)]]
 roles.GLYPHS['G']=[[(1,.85),(.8,1),(.2,1),(0,.8),(0,.2),(.2,0),(1,0),(1,.5),(.55,.5)]]
 configs=[('pharmacist','coat','RX',(.10,.32,.24)),('neurologist','coat','NEU',(.23,.13,.37)),('physio','clinician','PT',(.045,.33,.39)),('neurotech','clinician','EEG',(.08,.20,.40))]
 roles.m.animate=lambda *args:None
 for key,base,code,color in configs:
  role=dict(id=key,base=base,code=code,top=color,pants=(.035,.065,.09),accent=color,hem=.88)
  arm,mesh=roles.m.character(base);roles.recolor(mesh,role);roles.m.PARTS=[];roles.accessories(role)
  bpy.ops.object.select_all(action='DESELECT');mesh.select_set(True)
  for ob in roles.m.PARTS:ob.select_set(True)
  bpy.context.view_layer.objects.active=mesh;bpy.ops.object.join();arm.name='staff-'+key;mesh.name=arm.name+'_skin';character_export(arm,mesh,arm.name)
  print('CLINIC_STAFF_EXPORTED',key,flush=True)
 bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/clinic_wardrobes.blend'))

def material(name,c,rough=.55,metal=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*c,1);p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;return m
parts=[];M={}
def pos(p):return(p[0],-p[2],p[1])
def finish(o,n,mat,bevel=0):
 o.name=n;o.data.materials.append(M[mat]);parts.append(o)
 if bevel:
  mod=o.modifiers.new('Soft manufactured edges','BEVEL');mod.width=bevel;mod.segments=2;o.data.use_auto_smooth=True;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 return o
def box(n,p,size,mat='white',bevel=.018):
 bpy.ops.mesh.primitive_cube_add(size=1,location=pos(p));o=bpy.context.object;o.dimensions=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return finish(o,n,mat,bevel)
def rod(n,a,b,r=.018,mat='metal'):
 a,b=Vector(pos(a)),Vector(pos(b));d=b-a;bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=r,depth=d.length,location=(a+b)/2);o=bpy.context.object;o.rotation_euler=d.to_track_quat('Z','Y').to_euler();return finish(o,n,mat)
def ball(n,p,scale,mat='blue'):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,location=pos(p));o=bpy.context.object;o.scale=(scale[0],scale[2],scale[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 for f in o.data.polygons:f.use_smooth=True
 return finish(o,n,mat)
def curve(n,points,r=.008,mat='rubber'):
 c=bpy.data.curves.new(n,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=1;s=c.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
 for v,p in zip(s.bezier_points,points):v.co=pos(p);v.handle_left_type='AUTO';v.handle_right_type='AUTO'
 o=bpy.data.objects.new(n,c);bpy.context.collection.objects.link(o);o.data.materials.append(M[mat]);parts.append(o);return o
def monitor(n,x,z,h=.77):
 box(n+' monitor housing',(x,h+.27,z),(.48,.32,.045),'white',.018);box(n+' fictional display',(x,h+.27,z-.025),(.426,.265,.006),'screen',.006)
 rod(n+' swivel post',(x,h,z),(x,h+.20,z),.025);box(n+' monitor base',(x,h+.016,z),(.28,.025,.18),'metal')
 box(n+' keyboard',(x,h+.018,z-.23),(.39,.022,.13),'dark',.006)
 for i in range(3):curve(n+' fictional trace'+str(i),[(x-.19+j*.019,h+.21+i*.065+.014*math.sin(j*1.2+i),z-.030)for j in range(21)],.002,'cyan')
def chair(n,x,z,facing=1):
 box(n+' cushion',(x,.48,z),(.48,.095,.45),'fabric',.045);box(n+' back',(x,.77,z-facing*.21),(.47,.50,.075),'fabric',.04)
 for sx in [-.18,.18]:
  for sz in [-.15,.15]:rod(n+' leg',(x+sx,.04,z+sz),(x+sx,.45,z+sz),.021)
def desk(type):
 box('Rounded consultation desk',(0,.75,0),(1.5,.09,.64),'white',.045)
 for x in [-.62,.62]:
  for z in [-.24,.24]:rod('Desk support',(x,.04,z),(x,.71,z),.024)
 monitor('Physician',-.44,-.13)
 chair('PhysicianChair',0,-.85,1);chair('VisitorChair',0,.95,-1)
 box('Paper notes',(.40,.805,.12),(.26,.012,.20),'linen',.003)
 if type=='neuro':
  box('Anatomy display cabinet',(1.14,.46,-1.08),(.65,.92,.66),'white');ball('Original fictional brain model',(1.14,1.01,-1.08),(.20,.15,.16),'peach')
  for x in [-.09,.02,.10]:curve('Sculpted anatomical groove',[(1.14+x,.99,-1.20),(1.14+x+.03,1.12,-1.07),(1.14+x,1.0,-.96)],.006,'blue')
 else:box('Low storage cabinet',(1.15,.38,-1.12),(.68,.76,.52),'white')
def changing_nook():
 box('Changing area screen',(.64,.79,.77),(.035,1.55,.77),'linen',.02)
 for z in [.38,1.16]:rod('Changing screen upright',(.64,.03,z),(.64,1.62,z),.021);box('Changing screen foot',(.64,.035,z),(.34,.06,.16),'metal')
 for z in [.45,.55,.65,.75,.85,.95,1.05]:box('Fabric screen fold',(.61,.79,z),(.025,1.45,.025),'fabric',.008)
def counter(type):
 box('Accessible reception counter',(0,.44,0),(1.95,.88,.63),'white',.04);box('Satin counter top',(0,.92,0),(2.02,.08,.69),'blue',.03);monitor('Admin'if type=='reception'else'Pharmacy',-.42,-.1,.96)
 box('Document tray',(.50,1.0,.08),(.29,.06,.23),'pale');box('Fictional order form',(.50,1.04,.08),(.25,.008,.18),'linen',.002)
 if type=='reception':changing_nook()
 else:
  box('Pharmacy cabinetry',(0,.80,-1.4),(2.8,1.6,.28),'white',.035)
  for y in [.36,.79,1.22]:
   box('Shelf lip',(0,y,-1.20),(2.75,.035,.12),'metal')
   for i in range(10):box('Fictional unbranded supply '+str(i),(i*.25-1.12,y+.14,-1.26),(.15,.25,.13),'peach'if i%3==0 else'pale',.01)
  box('Collection bag',(.51,1.11,.03),(.21,.22,.12),'linen',.014)
def bed(type):
 box('Clinical bed pedestal',(0,.34,0),(.64,.65,1.15),'white',.06);box('Adjustable bed frame',(0,.77,0),(1.0,.12,2.3),'metal',.04);box('Mattress',(0,.875,0),(.92,.13,2.20),'fabric',.065);box('Pillow',(0,.98,-.78),(.63,.11,.43),'linen',.07)
 for x in [-.53,.53]:
  for z in [-.55,.55]:rod('Side rail post',(x,.79,z),(x,1.08,z),.022)
  rod('Safety rail',(x,1.08,-.58),(x,1.08,.58),.027)
 box('Monitoring console',(-1.20,.62,-.85),(.55,.12,.45),'white');rod('Console support',(-1.20,.02,-.85),(-1.20,.62,-.85),.038);monitor('Recording',-1.20,-.85,.72)
 for i in range(3):curve('Equipment cable',[(0,.85,-.90),(-.65,.9,-1.10),(-1.18,.60,-.90-i*.04)],.006,'rubber')
 if type=='sleep':
  box('Sleep privacy panel',(.77,.9,-1.28),(1.7,1.8,.035),'linen');rod('Warm task light mast',(1.28,.03,-.72),(1.28,1.80,-.72),.024);box('Warm task light',(1.08,1.81,-.72),(.40,.055,.23),'light',.03)
 else:
  root=bpy.data.objects.new('EEGCapRoot',None);bpy.context.collection.objects.link(root)
  before=len(parts)
  for angle in [0,math.pi/3,2*math.pi/3]:
   points=[]
   for i in range(13):
    a=math.pi*i/12;points.append((math.cos(a)*.085*math.cos(angle),.025+math.sin(a)*.095,math.cos(a)*.085*math.sin(angle)))
   curve('EEGCap band',points,.006,'linen')
  for i in range(8):a=i*math.pi/4;ball('EEGCap sensor',(math.cos(a)*.071,.075,math.sin(a)*.071),(.014,.014,.014),'blue')
  for o in parts[before:]:o.parent=root
def gait():
 box('Gait measurement track',(0,.012,0),(1.12,.025,2.7),'pale',.025)
 for z in [-1.15,-.6,0,.6,1.15]:box('Track distance stripe',(0,.028,z),(1.05,.006,.025),'white',.002)
 for x in [-.62,.62]:
  for z in [-1.15,1.15]:rod('Parallel rail support',(x,.02,z),(x,.95,z),.025)
  rod('Parallel handrail',(x,.95,-1.28),(x,.95,1.28),.03)
 for x,z in [(1.22,-1.20),(1.22,1.20)]:rod('Optical camera tripod',(x,.02,z),(x,1.18,z),.018);box('Original optical camera',(x,1.24,z),(.13,.12,.18),'dark',.015);ball('Glass camera lens',(x-.08,1.24,z),(.025,.035,.035),'screen')
 box('Gait workstation',(-1.15,.74,-1.05),(.62,.10,.46),'white');rod('Gait workstation column',(-1.15,.03,-1.05),(-1.15,.74,-1.05),.035);monitor('Gait',-1.15,-1.05,.78)
def equipment():
 global parts,M
 clear();M={k:material(*v)for k,v in {'white':('Powder-coated medical housing',(.86,.91,.91),.48),'blue':('Satin equipment blue',(.025,.30,.48),.46),'pale':('Pale medical polymer',(.51,.73,.78),.62),'metal':('Brushed structural aluminium',(.47,.55,.59),.35,.72),'dark':('Rubber and screen bezel',(.025,.045,.055),.76),'rubber':('Flexible rubber cable',(.035,.045,.049),.9),'fabric':('Matte upholstery',(.35,.56,.57),.92),'linen':('Matte clinic linen',(.81,.86,.81),.94),'screen':('Diagnostic glass · fictional',(.008,.045,.06),.3),'cyan':('Fictional display trace',(.16,.58,.59),.55),'peach':('Restrained supply accent',(.63,.37,.23),.7),'light':('Warm task diffuser',(.95,.90,.70),.6)}.items()}
 stations=json.loads((ASSETS/'clinic-stations.json').read_text())
 for key,d in stations.items():
  parts=[];col=bpy.data.collections.new('Clinic '+key);bpy.context.scene.collection.children.link(col)
  if key in ['gp','neuro']:desk(key)
  elif key in ['intake','pharmacy']:counter('reception'if key=='intake'else key)
  elif key=='gait':gait()
  else:bed(key)
  # Retain station markers to verify props and browser poses share coordinates.
  for name,p in [('PatientStation',d['patient']),('StaffStation',d['staffPost'])]:o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=pos(p);parts.append(o)
  roots=[o for o in parts if not o.parent];roots += [o for o in bpy.context.scene.objects if o.name.startswith('EEGCapRoot')and o.name not in {q.name for q in roots}and not o.users_collection==[col]]if key=='eeg'else[]
  for o in parts+[o for o in roots if o not in parts]:
   for old in list(o.users_collection):old.objects.unlink(o)
   col.objects.link(o)
  bpy.ops.object.select_all(action='DESELECT')
  for o in col.objects:o.select_set(True)
  # Apply bevels and combine static pieces by material, keeping the cap separate.
  for o in list(col.objects):
   if o.type=='CURVE':bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
  for mat in M.values():
   group=[o for o in col.objects if o.type=='MESH'and not o.parent and o.data.materials and o.data.materials[0]==mat]
   if group:
    bpy.ops.object.select_all(action='DESELECT')
    for o in group:
     o.select_set(True);bpy.context.view_layer.objects.active=o
     for mod in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.context.view_layer.objects.active=group[0];bpy.ops.object.join()
  bpy.ops.object.select_all(action='DESELECT')
  for o in col.objects:o.select_set(True)
  bpy.ops.export_scene.gltf(filepath=str(ASSETS/(d['asset']+'.glb')),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_extras=True)
  col.hide_render=True;col.hide_viewport=True;print('CLINIC_ROOM_EXPORTED',key,flush=True)
 bpy.context.scene.unit_settings.system='METRIC';bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/clinic_equipment.blend'))

wardrobes();equipment()
manifest=json.loads((ASSETS/'patient-appearances.json').read_text())
for a in manifest['appearances']:a['casual']='casual-'+a['id']+'-lod.glb';a['casualHigh']='casual-'+a['id']+'.glb'
(ASSETS/'patient-appearances.json').write_text(json.dumps(manifest,indent=2)+'\n')
files=list(ASSETS.glob('casual-*.glb'))+[ASSETS/(v['asset']+'.glb')for v in json.loads((ASSETS/'clinic-stations.json').read_text()).values()]
files += [ASSETS/('staff-'+r+s+'.glb')for r in ['pharmacist','neurologist','physio','neurotech']for s in ['','-lod']]
(REPORT/'exports.json').write_text(json.dumps({'blender':bpy.app.version_string,'license':'CC0-1.0','files':[{ 'file':f.name,'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()}for f in files]},indent=2)+'\n')
