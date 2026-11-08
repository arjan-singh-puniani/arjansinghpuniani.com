import json, struct, hashlib, argparse
from collections import Counter
from pathlib import Path
import numpy as np
parser=argparse.ArgumentParser(description='Bake the CC0 Arjan upper body; requires NumPy and the pinned MakeHuman core files.')
parser.add_argument('core',type=Path);parser.add_argument('output',type=Path);args=parser.parse_args()
SRC=args.core;OUT=args.output;OUT.mkdir(parents=True,exist_ok=True)
def obj(path):
 p=[];uv=[];faces=[];groups={};g=''
 for l in open(path):
  a=l.split()
  if not a:continue
  if a[0]=='v':p.append(list(map(float,a[1:4])))
  elif a[0]=='vt':uv.append(list(map(float,a[1:3])))
  elif a[0]=='g':g=' '.join(a[1:])
  elif a[0]=='f':
   f=[tuple(int(x)-1 for x in s.split('/')[:2]) for s in a[1:]];faces.append((g,f));groups.setdefault(g,set()).update(v[0] for v in f)
 return np.array(p),np.array(uv),faces,groups
base,uv,faces,groups=obj(SRC/'base.obj');shape=base.copy()
for name,weight in [('asian-male-young.target',1/3),('caucasian-male-young.target',1/3),('african-male-young.target',1/3)]:
 for l in open(SRC/name):
  a=l.split()
  if len(a)==4 and a[0].isdigit():shape[int(a[0])]+=weight*np.array(list(map(float,a[1:])))
# shortcut: a moderate athletic source shape, not a measured body scan; refit when calibrated measurements are available.
for l in open(SRC/'universal-male-young-maxmuscle-averageweight.target'):
 a=l.split()
 if len(a)==4 and a[0].isdigit():shape[int(a[0])]+=.35*np.array(list(map(float,a[1:])))
names=['pelvis','spine','chest','neck','head','upperArmL','foreArmL','handL','upperArmR','foreArmR','handR','thighL','shinL','thighR','shinR','footL','footR','foreArmTwistL','foreArmTwistR']
W=np.zeros((len(base),len(names)))
def bonemap(n):
 side='L' if n.endswith('.L') else 'R'
 if n.startswith(('upperarm','shoulder')):return 'upperArm'+side
 if n.startswith('lowerarm02'):return 'foreArmTwist'+side
 if n.startswith('lowerarm01'):return 'foreArm'+side
 if n.startswith(('finger','metacarpal','wrist')):return 'hand'+side
 if n.startswith('upperleg'):return 'thigh'+side
 if n.startswith('lowerleg'):return 'shin'+side
 if n.startswith(('foot','toe')):return 'foot'+side
 if n.startswith('neck'):return 'neck'
 if n in ('root','pelvis.L','pelvis.R'):return 'pelvis'
 if n.startswith('spine'):return 'chest' if n in ('spine01','spine02') else 'spine'
 if n.startswith(('breast','clavicle')):return 'chest'
 return 'head'
source_weights=json.load(open(SRC/'default_weights.mhw'))['weights']
for bone,entries in source_weights.items():
 for i,w in entries:W[i,names.index(bonemap(bone))]+=w
sums=W.sum(1);assert np.all(sums[:13380]>.9);W/=np.maximum(sums[:,None],1e-10)
scale=.1555;floor=float(shape[:13380,1].min())
def metric(p):return (p-np.array([0,floor,0]))*np.array([-scale,scale,scale])
def joint(s):return shape[list(groups['joint-'+s])].mean(0)
bind={
 'pelvis':joint('pelvis'),'spine':joint('spine-3'),'chest':(joint('l-shoulder')+joint('r-shoulder'))/2,'neck':joint('neck'),'head':(joint('l-eye')+joint('r-eye'))/2,
}
# MakeHuman L has positive source X; the renderer's L has negative X.
# source X is reflected once, so keep these labels on the positive-source side.
for side,source in [('L','l'),('R','r')]:
 for target,suffix in [('upperArm','shoulder'),('foreArm','elbow'),('hand','hand-2'),('thigh','upper-leg'),('shin','knee'),('foot','ankle')]:
  key='joint-'+source+'-'+suffix
  if key not in groups:
   print('missing',key);raise ValueError(key)
  bind[target+side]=joint(source+'-'+suffix)
