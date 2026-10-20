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
names=['pelvis','spine','chest','neck','head','upperArmL','foreArmL','handL','upperArmR','foreArmR','handR','thighL','shinL','thighR','shinR','footL','footR']
W=np.zeros((len(base),len(names)))
def bonemap(n):
 side='L' if n.endswith('.L') else 'R'
 if n.startswith(('upperarm','shoulder')):return 'upperArm'+side
 if n.startswith(('lowerarm',)):return 'foreArm'+side
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
bind={k:metric(v) for k,v in bind.items()};bind['footL'][1]-=.022;bind['footR'][1]-=.022;bind['forward']=np.array([0.,0.,1.])
for side,source in [('L','l'),('R','r')]:
 hand=metric(shape[W[:,names.index('hand'+side)]>.8]);center=hand.mean(0);_,axes=np.linalg.eigh((hand-center).T@(hand-center));normal=axes[:,0]
 if normal[2]<0:normal=-normal
 direction=metric(joint(source+'-finger-3-1'))-metric(joint(source+'-hand'));direction/=np.linalg.norm(direction)
 bind['handDirection'+side]=direction;bind['handForward'+side]=normal;bind['foreArmForward'+side]=normal
children=['spine','chest','neck','head','neck','foreArmL','handL','foreArmL','foreArmR','handR','foreArmR','shinL','footL','shinR','footR',None,None]
def frame(k):
 a=bind[k]
 if k.startswith('foot') or k=='head':y=np.array([0.,1.,0.]);f=bind['forward']
 elif k.startswith('hand'):
  side=k[-1];y=bind['handDirection'+side];f=bind['handForward'+side]
 else:
  b=bind.get('wrist'+k[-1],bind[children[names.index(k)]]) if k.startswith('foreArm') else bind[children[names.index(k)]];y=b-a
  if k in ('head','handL','handR'):y=-y
  y/=np.linalg.norm(y);f=bind.get('foreArmForward'+k[-1],bind['forward']) if k.startswith('foreArm') else bind['forward']
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

parts=[];hidden=set()
def fitted(name,folder,stem,texture,material='matte',force=None,clip=None):
 global hidden
 p,u,f,g=obj(ROOT/folder/(stem+'.obj'));lines=(ROOT/folder/(stem+'.mhclo')).read_text().splitlines();active=False;rows=[];sc=np.ones(3);deleting=False
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
    hidden.update(v for v in range(start,end+1) if shape[v,1]>-2.25);i+=1
 assert len(rows)==len(p),(name,len(rows),len(p))
 pw=[]
 for i,a in enumerate(rows):
  if len(a)==1:idx=int(a[0]);p[i]=shape[idx];pw.append(W[idx])
  else:
   ix=np.array(list(map(int,a[:3])));bw=np.array(list(map(float,a[3:6])));p[i]=(shape[ix]*bw[:,None]).sum(0)+np.array(list(map(float,a[6:9])))*sc;pw.append((W[ix]*bw[:,None]).sum(0))
 pw=np.array(pw)
 if name=='kit':
  import subprocess
  with tempfile.TemporaryDirectory(prefix='rally-athlete-') as directory:
   fitting=Path(directory)/'kit.json';fitting.write_text(json.dumps({'body':shape[:13380].tolist(),'faces':[[v[0] for v in face] for g,face in faces if g=='body'],'kit':p.tolist(),'weights':W[:13380].tolist()}))
   subprocess.run(['/Applications/Blender.app/Contents/MacOS/Blender','--background','--factory-startup','--python',str(Path(__file__).with_name('fit-athlete-kit.py')),'--',str(fitting)],check=True,stdout=subprocess.DEVNULL)
   fitted_data=json.loads(fitting.with_suffix('.fitted.json').read_text());p=np.array(fitted_data['positions']);pw=np.array(fitted_data['weights'])
 if force is not None:pw[:]=0;pw[:,names.index(force)]=1
 if clip:
  # Clip triangles at a physical hem plane, interpolating both UVs and skin weights.
  positions=list(p);coords=list(u);influences=list(pw);clipped=[]
  for group,face in f:
   for j in range(1,len(face)-1):
    polygon=[face[0],face[j],face[j+1]];result=[]
    for previous,current in zip(polygon[-1:]+polygon[:-1],polygon):
     a,b=positions[previous[0]],positions[current[0]];insideA=a[1]>=clip;insideB=b[1]>=clip
     if insideA!=insideB:
      t=(clip-a[1])/(b[1]-a[1]);vi=len(positions);ui=len(coords);positions.append(a+(b-a)*t);coords.append(coords[previous[1]]+(coords[current[1]]-coords[previous[1]])*t);influences.append(influences[previous[0]]+(influences[current[0]]-influences[previous[0]])*t);result.append((vi,ui))
     if insideB:result.append(current)
    if len(result)>=3:clipped.append((group,result))
  p=np.array(positions);u=np.array(coords);pw=np.array(influences);f=clipped
 parts.append((name,p,u,f,pw,texture,material))
