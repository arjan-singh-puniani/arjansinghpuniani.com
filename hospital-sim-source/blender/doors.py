"""Original hospital doorway/vestibule; metres, editable sliding panels, CC0."""
import bpy,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
s=bpy.context.scene;s.unit_settings.system='METRIC'
def mat(name,color,roughness,metallic=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=roughness;p.inputs['Metallic'].default_value=metallic;return m
ivory=mat('Powder coated warm white',(.80,.85,.84),.58);blue=mat('Cerulean structural edge',(.035,.28,.43),.48);metal=mat('Brushed door hardware',(.55,.64,.67),.32,.72);glass=mat('Frosted pale blue glass',(.39,.68,.73),.26);dark=mat('Interior shade',(.09,.18,.21),.92)
def box(name,loc,size,m,r=.025):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m);o.data.use_auto_smooth=True;b=o.modifiers.new('Soft manufactured edges','BEVEL');b.width=r;b.segments=3;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');return o
# Browser +Z faces outside, Blender -Y.
box('Vestibule landing',(0,-.65,-.045),(1.72,1.6,.09),blue)
box('Overhanging canopy',(0,-.53,2.26),(1.94,.80,.16),ivory,.045)
box('Canopy blue fascia',(0,-.06,2.24),(1.96,.10,.19),blue)
for sign in [-1,1]:
 box('Vestibule side wall',(sign*.86,-.43,1.08),(.12,.55,2.16),ivory)
 box('Door jamb',(sign*.83,-.43,1.05),(.095,.18,2.10),metal,.012)
 box('Door glass '+('L' if sign<0 else 'R'),(sign*.38,-.43,1.05),(.72,.045,1.94),glass,.012)
 # Hardware is parented so sliders remain coherent.
 panel=bpy.context.object
 rail=box('Vertical door handle',(sign*.08,-.385,1.04),(.028,.036,.49),metal,.009);rail.parent=panel;rail.matrix_parent_inverse=panel.matrix_world.inverted()
box('Door track',(0,-.43,2.10),(1.75,.18,.09),metal,.01)
box('Threshold',(0,-.43,.014),(1.66,.24,.028),metal,.008)
box('Entry light',(0,-.315,2.11),(.36,.025,.025),glass,.006)
box('Sign backing',(0,-.02,2.30),(1.22,.065,.34),ivory,.02)
for x,size in [(0,(.22,.018,.055)),(0,(.055,.018,.22))]:box('Care cross',(x,.02,2.30),size,blue,.006)
s['provenance']='Original procedural doorway; substantial AI assistance; CC0-1.0'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/doors.blend'),compress=True)
# Consolidate stationary materials; leave sliding panels and their handles separate.
static=[o for o in bpy.context.scene.objects if o.type=='MESH' and not o.name.startswith(('Door glass','Vertical door handle'))]
groups=[(m,[o for o in static if o.data.materials[0]==m])for m in [ivory,blue,metal,glass]]
for m,group in groups:
 if not group:continue
 bpy.ops.object.select_all(action='DESELECT')
 for o in group:
  bpy.context.view_layer.objects.active=o;o.select_set(True)
  for modifier in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=modifier.name)
 bpy.context.view_layer.objects.active=group[0]
 if len(group)>1:bpy.ops.object.join()
 group[0].name=m.name+' static geometry'
bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(ROOT/'dist/assets/doors.glb'),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_animations=False)
print('DOORS_EXPORTED')