for side,source in [('L','l'),('R','r')]:bind['hand'+side]=(joint(source+'-hand')+joint(source+'-finger-3-1'))/2
for side,source in [('L','l'),('R','r')]:bind['wrist'+side]=joint(source+'-hand')
source_rig=json.load(open(SRC/'default.mhskel'))
for side in ['L','R']:
 ids=source_rig['joints'][source_rig['bones']['lowerarm02.'+side]['head']];bind['foreArmTwist'+side]=shape[ids].mean(0)
bind={k:metric(v) for k,v in bind.items()};bind['head']-=np.array([0.,.018,.100]);bind['footL'][1]-=.022;bind['footR'][1]-=.022;bind['forward']=np.array([0.,0.,1.])
for side,source in [('L','l'),('R','r')]:
 hand=metric(shape[W[:,names.index('hand'+side)]>.8]);center=hand.mean(0);_,axes=np.linalg.eigh((hand-center).T@(hand-center));normal=axes[:,0]
 if normal[2]<0:normal=-normal
 direction=metric(joint(source+'-finger-3-1'))-metric(joint(source+'-hand'));direction/=np.linalg.norm(direction)
 bind['handDirection'+side]=direction;bind['handForward'+side]=normal;bind['foreArmForward'+side]=normal
children=['spine','chest','neck','head','neck','foreArmL','foreArmTwistL','foreArmL','foreArmR','foreArmTwistR','foreArmR','shinL','footL','shinR','footR',None,None,'handL','handR']
def frame(k):
 a=bind[k]
 if k.startswith('foot') or k=='head':y=np.array([0.,1.,0.]);f=bind['forward']
 elif k.startswith('hand'):
  side=k[-1];y=bind['handDirection'+side];f=bind['handForward'+side]
 else:
  b=bind.get('wrist'+k[-1],bind[children[names.index(k)]]) if k.startswith('foreArmTwist') else bind[children[names.index(k)]];y=b-a
  if k in ('head','handL','handR'):y=-y
  y/=np.linalg.norm(y);f=bind.get('foreArmForward'+k[-1],bind['forward']) if k.startswith('foreArmTwist') else bind['forward']
  if k.startswith(('shin','thigh')):f=np.cross(np.array([-1.,0.,0.]),y)
 z=f-y*np.dot(f,y);z/=np.linalg.norm(z);x=np.cross(y,z);m=np.eye(4);m[:3,:3]=np.stack([x,y,z],1);m[:3,3]=a;return m
frames=[frame(n) for n in names]

# Fit the grip anchor inside the curled fingers so the existing racket axis passes through the hand.
grip_delta=np.zeros_like(shape)
grip_sign={}
for side,source in [('L','l'),('R','r')]:
 hand_frame=frames[names.index('hand'+side)]
 normal=bind['handForward'+side]*np.array([-1,1,1])
 palm_width=metric(joint(source+'-finger-2-1'))-metric(joint(source+'-finger-5-1'))
 grip_sign[side]=1 if np.dot(hand_frame[:3,0],palm_width)>0 else -1
 for finger in range(1,6):
  parent=np.eye(4)
  curled=[]
  angles=[.55,.65,.50] if finger==1 else [1.05,1.20,.85]
  for segment,angle in enumerate(angles,1):
   pivot=joint(f'{source}-finger-{finger}-{segment}')
   tip=joint(f'{source}-finger-{finger}-{segment+1}')
   curled.append((parent@np.append(pivot,1))[:3])
   axis=np.cross(tip-pivot,normal)
   x,y,z=axis/np.linalg.norm(axis)
   cross=np.array([[0,-z,y],[z,0,-x],[-y,x,0]])
   rotation=np.eye(3)+np.sin(angle)*cross+(1-np.cos(angle))*(cross@cross)
   local=np.eye(4)
   local[:3,:3]=rotation
   local[:3,3]=pivot-rotation@pivot
   parent=parent@local
   for vertex,weight in source_weights[f'finger{finger}-{segment}.{side}']:
    grip_delta[vertex]+=weight*((parent@np.append(shape[vertex],1))[:3]-shape[vertex])
  if finger==3:
   curled.append((parent@np.append(tip,1))[:3])
   curve=np.array([(np.linalg.inv(hand_frame)@np.append(metric(point),1))[1:3] for point in curled])
   circle=np.linalg.lstsq(np.column_stack([curve,np.ones(len(curve))]),-(curve*curve).sum(1),rcond=None)[0]
   center=-circle[:2]/2
   assert np.linalg.norm(center)<.18
   bind['hand'+side]+=hand_frame[:3,:3]@np.array([0,*center])
