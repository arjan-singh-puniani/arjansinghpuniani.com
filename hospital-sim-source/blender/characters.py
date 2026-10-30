"""Common Good original human assets. CC0-1.0; substantial OpenAI Codex assistance.
Blender 4.0: blender -b --python blender/characters.py
Metres; feet at z=0; forward -Y; glTF forward +Z. No third-party assets.
"""
import bpy, math, os, sys
from mathutils import Vector, Matrix, Quaternion
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'dist' / 'assets'
PARTS=[]
WALK_DURATION=.90
WALK_SPEED=1.65
WALK_FRAMES=27
TRANSFER_DURATION=3.0
CLIPS=('Idle','Walk','Sit','Work','Discuss','Attend','Rest','TransferIn','TransferOut')

def material(name,color,roughness=.55,metal=0):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Roughness'].default_value=roughness; p.inputs['Metallic'].default_value=metal
    return m

def finish(obj,mat,bone):
    obj.data.materials.append(mat)
    if bone: obj.vertex_groups.new(name=bone).add(list(range(len(obj.data.vertices))),1,'REPLACE')
    for poly in obj.data.polygons: poly.use_smooth=True
    PARTS.append(obj)
    return obj

def surface(name,rings,mat,bone,n=20):
    # Smooth cross-section lofts carry actual anatomy and clothing folds.
    verts=[]; faces=[]
    for z,rx,ry,cy in rings:
        for i in range(n):
            a=2*math.pi*i/n; verts.append((rx*math.cos(a),cy+ry*math.sin(a),z))
    for j in range(len(rings)-1):
        for i in range(n):
            k=j*n+i; q=j*n+(i+1)%n; faces.append((k,q,q+n,k+n))
    faces.extend([tuple(range(n-1,-1,-1)),tuple((len(rings)-1)*n+i for i in range(n))])
    me=bpy.data.meshes.new(name); me.from_pydata(verts,[],faces); me.update()
    ob=bpy.data.objects.new(name,me); bpy.context.collection.objects.link(ob)
    return finish(ob,mat,bone)

def ellipsoid(name,loc,scale,mat,bone,segments=16,rings=12):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=loc)
    ob=bpy.context.object; ob.name=name; ob.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(ob,mat,bone)

def tube(name,a,b,radii,mat,bone,n=12):
    a,b=Vector(a),Vector(b); d=b-a; u=d.cross(Vector((0,1,0))).normalized()
    if u.length < .1: u=d.cross(Vector((1,0,0))).normalized()
    v=d.normalized().cross(u); verts=[]; faces=[]
    for t,rx,ry in radii:
        for i in range(n):
            ang=2*math.pi*i/n; p=a+d*t+u*(rx*math.cos(ang))+v*(ry*math.sin(ang)); verts.append(tuple(p))
    for j in range(len(radii)-1):
        for i in range(n):
            k=j*n+i; q=j*n+(i+1)%n; faces.append((k,q,q+n,k+n))
    faces.extend([tuple(range(n-1,-1,-1)),tuple((len(radii)-1)*n+i for i in range(n))])
    me=bpy.data.meshes.new(name); me.from_pydata(verts,[],faces); me.update()
    ob=bpy.data.objects.new(name,me); bpy.context.collection.objects.link(ob)
    return finish(ob,mat,bone)

def box(name,loc,scale,mat,bone,bevel=.008):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc); ob=bpy.context.object; ob.name=name; ob.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    mod=ob.modifiers.new('Soft stitched edges','BEVEL'); mod.width=bevel; mod.segments=2
    bpy.context.view_layer.objects.active=ob; bpy.ops.object.modifier_apply(modifier=mod.name)
    return finish(ob,mat,bone)

def curve(name,points,radius,mat,bone):
    data=bpy.data.curves.new(name,'CURVE'); data.dimensions='3D'; data.resolution_u=1
    spline=data.splines.new('POLY'); spline.points.add(len(points)-1)
    for i,point in enumerate(points):
        spline.points[i].co=(*point,1); spline.points[i].radius=.55 if i in [0,len(points)-1] else 1
    data.bevel_depth=radius; data.bevel_resolution=1
    obj=bpy.data.objects.new(name,data); bpy.context.collection.objects.link(obj)
    bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True); bpy.context.view_layer.objects.active=obj
    bpy.ops.object.convert(target='MESH')
    return finish(bpy.context.object,mat,bone)


def mesh_object(name,vertices,faces,mat,bone,thickness=0):
    data=bpy.data.meshes.new(name); data.from_pydata(vertices,[],faces); data.update()
    obj=bpy.data.objects.new(name,data); bpy.context.collection.objects.link(obj); finish(obj,mat,bone)
    if thickness:
        mod=obj.modifiers.new('Fabric thickness','SOLIDIFY'); mod.thickness=thickness; mod.offset=0
        bpy.context.view_layer.objects.active=obj; bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj


def garment(name,mat,bone,coat=False):
    rings=[(.955,.158,.100),(.975,.162,.104),(1.01,.157,.102),(1.055,.150,.098),
           (1.10,.149,.099),(1.18,.153,.102),(1.28,.174,.107),(1.36,.187,.100),(1.405,.177,.082),(1.444,.064,.050)]
    if coat:
        rings=[(.83,.195,.126),(.87,.198,.127),(.94,.190,.124),(1.04,.180,.119),(1.16,.177,.118),
               (1.28,.192,.121),(1.36,.196,.114),(1.405,.184,.096),(1.444,.069,.060)]
    vertices=[]; faces=[]; n=32
    for z,rx,ry in rings:
        opening=.19 if z<1.20 else (.24 if z<1.32 else (.43 if z<1.43 else .85))
        for i in range(n):
            a=(-math.pi/2+opening)+(2*math.pi-2*opening)*i/(n-1) if coat else i/n*2*math.pi
            x=rx*math.cos(a); front=max(0,-math.sin(a)); cut=max(0,1-abs(x)/.065)*front
            neckline=.080*cut*max(0,min(1,(z-1.28)/.164)) if not coat else 0
            fold=.0025*front*math.exp(-((z-1.04)/.095)**2)*math.sin((z-.97)*48+abs(x)*18)
            y=(ry+fold)*math.sin(a)
            vertices.append((x,y,z-neckline))
    for j in range(len(rings)-1):
        for i in range(n-1 if coat else n):
            k=j*n+i;q=j*n+(i+1)%n;faces.append((k,q,q+n,k+n))
    return mesh_object(name,vertices,faces,mat,bone,.0035 if coat else .0025)


