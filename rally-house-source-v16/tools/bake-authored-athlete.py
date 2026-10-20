import json, struct, hashlib, argparse, tempfile
from pathlib import Path
import numpy as np
from PIL import Image
parser=argparse.ArgumentParser(description='Bake the licensed Rally House athlete; requires NumPy, Pillow and Blender 4.0.')
parser.add_argument('core',type=Path);parser.add_argument('system',type=Path);parser.add_argument('output',type=Path);args=parser.parse_args()
SRC=args.core;ROOT=args.system;OUT=args.output;OUT.mkdir(parents=True,exist_ok=True)
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
for name,weight in [('asian-female-young.target',.6),('caucasian-female-young.target',.4)]:
 for l in open(SRC/name):
  a=l.split()
  if len(a)==4 and a[0].isdigit():shape[int(a[0])]+=weight*np.array(list(map(float,a[1:])))
# A restrained athletic build uses the same adult target across the entire mesh.
for l in open(SRC/'universal-female-young-maxmuscle-averageweight.target'):
 a=l.split()
 if len(a)==4 and a[0].isdigit():shape[int(a[0])]+=.24*np.array(list(map(float,a[1:])))
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
for bone,entries in json.load(open(SRC/'default_weights.mhw'))['weights'].items():
 for i,w in entries:W[i,names.index(bonemap(bone))]+=w
