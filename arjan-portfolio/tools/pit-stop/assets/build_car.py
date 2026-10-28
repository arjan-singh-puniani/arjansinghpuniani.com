"""Original SF-26 launch-reference study. Blender 4.0+, metres, editable source + two GLBs.
Run: Blender --background --factory-startup --python tools/pit-stop/assets/build_car.py
Photographs guide proportions only; no downloaded meshes, logos or photo textures are exported.
"""
import bpy, math, json, pathlib, hashlib
import numpy as np
from mathutils import Vector, Matrix
APP = pathlib.Path(__file__).resolve().parents[3]
OUT = APP/'public/pit-stop-lab/assets'
SOURCE = APP/'assets/pit-stop'
OUT.mkdir(parents=True, exist_ok=True); SOURCE.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
bpy.context.preferences.filepaths.save_version=0
scene=bpy.context.scene;scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
scene.render.engine='CYCLES';scene.cycles.samples=8;scene.cycles.device='CPU'

def material(name,color,metal=0,rough=.4,coat=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;p.inputs['Coat Weight'].default_value=coat;p.inputs['Coat Roughness'].default_value=.18
 return m
red=material('Rosso_reference_clearcoat',(.57,.009,.018),.16,.23,.85)
white=material('Ivory_white_clearcoat',(.82,.83,.80),.08,.26,.65)
carbon=material('Carbon_twill',(.024,.028,.032),.3,.35,.15)
rubber=material('Slick_rubber',(.012,.014,.016),0,.83)
metal=material('Machined_titanium',(.44,.48,.51),.95,.25)
rim=material('Dark_magnesium',(.055,.06,.067),.88,.26)
black=material('Intake_shadow',(.005,.007,.009),.1,.62);black.use_backface_culling=False
glass=material('Visor_glass',(.018,.055,.075),.65,.15,.7)
stripe=material('Tire_compound_mark',(.74,.60,.12),0,.67)
light=material('Rear_safety_LED',(.6,.005,.002),.1,.3);p=light.node_tree.nodes.get('Principled BSDF');p.inputs['Emission Color'].default_value=(1,.005,.001,1);p.inputs['Emission Strength'].default_value=2

# Bake the original procedural weave to a tangent normal map, not an image from the references.
bpy.ops.mesh.primitive_plane_add(size=2);plane=bpy.context.object;plane.name='Carbon_bake_plane'
proc=material('Original_procedural_weave',(.08,.08,.08),.3,.4);plane.data.materials.append(proc)
n=proc.node_tree.nodes;l=proc.node_tree.links;uv=n.new('ShaderNodeTexCoord');wave=n.new('ShaderNodeTexWave');wave.wave_type='BANDS';wave.bands_direction='X';wave.inputs['Scale'].default_value=8;l.new(uv.outputs['UV'],wave.inputs['Vector'])
wave2=n.new('ShaderNodeTexWave');wave2.bands_direction='Y';wave2.inputs['Scale'].default_value=8;l.new(uv.outputs['UV'],wave2.inputs['Vector']);mix=n.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1;l.new(wave.outputs['Color'],mix.inputs[1]);l.new(wave2.outputs['Color'],mix.inputs[2]);bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.22;bump.inputs['Distance'].default_value=.018;l.new(mix.outputs[0],bump.inputs['Height']);l.new(bump.outputs[0],n.get('Principled BSDF').inputs['Normal'])
image=bpy.data.images.new('carbon_twill_normal',512,512);image.colorspace_settings.name='Non-Color';target=n.new('ShaderNodeTexImage');target.image=image;n.active=target
bpy.ops.object.bake(type='NORMAL',normal_space='TANGENT',margin=8)
image.filepath_raw=str(OUT/'carbon-normal.png');image.file_format='PNG';image.save();bpy.data.objects.remove(plane,do_unlink=True)

def normal_map(mat,image,strength,scale):
 n=mat.node_tree.nodes;l=mat.node_tree.links;tex=n.new('ShaderNodeTexImage');tex.image=image;tex.extension='REPEAT';mapping=n.new('ShaderNodeMapping');mapping.inputs['Scale'].default_value=(scale,scale,scale);uv=n.new('ShaderNodeTexCoord');l.new(uv.outputs['UV'],mapping.inputs[0]);l.new(mapping.outputs[0],tex.inputs['Vector']);normal=n.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=strength;l.new(tex.outputs['Color'],normal.inputs['Color']);l.new(normal.outputs[0],n.get('Principled BSDF').inputs['Normal'])
normal_map(carbon,image,.12,25)
rng=np.random.default_rng(17);noise=rng.normal(0,1,(256,256));noise=(noise+np.roll(noise,1,0)+np.roll(noise,1,1))/3;dy,dx=np.gradient(noise);pixels=np.ones((256,256,4),dtype=np.float32);pixels[:,:,0]=.5+dx*.08;pixels[:,:,1]=.5+dy*.08;pixels[:,:,2]=.995
wear=bpy.data.images.new('Original_rubber_micro_normal',256,256);wear.colorspace_settings.name='Non-Color';wear.pixels.foreach_set(pixels.ravel());wear.filepath_raw=str(OUT/'rubber-normal.png');wear.file_format='PNG';wear.save();normal_map(rubber,wear,.12,8)

# Author in runtime X/right, Y/up, Z/aft; convert to Blender's Z/up at the boundary.
def co(v):return (v[0],-v[2],v[1])
def empty(name,parent=None,location=(0,0,0)):
 o=bpy.data.objects.new(name,None);scene.collection.objects.link(o);o.parent=parent;o.location=co(location);return o
root=empty('SF26_reference_study');root['asset_status']='Original visual recreation, not official Ferrari CAD';root['units']='metres';root['launch_reference']='2026-01-23'
body=empty('Bodywork',root)
objects=[]
def mesh(name,verts,faces,mat,parent=body,sub=0):
 data=bpy.data.meshes.new(name);data.from_pydata([co(v) for v in verts],[],faces);data.materials.append(mat);data.update();o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);o.parent=parent
 for p in data.polygons:p.use_smooth=True
 if sub:
  mod=o.modifiers.new('Editable_surface_subdivision','SUBSURF');mod.levels=sub;mod.render_levels=sub
 objects.append(o);return o

