import bpy,json,sys
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from pathlib import Path
p=Path(sys.argv[sys.argv.index('--')+1]);data=json.loads(p.read_text());triangles=[(f[0],f[j],f[j+1]) for f in data['faces'] for j in range(1,len(f)-1)];body=[Vector(v) for v in data['body']];tree=BVHTree.FromPolygons(body,triangles);out=[];weights=[]
reference=data.get('reference');reference_tree=BVHTree.FromPolygons([Vector(v) for v in reference['positions']],reference['faces']) if reference else None
for i,values in enumerate(data['kit']):
 v=Vector(values)
 if reference_tree:
  v=v.lerp(reference_tree.find_nearest(v)[0],data['blend'][i]);v.y=values[1]
 else:
  hit,n,_,d=tree.find_nearest(v);blend=.94 if data['garment']=='kit' else .35 if data['garment']=='top' else 0
  target=hit+n*.055;v=v.lerp(target,blend)
 hit,n,face,d=tree.find_nearest(v);clearance=(v-hit).dot(n)
 padding=.025 if reference else .05
 if clearance<padding:v+=n*(padding-clearance)
 if reference_tree:v.y=values[1]
 out.append(list(v))
 ids=triangles[face];a,b,c=[body[i] for i in ids];ab=b-a;ac=c-a;ap=hit-a;d00=ab.dot(ab);d01=ab.dot(ac);d11=ac.dot(ac);d20=ap.dot(ab);d21=ap.dot(ac);den=d00*d11-d01*d01
 v1=(d11*d20-d01*d21)/den if abs(den)>1e-12 else 0;v2=(d00*d21-d01*d20)/den if abs(den)>1e-12 else 0;coeff=[max(0,1-v1-v2),max(0,v1),max(0,v2)];total=sum(coeff);weights.append([sum(data['weights'][idx][bone]*coeff[k]/total for k,idx in enumerate(ids)) for bone in range(len(data['weights'][0]))])
p.with_suffix('.fitted.json').write_text(json.dumps({'positions':out,'weights':weights}));print('Fitted sportswear against full anatomical body:',len(out),'vertices')
