"""Package the reviewed numeric head fit; source textures remain unchanged."""
import argparse, hashlib, json, shutil, struct
from pathlib import Path
import numpy as np
from PIL import Image
from collections import Counter

parser = argparse.ArgumentParser()
parser.add_argument('fit', type=Path)
parser.add_argument('textures', type=Path)
parser.add_argument('body', type=Path)
parser.add_argument('output', type=Path)
args = parser.parse_args()
source = json.loads(args.fit.read_text())
body = json.loads(args.body.read_text())
out = args.output
out.mkdir(parents=True, exist_ok=True)
doc = {'asset': {'version': '2.0', 'generator': 'Rally House / reviewed head fit'}, 'accessors': [], 'bufferViews': [], 'meshes': [], 'materials': [], 'nodes': [{'name': name} for name in ['head','neck','chest','upperArmL','upperArmR']]}
binary = bytearray()

def accessor(values, kind, component=5126):
    a = np.asarray(values, dtype={5126: '<f4', 5123: '<u2'}[component])
    binary.extend(bytes((-len(binary)) % 4))
    offset = len(binary)
    binary.extend(a.tobytes())
    doc['bufferViews'].append({'buffer': 0, 'byteOffset': offset, 'byteLength': a.nbytes})
    entry = {'bufferView': len(doc['bufferViews']) - 1, 'componentType': component, 'count': len(a), 'type': kind}
    if kind == 'VEC3':
        entry.update(min=a.min(0).tolist(), max=a.max(0).tolist())
    doc['accessors'].append(entry)
    return len(doc['accessors']) - 1

doc['skins'] = [{'joints': list(range(5)), 'inverseBindMatrices': accessor([np.eye(4).flatten() for _ in range(5)], 'MAT4')}]
doc['images'] = [{'uri': 'head-skin.webp'}, {'uri': 'head-hair.webp'}]
doc['textures'] = [{'source': 0}, {'source': 1}]
# Fit the donor's open neck loop to the existing garment's actual collar, retaining its native influences.
face = next(part for part in source['parts'] if part['kind']=='face')
points = (np.array(face['p']).reshape(-1,3)-[0,.018,.1])*.68+[0,.018,.1]
unique,indices = np.unique(np.round(points,6),axis=0,return_inverse=True)
edges = Counter(tuple(sorted((int(t[a]),int(t[b])))) for t in indices.reshape(-1,3) for a,b in [(0,1),(1,2),(2,0)])
rim = {v for edge,count in edges.items() if count==1 for v in edge}
source_loop = unique[sorted(rim)]
assert len(source_loop)==20 and source_loop[:,1].max()<-.1
center = (source_loop.min(0)+source_loop.max(0))*.5
source_loop = source_loop[np.argsort(np.arctan2(source_loop[:,0]-center[0],source_loop[:,2]-center[2]))]
target_loop = np.array([row['position'] for row in body['neckContour']])
target_weights = np.zeros((len(target_loop),5))
for i,row in enumerate(body['neckContour']):
    for bone,weight in zip(row['joints'],row['weights']):
        if weight>1e-6:
            assert bone in [4,3,2,5,8]
            target_weights[i,[4,3,2,5,8].index(bone)] += weight
assert np.max(np.abs(target_weights.sum(1)-1))<1e-5

def ray_loop(loop,directions):
    center=(loop.min(0)+loop.max(0))*.5
    best=np.full(len(directions),np.inf);points=np.zeros((len(directions),3));weights=np.zeros((len(directions),5))
    for j in range(len(loop)):
        a,b=loop[j],loop[(j+1)%len(loop)];delta=b-a;v=a-center
        det=directions[:,0]*delta[2]-directions[:,1]*delta[0]
        safe=np.where(np.abs(det)>1e-12,det,np.inf)
        distance=(v[0]*delta[2]-v[2]*delta[0])/safe
        t=(v[0]*directions[:,1]-v[2]*directions[:,0])/safe
        valid=(distance>0)&(distance<best)&(t>=-1e-6)&(t<=1+1e-6)&(np.abs(det)>1e-12)
        best[valid]=distance[valid];points[valid]=a+t[valid,None]*delta
        if loop is target_loop:weights[valid]=target_weights[j]+t[valid,None]*(target_weights[(j+1)%len(loop)]-target_weights[j])
    assert np.isfinite(best).all()
    return points,weights