HEAD_PROFILE=[(1.492,.030,.042,.041,.004),(1.507,.045,.050,.050,.001),(1.528,.061,.063,.061,.001),
 (1.548,.069,.070,.068,.002),(1.567,.075,.073,.075,.003),(1.584,.079,.075,.079,.004),
 (1.600,.080,.076,.080,.004),(1.615,.078,.075,.080,.005),(1.630,.077,.075,.080,.006),
 (1.646,.077,.075,.078,.007),(1.666,.074,.072,.075,.007),(1.686,.067,.066,.067,.007),
 (1.706,.052,.052,.052,.007),(1.721,.032,.032,.032,.007),(1.728,.010,.010,.010,.007),
 (1.740,.001,.001,.001,.007)]


def head_section(z):
    for low,high in zip(HEAD_PROFILE,HEAD_PROFILE[1:]):
        if low[0]<=z<=high[0]:
            t=(z-low[0])/(high[0]-low[0]);return [a+(b-a)*t for a,b in zip(low[1:],high[1:])]
    return HEAD_PROFILE[0][1:] if z<HEAD_PROFILE[0][0] else HEAD_PROFILE[-1][1:]


def front_face_y(x,z):
    rx,front,back,cy=head_section(z);sn=math.sqrt(max(0,1-(x/rx)**2))
    nasal=.014*math.exp(-(x/.012)**2-((z-1.608)/.038)**2)+.019*math.exp(-(x/.017)**2-((z-1.579)/.013)**2)
    cheek=.0035*math.exp(-((abs(x)-.044)/.022)**2-((z-1.59)/.020)**2)
    brow=.0025*math.exp(-((abs(x)-.031)/.021)**2-((z-1.640)/.009)**2)
    socket=.0025*math.exp(-((abs(x)-.031)/.016)**2-((z-1.617)/.010)**2)
    return cy-front*sn**.42+(-nasal-cheek-brow+socket)*sn**3


def cloth_front_y(x,z,coat=False):
    profile=([(.83,.195,.126),(.87,.198,.127),(.94,.190,.124),(1.04,.180,.119),(1.16,.177,.118),
              (1.28,.192,.121),(1.36,.196,.114),(1.405,.184,.096),(1.444,.069,.060)] if coat else
             [(.955,.158,.100),(.975,.162,.104),(1.01,.157,.102),(1.055,.150,.098),(1.10,.149,.099),
              (1.18,.153,.102),(1.28,.174,.107),(1.36,.187,.100),(1.405,.177,.082),(1.444,.064,.050)])
    for low,high in zip(profile,profile[1:]):
        if low[0]<=z<=high[0]:
            t=(z-low[0])/(high[0]-low[0]);rx=low[1]+(high[1]-low[1])*t;ry=low[2]+(high[2]-low[2])*t
            return -ry*math.sqrt(max(0,1-(x/rx)**2))
    return -.1


def pocket(name,x0,x1,z0,z1,mat,coat=False):
    vertices=[]
    for z in [z0,z1]:
        for i in range(5):
            x=x0+(x1-x0)*i/4;vertices.append((x,cloth_front_y(x,z,coat)-.0024,z))
    mesh_object(name,vertices,[(i,i+1,i+6,i+5)for i in range(4)],mat,'spine',.002)
    return [(x0+(x1-x0)*i/4,cloth_front_y(x0+(x1-x0)*i/4,z1,coat)-.004,z1)for i in range(5)]


def head_mesh(skin):
    zs=sorted([r[0] for r in HEAD_PROFILE[:-1]]+[1.572,1.577,1.581,1.589,1.595,1.623,1.636])
    vertices=[];faces=[];n=64
    for z in zs:
        rx,front,back,cy=head_section(z)
        for i in range(n):
            a=i/n*2*math.pi;x=rx*math.cos(a);sn=math.sin(a)
            vertices.append((x,cy+back*sn if sn>=0 else front_face_y(x,z),z))
    for j in range(len(zs)-1):
        for i in range(n):
            k=j*n+i;q=j*n+(i+1)%n;faces.append((k,q,q+n,k+n))
    faces.extend([tuple(range(n-1,-1,-1)),tuple((len(zs)-1)*n+i for i in range(n))])
    return mesh_object('Integrated face planes',vertices,faces,skin,'head')


def hair_mesh(mat,detail):
    vertices=[];faces=[];n=48;rows=12
    for j in range(rows):
        u=j/(rows-1)
        for i in range(n):
            a=i/n*2*math.pi;front=max(0,-math.sin(a));back=max(0,math.sin(a))
            base=1.616+.055*front-.022*back;z=base+(1.737-base)*u
            rx,rf,rb,cy=head_section(z);ripple=.0007*math.sin(a*19+u*7)*math.sin(math.pi*u)
            margin=.003+.004*smooth_between(.70,1,u)
            x=(rx+margin+ripple)*math.cos(a);sn=math.sin(a)
            y=cy+(rb+margin+ripple)*sn if sn>=0 else cy-(rf+margin+ripple)*(-sn)**.42
            vertices.append((x,y,z))
    for j in range(rows-1):
        for i in range(n):
            k=j*n+i;q=j*n+(i+1)%n;faces.append((k,q,q+n,k+n))
    faces.append(tuple((rows-1)*n+i for i in range(n)))
    mesh_object('Fitted short hair',vertices,faces,mat,'head')
    for offset in [-6,-3,0,3,6]:
        points=[]
        for j in [2,4,6,8,10]:
            p=Vector(vertices[j*n+(36+offset)%n]);p.y-=.0007;points.append(tuple(p))
        curve('Combed hair ridge',points,.0003,detail,'head')


