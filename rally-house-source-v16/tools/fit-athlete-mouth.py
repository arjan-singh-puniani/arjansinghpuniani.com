import bpy,json,sys,math
from pathlib import Path
p=Path(sys.argv[sys.argv.index('--')+1]);data=json.loads(p.read_text());mesh=bpy.data.meshes.new('athlete-mouth');mesh.from_pydata(data['positions'],[],[[v[0] for v in f] for f in data['faces']]);mesh.update();uv=mesh.uv_layers.new(name='UVMap')
for polygon,face in zip(mesh.polygons,data['faces']):
 for loop,(_,ui) in zip(polygon.loop_indices,face):uv.data[loop].uv=data['uvs'][ui]
# Point attributes survive edge collapse, keeping the original jaw deformation.
for channel,delta in enumerate(data['deltas']):
 attribute=mesh.attributes.new(name='face'+str(channel),type='FLOAT_VECTOR',domain='POINT')
 for point,value in zip(attribute.data,delta):point.vector=value
obj=bpy.data.objects.new('athlete-mouth',mesh);bpy.context.collection.objects.link(obj);bpy.context.view_layer.objects.active=obj;obj.select_set(True);modifier=obj.modifiers.new('mouth-budget','DECIMATE');modifier.ratio=.08;modifier.use_collapse_triangulate=True;bpy.ops.object.modifier_apply(modifier=modifier.name);mesh=obj.data
positions=[list(v.co) for v in mesh.vertices];coords=[list(v.uv) for v in mesh.uv_layers.active.data];faces=[[[mesh.loops[i].vertex_index,i] for i in polygon.loop_indices] for polygon in mesh.polygons];deltas=[[list(v.vector) for v in mesh.attributes['face'+str(channel)].data] for channel in range(4)];triangles=sum(len(f)-2 for f in faces)
assert 0<triangles<=650 and all(math.isfinite(n) for a in [positions,*deltas] for v in a for n in v)
assert max(abs(n) for v in deltas[1] for n in v)>.01,'jaw deformation was lost during reduction'
p.with_suffix('.fitted.json').write_text(json.dumps({'positions':positions,'uvs':coords,'faces':faces,'deltas':deltas}));print('Authored teeth with preserved jaw morph:',triangles,'triangles')