def collar_field(p):
    center=(source_loop.min(0)+source_loop.max(0))*.5
    directions=p[:,[0,2]]-center[[0,2]];length=np.linalg.norm(directions,axis=1)
    directions[length<1e-10]=[0,1];length[length<1e-10]=1;directions/=length[:,None]
    a,_=ray_loop(source_loop,directions);b,weights=ray_loop(target_loop,directions)
    # The skin ends just inside and below the garment edge, so no second cap or visible overlap is needed.
    target_center=(target_loop.min(0)+target_loop.max(0))*.5
    inward=target_center[[0,2]]-b[:,[0,2]];inward/=np.linalg.norm(inward,axis=1)[:,None]
    b[:,[0,2]]+=inward*.008;b[:,1]-=.020;b-=body['bind']['head']
    fraction=np.clip((-.095-p[:,1])/(-.095-a[:,1]),0,1)
    t=np.clip((fraction-.2)/.8,0,1);blend=t*t*(3-2*t)
    # Protect the visible jaw; the join only reshapes skin beneath it.
    jaw_y=np.clip((p[:,1]+.18)/.04,0,1);jaw_z=np.clip((p[:,2]-.07)/.04,0,1)
    blend*=1-(jaw_y*jaw_y*(3-2*jaw_y))*(jaw_z*jaw_z*(3-2*jaw_z))
    q=p+(b-a)*blend[:,None]
    weights*=blend[:,None];weights[:,0]+=1-blend
    return q,weights

def collar_fit(p,n):
    q,weights=collar_field(p);columns=[]
    for axis in range(3):
        shifted=p.copy();shifted[:,axis]+=1e-5;columns.append((collar_field(shifted)[0]-q)/1e-5)
    jac=np.stack(columns,axis=2);minimum=np.linalg.det(jac).min()
    assert minimum>.05, minimum
    nn=np.linalg.solve(jac.transpose(0,2,1),n[:,:,None])[:,:,0];nn/=np.linalg.norm(nn,axis=1)[:,None]
    return q,nn,weights

# Eye width was consistently too small across the four reference views. Apply the
# same local field to the lids, eye surfaces, brows and expression targets.
# shortcut: these orbital bounds fit the current head; remeasure if its source changes.
eye_centres=np.asarray(source['eyeStudyCenters'])
def orbital_field(p):
    centre=eye_centres[(p[:,0]>=0).astype(int)];d=p-centre
    def smooth(t):
        t=np.clip(t,0,1);return t*t*(3-2*t)
    weight=(1-smooth((np.abs(d[:,0])-.025)/.018))*(1-smooth((np.abs(d[:,1])-.012)/.028))*smooth((p[:,2]-.065)/.035)*smooth((np.abs(p[:,0])-.002)/.022)
    return p+d*np.array([.16,.16,0])*weight[:,None],weight

def orbital_normals(p,n):
    q,weight=orbital_field(p);columns=[]
    for axis in range(3):
        sample=p.copy();sample[:,axis]+=1e-6;columns.append((orbital_field(sample)[0]-q)/1e-6)
    jac=np.stack(columns,axis=2)
    assert np.linalg.det(jac).min()>.5, 'Orbital fit compresses or folds the surface'
    result=n.copy();mask=weight>0
    result[mask]=np.linalg.solve(jac[mask].transpose(0,2,1),n[mask,:,None])[:,:,0]
    result[mask]/=np.linalg.norm(result[mask],axis=1)[:,None]
    return result

skin_pixels=np.asarray(Image.open(args.textures/'male-skin.webp').convert('RGB'))