def finger_points(sign,index):
    x=sign*(.236+index*.016);end=.801+abs(index-1.3)*.009
    return Vector((x,-.016,.874)),Vector((x+sign*.004,-.024,end))


def thumb_points(sign):
    return Vector((sign*.232,-.021,.927)),Vector((sign*.216,-.049,.864))


def rig():
    bpy.ops.object.armature_add(location=(0,0,0)); arm=bpy.context.object; arm.name='Human'
    bpy.ops.object.mode_set(mode='EDIT'); e=arm.data.edit_bones; e.remove(e[0])
    specs=[('hips',(0,0,.88),(0,0,1.04),None),('spine',(0,0,1.04),(0,0,1.43),'hips'),
           ('head',(0,0,1.43),(0,0,1.72),'spine')]
    for s,x in [('L',1),('R',-1)]:
        specs += [(f'upper_arm.{s}',(x*.19,0,1.425),(x*.238,0,1.17),'spine'),
                  (f'forearm.{s}',(x*.238,0,1.17),(x*.255,-.012,.956),f'upper_arm.{s}'),
                  (f'hand.{s}',(x*.255,-.012,.956),(x*.263,-.018,.866),f'forearm.{s}'),
                  (f'thigh.{s}',(x*.098,0,.925),(x*.105,-.005,.525),'hips'),
                  (f'shin.{s}',(x*.105,-.005,.525),(x*.105,0,.105),f'thigh.{s}'),
                  (f'foot.{s}',(x*.105,0,.105),(x*.105,-.15,.075),f'shin.{s}')]
    specs += [('jaw',(0,0,1.585),(0,-.055,1.54),'head'),('mouth',(0,-.081,1.552),(0,-.081,1.54),'head')]
    for side,sign in [('L',1),('R',-1)]:
        specs.append((f'eyelid.{side}',(sign*.031,-.084,1.628),(sign*.031,-.084,1.613),'head'))
        for i in range(4):
            start,tip=finger_points(sign,i); mid=start.lerp(tip,.5)
            specs += [(f'finger{i}.01.{side}',start,mid,f'hand.{side}'),(f'finger{i}.02.{side}',mid,tip,f'finger{i}.01.{side}')]
        start,tip=thumb_points(sign);mid=start.lerp(tip,.5)
        specs += [(f'thumb.01.{side}',start,mid,f'hand.{side}'),(f'thumb.02.{side}',mid,tip,f'thumb.01.{side}')]
    for name,a,b,parent in specs:
        bone=e.new(name); bone.head=a; bone.tail=b
        if parent: bone.parent=e[parent]
    bpy.ops.object.mode_set(mode='OBJECT'); arm.show_in_front=True
    return arm