def loft(name,sections,mat,offset=0,sub=2,open_top=False,parent=body,open_front=False):
 # sections are z, center-x, width, floor-y, height; Catmull-Clark supplies longitudinal continuity.
 count=32 if name.startswith('Sidepod') else 24;verts=[];faces=[]
 for z,cx,w,bottom,h in sections:
  for i in range(count):
   a=2*math.pi*i/count;exponent=.5 if name.startswith('Sidepod') else .62 if name.startswith('Nose') else 1;ca=math.cos(a);sa=math.sin(a);verts.append((offset+cx+math.copysign(abs(ca)**exponent,ca)*w,bottom+(math.copysign(abs(sa)**exponent,sa)+1)*h/2,z))
 for j in range(len(sections)-1):
  for i in range(count):
   if open_top and -.56<=sections[j][0] and sections[j+1][0]<=.42 and 2<=i<=9:continue
   faces.append((j*count+i,j*count+(i+1)%count,(j+1)*count+(i+1)%count,(j+1)*count+i))
 if not open_front:faces.append(tuple(reversed(range(count))))
 faces.append(tuple((len(sections)-1)*count+i for i in range(count)))
 return mesh(name,verts,faces,mat,parent,sub)

def tube(name,points,radius,mat,parent=body):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=16;c.bevel_depth=radius;c.bevel_resolution=3;s=c.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
 for b,v in zip(s.bezier_points,points):b.co=co(v);b.handle_left_type='AUTO';b.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,c);scene.collection.objects.link(o);o.parent=parent;o.data.materials.append(mat);return o

def ellipsoid(name,pos,scale,mat,parent=body):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,location=co(pos));o=bpy.context.object;o.name=name;o.parent=parent;o.scale=(scale[0],scale[2],scale[1]);o.data.materials.append(mat)
 for p in o.data.polygons:p.use_smooth=True
 objects.append(o);return o

def lettering(name,text,pos,size,mat,right=(1,0,0),up=(0,1,0),parent=body):
 # Original workshop identifiers only; font outlines are embedded as geometry, not a runtime font.
 normal=Vector(right).cross(Vector(up));data=bpy.data.curves.new(name,'FONT');data.body=text;data.align_x='CENTER';data.size=size;data.resolution_u=3
 o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);o.parent=parent;o.location=co(pos);o.rotation_euler=Matrix((Vector(co(right)),Vector(co(up)),Vector(co(normal)))).transposed().to_euler();data.materials.append(mat);return o