fitted('kit','clothes/female_sportsuit01','female_sportsuit01','kit.webp','performanceKnit',clip=-2.4)
fitted('shoes','clothes/shoes05','shoes05','shoes.webp','performanceKnit')
fitted('hair','hair/ponytail01','ponytail01','hair.webp','groomedHair',force='head')
fitted('eyes','eyes/high-poly','high-poly','eyes.webp','ceramic',force='head')
fitted('lashes','eyelashes/eyelashes01','eyelashes01','lashes.webp','groomedHair',force='head')
fitted('brows','eyebrows/eyebrow001','eyebrow001','brows.webp','groomedHair',force='head')
bodyfaces=[(g,f) for g,f in faces if g=='body' and not all(v[0] in hidden for v in f) and np.mean(shape[[v[0] for v in f],1])>-6.5]
parts.insert(0,('skin',shape,uv,bodyfaces,W,'skin.webp','humanSkin'))
# Keep only the clothed runtime mesh; covered torso/pelvis and helper geometry are absent.
textures={
 'skin.webp':SRC/'skins/skins/toigo_light_skin_with_natural_makeup/young_lightskinned_female_diffuse4.png',
 'kit.webp':ROOT/'clothes/female_sportsuit01/female_sportsuit01_diffuse.png',
 'shoes.webp':ROOT/'clothes/shoes05/shoes05_diffuse.png',
 'hair.webp':ROOT/'hair/ponytail01/ponytail01_diffuse.png',
 'eyes.webp':ROOT/'eyes/materials/brown_eye.png',
 'lashes.webp':ROOT/'eyelashes/eyelashes01/eyelashes01.png',
 'brows.webp':ROOT/'eyebrows/eyebrow001/eyebrow001.png'}
for name,p in textures.items():
 im=Image.open(p);im.thumbnail((2048,2048) if name=='skin.webp' else (1024,1024));im.save(OUT/name,'WEBP',quality=91,method=6)
doc={'asset':{'version':'2.0','generator':'Rally House authored athlete / MakeHuman CC0'},'accessors':[],'bufferViews':[],'buffers':[],'meshes':[],'materials':[],'textures':[],'images':[], 'nodes':[]};binary=bytearray()
def accessor(a,t,component=5126):
 a=np.array(a,dtype={5126:'<f4',5123:'<u2',5125:'<u4'}[component]);binary.extend(bytes((-len(binary))%4));offset=len(binary);binary.extend(a.tobytes());view=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':a.nbytes});ac={'bufferView':view,'componentType':component,'count':len(a),'type':t}
 if t=='VEC3':ac.update(min=a.min(0).tolist(),max=a.max(0).tolist())
 doc['accessors'].append(ac);return len(doc['accessors'])-1