def character(kind):
    global PARTS; PARTS=[]
    skin=material(kind+' · skin',{'clinician':(.59,.37,.25),'coat':(.83,.64,.49),'patient':(.72,.49,.36)}[kind],.62)
    cloth=material(kind+' · fabric',{'clinician':(.055,.39,.43),'coat':(.88,.91,.89),'patient':(.40,.12,.07)}[kind],.88)
    trim=material(kind+' · fabric trim',{'clinician':(.035,.24,.29),'coat':(.14,.31,.39),'patient':(.025,.075,.13)}[kind],.8)
    dark=material(kind+' · hair / rubber',(.19,.20,.19) if kind=='coat' else (.038,.045,.049),.66)
    white=material(kind+' · eyes / badge / sole',(.88,.91,.89),.48)
    arm=rig(); arm.name=kind
    shade=material(kind+' · seam',tuple(c*.83 for c in cloth.diffuse_color[:3]),.92)
    shoe=material(kind+' · footwear',(.026,.031,.034),.82)
    lip=material(kind+' · lip',tuple(c*f for c,f in zip(skin.diffuse_color[:3],[.83,.68,.66])),.62)
    mouth_dark=material(kind+' · mouth shadow',(.018,.007,.008),.70)
    iris=material(kind+' · iris',(.075,.052,.035),.48)
    hair_detail=material(kind+' · hair detail',tuple(min(1,c*1.25) for c in dark.diffuse_color[:3]),.72)
    pants_mat=trim if kind in ['coat','patient'] else cloth
    surface('Trouser pelvis',[(.845,.028,.047,0),(.88,.150,.080,0),(.93,.182,.090,0),(.975,.158,.098,0),(.99,.152,.095,0)],pants_mat,'hips',24)
    torso=garment('Scrub top',trim if kind=='coat' else cloth,'spine')
    surface('Clavicle',[(1.35,.063,.050,0),(1.40,.078,.058,0),(1.445,.055,.048,.006),(1.460,.044,.038,.014)],skin,'spine')
    surface('Neck',[(1.425,.052,.047,.007),(1.47,.046,.043,.011),(1.514,.040,.039,.015)],skin,'head')
    for sign in [-1,1]:
        curve('Bound V neckline',[(sign*.063,-.048,1.44),(sign*.038,-.060,1.401),(0,-.054,1.364)],.003,shade if kind!='coat' else trim,'spine')
    curve('Hem seam',[(-.13,-.058,.961),(-.075,-.09,.958),(0,-.10,.957),(.075,-.09,.958),(.13,-.058,.961)],.0012,shade,'spine')
    face=head_mesh(skin)
    jaw=face.vertex_groups.new(name='jaw')
    for vertex in face.data.vertices:
        weight=max(0,min(1,(1.58-vertex.co.z)/.04))
        if weight:
            face.vertex_groups['head'].add([vertex.index],1-weight,'REPLACE'); jaw.add([vertex.index],weight,'REPLACE')
    for sign in [-1,1]:
        side='L' if sign>0 else 'R'
        ellipsoid('Ear pinna',(sign*.079,.004,1.594),(.010,.013,.025),skin,'head',12,8)
        ellipsoid('Ear concha',(sign*.086,-.001,1.595),(.0025,.006,.014),lip,'head',8,6)
        eye_y=front_face_y(sign*.031,1.617)+.001
        ellipsoid('Eye white',(sign*.031,eye_y,1.617),(.013,.003,.0043),white,'head',16,8)
        ellipsoid('Iris',(sign*.031,eye_y-.0034,1.617),(.0045,.001,.0041),iris,'head',12,8)
        ellipsoid('Pupil',(sign*.031,eye_y-.0043,1.617),(.002,.0006,.0023),mouth_dark,'head',8,6)
        ellipsoid('Upper eyelid',(sign*.031,eye_y-.0048,1.628),(.014,.0015,.0018),skin,'eyelid.'+side,16,8)
        curve('Lid crease',[(sign*.031-.010,eye_y-.0061,1.628),(sign*.031,eye_y-.0064,1.6283),(sign*.031+.010,eye_y-.0061,1.628)],.00045,lip,'eyelid.'+side)
        brow_points=[(sign*x,front_face_y(sign*x,z)-.001,z)for x,z in [(.014,1.635),(.026,1.639),(.039,1.639),(.051,1.636)]]
        curve('Arched brow',brow_points,.0015,dark,'head')
    vertices=[]
    for row in [-1,1]:
        for i in range(9):
            x=(i-4)/4*.0165;z=1.552+row*.0013*math.sqrt(max(0,1-(x/.0165)**2))
            vertices.append((x,front_face_y(x,z)-.0035,z))
    mesh_object('Mouth slit',vertices,[(i,i+1,i+10,i+9)for i in range(8)],mouth_dark,'mouth')
    for name,points,bone in [('Upper lip',[(-.017,1.554),(-.006,1.555),(0,1.554),(.006,1.555),(.017,1.554)],'head'),('Lower lip',[(-.016,1.550),(0,1.549),(.016,1.550)],'jaw')]:
        curve(name,[(x,front_face_y(x,z)-.0038,z)for x,z in points],.0008,lip,bone)
    hair_mesh(dark,hair_detail)
    if kind=='coat':
        garment('Open laboratory coat',cloth,'spine',coat=True)
        for sign in [-1,1]:
            vertices=[(sign*.047,-.060,1.442),(sign*.111,-.102,1.355),(sign*.052,-.118,1.17),(sign*.026,-.110,1.245)]
            mesh_object('Folded coat lapel',vertices,[(0,1,2,3)],white,'spine',.004)
            welt=pocket('Stitched coat pocket',sign*.063,sign*.137,.982,1.054,cloth,coat=True)
            curve('Pocket welt',welt,.0011,white,'spine')
        for z in [.91,1.01,1.11]:ellipsoid('Coat button',(.045,cloth_front_y(.045,z,True)-.002,z),(.003,.0018,.003),trim,'spine',8,4)
    else:
        welt=pocket('Stitched chest pocket',.054,.114,1.251,1.314,cloth)
        curve('Pocket hem',welt,.001,shade,'spine')
    badge_y=cloth_front_y(-.078,1.329,kind=='coat')-.005
    box('Name badge',(-.078,badge_y,1.329),(.047,.008,.029),white,'spine',.003)
    box('Badge stripe',(-.078,badge_y-.005,1.33),(.029,.002,.006),trim,'spine',.001)
    for side,sign in [('L',1),('R',-1)]:
        sh=(sign*.135,0,1.385); el=(sign*.238,0,1.17); wr=(sign*.255,-.012,.956)
        sleeveEnd=(sign*.221,0,1.265) if kind!='coat' else (sign*.238,0,1.16)
        if kind=='coat':
            limb=tube('Coat sleeve',sh,wr,[(0,.052,.057),(.15,.069,.066),(.48,.055,.055),(.73,.046,.047),(.87,.044,.045),(.94,.045,.046),(1,.037,.039)],cloth,f'upper_arm.{side}',16)
        else:
            tube('Sleeve',sh,sleeveEnd,[(0,.051,.056),(.18,.069,.065),(.70,.061,.059),(.94,.061,.060),(1,.059,.057)],cloth,f'upper_arm.{side}',16)
            limb=tube('Continuous arm',(sign*.216,0,1.29),wr,[(0,.054,.053),(.15,.052,.051),(.36,.041,.042),(.55,.045,.043),(.9,.031,.032),(1,.029,.029)],skin,f'upper_arm.{side}',16)
        lower=limb.vertex_groups.new(name=f'forearm.{side}')
        for v in limb.data.vertices:
            if v.co.z<1.17:
                limb.vertex_groups[f'upper_arm.{side}'].remove([v.index]); lower.add([v.index],1,'REPLACE')
        palm=surface('Anatomical palm',[(.865,.031,.017,-.012),(.881,.037,.020,-.012),(.913,.035,.020,-.012),(.941,.030,.023,-.012),(.958,.029,.026,-.012),(.972,.027,.025,-.010)],skin,f'hand.{side}',16)
        palm.location.x=sign*.26
        for i in range(4):
            start,tip=finger_points(sign,i)
            digit=tube('Finger',start,tip,[(0,.0075,.008),(.25,.0078,.0078),(.5,.007,.007),(.75,.006,.006),(1,.0048,.005)],skin,f'finger{i}.01.{side}',8)
            distal=digit.vertex_groups.new(name=f'finger{i}.02.{side}')
            for vertex in digit.data.vertices:
                weight=max(0,min(1,(start.z-vertex.co.z)/(start.z-tip.z)))
                digit.vertex_groups[f'finger{i}.01.{side}'].add([vertex.index],1-weight,'REPLACE');distal.add([vertex.index],weight,'REPLACE')
        start,tip=thumb_points(sign)
        digit=tube('Thumb',start,tip,[(0,.010,.010),(.25,.010,.010),(.5,.009,.009),(.75,.0075,.0075),(1,.006,.006)],skin,f'thumb.01.{side}',8)
        distal=digit.vertex_groups.new(name=f'thumb.02.{side}')
        for vertex in digit.data.vertices:
            weight=max(0,min(1,(start.z-vertex.co.z)/(start.z-tip.z)))
            digit.vertex_groups[f'thumb.01.{side}'].add([vertex.index],1-weight,'REPLACE');distal.add([vertex.index],weight,'REPLACE')
        hip=(sign*.098,0,.93); knee=(sign*.105,-.005,.525); ankle=(sign*.105,0,.105)
        leg=tube('Continuous trouser',hip,ankle,[(0,.082,.086),(.12,.080,.081),(.32,.073,.074),(.42,.065,.067),(.48,.063,.065),(.54,.064,.066),(.64,.061,.061),(.78,.055,.053),(.88,.047,.047),(.94,.046,.047),(.97,.044,.045),(1,.046,.045)],trim if kind in ['coat','patient'] else cloth,f'thigh.{side}',20)
        lower=leg.vertex_groups.new(name=f'shin.{side}')
        for v in leg.data.vertices:
            if v.co.z<.525:
                leg.vertex_groups[f'thigh.{side}'].remove([v.index]); lower.add([v.index],1,'REPLACE')
        ellipsoid('Shoe',(sign*.105,-.065,.057),(.055,.122,.05),shoe,f'foot.{side}')
        box('Sole',(sign*.105,-.066,.022),(.111,.226,.024),white,f'foot.{side}',.012)
        box('Shoe tongue',(sign*.105,-.089,.095),(.051,.085,.012),shoe,f'foot.{side}',.007)
    # Keep five editable material sources; browser export consolidates them into one primitive.
    bpy.ops.object.select_all(action='DESELECT')
    for ob in PARTS: ob.select_set(True)
    bpy.context.view_layer.objects.active=PARTS[0]; bpy.ops.object.join(); mesh=bpy.context.object; mesh.name=kind+'_skin'
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    mesh.parent=arm; mod=mesh.modifiers.new('Human skeleton','ARMATURE'); mod.object=arm
    # Soften transitions across bones while retaining segmented clothing edges.
    for v in mesh.data.vertices:
        co=mesh.matrix_world @ v.co
        for side,sign in [('L',1),('R',-1)]:
            if co.x*sign>.04:
                if .46<co.z<.59:
                    a,b=f'thigh.{side}',f'shin.{side}'; t=(.59-co.z)/.13
                elif 1.105<co.z<1.235 and abs(co.x)>.18:
                    a,b=f'upper_arm.{side}',f'forearm.{side}'; t=(1.235-co.z)/.13
                else: continue
                groups={mesh.vertex_groups[g.group].name for g in v.groups}
                if a in groups or b in groups:
                    mesh.vertex_groups[a].add([v.index],1-t,'REPLACE'); mesh.vertex_groups[b].add([v.index],t,'REPLACE')
    animate(arm,kind)
    return arm,mesh