frames=[frame(name) for name in names]

def smooth_normals(positions,triangles):
 normals=np.zeros_like(positions)
 for _,face in triangles:
  ids=[vertex for vertex,_ in face]
  a,b,c=positions[ids]
  normals[ids]+=np.cross(b-a,c-a)
 return normals/np.maximum(np.linalg.norm(normals,axis=1)[:,None],1e-12)

def clip_faces(p,u,f,pw,distances):
 positions=list(p);coords=list(u);influences=list(pw);values=list(distances);clipped=[];intersections={}
 for group,face in f:
  for j in range(1,len(face)-1):
   polygon=[face[0],face[j],face[j+1]];result=[]
   for previous,current in zip(polygon[-1:]+polygon[:-1],polygon):
    a,b=previous[0],current[0];insideA=values[a]>=0;insideB=values[b]>=0
    if insideA!=insideB:
     t=values[a]/(values[a]-values[b]);edge=tuple(sorted((a,b)));vi=intersections.get(edge)
     if vi is None:
      vi=len(positions);intersections[edge]=vi;positions.append(positions[a]+(positions[b]-positions[a])*t);influences.append(influences[a]+(influences[b]-influences[a])*t);values.append(0)
     ui=len(coords);coords.append(coords[previous[1]]+(coords[current[1]]-coords[previous[1]])*t);result.append((vi,ui))
    if insideB:result.append(current)
   for k in range(1,len(result)-1):
    tri=[result[0],result[k],result[k+1]];a,b,c=[positions[v] for v,_ in tri]
    if np.linalg.norm(np.cross(b-a,c-a))>1e-12:clipped.append((group,tri))
 p=np.array(positions);u=np.array(coords);pw=np.array(influences);f=clipped
 return p,u,f,pw

# Keep the jersey, forearm and hand attached to the same source rig.
mp=metric(shape);body_faces=[(g,f) for g,f in faces if g=='body'];normal=np.zeros_like(shape)
for _,f in body_faces:
 ids=[v[0] for v in f];normal[ids]+=np.cross(shape[ids[1]]-shape[ids[0]],shape[ids[2]]-shape[ids[0]])
normal/=np.maximum(np.linalg.norm(normal,axis=1)[:,None],1e-12)
waist=bind['pelvis'][1]+.015;neck=bind['neck'][1]-.025;cloth=np.minimum(mp[:,1]-waist,neck-mp[:,1]);arm_visibility=np.full(len(shape),-10.)
# The center-front notch opens the polo while preserving the back and sides of the neckline.
notch=.038*np.clip(1-np.abs(mp[:,0])/.063,0,1)*np.clip((mp[:,2]-bind['neck'][2])/.08,0,1)
cloth=np.minimum(cloth,neck-mp[:,1]-notch)
for side in ['L','R']:
 a,b=bind['upperArm'+side],bind['foreArm'+side];axis=b-a;length=np.linalg.norm(axis);axis/=length;arm=W[:,[names.index(n+side) for n in ['upperArm','foreArm','foreArmTwist','hand']]].sum(1);along=(mp-a)@axis
 sleeve=.36*length-along;cloth=np.where(arm>.35,np.minimum(cloth,sleeve),cloth);arm_visibility=np.maximum(arm_visibility,np.where(arm>.35,-sleeve,-10.))
 # Spread the elbow bend across neighboring rings; abrupt changes around one ring fold the skin.
 upper,fore=[names.index(name+side) for name in ('upperArm','foreArm')]
 elbow_axis=bind['wrist'+side]-a
 elbow_axis/=np.linalg.norm(elbow_axis)
 distance=(mp-b)@elbow_axis
 bend=np.clip((distance+.145)/.29,0,1)
 mix=np.clip((.15-np.abs(distance))/.035,0,1)
 mix*=mix*(3-2*mix)
 pair=W[:,upper]+W[:,fore]
 fore_weight=W[:,fore]*(1-mix)+pair*bend*mix
 W[:,upper]=pair-fore_weight
 W[:,fore]=fore_weight