inverse=accessor([np.linalg.inv(m).T.flatten() for m in frames],'MAT4')
for n,m in zip(names,frames):doc['nodes'].append({'name':n,'matrix':m.T.flatten().tolist()})
doc['skins']=[{'joints':list(range(17)),'inverseBindMatrices':inverse}]
report=[]
for name,p,u,f,w,tex,mat in parts:
 normal=np.zeros_like(p)
 for _,face in f:
  ids=[v[0] for v in face];n=np.cross(p[ids[1]]-p[ids[0]],p[ids[2]]-p[ids[0]])
  normal[ids]+=n
 normal/=np.maximum(np.linalg.norm(normal,axis=1)[:,None],1e-12)
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
 ti=len(doc['textures']);doc['images'].append({'uri':tex});doc['textures'].append({'source':ti});doc['materials'].append({'name':name,'pbrMetallicRoughness':{'baseColorTexture':{'index':ti},'metallicFactor':0,'roughnessFactor':.75},'doubleSided':name in ('hair','brows','lashes','eyes'),'alphaMode':'MASK' if name in ('hair','brows','lashes','eyes') else 'OPAQUE','alphaCutoff':.35})
 attrs={'POSITION':accessor(pos,'VEC3'),'NORMAL':accessor(norm,'VEC3'),'TEXCOORD_0':accessor(uvs,'VEC2'),'JOINTS_0':accessor(bi,'VEC4',5123),'WEIGHTS_0':accessor(bw,'VEC4')}
 primitive={'attributes':attrs,'indices':accessor(np.array(tri).flatten(),'SCALAR',5125),'material':ti};extras={}
 if name in ('skin','lashes','brows'):
  q=np.array(pos)/np.array([-scale,scale,scale])+np.array([0,floor,0]);x,y,z=q.T;front=np.clip((z-.95)/.25,0,1);d=np.zeros((5,len(pos),3));gauss=lambda cx,cy,rx,ry:np.exp(-((abs(x)-cx)/rx)**2-((y-cy)/ry)**2)*front
  corner=gauss(.235,5.53,.15,.16);d[0,:,0]=np.sign(x)*.018*corner;d[0,:,1]=.035*corner+.015*gauss(0,5.5,.4,.28)
  jaw=gauss(0,5.29,.5,.33);d[1,:,1]=-.10*jaw;d[1,:,2]=.018*jaw
  lid=gauss(.292,6.245,.16,.115);d[2,:,1]=np.where(y>=6.18,-.13*lid,.025*gauss(.292,6.11,.16,.065))
  if name=='brows':d[2]=0
  if name=='lashes':d[2,:,1]=np.where(y>=6.18,-.13*np.exp(-((abs(x)-.292)/.16)**2),.025*np.exp(-((abs(x)-.292)/.16)**2))
  d[3,:,1]=.085*gauss(.30,6.46,.24,.15)
  if name=='skin':d[4]=grip_delta[source_ids]
  grip_normals=None
  if name=='skin':
   closed=p+grip_delta;closed_normals=np.zeros_like(p)
   for _,face in f:
    ids=[v[0] for v in face];n=np.cross(closed[ids[1]]-closed[ids[0]],closed[ids[2]]-closed[ids[0]]);closed_normals[ids]+=n
   closed_normals/=np.maximum(np.linalg.norm(closed_normals,axis=1)[:,None],1e-12);grip_normals=(closed_normals[source_ids]-normal[source_ids])*np.array([-1,1,1])
  primitive['targets']=[{'POSITION':accessor(delta*np.array([-scale,scale,scale]),'VEC3')} for delta in d];extras={'targetNames':['smile','mouthOpen','blink','browRaise','grip']}
  if grip_normals is not None:primitive['targets'][4]['NORMAL']=accessor(grip_normals,'VEC3')
 doc['meshes'].append({'name':name,'primitives':[primitive],'extras':extras});doc['nodes'].append({'mesh':len(doc['meshes'])-1,'skin':0});report.append({'name':name,'triangles':len(tri),'vertices':len(pos),'material':mat})
doc['scenes']=[{'nodes':list(range(len(doc['nodes'])))}];doc['scene']=0;doc['buffers']=[{'byteLength':len(binary)}];binary.extend(bytes((-len(binary))%4));j=json.dumps(doc,separators=(',',':')).encode();j+=b' '*((-len(j))%4);glb=struct.pack('<III',0x46546c67,2,28+len(j)+len(binary))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(binary),0x004e4942)+binary;(OUT/'taylor.glb').write_bytes(glb)
meta={'author':'MakeHuman Community; MargaretToigo; Rally House fit and runtime adaptation','source':'https://github.com/makehumancommunity/makehuman/tree/a8bc2d54ff0ac92e78ff71431b1023eda42bf482','license':'CC0-1.0','sha256':hashlib.sha256(glb).hexdigest(),'boneMap':{n:n for n in names},'bind':{k:v.tolist() for k,v in bind.items()},'parts':report,'textures':{name:hashlib.sha256((OUT/name).read_bytes()).hexdigest() for name in textures},'sourceHashes':{str(p.relative_to(SRC)) if p.is_relative_to(SRC) else str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [SRC/'base.obj',SRC/'default_weights.mhw',*textures.values()]}}
meta['gripSign']=grip_sign
meta['assetPacks']=['https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html','https://static.makehumancommunity.org/assets/assetpacks/skins01.html']
for p in [*SRC.glob('*.target'),*[p for folder in ['clothes/female_sportsuit01','clothes/shoes05','hair/ponytail01','eyes/high-poly','eyelashes/eyelashes01','eyebrows/eyebrow001'] for p in (ROOT/folder).iterdir() if p.suffix in ('.obj','.mhclo')]]:meta['sourceHashes'][str(p.relative_to(SRC)) if p.is_relative_to(SRC) else str(p.relative_to(ROOT))]=hashlib.sha256(p.read_bytes()).hexdigest()
meta['authoringScripts']={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [Path(__file__),Path(__file__).with_name('fit-athlete-kit.py')]}
(OUT/'provenance.json').write_text(json.dumps(meta,indent=2)+'\n');print(json.dumps(report));print('triangles',sum(p['triangles'] for p in report),'glb',len(glb))