sums=W.sum(1);assert np.all(sums[:13380]>.9);W/=np.maximum(sums[:,None],1e-10)
scale=.1555;floor=float(shape[:13380,1].min())
def metric(p):return (p-np.array([0,floor,0]))*np.array([-scale,scale,scale])
def joint(s):return shape[list(groups['joint-'+s])].mean(0)
bind={
 'pelvis':joint('pelvis'),'spine':joint('spine-3'),'chest':(joint('l-shoulder')+joint('r-shoulder'))/2,'neck':joint('neck'),'head':np.array([0,6.18,.48]),
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
bind={k:metric(v) for k,v in bind.items()};bind['footL'][1]-=.022;bind['footR'][1]-=.022;bind['forward']=np.array([0.,0.,1.])
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
# Bake a handle grip from the authored finger weights, leaving the palm anchor fixed.
grip_delta=np.zeros_like(shape);source_weights=json.load(open(SRC/'default_weights.mhw'))['weights'];grip_sign={}
for side,source in [('L','l'),('R','r')]:
 normal=bind['handForward'+side]*np.array([-1,1,1]);palm_width=metric(joint(source+'-finger-2-1'))-metric(joint(source+'-finger-5-1'));grip_sign[side]=1 if np.dot(frames[names.index('hand'+side)][:3,0],palm_width)>0 else -1
 for finger in range(1,6):
  parent=np.eye(4);closed_joints=[]
  for segment in range(1,4):
   pivot=joint(f'{source}-finger-{finger}-{segment}');tip=joint(f'{source}-finger-{finger}-{segment+1}');closed_joints.append((parent@np.append(pivot,1))[:3]);direction=tip-pivot;direction/=np.linalg.norm(direction);axis=np.cross(direction,normal);axis/=np.linalg.norm(axis)
   angle=([.55,.65,.50] if finger==1 else [1.05,1.20,.85])[segment-1];cross=np.array([[0,-axis[2],axis[1]],[axis[2],0,-axis[0]],[-axis[1],axis[0],0]]);rotation=np.eye(3)+np.sin(angle)*cross+(1-np.cos(angle))*(cross@cross);local=np.eye(4);local[:3,:3]=rotation;local[:3,3]=pivot-rotation@pivot;parent=parent@local
   for vertex,weight in source_weights[f'finger{finger}-{segment}.{side}']:grip_delta[vertex]+=weight*((parent@np.append(shape[vertex],1))[:3]-shape[vertex])
  if finger==3:closed_joints.append((parent@np.append(tip,1))[:3]);grip_curve=closed_joints
 hand_frame=frames[names.index('hand'+side)];local=np.array([(np.linalg.inv(hand_frame)@np.append(metric(p),1))[1:3] for p in grip_curve]);coeff=np.linalg.lstsq(np.column_stack([local,np.ones(len(local))]),-(local*local).sum(1),rcond=None)[0];center=-coeff[:2]/2;assert np.linalg.norm(center)<.18
 offset=(hand_frame[:3,:3]@np.array([0,*center]))/np.array([-scale,scale,scale]);along=(metric(shape)-bind['wrist'+side])@bind['handDirection'+side];fade=np.clip(along/.045,0,1);fade=fade*fade*(3-2*fade);grip_delta-=W[:,names.index('hand'+side),None]*fade[:,None]*offset

parts=[];hidden=set();morph_data={};normal_data={};normal_delta_data={}

def fitted(name,folder,stem,texture,material='matte',force=None,clip=None):
 global hidden
 lines=(ROOT/folder/(stem+'.mhclo')).read_text().splitlines();obj_file=next(l.split()[1] for l in lines if l.startswith('obj_file '));p,u,f,g=obj(ROOT/folder/obj_file);
 if name=='kit':f=[(g,face) for g,face in f if np.mean(p[[v[0] for v in face],1])<1.5]
 active=False;rows=[];sc=np.ones(3);deleting=False
 for l in lines:
  a=l.split()
  if not a or a[0].startswith('#'):continue
  if a[0] in ('x_scale','y_scale','z_scale'):
   axis={'x_scale':0,'y_scale':1,'z_scale':2}[a[0]];sc[axis]=abs(shape[int(a[1]),axis]-shape[int(a[2]),axis])/float(a[3])
  elif a[0]=='verts':active=True
  elif a[0]=='delete_verts':active=False;deleting=True
  elif active:
   if not a[0].lstrip('-').isdigit():continue
   rows.append(a)
  elif deleting:
   if not a[0].isdigit():deleting=False;continue
   i=0
   while i<len(a):
    start=int(a[i]);end=start
    if i+2<len(a) and a[i+1]=='-':end=int(a[i+2]);i+=2
    hidden.update(v for v in range(start,end+1) if name!='skirt' and (name!='kit' or shape[v,1]<1.5) and (name!='top' or shape[v,1]<5.40) and shape[v,1]>(clip+.1 if name in ('kit','top') else -2.25));i+=1
 assert len(rows)==len(p),(name,len(rows),len(p))
 pw=[]
 for i,a in enumerate(rows):
  if len(a)==1:idx=int(a[0]);p[i]=shape[idx];pw.append(W[idx])
  else:
   ix=np.array(list(map(int,a[:3])));bw=np.array(list(map(float,a[3:6])));p[i]=(shape[ix]*bw[:,None]).sum(0)+np.array(list(map(float,a[6:9])))*sc;pw.append((W[ix]*bw[:,None]).sum(0))
 pw=np.array(pw)
 if name=='skirt':
  top,bottom=p[:,1].max(),p[:,1].min();p[:,1]=top-(top-p[:,1])*.90;clip=top-(top-bottom)*.52
  # A skirt spans both legs: smooth hip weights avoid nearest-leg seams and shin folds.
  depth=np.clip((top-p[:,1])/(top-clip),0,1);depth=depth*depth*(3-2*depth)
  front=np.clip((p[:,2]+.55)/1.4,0,1);left=1/(1+np.exp(-p[:,0]*3))
  follow=depth*front*.92;pw[:]=0;pw[:,names.index('pelvis')]=1-follow;pw[:,names.index('thighL')]=follow*left;pw[:,names.index('thighR')]=follow*(1-left)
 if name in ('kit','skirt','top'):
  import subprocess
  with tempfile.TemporaryDirectory(prefix='rally-athlete-') as directory:
   fitting=Path(directory)/'kit.json';fitting.write_text(json.dumps({'garment':name,'body':shape[:13380].tolist(),'faces':[[v[0] for v in face] for g,face in faces if g=='body'],'kit':p.tolist(),'weights':W[:13380].tolist()}))
   subprocess.run(['/Applications/Blender.app/Contents/MacOS/Blender','--background','--factory-startup','--python',str(Path(__file__).with_name('fit-athlete-kit.py')),'--',str(fitting)],check=True,stdout=subprocess.DEVNULL)
   fitted_data=json.loads(fitting.with_suffix('.fitted.json').read_text());p=np.array(fitted_data['positions']);surface_weights=np.array(fitted_data['weights'])
   if name=='skirt':
    seam=np.clip((.65-depth)/.25,0,1);seam=seam*seam*(3-2*seam);pw=pw*(1-seam[:,None])+surface_weights*seam[:,None]
   else:pw=surface_weights
 if force is not None:pw[:]=0;pw[:,names.index(force)]=1
 for cut,direction in ([(clip,1)] if clip is not None else [])+([(5.45,-1)] if name=='top' else []):
  # Clip triangles at a physical hem plane, interpolating both UVs and skin weights.
  positions=list(p);coords=list(u);influences=list(pw);clipped=[];intersections={}
  for group,face in f:
   for j in range(1,len(face)-1):
    polygon=[face[0],face[j],face[j+1]];result=[]
    for previous,current in zip(polygon[-1:]+polygon[:-1],polygon):
     a,b=positions[previous[0]],positions[current[0]];insideA=direction*(a[1]-cut)>=0;insideB=direction*(b[1]-cut)>=0
     if insideA!=insideB:
      t=(cut-a[1])/(b[1]-a[1]);edge=tuple(sorted((previous[0],current[0])));vi=intersections.get(edge)
      # Adjacent triangles share a cut vertex so their hem normals remain continuous.
      if vi is None:
       vi=len(positions);intersections[edge]=vi;positions.append(a+(b-a)*t);influences.append(influences[previous[0]]+(influences[current[0]]-influences[previous[0]])*t)
      ui=len(coords);coords.append(coords[previous[1]]+(coords[current[1]]-coords[previous[1]])*t);result.append((vi,ui))
     if insideB:result.append(current)
    if len(result)>=3:clipped.append((group,result))
  p=np.array(positions);u=np.array(coords);pw=np.array(influences);f=clipped
 if name=='skirt':
  # The thigh pivot rolls the front hem up; this corrective restores its seated drape.
  used=np.unique([v for _,face in f for v,_ in face]);mp=metric(p);lo,hi=mp[used,1].min(),mp[used,1].max();depth=np.clip((hi-mp[:,1])/(hi-lo),0,1);depth=depth*depth*(3-2*depth);front=np.clip((mp[:,2]-.02)/.18,0,1);front=front*front*(3-2*front)
  morph_data[name]=np.zeros((5,len(p),3));morph_data[name][0,:,1]=-.22/scale*depth*front;morph_data[name][0,:,2]=(.23-mp[:,2])/scale*depth*front
 parts.append((name,p,u,f,pw,texture,material))
fitted('kit','clothes/female_sportsuit01','female_sportsuit01','kit.webp','performanceKnit',clip=-.55)
fitted('top','clothes/punkduck_high_neck_crop_top','punkduck_high_neck_crop_top','kit.webp','performanceKnit',clip=2.5)
fitted('skirt','clothes/toigo_skirt_with_lace_ruffle','toigo_skirt_with_lace_ruffle','skirt.webp','performanceKnit')
fitted('shoes','clothes/shoes05','shoes05','shoes.webp','performanceKnit')
fitted('eyes','eyes/high-poly','high-poly','eyes.webp','iris',force='head')
# One atlas keeps the fitted top and protected shorts in the existing kit draw.
# Sample the solid top tile at its centre so mip filtering cannot pull in the shorts.
ki=next(i for i,p in enumerate(parts) if p[0]=='kit');ti=next(i for i,p in enumerate(parts) if p[0]=='top');kit=parts[ki];top=parts.pop(ti)
kp,ku,kf,kw=kit[1:5];tp,tu,tf,tw=top[1:5];ku=ku.copy();tu=np.full_like(tu,.5);ku[:,1]=.5+ku[:,1]*.5;tu[:,1]*=.5
parts[ki]=('kit',np.vstack([kp,tp]),np.vstack([ku,tu]),[*kf,*[(g,[(v+len(kp),u+len(ku)) for v,u in face]) for g,face in tf]],np.vstack([kw,tw]),'kit.webp','performanceKnit')
# Align the authored head to the original eye landmarks; the live anatomical rig stays unchanged.
alignment=next(p for p in parts if p[0]=='eyes');parts.remove(alignment);eye_points=metric(alignment[1]);target_eyes=[]
for side in [-1,1]:
 eye=eye_points[eye_points[:,0]*side>0];target_eyes.append(((eye.min(0)+eye.max(0))/2).tolist())
import subprocess
with tempfile.TemporaryDirectory(prefix='rally-head-') as directory:
 fitting=Path(directory)/'input.json';output=Path(directory)/'head.json';fitting.write_text(json.dumps({'source':str(SRC/'rocketbox'),'eyes':target_eyes}))
 subprocess.run(['/Applications/Blender.app/Contents/MacOS/Blender','--background','--factory-startup','--python',str(Path(__file__).with_name('fit-athlete-head.py')),'--',str(fitting),str(output)],check=True,stdout=subprocess.DEVNULL)
 head=json.loads(output.read_text())
bodyfaces=[(g,f) for g,f in faces if g=='body' and not all(v[0] in hidden for v in f) and np.mean(shape[[v[0] for v in f],1])>-6.5 and np.mean(W[[v[0] for v in f],names.index('head')])<.15]
body_uv=uv.copy();body_uv[:,1]=.5+body_uv[:,1]*.5
for part in head['parts']:
 name='skin' if part['kind']=='face' else part['kind'];hp=np.array(part['p']).reshape(-1,3)*np.array([-1,1,1])/scale+np.array([0,floor,0]);hu=np.array(part['uv']).reshape(-1,2);hu[:,1]=1-hu[:,1]
 if name!='hair':hu[:,1]*=.5
 hf=[('',[(i,i),(i+2,i+2),(i+1,i+1)]) for i in range(0,len(hp),3)];hw=np.zeros((len(hp),len(names)));hw[:,names.index('head')]=1
 delta=np.array(part['morphs']).reshape(5,len(hp),3)*np.array([-1,1,1])/scale;normal=np.array(part['n']).reshape(-1,3)*np.array([-1,1,1]);normal_delta=np.array(part['morphNormals']).reshape(5,len(hp),3)*np.array([-1,1,1])
 if name=='skin':
  offset=len(shape);hp=np.vstack([shape,hp]);hu=np.vstack([body_uv,hu]);hf=[*bodyfaces,*[(g,[(v+offset,u+len(body_uv)) for v,u in face]) for g,face in hf]];hw=np.vstack([W,hw]);morph_data[name]=np.zeros((5,len(hp),3));morph_data[name][4,:offset]=grip_delta;morph_data[name][:,offset:]=delta;normal_data[name]=(slice(offset,None),normal);normal_delta_data[name]=(slice(offset,None),normal_delta);parts.insert(0,(name,hp,hu,hf,hw,'skin.webp','humanSkin'))
 else:
  morph_data[name]=delta;normal_data[name]=(slice(None),normal);normal_delta_data[name]=(slice(None),normal_delta);parts.append((name,hp,hu,hf,hw,'hair.webp' if name=='hair' else 'skin.webp','groomedHair' if name=='hair' else 'iris'))
# Keep only the clothed runtime mesh; covered torso/pelvis and helper geometry are absent.
textures={
 'skin.webp':SRC/'skins/skins/bobby_03_young_female_hairless/Young_Female_Hairless.png',
 'kit.webp':ROOT/'clothes/female_sportsuit01/female_sportsuit01_diffuse.png',
 'shoes.webp':ROOT/'clothes/shoes05/shoes05_diffuse.png',
 'hair.webp':SRC/'rocketbox/f001_opacity_color.tga'}
for name,p in textures.items():
 im=Image.open(p);im.thumbnail((2048,2048) if name=='skin.webp' else (1024,1024));im.save(OUT/name,'WEBP',quality=91,method=6)
atlas=Image.new('RGB',(1024,2048),(40,67,172));atlas.paste(Image.open(textures['kit.webp']).convert('RGB').resize((1024,1024)),(0,0));atlas.save(OUT/'kit.webp','WEBP',quality=91,method=6)
# Match the body’s neutral neck pigment to the authored head without tinting facial detail.
body_albedo=np.asarray(Image.open(textures['skin.webp']).convert('RGB').resize((2048,1024)),dtype=float)
body_albedo=Image.fromarray(np.clip(body_albedo*np.array([1.09,1.025,.95]),0,255).astype('uint8'))
skin_atlas=Image.new('RGB',(2048,2048));skin_atlas.paste(body_albedo,(0,0));skin_atlas.paste(Image.open(SRC/'rocketbox/f001_head_color.tga').convert('RGB').resize((2048,1024)),(0,1024));skin_atlas.save(OUT/'skin.webp','WEBP',quality=92,method=6)
Image.new('RGB',(4,4),(210,231,89)).save(OUT/'skirt.webp','WEBP',lossless=True)
doc={'asset':{'version':'2.0','generator':'Rally House authored athlete / MakeHuman, punkduck and Microsoft Rocketbox'},'accessors':[],'bufferViews':[],'buffers':[],'meshes':[],'materials':[],'textures':[],'images':[], 'nodes':[]};binary=bytearray()
def accessor(a,t,component=5126):
 a=np.array(a,dtype={5126:'<f4',5123:'<u2',5125:'<u4'}[component]);binary.extend(bytes((-len(binary))%4));offset=len(binary);binary.extend(a.tobytes());view=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':a.nbytes});ac={'bufferView':view,'componentType':component,'count':len(a),'type':t}
 if t=='VEC3':ac.update(min=a.min(0).tolist(),max=a.max(0).tolist())
 doc['accessors'].append(ac);return len(doc['accessors'])-1
inverse=accessor([np.linalg.inv(m).T.flatten() for m in frames],'MAT4')
for n,m in zip(names,frames):doc['nodes'].append({'name':n,'matrix':m.T.flatten().tolist()})
doc['skins']=[{'joints':list(range(len(names))),'inverseBindMatrices':inverse}]
def smooth_normals(p,faces):
 normal=np.zeros_like(p)
 for _,face in faces:
  ids=[v[0] for v in face];normal[ids]+=np.cross(p[ids[1]]-p[ids[0]],p[ids[2]]-p[ids[0]])
 return normal/np.maximum(np.linalg.norm(normal,axis=1)[:,None],1e-12)
report=[]
for name,p,u,f,w,tex,mat in parts:
 normal=smooth_normals(p,f)
 if name in normal_data:region,values=normal_data[name];normal[region]=values
 mapping={};pos=[];norm=[];uvs=[];bi=[];bw=[];tri=[];source_ids=[]
 for _,face in f:
  indices=[]
  for vi,ui in face:
   key=(vi,ui)
   if key not in mapping:
    mapping[key]=len(pos);source_ids.append(vi);pos.append(metric(p[vi]));norm.append(normal[vi]*[-1,1,1]);uvs.append([u[ui,0],1-u[ui,1]])
    order=np.argsort(w[vi])[-4:][::-1];weights=w[vi,order];weights/=max(weights.sum(),1e-8);assert weights.sum()>.99
    bi.append(order);bw.append(weights)
   indices.append(mapping[key])
  for i in range(1,len(indices)-1):tri.append([indices[0],indices[i+1],indices[i]])
 ti=len(doc['textures']);doc['images'].append({'uri':tex});doc['textures'].append({'source':ti});doc['materials'].append({'name':name,'pbrMetallicRoughness':{'baseColorTexture':{'index':ti},'metallicFactor':0,'roughnessFactor':.75},'doubleSided':name in ('hair','brows','lashes','eyes','skirt'),'alphaMode':'MASK' if name in ('hair','brows','lashes','eyes') else 'OPAQUE','alphaCutoff':.35})
 attrs={'POSITION':accessor(pos,'VEC3'),'NORMAL':accessor(norm,'VEC3'),'TEXCOORD_0':accessor(uvs,'VEC2'),'JOINTS_0':accessor(bi,'VEC4',5123),'WEIGHTS_0':accessor(bw,'VEC4')}
 primitive={'attributes':attrs,'indices':accessor(np.array(tri).flatten(),'SCALAR',5125),'material':ti};extras={}
 if name in morph_data:
  source_delta=morph_data[name]
  primitive['targets']=[]
  for channel,delta in enumerate(source_delta):
   normals=smooth_normals(p+delta,f)-normal
   if name in normal_delta_data:region,values=normal_delta_data[name];normals[region]=values[channel]
   normals=normals[source_ids]*np.array([-1,1,1])
   primitive['targets'].append({'POSITION':accessor(delta[source_ids]*np.array([-scale,scale,scale]),'VEC3'),'NORMAL':accessor(normals,'VEC3')})
  extras={'targetNames':['seatedDrape','reserved1','reserved2','reserved3','reserved4'] if name=='skirt' else ['smile','mouthOpen','blink','browRaise','grip']}
 doc['meshes'].append({'name':name,'primitives':[primitive],'extras':extras});doc['nodes'].append({'mesh':len(doc['meshes'])-1,'skin':0});report.append({'name':name,'triangles':len(tri),'vertices':len(pos),'material':mat})
doc['scenes']=[{'nodes':list(range(len(doc['nodes'])))}];doc['scene']=0;doc['buffers']=[{'byteLength':len(binary)}];binary.extend(bytes((-len(binary))%4));j=json.dumps(doc,separators=(',',':')).encode();j+=b' '*((-len(j))%4);glb=struct.pack('<III',0x46546c67,2,28+len(j)+len(binary))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(binary),0x004e4942)+binary;(OUT/'taylor.glb').write_bytes(glb)
meta={'author':'MakeHuman Community; MargaretToigo; Bobby_03; punkduck; Microsoft Rocketbox; Rally House fit and runtime adaptation','source':'https://github.com/makehumancommunity/makehuman/tree/a8bc2d54ff0ac92e78ff71431b1023eda42bf482','license':'CC0-1.0 AND CC-BY-4.0 AND MIT','sha256':hashlib.sha256(glb).hexdigest(),'boneMap':{n:n for n in names},'bind':{k:v.tolist() for k,v in bind.items()},'parts':report,'textures':{name:hashlib.sha256((OUT/name).read_bytes()).hexdigest() for name in [*textures,'skirt.webp']},'sourceHashes':{str(p.relative_to(SRC)) if p.is_relative_to(SRC) else str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [SRC/'base.obj',SRC/'default_weights.mhw',SRC/'default.mhskel',*textures.values(),*list((SRC/'rocketbox').iterdir())]}}
meta['gripSign']=grip_sign;meta['facialTargets']=head['channels'];meta['headSource']={'author':'Microsoft Rocketbox','license':'MIT','revision':'0943055db6ec570bcef9f2c8b41c9e5467c808f9','source':'https://github.com/microsoft/Microsoft-Rocketbox'}
meta['assetPacks']=['https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html','https://static.makehumancommunity.org/assets/assetpacks/skins01.html','https://static.makehumancommunity.org/assets/assetpacks/skirts01.html','https://static.makehumancommunity.org/assets/assetpacks/shirts03.html']
for p in [*SRC.glob('*.target'),*[p for folder in ['clothes/female_sportsuit01','clothes/punkduck_high_neck_crop_top','clothes/toigo_skirt_with_lace_ruffle','clothes/shoes05','eyes/high-poly'] for p in (ROOT/folder).iterdir() if p.suffix in ('.obj','.mhclo')]]:meta['sourceHashes'][str(p.relative_to(SRC)) if p.is_relative_to(SRC) else str(p.relative_to(ROOT))]=hashlib.sha256(p.read_bytes()).hexdigest()
meta['authoringScripts']={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [Path(__file__),Path(__file__).with_name('fit-athlete-kit.py'),Path(__file__).with_name('fit-athlete-head.py')]}
(OUT/'provenance.json').write_text(json.dumps(meta,indent=2)+'\n');print(json.dumps(report));print('triangles',sum(p['triangles'] for p in report),'glb',len(glb))