def write_part(kind,p,n,uv,morphs,normals,influences):
    # Deduplicate with every expression and UV included, retaining seams and authored blink normals.
    all_values = np.concatenate([p, n, uv, morphs.transpose(1, 0, 2).reshape(len(p), -1), normals.transpose(1, 0, 2).reshape(len(p), -1)], 1)
    _, unique, indices = np.unique(all_values, axis=0, return_index=True, return_inverse=True)
    assert len(unique) < 65536
    joints=np.argsort(influences[unique],axis=1)[:,-4:][:,::-1]
    weights=np.take_along_axis(influences[unique],joints,axis=1);weights/=weights.sum(1)[:,None]
    attrs = {'POSITION': accessor(p[unique], 'VEC3'), 'NORMAL': accessor(n[unique], 'VEC3'), 'JOINTS_0': accessor(joints, 'VEC4', 5123), 'WEIGHTS_0': accessor(weights, 'VEC4')}
    material = {'name': kind, 'doubleSided': kind in ['hair', 'browCore', 'browStrands'], 'pbrMetallicRoughness': {'metallicFactor': 0, 'roughnessFactor': .75}}
    if kind in ['face', 'scalp', 'eyes', 'hair']:
        attrs['TEXCOORD_0'] = accessor(uv[unique], 'VEC2')
        material['pbrMetallicRoughness']['baseColorTexture'] = {'index': 1 if kind == 'hair' else 0}
    if kind == 'hair':
        material.update(alphaMode='MASK', alphaCutoff=.5)
    doc['materials'].append(material)
    targets = [{'POSITION': accessor(m[unique], 'VEC3'), 'NORMAL': accessor(nn[unique], 'VEC3')} for m, nn in zip(morphs, normals)]
    doc['meshes'].append({'name': kind, 'extras': {'targetNames': ['smile', 'mouthOpen', 'blink', 'browRaise', 'grip']}, 'primitives': [{'attributes': attrs, 'indices': accessor(indices, 'SCALAR', 5123), 'material': len(doc['materials']) - 1, 'targets': targets}]})
    doc['nodes'].append({'mesh': len(doc['meshes']) - 1, 'skin': 0})
    counts.append({'material': kind, 'triangles': len(p) // 3, 'vertices': len(unique)})

counts = []
for part in source['parts']:
    kind = part['kind']
    if kind not in ['face', 'eyes', 'hair', 'browCore', 'browStrands']:
        continue
    p = np.array(part['p']).reshape(-1, 3)
    # Match the inspected study's head registration, without altering the accepted gameplay skeleton.
    p = (p - [0, .018, .1]) * .68 + [0, .018, .1]
    n = np.array(part['n']).reshape(-1, 3)
    uv = np.array(part['uv']).reshape(-1, 2)
    morphs = np.array(part['morphs']).reshape(5, -1, 3) * .68
    normals = np.array(part['morphNormals']).reshape(5, -1, 3)
    if kind in ['face','eyes','browCore','browStrands']:
        fitted=orbital_field(p)[0];fitted_normal=orbital_normals(p,n)
        for channel in range(5):
            posed=p+morphs[channel]
            morphs[channel]=orbital_field(posed)[0]-fitted
            normals[channel]=orbital_normals(posed,n+normals[channel])-fitted_normal
        p,n=fitted,fitted_normal
    if kind=='face':
        # The donor atlas paints long hair onto the nape; sample its clean neck patch beneath the short haircut.
        blend=np.clip((-.10-p[:,1])/.035,0,1);blend=blend*blend*(3-2*blend)
        rear=np.clip((.015-p[:,2])/.065,0,1);blend*=rear*rear*(3-2*rear)
        patch=np.column_stack([.5+p[:,0]*1.2,.62+(-.12-p[:,1])*.5])
        uv=uv+(patch-uv)*blend[:,None]
    influences=np.zeros((len(p),5));influences[:,0]=1
    if kind=='face':
        fitted,fitted_normal,influences=collar_fit(p,n)
        for channel in range(5):
            posed,posed_normal,_=collar_fit(p+morphs[channel],n+normals[channel])
            morphs[channel]=posed-fitted;normals[channel]=posed_normal-fitted_normal
        p,n=fitted,fitted_normal
    if kind=='hair':
        # Cards light as one hair volume, while their original orientation still supports two-sided rendering.
        distance=np.sum((p[:,None]-scalp_points[None,:])**2,axis=2)
        nearest=np.argsort(distance,axis=1)[:,:4]
        weight=1/np.maximum(np.take_along_axis(distance,nearest,axis=1),1e-7)
        weight/=weight.sum(1,keepdims=True)
        assert np.sqrt(distance.min(1)).max()<.08, 'Hair cards are detached from the scalp'
        def transfer(values):
            v=(values[nearest]*weight[:,:,None]).sum(1)
            return v/np.linalg.norm(v,axis=1)[:,None]
        # Tuck raised crown cards toward the scalp while retaining their UVs and front hairline.
        direction=transfer(scalp_normals)
        t=np.clip((p[:,1]-.02)/.06,0,1);blend=t*t*(3-2*t)
        def snug(points,scalp):
            anchor=(scalp[nearest]*weight[:,:,None]).sum(1)
            gap=((points-anchor)*direction).sum(1)
            return points-direction*np.minimum(np.maximum(gap-.008,0),.018)[:,None]*blend[:,None]
        fitted=snug(p,scalp_points)
        for channel in range(5):morphs[channel]=snug(p+morphs[channel],scalp_points+scalp_morphs[channel])-fitted
        old=p.reshape(-1,3,3);new=fitted.reshape(-1,3,3)
        area=lambda q:np.cross(q[:,1]-q[:,0],q[:,2]-q[:,0])
        old_area,new_area=area(old),area(new)
        ratio=np.linalg.norm(new_area,axis=1)/np.linalg.norm(old_area,axis=1)
        print('Crown max tuck / minimum area ratio',np.linalg.norm(fitted-p,axis=1).max(),ratio.min())
        assert ratio.min()>.15 and (old_area*new_area).sum(1).min()>0
        p=fitted
        fitted_normal=transfer(scalp_normals)
        sign=np.where((fitted_normal*n).sum(1)<0,-1,1)[:,None]
        for channel in range(5):
            normals[channel]=(transfer(scalp_normals+scalp_morph_normals[channel])-fitted_normal)*sign
        n=fitted_normal*sign
        assert np.isfinite(n).all() and np.max(np.abs(np.linalg.norm(n,axis=1)-1))<1e-6
    assert np.isfinite(p).all() and np.isfinite(morphs).all()
    assert np.max(np.abs(morphs)) <= .06 and np.max(np.abs(normals)) <= 2.01
    if kind=='face':
        # A canonical fingerprint proves that the material cut retains the original surface and all expressions.
        rows=np.concatenate([p,n,uv,*morphs,*normals],axis=1).astype('<f4').reshape(-1,114)
        source_face_sha=hashlib.sha256(b''.join(sorted(row.tobytes() for row in rows))).hexdigest()
        samples=np.concatenate([uv.reshape(-1,3,2),uv.reshape(-1,3,2).mean(1,keepdims=True)],axis=1)
        xy=np.clip((samples*[skin_pixels.shape[1],skin_pixels.shape[0]]).astype(int),0,np.array([skin_pixels.shape[1]-1,skin_pixels.shape[0]-1]))
        red=skin_pixels[xy[:,:,1],xy[:,:,0],0]/255
        tri=p.reshape(-1,3,3)
        # shortcut: this cut is calibrated to the pinned generic atlas; author an explicit mask when that atlas changes.
        region=((tri[:,:,1]>.045)|(tri[:,:,2]<.07))&(tri[:,:,1]>-.14)
        scalp=(red<.50).all(1)&region.all(1)
        assert 100<scalp.sum()<len(scalp)/2, 'Unexpected scalp/face atlas registration'
        scalp_ids=np.flatnonzero(np.repeat(scalp,3))
        _,unique=np.unique(np.round(p[scalp_ids],6),axis=0,return_index=True)
        scalp_ids=scalp_ids[unique]
        scalp_points,scalp_normals,scalp_morph_normals=p[scalp_ids],n[scalp_ids],normals[:,scalp_ids]
        scalp_morphs=morphs[:,scalp_ids]
        for slot,mask in [('face',~scalp),('scalp',scalp)]:
            ids=np.flatnonzero(np.repeat(mask,3))
            write_part(slot,p[ids],n[ids],uv[ids],morphs[:,ids],normals[:,ids],influences[ids])
    else:
        write_part(kind,p,n,uv,morphs,normals,influences)

doc.update(scenes=[{'nodes': list(range(len(doc['nodes'])))}], scene=0, buffers=[{'byteLength': len(binary)}])
binary.extend(bytes((-len(binary)) % 4))
j = json.dumps(doc, separators=(',', ':')).encode(); j += b' ' * ((-len(j)) % 4)
glb = struct.pack('<III', 0x46546c67, 2, 28 + len(j) + len(binary)) + struct.pack('<II', len(j), 0x4e4f534a) + j + struct.pack('<II', len(binary), 0x004e4942) + binary
(out / 'head.glb').write_bytes(glb)
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
for kind in ['skin', 'hair']:
    shutil.copyfile(args.textures / ('male-' + kind + '.webp'), out / ('head-' + kind + '.webp'))
centres = np.array(source['eyeStudyCenters'])
eyes = next(p for p in source['parts'] if p['kind'] == 'eyes')
ep = (np.array(eyes['p']).reshape(-1, 3) - [0, .018, .1]) * .68 + [0, .018, .1]
for i, side in enumerate([-1, 1]):
    points = ep[ep[:, 0] * side > 0]
    centres[i, 2] = (points[:, 2].min() + points[:, 2].max()) * .5
metadata = {'author': 'Microsoft Rocketbox; Rally House geometry fitting and rig adaptation', 'source': 'https://github.com/microsoft/Microsoft-Rocketbox/tree/0943055db6ec570bcef9f2c8b41c9e5467c808f9', 'license': 'MIT', 'sha256': sha(out / 'head.glb'), 'sourceAsset': 'Male_Adult_02_facial.fbx', 'neckBoundaryVertices': len(source_loop), 'bodySha256': body['sha256'], 'boneMap': {name:name for name in ['head','neck','chest','upperArmL','upperArmR']}, 'eyeCenters': centres.tolist(), 'parts': counts, 'sourceFaceGeometrySha256': source_face_sha, 'textures': {name: sha(out / name) for name in ['head-skin.webp', 'head-hair.webp']}, 'sourceHashes': {p.name: sha(p) for p in [args.fit, args.body, args.textures / 'Male_Adult_02_facial.fbx', args.textures / 'm003_head_color.tga', args.textures / 'm003_opacity_color.tga']}, 'authoringScriptSha256': sha(Path(__file__)), 'limit': 'Multi-view landmark geometry fit on a licensed generic head, not a scan or an approved personal likeness. Original generic texture images unchanged; no user photographs shipped.'}
(out / 'head-provenance.json').write_text(json.dumps(metadata, indent=2) + '\n')
print(json.dumps({'parts': counts, 'bytes': len(glb), 'eyeCenters': centres.tolist()}))
