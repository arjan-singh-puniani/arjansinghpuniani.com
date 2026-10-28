"""Regression: the survival cell must not protrude through the visible left inlet (fixed hero ray)."""
import json,struct,math,pathlib
root=pathlib.Path(__file__).resolve().parents[3]
b=(root/'public/pit-stop-lab/assets/sf26-runtime.glb').read_bytes();js=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+js]);data=memoryview(b)[28+js:]
def add(a,b):return tuple(x+y for x,y in zip(a,b))
def mul(a,b):return tuple(x*b for x in a)
def sub(a,b):return add(a,mul(b,-1))
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return (a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def norm(a):return mul(a,1/math.sqrt(dot(a,a)))
o=(4.4,1.85,-5.6);f=norm(sub((0,.44,-.15),o));r=norm(cross(f,(0,1,0)));u=cross(r,f);d=norm(add(f,add(mul(r,(705/1440*2-1)*math.tan(math.pi/10)*1440/877),mul(u,(1-2*(582-123)/877)*math.tan(math.pi/10)))))
def values(index):
 a=j['accessors'][index];v=j['bufferViews'][a['bufferView']];n={'SCALAR':1,'VEC3':3}[a['type']];fmt={5126:'f',5123:'H',5125:'I',5121:'B'}[a['componentType']]*n;size=struct.calcsize('<'+fmt);start=v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',size)
 return [struct.unpack_from('<'+fmt,data,start+i*stride) for i in range(a['count'])]
hits=[]
def walk(i,parent=(0,0,0)):
 node=j['nodes'][i];assert 'rotation' not in node and 'matrix' not in node;pos=add(parent,node.get('translation',(0,0,0)))
 if 'mesh' in node:
  for p in j['meshes'][node['mesh']]['primitives']:
   vs=[add(v,pos) for v in values(p['attributes']['POSITION'])];ids=values(p['indices'])
   for k in range(0,len(ids),3):
    a,bb,c=[vs[ids[k+n][0]] for n in range(3)];e1=sub(bb,a);e2=sub(c,a);q=cross(d,e2);det=dot(e1,q)
    if abs(det)<1e-8:continue
    inv=1/det;s=sub(o,a);uu=dot(s,q)*inv
    if uu<0 or uu>1:continue
    qq=cross(s,e1);vv=dot(d,qq)*inv
    if vv<0 or uu+vv>1:continue
    t=dot(e2,qq)*inv
    if t>0:hits.append((t,node['name'],j['materials'][p['material']]['name'],add(o,mul(d,t))))
 for child in node.get('children',[]):walk(child,pos)
for i in j['scenes'][j['scene']]['nodes']:walk(i)
assert hits and sorted(hits)[0][2]=='Intake_shadow', 'A body panel intersects the open inlet'
print('Inlet clearance regression passed:',sorted(hits)[0][1])