skin_dist=np.minimum(arm_visibility+.012,bind['head'][1]-.15-mp[:,1])
parts=[]
for kind,positions,distances in [('kit',shape+normal*.025,cloth),('skin',shape,skin_dist)]:
 p,u,f,weights=clip_faces(positions,uv,body_faces,W,distances)
 if kind=='kit':
  # Let the polo hang from the rib cage instead of tracing every dip in the waist.
  points=metric(p);t=np.clip((points[:,1]-waist)/.24,0,1)
  # Ease the untucked hem over the moving waistband without widening the chest.
  drape=np.clip(1-(points[:,1]-waist)/.14,0,1)
  ease=drape*drape*(3-2*drape)
  p[:,0]*=1+.045*np.sin(np.pi*t)**2+.09*ease
  p[:,2]+=(points[:,2]-bind['pelvis'][2])/scale*.12*ease
 if kind=='skin':
  # Clipping only adds sleeve-edge vertices, where the finger curl has no influence.
  delta=np.zeros_like(p)
  delta[:len(shape)]=grip_delta
 n=smooth_normals(p,f)
 ids=[]
 for _,face in f:
  for i in range(1,len(face)-1):ids.extend([face[0][0],face[i+1][0],face[i][0]])
 ids=np.array(ids);assert len(ids)>1000
 pw=weights[ids].copy()
 if kind=='kit':
  legs=[names.index(n+side) for side in ['L','R'] for n in ['thigh','shin','foot']];pw[:,names.index('pelvis')]+=pw[:,legs].sum(1);pw[:,legs]=0
 order=np.argsort(pw,axis=1)[:,-4:][:,::-1];pw=np.take_along_axis(pw,order,axis=1);pw/=pw.sum(1)[:,None]
 pos=metric(p)[ids];norm=n[ids]*[-1,1,1];assert np.isfinite(pos).all() and np.all(np.linalg.norm(norm,axis=1)>.99)
 part={'kind':kind,'p':pos,'n':norm,'bi':order,'bw':pw}
 if kind=='skin':
  part['grip']=delta[ids]*np.array([-scale,scale,scale])
  part['grip_normal']=(smooth_normals(p+delta,f)-n)[ids]*np.array([-1,1,1])
 parts.append(part)

# Use the existing strict glTF intake contract; there are no photos, textures or animation clips in this asset.
doc={'asset':{'version':'2.0','generator':'Rally House / MakeHuman upper-body fit'},'accessors':[],'bufferViews':[],'buffers':[],'meshes':[],'materials':[],'nodes':[]}
binary=bytearray()
def accessor(values,kind,component=5126):
 a=np.asarray(values,dtype={5126:'<f4',5123:'<u2'}[component]);binary.extend(bytes((-len(binary))%4));offset=len(binary);binary.extend(a.tobytes());view=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':a.nbytes});entry={'bufferView':view,'componentType':component,'count':len(a),'type':kind}
 if kind=='VEC3':entry.update(min=a.min(0).tolist(),max=a.max(0).tolist())
 doc['accessors'].append(entry);return len(doc['accessors'])-1