def plate(name,points,thick,mat,parent=body,bevel=.008):
 axis=0 if max(v[0] for v in points)-min(v[0] for v in points)<1e-5 else 1
 verts=[]
 for offset in [-thick/2,thick/2]:
  for point in points:
   v=list(point);v[axis]+=offset;verts.append(tuple(v))
 n=len(points);faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)];o=mesh(name,verts,faces,mat,parent)
 if bevel:
  m=o.modifiers.new('Machined_edge_bevel','BEVEL');m.width=bevel;m.segments=3
  o.modifiers.new('Weighted_normals','WEIGHTED_NORMAL')
 return o

def foil(name,span,z0,chord,height,mat,dihedral=.025,sweep=.07,parent=body):
 verts=[];faces=[];rings=17;profile=40
 for j in range(rings):
  x=-span+2*span*j/(rings-1);out=abs(x)/span
  for i in range(profile):
   t=(1-math.cos(2*math.pi*i/profile))/2;sign=1 if i<profile/2 else -1
   thickness=5*.105*(.2969*math.sqrt(t)-.126*t-.3516*t*t+.2843*t**3-.1036*t**4)
   camber=.04*math.sin(math.pi*t)
   verts.append((x,height+dihedral*out**3+chord*(camber+sign*thickness),z0+sweep*out**2+chord*t))
 for j in range(rings-1):
  for i in range(profile):faces.append((j*profile+i,j*profile+(i+1)%profile,(j+1)*profile+(i+1)%profile,(j+1)*profile+i))
 faces.extend([tuple(reversed(range(profile))),tuple((rings-1)*profile+i for i in range(profile))]);return mesh(name,verts,faces,mat,parent)

# Nose with rounded rectangular shoulder, a genuinely open cockpit, sculpted sidepods and air intake.
loft('Nose', [(-2.525,0,.012,.285,.018),(-2.51,0,.06,.265,.060),(-2.49,0,.10,.25,.10),(-2.46,0,.115,.25,.10),(-2.05,0,.145,.27,.15),(-1.60,0,.16,.29,.21),(-1.05,0,.23,.29,.29),(-.65,0,.275,.27,.36),(-.57,0,.28,.27,.36)],red)
loft('Cockpit_survival_cell',[(-.61,0,.27,.23,.39),(-.55,0,.28,.22,.40),(-.42,0,.28,.22,.41),(.25,0,.28,.22,.40),(.41,0,.27,.22,.43),(.48,0,.26,.23,.45)],white,open_top=True)
engine=loft('Engine_cover',[(.37,0,.24,.25,.58),(.46,0,.25,.24,.65),(.64,0,.235,.22,.66),(1.0,0,.19,.21,.58),(1.45,0,.14,.24,.39),(1.87,0,.07,.28,.18),(2.0,0,.045,.30,.10)],red)
# Paint regions share one continuous mesh: overlapping white shells cause z-fighting in close-ups.
engine.data.materials.append(white)
for face in engine.data.polygons:
 face.material_index=1
for side in [-1,1]:
 sections=[(-.708,side*.55,.235,.34,.30),(-.58,side*.55,.24,.25,.39),(-.24,side*.54,.245,.19,.46),(.30,side*.52,.25,.18,.43),(.83,side*.43,.24,.20,.36),(1.33,side*.30,.15,.24,.23),(1.64,side*.18,.08,.27,.14)]
 loft(f'Sidepod_{side}',sections,red,open_front=True)
 # Hollow, asymmetric inlet rings with visible depth and a black throat.
 ring=[]
 for i in range(33):
  a=2*math.pi*i/32;ca=math.cos(a);sa=math.sin(a);ring.append((side*(.55+math.copysign(abs(ca)**.50,ca)*.235),.49+math.copysign(abs(sa)**.5,sa)*.15,-.708))
 tube(f'Intake_lip_{side}',ring,.016,red)
 loft(f'Sidepod_inner_{side}',[(z,cx,w*.90,bottom+h*.05,h*.90) for z,cx,w,bottom,h in sections[:3]],black,open_front=True)
 tube(f'Sidepod_lower_shadow_{side}',[(side*.72,.24,-.2),(side*.72,.23,.3),(side*.57,.25,1.0),(side*.26,.3,1.65)],.012,carbon)
 for i in range(7):
  z=.52+i*.067;tube(f'Cooling_louvre_{side}_{i}',[(side*.29,.65-i*.012,z),(side*.44,.64-i*.012,z+.025)],.009,black)
 tube(f'Mirror_stalk_{side}',[(side*.40,.58,-.54),(side*.67,.64,-.60),(side*.76,.65,-.59)],.012,carbon)
 ellipsoid(f'Mirror_{side}',(side*.76,.66,-.59),(.105,.035,.048),red)
 ellipsoid(f'Mirror_glass_{side}',(side*.76,.658,-.552),(.083,.025,.008),glass)
 # Small service marks establish scale without borrowing sponsor graphics.
 for z in [-.12,.32,.77]:
  ellipsoid(f'Sidepod_fastener_{side}_{z}',(side*(.782 if z<.5 else .67),.44,z),(.0025,.006,.006),metal)
 tube(f'Body_panel_seam_{side}',[(side*.73,.33,-.40),(side*.766,.36,-.13),(side*.76,.35,.25),(side*.64,.34,.75)],.0018,black)
