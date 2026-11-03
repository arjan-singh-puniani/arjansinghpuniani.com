"""Stitch a bounded, privately prepared facial surface into the attributed reference exterior."""
import math
import bmesh
from mathutils import Vector


def apply_surface(body,d):
    assert len(d['points'])==478 and 800<=len(d['faces'])<=1500
    assert all(len(p)==3 and all(math.isfinite(v) for v in p) and abs(p[0])<.16 and .60<p[1]<.96 and -.05<p[2]<.25 for p in d['points'])
    assert all(len(f)==3 and len(set(f))==3 and all(isinstance(i,int) and 0<=i<468 for i in f) for f in d['faces'])
    points=[Vector((x,-z,y)) for x,y,z in d['points']]
    outer=[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109]
    polygon=[(points[i].x*1.04,.79+(points[i].z-.79)*1.02) for i in outer]
    def inside(x,y):
     value=False;j=len(polygon)-1
     for i,(a,b) in enumerate(polygon):
      c,e=polygon[j]
      if (b>y)!=(e>y) and x<(c-a)*(y-b)/(e-b)+a:value=not value
      j=i
     return value
    bm=bmesh.new();bm.from_mesh(body.data);layer=bm.verts.layers.float_vector.new('_SURFACE_DETAIL')
    remove=[f for f in bm.faces if (c:=f.calc_center_median()).y<-.005 and inside(c.x,c.z)]
    assert len(remove)>200, 'Surface boundary did not intersect the reference face'
    bmesh.ops.delete(bm,geom=remove,context='FACES')
    edges=[e for e in bm.edges if e.is_boundary and all(.64<v.co.z<.92 and abs(v.co.x)<.14 and v.co.y<.025 for v in e.verts)]
    adj={}
    for e in edges:
     a,b=e.verts;adj.setdefault(a,[]).append(b);adj.setdefault(b,[]).append(a)
    assert all(len(v)==2 for v in adj.values()),'Skin boundary is not a collection of loops'
    loops=[];unseen=set(adj)
    while unseen:
     start=next(iter(unseen));loop=[];current=start;previous=None
     while current not in loop:
      loop.append(current);unseen.discard(current);n=adj[current];previous,current=current,next(v for v in n if v is not previous)
     assert current is start;loops.append(loop)
    skin=max(loops,key=len);assert len(skin)>30
    for loop in loops:
     if loop is not skin:
      bmesh.ops.holes_fill(bm,edges=[bm.edges.get((a,b)) for a,b in zip(loop,loop[1:]+loop[:1])],sides=0)
    face=[bm.verts.new(p) for p in points[:468]]
    detail={}
    brows=[70,63,105,66,107,55,65,52,53,46,336,296,334,293,300,276,283,282,295,285]
    for i in brows:face[i].co.y-=.0015;detail[face[i]]=(0,0,1)
    eyelids=([33,7,163,144,145,153,154,155,133,173,157,158,159,160,161,246],[263,249,390,373,374,380,381,382,362,398,384,385,386,387,388,466])
    mouth=[78,191,80,81,82,13,312,311,310,415,308,324,318,402,317,14,87,178,88,95]
    # Canonical topology seals the eyes and mouth; remove those caps before adding recessed detail.
    apertures=[set(ids) for ids in [*eyelids,mouth]]
    for f in d['faces']:
     if not any(set(f)<=rim for rim in apertures):bm.faces.new([face[i] for i in f])
    # Fill the actual eyelid apertures with connected, monochrome iris relief, not floating spheres.
    for ids in eyelids:
     rim=[face[i] for i in ids];average=sum((v.co for v in rim),Vector())/len(rim);iris=min((points[468],points[473]),key=lambda p:(p.x-average.x)**2+(p.z-average.z)**2)
     rim.sort(key=lambda v:math.atan2(v.co.z-iris.z,v.co.x-iris.x));rings=[]
     for radius,depth in ((.0044,.0012),(.0017,.0004)):
      rings.append([bm.verts.new((iris.x+radius*math.cos(a:=math.atan2(v.co.z-iris.z,v.co.x-iris.x)),iris.y-depth,iris.z+radius*math.sin(a))) for v in rim])
     for a,b in zip([rim]+rings,rings):
      for i in range(len(a)):bm.faces.new((a[i],a[(i+1)%len(a)],b[(i+1)%len(b)],b[i]))
     for v in rings[0]:detail[v]=(1,0,0)
     for v in rings[-1]:detail[v]=(0,1,0)
     center=bm.verts.new((iris.x,iris.y+.0007,iris.z));detail[center]=(0,1,0)
     for i in range(len(rim)):bm.faces.new((rings[-1][i],rings[-1][(i+1)%len(rim)],center))
    rim=[face[i] for i in mouth];center=sum((v.co for v in rim),Vector())/len(rim);center.y+=.0015;middle=bm.verts.new(center)
    for i in range(len(rim)):bm.faces.new((rim[i],rim[(i+1)%len(rim)],middle))
    def ordered(loop):
     area=sum(a.co.x*b.co.z-b.co.x*a.co.z for a,b in zip(loop,loop[1:]+loop[:1]))
     if area<0:loop=list(reversed(loop))
     start=max(range(len(loop)),key=lambda i:loop[i].co.z-abs(loop[i].co.x)*.15)
     loop=loop[start:]+loop[:start];lengths=[(a.co-b.co).length for a,b in zip(loop,loop[1:]+loop[:1])];total=sum(lengths);p=[0]
     for length in lengths:p.append(p[-1]+length/total)
     return loop,p
    skin,sa=ordered(skin);border,ba=ordered([face[i] for i in outer]);i=j=0
    while i<len(skin) or j<len(border):
     if i<len(skin) and (j==len(border) or sa[i+1]<ba[j+1]):f=(skin[i%len(skin)],skin[(i+1)%len(skin)],border[j%len(border)]);i+=1
     else:f=(skin[i%len(skin)],border[(j+1)%len(border)],border[j%len(border)]);j+=1
     bm.faces.new(f)
    seam=set(skin+border)
    for _ in range(3):seam|={e.other_vert(v) for v in list(seam) for e in v.link_edges}
    for _ in range(12):bmesh.ops.smooth_vert(bm,verts=list(seam),factor=.45,use_axis_x=True,use_axis_y=True,use_axis_z=True)
    for v,value in detail.items():v[layer]=value
    # Refine the low-resolution estimated face while leaving the approved exterior untouched.
    facial=set(face);edges=[e for e in bm.edges if all(v in facial for v in e.verts)]
    refined=bmesh.ops.subdivide_edges(bm,edges=edges,cuts=1,use_grid_fill=True)
    interior=[v for v in refined['geom_inner'] if isinstance(v,bmesh.types.BMVert)]
    for _ in range(2):bmesh.ops.smooth_vert(bm,verts=interior,factor=.25,use_axis_x=True,use_axis_y=True,use_axis_z=True)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(body.data);bm.free()
    attribute=body.data.attributes['_SURFACE_DETAIL']
    for v in body.data.vertices:
     x,height,depth=v.co.x,v.co.z,-v.co.y
     if height<.80:continue
     front=max(0,min(1,(depth-.015)/.045));line=.818+front*.035;hair=max(0,min(1,(height-line)/.030));hair=hair*hair*(3-2*hair)
     quiff=math.exp(-((x+.035)/.065)**2-((height-.89)/.065)**2)
     
     if hair>.4:attribute.data[v.index].vector=(0,0,1)
     v.co.x+=hair*(.065*x-.0015);v.co.z+=hair*(.008+.004*front+.003*quiff);v.co.y-=hair*front*(.008+.0018*math.cos(2*math.pi*(x+.65*(height-.85))/.027))