inverse=accessor([np.linalg.inv(m).T.flatten() for m in frames],'MAT4')
doc['nodes']=[{'name':name,'matrix':frame.T.flatten().tolist()} for name,frame in zip(names,frames)]
doc['skins']=[{'joints':list(range(len(names))),'inverseBindMatrices':inverse}]
counts=[];neck_contour=[]
for part in parts:
 p=np.array(part['p']).reshape(-1,3);n=np.array(part['n']).reshape(-1,3);bi=np.array(part['bi']).reshape(-1,4);bw=np.array(part['bw']).reshape(-1,4)
 base_triangles=len(p)//3
 if part['kind']=='kit':
  # Keep the original opening as the skin attachment; the folded polo collar shares its native influences.
  keys=[tuple(np.round(v,6)) for v in p];edges=Counter(tuple(sorted((keys[i+a],keys[i+b]))) for i in range(0,len(p),3) for a,b in [(0,1),(1,2),(2,0)])
  rim={v for edge,count in edges.items() if count==1 and min(v[1] for v in edge)>neck-.050 for v in edge}
  assert len(rim)>12
  samples={}
  for i,k in enumerate(keys):
   if k in rim:samples[k]={'position':p[i].tolist(),'joints':bi[i].astype(int).tolist(),'weights':bw[i].tolist()}
  center=np.array(list(rim)).mean(0)
  neck_contour=sorted(samples.values(),key=lambda row:np.arctan2(row['position'][0]-center[0],row['position'][2]-center[2]))
  extra_p=[];extra_n=[];extra_bi=[];extra_bw=[];extra_groups=[]
  def collar_triangle(points,rows,group):
   normal=np.cross(points[1]-points[0],points[2]-points[0]);length=np.linalg.norm(normal);assert length>1e-10
   extra_p.extend(points);extra_n.extend([normal/length]*3);extra_bi.extend(row['joints'] for row in rows);extra_bw.extend(row['weights'] for row in rows);extra_groups.extend([group]*3)
  surface=p.reshape(-1,3,3);surface_a,surface_b,surface_c=surface[:,0],surface[:,1],surface[:,2]
  det=(surface_b[:,1]-surface_c[:,1])*(surface_a[:,0]-surface_c[:,0])+(surface_c[:,0]-surface_b[:,0])*(surface_a[:,1]-surface_c[:,1]);valid=np.abs(det)>1e-10
  def clear_front(point, gap, attach=False):
   # A folded lapel must sit above the actual chest, whose depth grows below the neck opening.
   x,y=point[:2];u=np.divide((surface_b[:,1]-surface_c[:,1])*(x-surface_c[:,0])+(surface_c[:,0]-surface_b[:,0])*(y-surface_c[:,1]),det,out=np.zeros(len(det)),where=valid)
   v=np.divide((surface_c[:,1]-surface_a[:,1])*(x-surface_c[:,0])+(surface_a[:,0]-surface_c[:,0])*(y-surface_c[:,1]),det,out=np.zeros(len(det)),where=valid);w=1-u-v
   hit=valid&(u>=-1e-6)&(v>=-1e-6)&(w>=-1e-6)
   if hit.any():
    depths=np.where(hit,u*surface_a[:,2]+v*surface_b[:,2]+w*surface_c[:,2],-np.inf);index=int(np.argmax(depths))
    point[2]=float(depths[index])+gap if attach else max(point[2],float(depths[index])+gap)
    if attach:
     weights=np.zeros(len(names))
     for vertex,amount in zip(range(index*3,index*3+3),[u[index],v[index],w[index]]):np.add.at(weights,bi[vertex],bw[vertex]*amount)
     weights=np.maximum(weights,0);order=np.argsort(weights)[-4:][::-1];values=weights[order];values/=values.sum()
     assert np.isfinite(values).all() and abs(values.sum()-1)<1e-9
     return point,{'joints':order.tolist(),'weights':values.tolist()}
   if attach:raise ValueError('Collar fold has no underlying shirt surface')
   return point
  def collar(row):
   a=np.array(row['position']);radial=a-center;radial[1]=0;radial/=np.linalg.norm(radial)
   front=max(0,radial[2]);top=a+np.array([0,.018,0]);fold=a+radial*.028+np.array([0,-.025-.034*front,0])
   tip=np.clip((front-.65)/.35,0,1);tip=tip*tip*(3-2*tip);fold[0]*=1-.15*tip;fold[1]-=.040*tip
   # The lapel edge follows the chest beneath it, while the seam stays attached to the neck opening.
   fold_row=row
   if front>.1:fold,fold_row=clear_front(fold,.008,attach=True)
   return a,top,fold,fold_row
  for i,row in enumerate(neck_contour):
   other=neck_contour[(i+1)%len(neck_contour)];a,top,fold,fold_row=collar(row);b,next_top,next_fold,next_fold_row=collar(other)
   # The front split leaves two collar points instead of a closed standing band.
   middle=(a+b)*.5-center
   if middle[2]>0 and abs(middle[0])<.030:continue
   collar_triangle([a,b,next_top],[row,other,other],0);collar_triangle([a,next_top,top],[row,other,row],0)
   collar_triangle([top,next_top,next_fold],[row,other,next_fold_row],1);collar_triangle([top,next_fold,fold],[row,next_fold_row,fold_row],1)
  # Follow the shirt surface so the placket has a stitched edge instead of hovering over the chest.
  front_row=max(neck_contour,key=lambda row:row['position'][2])
  _,y,z=front_row['position']
  placket=[clear_front(np.array([x,y-dy,z-.04]),gap) for dy in [.025,.065,.105,.135] for x,gap in [(-.016,.002),(-.009,.008),(.013,.007)]]
  placket[0]=np.array(front_row['position'])
  chest_row={'joints':[names.index('chest'),0,0,0],'weights':[1,0,0,0]}
  for i in range(3):
   for j in range(2):
    a=i*3+j
    for ids in [(a,a+3,a+1),(a+1,a+3,a+4)]:
     collar_triangle([placket[k] for k in ids],[front_row if k<3 else chest_row for k in ids],2+j)
  # Smooth each cloth panel while retaining the fold between the stand and its lapels.
  averages={};keys=[(*np.round(point,6),group) for point,group in zip(extra_p,extra_groups)]
  for key,normal in zip(keys,extra_n):averages[key]=averages.get(key,np.zeros(3))+normal
  extra_n=[averages[key]/np.linalg.norm(averages[key]) for key in keys]
  p=np.vstack([p,extra_p]);n=np.vstack([n,extra_n]);bi=np.vstack([bi,extra_bi]);bw=np.vstack([bw,extra_bw])
 unique={};vertices=[];indices=[]
 for i in range(len(p)):
  key=tuple([*p[i],*n[i],*bi[i],*bw[i]])
  if key not in unique:unique[key]=len(vertices);vertices.append(i)
  indices.append(unique[key])
 assert len(vertices)<65536
 attrs={'POSITION':accessor(p[vertices],'VEC3'),'NORMAL':accessor(n[vertices],'VEC3'),'JOINTS_0':accessor(bi[vertices],'VEC4',5123),'WEIGHTS_0':accessor(bw[vertices],'VEC4')}
 material=len(doc['materials']);doc['materials'].append({'name':part['kind'],'doubleSided':part['kind']=='kit','pbrMetallicRoughness':{'metallicFactor':0,'roughnessFactor':.75}})
 primitive={'attributes':attrs,'indices':accessor(indices,'SCALAR',5123),'material':material}
 mesh={'name':part['kind'],'primitives':[primitive]}
 if part['kind']=='skin':
  zero=accessor(np.zeros((len(vertices),3)),'VEC3')
  primitive['targets']=[{'POSITION':zero,'NORMAL':zero} for _ in range(4)]
  primitive['targets'].append({'POSITION':accessor(part['grip'][vertices],'VEC3'),'NORMAL':accessor(part['grip_normal'][vertices],'VEC3')})
  mesh['extras']={'targetNames':['smile','mouthOpen','blink','browRaise','grip']}
 doc['meshes'].append(mesh)
 doc['nodes'].append({'mesh':len(doc['meshes'])-1,'skin':0})
 counts.append({'material':part['kind'],'triangles':len(indices)//3,'vertices':len(vertices)})
 if part['kind']=='kit':counts[-1]['baseTriangles']=base_triangles

doc['scenes']=[{'nodes':list(range(len(doc['nodes'])))}];doc['scene']=0;doc['buffers']=[{'byteLength':len(binary)}];binary.extend(bytes((-len(binary))%4));j=json.dumps(doc,separators=(',',':')).encode();j+=b' '*((-len(j))%4)
glb=struct.pack('<III',0x46546c67,2,28+len(j)+len(binary))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(binary),0x004e4942)+binary
(OUT/'upper-body.glb').write_bytes(glb)
sources=['base.obj','default_weights.mhw','default.mhskel','LICENSE.ASSETS.md','asian-male-young.target','caucasian-male-young.target','african-male-young.target','universal-male-young-maxmuscle-averageweight.target']
meta={'author':'MakeHuman Community; Rally House fit and rig adaptation','source':'https://github.com/makehumancommunity/makehuman/tree/a8bc2d54ff0ac92e78ff71431b1023eda42bf482','license':'CC0-1.0','sha256':hashlib.sha256(glb).hexdigest(),'boneMap':{name:name for name in names},'bind':{k:v.tolist() for k,v in bind.items()},'parts':counts,'gripSign':grip_sign,'neckContour':neck_contour,'sourceHashes':{name:hashlib.sha256((SRC/name).read_bytes()).hexdigest() for name in sources},'authoringScriptSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'limit':'Artistically fitted athletic upper body, not a scan or a claim of exact personal proportions.'}
(OUT/'provenance.json').write_text(json.dumps(meta,indent=2)+'\n');print(json.dumps({'parts':counts,'bytes':len(glb),'sha256':meta['sha256']}))