lettering('Nose_identifier','01',(0,.487,-1.61),.11,white,right=(1,0,0),up=(0,0,1))
# Cockpit interior, seat, steering wheel and harness remain separate inspectable components.
ellipsoid('Cockpit_inner',(0,.46,-.02),(.235,.12,.39),black)
ellipsoid('Seat',(0,.46,.15),(.19,.10,.25),carbon)
tube('Steering_rim',[(-.125,.57,-.33),(-.11,.63,-.35),(.11,.63,-.35),(.125,.57,-.33),(-.125,.57,-.33)],.015,carbon)
for side in [-1,1]:tube(f'Harness_{side}',[(side*.08,.57,.25),(side*.09,.48,-.01),(side*.13,.45,-.15)],.012,stripe)
tube('Halo_hoop',[(-.33,.73,.43),(-.35,.78,.03),(-.28,.80,-.42),(0,.83,-.66),(.28,.80,-.42),(.35,.78,.03),(.33,.73,.43)],.025,carbon)
tube('Halo_center_pylon',[(0,.60,-.62),(0,.72,-.63),(0,.83,-.66)],.016,carbon)
ring=[(-.11,.78,.30),(-.12,.84,.30),(-.055,1.02,.30),(.055,1.02,.30),(.12,.84,.30),(.11,.78,.30),(-.11,.78,.30)]
tube('Airbox_lip',ring,.014,white);mesh('Airbox_throat',[(x,y,z+.025) for x,y,z in ring[:-1]],[tuple(range(6))],black)
plate('Engine_shark_fin',[(0,.84,.63),(0,1.01,.72),(0,.83,1.27),(0,.61,1.85)],.016,white,bevel=.004)
# Shaped carbon floor and diffuser, with swept edges rather than rectangular slabs.
floor=[(-.36,.125,-1.28),(-.59,.125,-.95),(-.78,.125,-.55),(-.81,.125,.45),(-.70,.125,1.18),(-.44,.24,2.03),(.44,.24,2.03),(.70,.125,1.18),(.81,.125,.45),(.78,.125,-.55),(.59,.125,-.95),(.36,.125,-1.28)]
plate('Floor',floor,.025,carbon)
for side in [-1,1]:tube(f'Floor_edge_{side}',[(side*.60,.14,-1.0),(side*.78,.15,-.45),(side*.80,.15,.50),(side*.68,.15,1.2),(side*.46,.26,2.0)],.012,carbon)
for x in [-.32,-.16,0,.16,.32]:plate(f'Diffuser_strake_{x}',[(x,.12,1.25),(x,.16,1.3),(x,.40,2.08),(x,.24,2.08)],.012,carbon,bevel=.003)
for i,(z,ch,h) in enumerate([(-2.65,.40,.13),(-2.48,.27,.19),(-2.30,.24,.25)]):foil(f'Front_wing_{i}',.90,z,ch,h,carbon,dihedral=.055,sweep=.09)
for side in [-1,1]:
 # Endplate vertical silhouette is a curved polyline surface with beveled edges.
 points=[(side*.905,.11,-2.56),(side*.905,.15,-2.65),(side*.905,.30,-2.55),(side*.905,.38,-2.13),(side*.905,.18,-1.98)]
 o=plate(f'Front_endplate_{side}',points,.014,carbon);o.modifiers['Machined_edge_bevel'].width=.012
 tube(f'Front_wing_pylon_{side}',[(side*.075,.28,-2.25),(side*.09,.19,-2.32),(side*.13,.15,-2.35)],.018,carbon)
 for axle,z,track in [('F',-1.65,.80),('R',1.65,.7625)]:
  for level,y in [('upper',.49),('lower',.27)]:
   for direction in [-1,1]:tube(f'{axle}_{level}_{side}_{direction}',[(side*.22,y,z+direction*.32),(side*(track-.11),.355,z)],.012 if level=='upper' else .015,carbon)
  tube(f'{axle}_pushrod_{side}',[(side*.20,.65,z+.30),(side*(track-.10),.27,z)],.014,carbon)
  tube(f'{axle}_steering_{side}',[(side*.20,.36,z-.10),(side*(track-.11),.35,z-.08)],.008,metal)