def foot_target(phase):
    """In-place ankle target; stance cancels a root moving forward -Y at WALK_SPEED."""
    stance=.5; front=-.34; rear=front+WALK_SPEED*WALK_DURATION*stance
    if phase<stance:
        u=phase/stance; y=front+WALK_SPEED*WALK_DURATION*phase; lift=0
        if u<.14: pitch=-.18*(1-u/.14)**2
        elif u>.78: pitch=.35*((u-.78)/.22)**2
        else: pitch=0
    else:
        u=(phase-stance)/(1-stance); m=WALK_SPEED*WALK_DURATION*(1-stance)
        y=(2*u**3-3*u*u+1)*rear+(u**3-2*u*u+u)*m+(-2*u**3+3*u*u)*front+(u**3-u*u)*m
        lift=.07*math.sin(math.pi*u)**1.5
        pitch=.35+(-.18-.35)*(u*u*(3-2*u))
    # Roll about an actual heel/toe sole point, keeping the contact stationary in world space.
    pivot=Vector((0,.045 if pitch<0 else -.17,-.095))
    q=Quaternion((1,0,0),pitch)
    ankle=Vector((0,y,.095+lift))+pivot-q@pivot
    return ankle,pitch,lift


def set_bone_between(arm,name,head,tail):
    bone=arm.pose.bones[name]; rest=bone.bone.matrix_local.to_quaternion()
    delta=(bone.bone.tail_local-bone.bone.head_local).rotation_difference(tail-head)
    bone.matrix=Matrix.Translation(head) @ (delta@rest).to_matrix().to_4x4()


