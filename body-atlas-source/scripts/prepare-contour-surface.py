"""Local-only preparation of an illustrative face surface; never uploads reference images."""
import argparse,json
from pathlib import Path
import numpy as np


def surface(landmarks,pose,width,height):
    points=np.asarray(landmarks,dtype=float)
    assert points.shape==(478,3) and np.isfinite(points).all()
    matrix=np.asarray(pose,dtype=float)
    assert matrix.shape==(4,4) and np.isfinite(matrix).all() and width>0 and height>0
    p=points*[width,-height,-width]
    left=(p[33]+p[133])/2;right=(p[263]+p[362])/2
    u,_,v=np.linalg.svd(matrix[:3,:3]);rotation=u@v
    assert np.linalg.det(rotation)>.99
    q=(p-(left+right)/2)@rotation
    span=q[454,0]-q[234,0]
    assert span>0
    result=q*(.172/span)+[0,.810,.104]
    # shortcut: monocular depth is estimated, damp it for this illustrative display; use calibrated capture for measured shape.
    result[:,2]=.104+(result[:,2]-.104)*.65
    assert np.isfinite(result).all()
    return result


def self_test():
    points=np.random.default_rng(4).uniform(.3,.7,(478,3))
    points[234]=[.25,.5,0];points[454]=[.75,.5,0]
    for i in [33,133]:points[i]=[.35,.5,0]
    for i in [263,362]:points[i]=[.65,.5,0]
    base=surface(points,np.eye(4),1000,1000)
    np.testing.assert_allclose(base,surface(points+[.05,-.1,.2],np.eye(4),1000,1000),atol=1e-12)
    np.testing.assert_allclose(base,surface(points*1.2,np.eye(4),1000,1000),atol=1e-12)
    try:surface(points[:20],np.eye(4),1000,1000)
    except AssertionError:pass
    else:raise AssertionError('Incomplete landmark arrays must fail')
    print('PASS: translation/scale invariance, finite output and malformed-input rejection; not a likeness score')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    for key in ['image','model','topology','output']:parser.add_argument('--'+key)
    parser.add_argument('--self-test',action='store_true');a=parser.parse_args()
    if a.self_test:self_test();raise SystemExit(0)
    if not all([a.image,a.model,a.topology,a.output]):parser.error('--image, --model, --topology and --output are required')
    from PIL import Image,ImageOps
    import mediapipe as mp
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
    image=ImageOps.exif_transpose(Image.open(a.image)).convert('RGB')
    options=vision.FaceLandmarkerOptions(base_options=python.BaseOptions(model_asset_path=a.model,delegate=python.BaseOptions.Delegate.CPU),running_mode=vision.RunningMode.IMAGE,num_faces=2,output_facial_transformation_matrixes=True,output_face_blendshapes=False)
    with vision.FaceLandmarker.create_from_options(options) as detector:
        result=detector.detect(mp.Image(image_format=mp.ImageFormat.SRGB,data=np.asarray(image)))
    assert len(result.face_landmarks)==1,'Use a reference containing exactly one face'
    points=surface([[p.x,p.y,p.z] for p in result.face_landmarks[0]],result.facial_transformation_matrixes[0],image.width,image.height)
    faces=[[int(t.split('/')[0])-1 for t in line.split()[1:]] for line in Path(a.topology).read_text().splitlines() if line.startswith('f ')]
    assert 800<=len(faces)<=1500 and all(len(f)==3 and all(0<=i<468 for i in f) for f in faces)
    output=Path(a.output);output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps({'points':points.tolist(),'faces':faces,'method':'Monocular estimated face surface in the original HRA display frame. Pose corrected, estimated depth damped. Not measured personal anatomy.'})+'\n')
    print('Prepared 478 estimated surface points locally. Reference image and source pixel coordinates are not included in the output.')