for i,(z,ch,h) in enumerate([(1.90,.43,.90),(2.03,.34,1.00),(2.17,.22,1.08)]):foil(f'Rear_wing_{i}',.61,z,ch,h,carbon,dihedral=.015,sweep=0)
for side in [-1,1]:
 plate(f'Rear_endplate_{side}',[(side*.62,.88,1.86),(side*.62,1.12,1.95),(side*.62,1.14,2.4),(side*.62,.90,2.4)],.014,carbon,bevel=.006)
 tube(f'Rear_swan_neck_{side}',[(side*.16,.39,1.57),(side*.19,.57,1.90),(side*.20,.89,2.10)],.016,carbon)
ellipsoid('Rain_light',(0,.34,2.12),(.045,.045,.018),light)

# Revolved wheel profiles around the actual axle; captive nuts are children of each wheel.
def lathe(name,profile,mat,parent,segments=96):
 verts=[];faces=[]
 for x,r in profile:
  for i in range(segments):a=2*math.pi*i/segments;verts.append((x,math.cos(a)*r,math.sin(a)*r))
 for j in range(len(profile)-1):
  for i in range(segments):faces.append((j*segments+i,(j+1)*segments+i,(j+1)*segments+(i+1)%segments,j*segments+(i+1)%segments))
 return mesh(name,verts,faces,mat,parent)
for corner,x,z,width in [('FL',.8,-1.65,.28),('FR',-.8,-1.65,.28),('RL',.7625,1.65,.375),('RR',-.7625,1.65,.375)]:
 w=empty('Wheel_'+corner,root,(x,.355,z));half=width/2
 lathe('Tire_'+corner,[(-half,.233),(-half-.002,.274),(-half*.94,.32),(-half*.79,.343),(-half*.55,.353),(0,.355),(half*.55,.353),(half*.79,.343),(half*.94,.32),(half+.002,.274),(half,.233)],rubber,w)
 lathe('Rim_'+corner,[(-half,.215),(-half,.233),(-half+.014,.236),(-half+.035,.224),(half-.035,.224),(half-.014,.236),(half,.233),(half,.215)],rim,w)
 lathe('Bead_'+corner,[(-half-.002,.231),(-half-.004,.235),(half+.004,.235),(half+.002,.231)],metal,w)
 for outer in [-1,1]:
  lathe(f'Sidewall_mark_{corner}_{outer}',[(outer*(half+.003),.287),(outer*(half+.003),.291)],stripe,w)
  lettering(f'Tire_stencil_{corner}_{outer}','SLICK',(outer*(half+.004),.303,0),.035,stripe,right=(0,0,-outer),parent=w)
  lettering(f'Tire_size_{corner}_{outer}','18 / DRY',(outer*(half+.005),-.326,0),.026,stripe,right=(0,0,-outer),parent=w)
  for i in range(10):
   a=i*2*math.pi/10
   points=[(outer*(half-.02),math.cos(a)*.06,math.sin(a)*.06),(outer*(half-.03),math.cos(a+.08)*.19,math.sin(a+.08)*.19)]
   tube(f'Spoke_{corner}_{outer}_{i}',points,.010,rim,w)
 lathe('Captive_nut_'+corner,[(-half-.013,.023),(-half-.013,.043),(half+.013,.043),(half+.013,.023)],metal,w,segments=6)
 # Brake assemblies stay on the body when the wheel is removed.
 brake=empty('Brake_'+corner,body,(x-(.13 if x>0 else -.13),.355,z))
 lathe('Carbon_disc_'+corner,[(-.025,.075),(-.025,.20),(.025,.20),(.025,.075)],carbon,brake,64)
 for a in range(12):
  angle=a*math.pi/6;tube(f'Disc_slot_{corner}_{a}',[(.027,math.cos(angle)*.13,math.sin(angle)*.13),(.027,math.cos(angle+.12)*.18,math.sin(angle+.12)*.18)],.003,black,brake)
 ellipsoid('Caliper_'+corner,(0,0,0),(.065,.10,.06),metal,brake).location=co((0,.03,.16))