def apply_walk(arm,phase):
    targets={side:foot_target((phase+offset)%1) for side,offset in [('L',0),('R',.5)]}
    # A small pelvis oscillation; reach limits keep the leg straight rather than stretching it.
    hip_z=.865+.012*math.sin(phase*4*math.pi)**2
    length1=(arm.data.bones['thigh.L'].tail_local-arm.data.bones['thigh.L'].head_local).length
    length2=(arm.data.bones['shin.L'].tail_local-arm.data.bones['shin.L'].head_local).length
    for ankle,pitch,lift in targets.values():
        horizontal=ankle.y*ankle.y+.007**2
        hip_z=min(hip_z,ankle.z+math.sqrt(max(.01,(length1+length2-.002)**2-horizontal)))
    arm.pose.bones['hips'].location.y=hip_z-.925
    bpy.context.view_layer.update()
    for side,sign in [('L',1),('R',-1)]:
        target,pitch,lift=targets[side]
        hip=Vector((sign*.098,0,hip_z)); ankle=Vector((sign*.105,target.y,target.z))
        direction=ankle-hip; distance=direction.length; axis=direction.normalized()
        a=(length1**2-length2**2+distance**2)/(2*distance)
        bend=Vector((0,-1,0)); bend=(bend-axis*bend.dot(axis)).normalized()
        knee=hip+axis*a+bend*math.sqrt(max(0,length1**2-a*a))
        set_bone_between(arm,'thigh.'+side,hip,knee)
        bpy.context.view_layer.update()
        set_bone_between(arm,'shin.'+side,knee,ankle)
        bpy.context.view_layer.update()
        foot=arm.pose.bones['foot.'+side]
        q=Quaternion((1,0,0),pitch) @ foot.bone.matrix_local.to_quaternion()
        foot.matrix=Matrix.Translation(ankle) @ q.to_matrix().to_4x4()
        swing=math.sin(phase*2*math.pi+(0 if side=='L' else math.pi))
        arm.pose.bones['upper_arm.'+side].rotation_euler=(-.14*swing,0,.018*sign)
        arm.pose.bones['forearm.'+side].rotation_euler=(-.13-.035*swing,0,0)
    arm.pose.bones['spine'].rotation_euler=(-.025,0,.014*math.sin(phase*2*math.pi))
    arm.pose.bones['head'].rotation_euler=(.015,0,-.008*math.sin(phase*2*math.pi))


def smooth_between(a,b,value):
    u=max(0,min(1,(value-a)/(b-a)))
    return u*u*(3-2*u)


def apply_transfer(arm,u):
    """Bedside feet anchor at0; endpoint head+X, face+Z, mattress z=.74m."""
    sit=smooth_between(0,.33,u); turn=smooth_between(.32,.68,u); lie=smooth_between(.53,1,u)
    root=arm.pose.bones['hips']
    rotation=Quaternion((0,0,1),-math.pi/2*turn) @ Quaternion((1,0,0),-math.pi/2*lie)
    location=Vector((-.45*turn,.20*sit+.35*turn,.88-.10*sit+.06*lie+.045*math.sin(math.pi*turn)))
    root.matrix=Matrix.Translation(location) @ (rotation@root.bone.matrix_local.to_quaternion()).to_matrix().to_4x4()
    for side,sign in [('L',1),('R',-1)]:
        lift=smooth_between(.30,.47,u)
        arm.pose.bones['thigh.'+side].rotation_euler.x=-(1.43*sit+(math.pi/2-1.43)*lift)*(1-lie)+(.055*lie if arm.name=='patient' else 0)
        arm.pose.bones['shin.'+side].rotation_euler.x=1.45*sit*(1-smooth_between(.30,.47,u))
        arm.pose.bones['upper_arm.'+side].rotation_euler=(-.18*math.sin(math.pi*u),0,-sign*.035*lie)
        arm.pose.bones['forearm.'+side].rotation_euler.x=-.04*(1-u)-.35*math.sin(math.pi*u)
    arm.pose.bones['spine'].rotation_euler.x=-.10*math.sin(math.pi*u)*(1-lie)
    arm.pose.bones['head'].rotation_euler.x=.08*math.sin(math.pi*u)
    return lie


def animate_face_and_hands(arm,kind,clip,phase,seconds,lying=0):
    pulse=max(0,1-abs(seconds-1.1)/.09)
    blink=pulse*pulse*(3-2*pulse)
    if clip=='Rest': blink=.95 if kind=='patient' else .5
    if clip in ['TransferIn','TransferOut']: blink=max(blink,.95*lying if kind=='patient' else .5*lying)
    for side in ['L','R']:
        eyelid=arm.pose.bones['eyelid.'+side]
        eyelid.location.y=.011*blink; eyelid.scale.y=1+1.5*blink
    speech=(.5+.5*math.sin(seconds*2*math.pi*3.8))*math.sin(math.pi*phase)**2
    if clip not in ['Discuss','Work']: speech=0
    if clip=='Work': speech*=.3
    arm.pose.bones['jaw'].rotation_euler.x=.065*speech
    arm.pose.bones['mouth'].scale.y=1+2.6*speech
    for side,sign in [('L',1),('R',-1)]:
        curl=.08
        if clip=='Work': curl=.10+.38*math.sin(phase*2*math.pi+sign*.3)**2
        if clip=='Attend': curl=.08+.70*math.sin(phase*math.pi)**2
        if clip=='Discuss': curl=.10+.38*math.sin(phase*math.pi)**2
        for i in range(4):
            varied=curl*(.85+i*.08)
            arm.pose.bones[f'finger{i}.01.{side}'].rotation_euler.x=-varied
            arm.pose.bones[f'finger{i}.02.{side}'].rotation_euler.x=-varied*.9
        arm.pose.bones[f'thumb.01.{side}'].rotation_euler=(-curl*.4,0,sign*curl*.25)
        arm.pose.bones[f'thumb.02.{side}'].rotation_euler.x=-curl*.6


