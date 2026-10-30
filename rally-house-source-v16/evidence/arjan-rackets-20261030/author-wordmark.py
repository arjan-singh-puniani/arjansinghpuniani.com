import bpy,json
from pathlib import Path
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.object.text_add();obj=bpy.context.object;c=obj.data;c.body='ARJAN';c.font=bpy.data.fonts.load('/System/Library/Fonts/Supplemental/Arial Rounded Bold.ttf');c.shear=.23;c.resolution_u=3
bpy.ops.object.convert(target='MESH');m=obj.data;m.calc_loop_triangles();xs=[v.co.x for v in m.vertices];ys=[v.co.y for v in m.vertices];x0,x1=min(xs),max(xs);y0,y1=min(ys),max(ys);out=[]
for t in m.loop_triangles:
 v=[m.vertices[i].co for i in t.vertices]
 if (v[1]-v[0]).cross(v[2]-v[0]).z<0:v[1],v[2]=v[2],v[1]
 for p in v:out.extend([round((p.x-x0)/(x1-x0)*3.8,6),round((p.y-y0)/(y1-y0),6)])
p=Path(__file__).resolve().parents[2]/'src/animation/RacketWordmark.ts'
p.open('w').write('// Baked ARJAN outline: Arial Rounded Bold, 0.23 oblique, curve resolution 3; no runtime font or logo asset.\nexport const RACKET_WORDMARK='+json.dumps(out,separators=(',',':'))+';\n')
print('wordmark triangles',len(out)//6)