# Convert curves; author UVs and keep subdivision editable in the .blend source.
bpy.ops.object.select_all(action='DESELECT')
for o in list(scene.objects):
 if o.type in ['CURVE','FONT']:
  o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH');o.select_set(False)
for o in list(scene.objects):
 if o.type!='MESH':continue
 bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=1.15,island_margin=.015);bpy.ops.object.mode_set(mode='OBJECT');o.select_set(False)
 for p in o.data.polygons:p.use_smooth=not any(m.type=='BEVEL' for m in o.modifiers)
# Group parts with the same functional root/material to reduce draw calls while retaining service roots.
for parent in [body]+[o for o in scene.objects if o.name.startswith(('Wheel_','Brake_'))]:
 candidates=[o for o in scene.objects if o.type=='MESH' and o.parent==parent and not o.modifiers]
 groups={}
 for o in candidates:
  functional='Front_wing' if o.name.startswith(('Front_wing','Front_endplate')) else 'Rear_wing' if o.name.startswith(('Rear_wing','Rear_endplate','Rear_swan')) else 'Halo' if o.name.startswith('Halo') else 'Suspension' if o.name.startswith(('F_upper','F_lower','R_upper','R_lower','F_pushrod','R_pushrod','F_steering','R_steering')) else 'Floor' if o.name.startswith(('Floor','Diffuser')) else 'Cockpit' if o.name.startswith(('Steering','Seat','Harness','Cockpit_inner')) else 'Intake' if o.name.startswith(('Intake','Airbox','Cooling')) else 'Trim'
  key=(functional,o.data.materials[0].name);groups.setdefault(key,[]).append(o)
 for key,group in groups.items():
  if len(group)<2:continue
  bpy.ops.object.select_all(action='DESELECT')
  for o in group:o.select_set(True)
  bpy.context.view_layer.objects.active=group[0];bpy.ops.object.join();group[0].name=f'{parent.name}_{key[0]}_{key[1]}'
# The main body sections retain named surface objects and their editable Subdivision modifiers.
for img in [image,wear]:img.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'sf26-reference.blend'))

def export(name):
 bpy.ops.object.select_all(action='SELECT')
 bpy.ops.export_scene.gltf(filepath=str(OUT/name),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_texcoords=True,export_normals=True,export_tangents=True,export_materials='EXPORT',export_extras=True,export_cameras=False,export_lights=False)
export('sf26-primary.glb')
for o in scene.objects:
 for mod in o.modifiers:
  if mod.type=='SUBSURF':mod.levels=2 if o.name=='Cockpit_survival_cell' else 1;mod.render_levels=mod.levels
export('sf26-runtime.glb')
manifest={'name':'SF-26 launch-reference study','authoring':'Original geometry and baked materials created in Blender 4.0.2','official':False,'rights':'No Ferrari shield, sponsor marks, commercial-game meshes or photographic textures included. Ferrari naming/likeness requires publisher review; this is not official CAD.','reference':'https://www.formula1.com/en/latest/article/gallery-check-out-every-angle-of-ferraris-2026-f1-car.7HdOPtJJwN5VHJ8XAWVtuS.7HdOPtJJwN5VHJ8XAWVtuS','units':'metres','estimated_wheelbase':3.3,'centers':{'FL':[.8,.355,-1.65],'FR':[-.8,.355,-1.65],'RL':[.7625,.355,1.65],'RR':[-.7625,.355,1.65]},'files':{}}
manifest['lettering']='Bundled Blender Bfont outlines converted to service/tire mesh lettering. Bitstream Vera / Arev notices in BFONT-LICENSE.txt; DejaVu changes public domain.'
for p in OUT.iterdir():
 if p.suffix in ['.glb','.png']:manifest['files'][p.name]={'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
(OUT/'provenance.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('PIT_ASSET_EXPORT_COMPLETE',json.dumps(manifest['files']))
