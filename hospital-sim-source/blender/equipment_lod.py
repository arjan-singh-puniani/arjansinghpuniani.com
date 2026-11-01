"""Original Common Good equipment LOD pipeline, CC0-1.0; substantial Codex assistance.
Blender4.0: -b --python blender/equipment_lod.py
Preserves source GLBs and source-node transforms/materials/embedded image bytes.
"""
import bpy,math,json,struct,hashlib,copy,sys
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'evidence/equipment-lod';LIMITS={'scan':22000,'care':18000,'consult':24000}

def read_glb(path):
    raw=path.read_bytes();n=struct.unpack_from('<I',raw,12)[0];return json.loads(raw[20:20+n]),raw[28+n:]

def triangles(obj):return sum(len(face.vertices)-2 for face in obj.data.polygons)

def snapshot():
    paths=[p for p in (ROOT/'dist/assets').rglob('*')if p.is_file()and p.name not in [n+'-lod.glb'for n in LIMITS]]
    paths+=[p for p in(ROOT/'blender').iterdir()if p.suffix in ['.py','.blend']and not p.name.startswith('equipment_lod')]
    return {str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest()for p in paths}

def isolate(collection,objects):
    for obj in objects:
        for old in list(obj.users_collection):old.objects.unlink(obj)
        collection.objects.link(obj)

def split_components(obj):
    bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.remove_doubles(threshold=.000001)
    bpy.ops.mesh.separate(type='LOOSE');bpy.ops.object.mode_set(mode='OBJECT')
    return [o for o in bpy.context.selected_objects if o.type=='MESH']

def component_info(obj):
    n=triangles(obj);points=[v.co for v in obj.data.vertices]
    dims=[max(p[i]for p in points)-min(p[i]for p in points)for i in range(3)]
    protected=n<=120 or(n<=400 and min(dims)<.016)
    return n,protected

def merge_components(parts,name):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in parts:obj.select_set(True)
    bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();obj=bpy.context.object;obj.name=name;obj.data.validate(clean_customdata=False);obj.data.update();return obj

def build_bvh(objects):
    vertices=[];faces=[]
    for obj in objects:
        start=len(vertices);vertices.extend(tuple(obj.matrix_world@v.co)for v in obj.data.vertices)
        faces.extend(tuple(start+i for i in p.vertices)for p in obj.data.polygons)
    return BVHTree.FromPolygons(vertices,faces,all_triangles=False)