def animate(arm,kind):
    arm.animation_data_create()
    for clip,count in [('Idle',72),('Walk',WALK_FRAMES),('Sit',72),('Work',72),('Discuss',72),('Attend',72),('Rest',72),('TransferIn',90),('TransferOut',90)]:
        action=bpy.data.actions.new(clip+'__'+kind); arm.animation_data.action=action
        for f in range(1,count+2):
            t=(f-1)/count*2*math.pi
            for p in arm.pose.bones: p.rotation_mode='XYZ'; p.rotation_euler=(0,0,0); p.location=(0,0,0); p.scale=(1,1,1)
            def rot(name,x=0,y=0,z=0): arm.pose.bones[name].rotation_euler=(x,y,z)
            lying=0
            if clip in ['TransferIn','TransferOut']:
                u=(f-1)/count
                lying=apply_transfer(arm,u if clip=='TransferIn' else 1-u)
            elif clip=='Walk':
                apply_walk(arm,(f-1)/count)
            elif clip=='Sit':
                for side in ['L','R']: rot('thigh.'+side,-1.43); rot('shin.'+side,1.45); rot('upper_arm.'+side,-.3); rot('forearm.'+side,-1.05)
                arm.pose.bones['hips'].location.y=-.42
                for side in ['L','R']: rot('hand.'+side,0,math.pi)
            elif clip=='Work':
                for side in ['L','R']: rot('upper_arm.'+side,-.35); rot('forearm.'+side,-1.0+.035*math.sin(t)); rot('hand.'+side,.08*math.sin(t*2),math.pi)
                rot('head',.075)
            elif clip=='Discuss':
                rot('upper_arm.L',-.34,0,-.15); rot('forearm.L',-.95+.10*math.sin(t)); rot('hand.L',0,.12*math.sin(t))
                rot('forearm.R',-.28); rot('head',0,.06*math.sin(t),.04*math.sin(t))
            elif clip=='Attend':
                rot('spine',-.07)
                for side in ['L','R']: rot('upper_arm.'+side,-.40); rot('forearm.'+side,-.42+.035*math.sin(t))
                rot('head',.12)
                for side in ['L','R']: rot('hand.'+side,0,math.pi)
            elif clip=='Rest':
                rot('upper_arm.L',0,0,-.035); rot('upper_arm.R',0,0,.035)
                if kind=='patient':
                    for side in ['L','R']: rot('thigh.'+side,.055)
            else:
                rot('forearm.L',-.04); rot('forearm.R',-.04); rot('head',0,0,.018*math.sin(t))
            if clip!='Walk': rot('spine',arm.pose.bones['spine'].rotation_euler.x+.006*math.sin(t))
            animate_face_and_hands(arm,kind,clip,(f-1)/count,(f-1)/30,lying)
            for p in arm.pose.bones:
                p.keyframe_insert('rotation_euler',frame=f); p.keyframe_insert('location',frame=f); p.keyframe_insert('scale',frame=f)
        for curve in action.fcurves:
            for key in curve.keyframe_points: key.interpolation='LINEAR'
        arm.animation_data.action=None
        track=arm.animation_data.nla_tracks.new(); track.name=clip
        strip=track.strips.new(clip,1,action); strip.name=clip
        # NLA tracks export individually; keep only Idle active in the editable source.
        track.mute=clip!='Idle'