def sample_error(a,b):
    tree=build_bvh(b);errors=[]
    for obj in a:
        stride=max(1,len(obj.data.vertices)//512)
        for index in range(0,len(obj.data.vertices),stride):
            vertex=obj.data.vertices[index]
            hit=tree.find_nearest(obj.matrix_world@vertex.co)
            if hit[0]is not None:errors.append(hit[3])
    return {'samples':len(errors),'maximum_metres':max(errors,default=0),'mean_metres':sum(errors)/max(1,len(errors))}

def embedded_images(doc,binary):
    return [binary[doc['bufferViews'][i['bufferView']].get('byteOffset',0):doc['bufferViews'][i['bufferView']].get('byteOffset',0)+doc['bufferViews'][i['bufferView']]['byteLength']]for i in doc.get('images',[])]

def preserve_package(original,original_binary,lod,lod_binary,path):
    """Use only LOD geometry; retain canonical scene/material data and exact texture bytes."""
    result=copy.deepcopy(original);result['accessors']=[];result['bufferViews']=[];binary=bytearray();views={};accessors={}
    def add_view(doc,blob,index,source):
        key=(source,index)
        if key in views:return views[key]
        while len(binary)%4:binary.append(0)
        view=copy.deepcopy(doc['bufferViews'][index]);start=view.get('byteOffset',0);data=blob[start:start+view['byteLength']]
        view['buffer']=0;view['byteOffset']=len(binary);binary.extend(data);result['bufferViews'].append(view);views[key]=len(result['bufferViews'])-1;return views[key]
    def add_accessor(doc,blob,index,source):
        key=(source,index)
        if key in accessors:return accessors[key]
        a=copy.deepcopy(doc['accessors'][index]);assert 'sparse'not in a;a['bufferView']=add_view(doc,blob,a['bufferView'],source)
        result['accessors'].append(a);accessors[key]=len(result['accessors'])-1;return accessors[key]
    lod_nodes={n['name']:n for n in lod['nodes']if'mesh'in n}
    for original_node in original['nodes']:
        if 'mesh'not in original_node:continue
        target=result['meshes'][original_node['mesh']];source_node=lod_nodes[original_node['name']]
        for field,default in [('translation',[0,0,0]),('rotation',[0,0,0,1]),('scale',[1,1,1])]:
            assert max(abs(a-b)for a,b in zip(original_node.get(field,default),source_node.get(field,default)))<2e-5,(original_node['name'],field)
        old=original['meshes'][original_node['mesh']]['primitives'];new=lod['meshes'][source_node['mesh']]['primitives'];assert len(old)==len(new)==1
        protected='Diagnostic glass'in original['materials'][old[0]['material']]['name']
        doc,blob,tag,p=(original,original_binary,'original',old[0])if protected else(lod,lod_binary,'lod',new[0])
        primitive=copy.deepcopy(p);primitive['material']=old[0]['material'];primitive['attributes']={name:add_accessor(doc,blob,index,tag)for name,index in p['attributes'].items()};primitive['indices']=add_accessor(doc,blob,p['indices'],tag)
        target['primitives']=[primitive]
    for image in result.get('images',[]):image['bufferView']=add_view(original,original_binary,image['bufferView'],'original')
    result['buffers']=[{'byteLength':len(binary)}]
    payload=json.dumps(result,separators=(',',':'),ensure_ascii=False).encode();payload+=b' '*((-len(payload))%4);binary.extend(b'\0'*((-len(binary))%4))
    path.write_bytes(struct.pack('<III',0x46546c67,2,12+8+len(payload)+8+len(binary))+struct.pack('<II',len(payload),0x4e4f534a)+payload+struct.pack('<II',len(binary),0x004e4942)+binary)
    assert result['nodes']==original['nodes']and result.get('materials')==original.get('materials')and embedded_images(result,binary)==embedded_images(original,original_binary)
    return result

def build_zone(name):
    doc,blob=read_glb(ROOT/'dist/assets'/(name+'.glb'));before=set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(ROOT/'dist/assets'/(name+'.glb')));bpy.context.view_layer.update()
    originals=[o for o in bpy.context.scene.objects if o not in before and o.type=='MESH'];by_name={o.name:o for o in originals}
    assert set(by_name)=={n['name']for n in doc['nodes']if'mesh'in n}
    original_collection=bpy.data.collections.new(name+' original');bpy.context.scene.collection.children.link(original_collection);isolate(original_collection,originals)
    lod_collection=bpy.data.collections.new(name+' LOD');bpy.context.scene.collection.children.link(lod_collection)
    groups=[];protected_triangles=0;eligible_triangles=0;component_count=0;protected_count=0
    original_count=sum(doc['accessors'][p['indices']]['count']//3 for mesh in doc['meshes']for p in mesh['primitives'])
    for node in doc['nodes']:
        if'mesh'not in node:continue
        original=by_name[node['name']];original.name='Original__'+node['name'];obj=original.copy();obj.data=original.data.copy();lod_collection.objects.link(obj);obj.name=node['name']
        material=doc['materials'][doc['meshes'][node['mesh']]['primitives'][0]['material']]['name'];glass='Diagnostic glass'in material
        parts=[obj]if glass else split_components(obj);stats=[]
        for part in parts:
            count,protected=component_info(part);protected=protected or glass
            protected_triangles+=count if protected else 0;eligible_triangles+=0 if protected else count
            component_count+=1;protected_count+=int(protected);stats.append((part,count,protected))
        groups.append((node['name'],stats))
    ratio=max(.32,min(.72,(original_count*.595-protected_triangles)/max(1,eligible_triangles)))
    lod_objects=[]
    for canonical_name,stats in groups:
        parts=[]
        for obj,count,protected in stats:
            if not protected:
                bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
                dec=obj.modifiers.new('Normal-camera equipment LOD','DECIMATE');dec.ratio=ratio;dec.use_collapse_triangulate=True;bpy.ops.object.modifier_apply(modifier=dec.name)
                obj.data.validate(clean_customdata=False);obj.data.update()
            parts.append(obj)
        lod_objects.append(merge_components(parts,canonical_name))
    bpy.context.view_layer.update();lod_count=sum(triangles(o)for o in lod_objects);assert lod_count<=LIMITS[name],(name,lod_count,LIMITS[name])
    bpy.ops.object.select_all(action='DESELECT')
    for obj in lod_objects:obj.select_set(True)
    temp=Path('/tmp')/('common-good-'+name+'-lod-geometry.glb')
    bpy.ops.export_scene.gltf(filepath=str(temp),export_format='GLB',use_selection=True,export_animations=False,export_yup=True,export_extras=True,export_draco_mesh_compression_enable=False)
    ld,lb=read_glb(temp);target=ROOT/'dist/assets'/(name+'-lod.glb');result=preserve_package(doc,blob,ld,lb,target);temp.unlink()
    final_count=sum(result['accessors'][p['indices']]['count']//3 for mesh in result['meshes']for p in mesh['primitives'])
    report={'original_triangles':original_count,'lod_triangles':final_count,'reduction_percent':100*(1-final_count/original_count),'raw_bytes':target.stat().st_size,'component_count':component_count,'protected_components':protected_count,'protected_triangles':protected_triangles,'eligible_collapse_ratio':ratio,'lod_to_original_sampled_surface_error':sample_error(lod_objects,originals),'original_to_lod_sampled_surface_error':sample_error(originals,lod_objects),'node_transforms_exact':True,'materials_exact':True,'texture_bytes_exact':True,'texture_sha256':[hashlib.sha256(i).hexdigest()for i in embedded_images(doc,blob)],'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
    if name=='scan':
        a=build_bvh(originals);b=build_bvh(lod_objects);clearance=[]
        for x,z in [(-.55,1.09),(-.35,1.09),(-.75,1.09),(-.55,1.29)]:
            origin=Vector((x,-.1,z));direction=Vector((0,1,0));old=a.ray_cast(origin,direction,1.35)[0];new=b.ray_cast(origin,direction,1.35)[0]
            if old is None:assert new is None,('bore blocked',x,z)
            clearance.append({'x':x,'height':z,'original_clear':old is None,'lod_clear':new is None})
        report['bore_clearance_rays']=clearance
    original_collection.hide_viewport=True;original_collection.hide_render=True;lod_collection.hide_viewport=name!='scan';lod_collection.hide_render=name!='scan'
    print('EQUIPMENT_LOD_ZONE_PASS',name,json.dumps(report),flush=True);return report

def main():
    OUT.mkdir(parents=True,exist_ok=True);baseline=snapshot()
    for obj in list(bpy.context.scene.objects):bpy.data.objects.remove(obj,do_unlink=True)
    bpy.context.scene.unit_settings.system='METRIC';report={'blender_version':bpy.app.version_string,'license':'CC0-1.0','provenance':'LOD adaptation of original Common Good equipment; substantial OpenAI Codex assistance','target':'Normal gameplay orthographic camera; small/thin components and screen geometry protected','zones':{}}
    for name in LIMITS:report['zones'][name]=build_zone(name)
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/equipment_lod.blend'),compress=True)
    assert all(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==sha for name,sha in baseline.items())
    report['original_file_hashes_unchanged']=baseline;(OUT/'checks.json').write_text(json.dumps(report,indent=2)+'\n');print('EQUIPMENT_LOD_BUILD_PASS',flush=True)

if __name__=='__main__':main()