def export_mesh(source,ratio=1):
    """Keep editable source materials, consolidate browser draws through vertex colors."""
    mesh=source.copy(); mesh.data=source.data.copy(); mesh.name=source.name+'_export'
    bpy.context.collection.objects.link(mesh)
    colors=mesh.data.color_attributes.new(name='Color',type='BYTE_COLOR',domain='CORNER')
    uv=mesh.data.uv_layers.new(name='MaterialRoughness')
    for polygon in mesh.data.polygons:
        color=source.data.materials[polygon.material_index].diffuse_color
        for loop in polygon.loop_indices:
            colors.data[loop].color=color
            uv.data[loop].uv=(.5,(polygon.material_index+.5)/len(source.data.materials))
        polygon.material_index=0
    name='Browser character · '+source.parent.name
    mat=bpy.data.materials.get(name)
    if mat is None:
        mat=material(name,(1,1,1),.72)
        node=mat.node_tree.nodes.new('ShaderNodeVertexColor'); node.layer_name='Color'
        mat.node_tree.links.new(node.outputs['Color'],mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
        # A tiny packed palette restores skin/fabric roughness without adding draw calls.
        image=bpy.data.images.new(source.parent.name+' roughness source',width=4,height=len(source.data.materials),alpha=False)
        image.colorspace_settings.name='Non-Color'
        pixels=[]
        for original in source.data.materials:
            roughness=original.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value
            pixels.extend([1,roughness,0,1]*4)
        image.pixels.foreach_set(pixels);image.pack()
        texture=mat.node_tree.nodes.new('ShaderNodeTexImage');texture.image=image;texture.interpolation='Closest';texture.extension='EXTEND'
        separate=mat.node_tree.nodes.new('ShaderNodeSeparateRGB')
        mat.node_tree.links.new(texture.outputs['Color'],separate.inputs[0])
        mat.node_tree.links.new(separate.outputs['G'],mat.node_tree.nodes.get('Principled BSDF').inputs['Roughness'])
    mesh.data.materials.clear(); mesh.data.materials.append(mat)
    if ratio<1:
        # Apply decimation to rest geometry before reattaching skin deformation.
        arm=next(mod.object for mod in mesh.modifiers if mod.type=='ARMATURE')
        for mod in list(mesh.modifiers): mesh.modifiers.remove(mod)
        dec=mesh.modifiers.new('Crowd LOD','DECIMATE'); dec.ratio=ratio; dec.use_collapse_triangulate=True
        bpy.context.view_layer.objects.active=mesh; mesh.select_set(True)
        bpy.ops.object.modifier_apply(modifier=dec.name)
        skin=mesh.modifiers.new('Human skeleton','ARMATURE'); skin.object=arm
    mesh.data.validate(clean_customdata=False);mesh.data.update()
    assert not mesh.data.validate(clean_customdata=False)
    return mesh


def verify_walk_contact(arm,scene):
    errors=[]; penetrations=[]
    for i in range(WALK_FRAMES*4+1):
        frame=1+i/4; scene.frame_set(int(frame),subframe=frame%1)
        phase=(frame-1)/WALK_FRAMES; root=Vector((0,-WALK_SPEED*WALK_DURATION*phase,0))
        for side,offset,sign in [('L',0,1),('R',.5,-1)]:
            q=(phase+offset)%1; foot=arm.pose.bones['foot.'+side]
            transform=foot.matrix @ foot.bone.matrix_local.inverted()
            if q<.5:
                pitch=foot_target(q)[1]; pivot=.045 if pitch<0 else -.17
                actual=transform@Vector((sign*.105,pivot,.01))+root
                expected=Vector((sign*.105,-.34+pivot-WALK_SPEED*WALK_DURATION*(phase-q),0))
                errors.append((actual-expected).length)
            penetrations.extend((transform@Vector((sign*.105+dx,y,.01))).z for dx in [-.05,.05] for y in [-.17,.045])
    assert max(errors)<.004 and min(penetrations)>-.003, (arm.name,max(errors),min(penetrations))
    print('WALK_CONTACT_QA',arm.name,'duration',WALK_DURATION,'speed',WALK_SPEED,
          'max_drift_m',max(errors),'mean_drift_m',sum(errors)/len(errors),'min_sole_m',min(penetrations))


def main():
    ASSETS.mkdir(parents=True,exist_ok=True)
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
    scene=bpy.context.scene; scene.unit_settings.system='METRIC'; scene.render.fps=30
    characters=[]
    for kind in ['clinician','coat','patient']:
        arm,mesh=character(kind); characters.append((arm,mesh))
        arm['provenance']='Original procedural geometry; substantial OpenAI Codex assistance; CC0-1.0'
        arm['transfer_contract']={'duration_seconds':3.0,'rest_root_position_gltf':[-1.33,.84,-.55],'rest_root_quaternion_gltf':[-.5,-.5,-.5,.5],'mattress_plane_gltf_y':.74,'bed_center_gltf':[-.45,.74,-.55],'start':'standing feet at0,forward+Z glTF','end':'head+X,face+Y; rebase Rest root against original standing anchor; reverse Out from same anchor'}
        arm['animation_notes']='Walk: contact-aware two-bone solve, 0.90s cycle at 1.65m/s forward -Y; Work/Attend align at deployment; bone-driven blink, jaw, mouth and two-joint digits; reversible3s bed transfers.'
        for suffix,ratio in [('',1),('-lod',.34)]:
            browser_mesh=export_mesh(mesh,ratio)
            bpy.ops.object.select_all(action='DESELECT'); arm.select_set(True); browser_mesh.select_set(True); bpy.context.view_layer.objects.active=arm
            for track in arm.animation_data.nla_tracks: track.mute=False
            bpy.ops.export_scene.gltf(filepath=str(ASSETS/(kind+suffix+'.glb')),export_format='GLB',use_selection=True,
                export_animations=True,export_nla_strips=True,export_anim_slide_to_zero=True,export_anim_single_armature=False,export_force_sampling=True,
                export_skins=True,export_yup=True,export_extras=True,export_colors=True)
            triangles=sum(len(p.vertices)-2 for p in browser_mesh.data.polygons)
            assert len(browser_mesh.data.materials)==1 and browser_mesh.data.color_attributes.get('Color')
            assert triangles<(5000 if ratio<1 else 14000)
            print('EXPORT_MESH',kind+suffix,'triangles',triangles)
            export_data=browser_mesh.data
            bpy.data.objects.remove(browser_mesh,do_unlink=True); bpy.data.meshes.remove(export_data)
            for track in arm.animation_data.nla_tracks: track.mute=track.name!='Idle'
    # All three retained editable at the origin in separate collections.
    for arm,mesh in characters:
        col=bpy.data.collections.new(arm.name.title()); scene.collection.children.link(col)
        for ob in [arm,mesh]:
            for old in list(ob.users_collection): old.objects.unlink(ob)
            col.objects.link(ob)
        if arm.name!='clinician': col.hide_render=True; col.hide_viewport=True
    # Invariant: all authored clips exist and each walking frame has a grounded support sole.
    for arm,mesh in characters:
        col=arm.users_collection[0]; col.hide_viewport=False
        for track in arm.animation_data.nla_tracks: track.mute=track.name!='Walk'
        support=[]
        for frame in range(1,WALK_FRAMES+2):
            scene.frame_set(frame); heights=[]
            for side,sign in [('L',1),('R',-1)]:
                foot=arm.pose.bones['foot.'+side]; transform=foot.matrix @ foot.bone.matrix_local.inverted()
                heights.extend((transform @ Vector((sign*.105+dx,y,.01))).z for dx in [-.05,.05] for y in [-.17,.04])
            support.append(min(heights))
        assert max(abs(h) for h in support)<.005, (arm.name,support)
        print('WALK_SUPPORT_ERROR_METRES',arm.name,max(abs(h) for h in support))
        verify_walk_contact(arm,scene)
        for track in arm.animation_data.nla_tracks: track.mute=track.name!='Idle'
        if arm.name!='clinician': col.hide_viewport=True
    scene.frame_set(1)
    assert all(len(a.pose.bones)==39 for a,m in characters)
    assert all(set(t.name for t in a.animation_data.nla_tracks)==set(CLIPS) for a,m in characters)
    for a,m in characters:
        print('CHARACTER',a.name,'vertices',len(m.data.vertices),'triangles',sum(len(p.vertices)-2 for p in m.data.polygons),'materials',len(m.data.materials),'clips',[t.name for t in a.animation_data.nla_tracks])
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender'/'characters.blend'),compress=True)

if __name__=='__main__': main()
