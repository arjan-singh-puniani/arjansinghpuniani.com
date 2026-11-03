"""Reproduce the image-derived teaching traces; no native ECG samples are inferred."""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "public/images/reasonos/asp-001-recording-b.webp"
SHA = "fe2569d277fa8c739c3c00347c7949c7937068bbceb15b8d62df95d51986cc23"
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == SHA
IMAGE = np.asarray(Image.open(SOURCE).convert("L"), dtype=float)
# Source-pixel guides follow the visible ink. They are author annotations, not clinical adjudication.
# Landmarks are guide indices: P onset/end, QRS onset/end, T onset/end, dominant QRS feature and its next-cycle counterpart.
GUIDES = {
 "I": (0, [[270,176],[280,173],[288,174],[294,179],[307,179],[316,183],[324,174],[329,140],[331,180],[337,180],[349,179],[359,176],[368,168],[375,167],[383,173],[392,183],[401,184],[414,184],[427,184],[440,188],[452,190],[458,179],[465,151],[467,189],[478,188]], [1,3,5,9,10,16,7,22]),
 "II": (0, [[218,1111],[225,1110],[233,1112],[239,1108],[246,1112],[251,1113],[256,1113],[260,1090],[264,1056],[266,1114],[273,1114],[284,1112],[293,1106],[300,1094],[307,1083],[311,1085],[318,1099],[326,1117],[334,1120],[344,1122],[354,1124],[366,1125],[378,1124],[385,1126],[391,1107],[395,1092],[399,1066],[401,1129],[409,1129],[417,1125]], [1,4,6,10,11,17,8,26]),
 "III": (0, [[221,792],[234,795],[244,796],[254,799],[264,801],[270,804],[277,798],[284,782],[286,800],[292,800],[305,798],[317,797],[329,790],[336,795],[345,805],[355,809],[367,810],[381,812],[397,812],[410,814],[418,808],[421,799],[424,815],[436,814]], [1,4,5,9,10,15,7,21]),
 "aVR": (1, [[695,207],[707,210],[720,214],[728,214],[735,211],[744,211],[750,215],[753,258],[756,216],[763,215],[773,216],[783,222],[793,232],[798,234],[805,225],[813,217],[822,217],[836,219],[854,220],[871,224],[885,220],[891,268],[894,222],[909,222]], [1,4,5,9,10,16,7,21]),
 "aVL": (1, [[683,521],[694,521],[703,519],[713,523],[721,529],[727,521],[733,511],[735,529],[746,529],[758,530],[772,531],[786,529],[799,531],[812,532],[827,532],[840,533],[855,533],[865,534],[874,528],[878,516],[880,535],[895,535]], [1,3,4,8,9,14,6,19]),
 "aVF": (1, [[652,837],[666,838],[678,834],[687,838],[695,840],[703,832],[708,779],[710,839],[719,840],[732,837],[744,830],[752,824],[758,828],[764,840],[774,847],[788,849],[802,850],[818,853],[831,852],[840,846],[848,801],[850,853],[864,852]], [1,3,4,8,9,15,6,20]),
 "V1": (2, [[1269,254],[1280,256],[1288,253],[1296,258],[1306,257],[1315,255],[1322,256],[1328,304],[1333,281],[1342,264],[1348,261],[1360,258],[1371,257],[1380,262],[1390,264],[1405,264],[1420,265],[1436,267],[1454,265],[1462,268],[1468,254],[1471,315],[1478,285],[1487,268]], [1,3,4,10,11,15,7,21]),
 "V2": (2, [[1247,574],[1259,574],[1270,572],[1279,577],[1288,576],[1298,575],[1307,565],[1311,615],[1316,593],[1322,576],[1328,573],[1337,565],[1346,547],[1353,537],[1356,542],[1360,565],[1366,581],[1375,585],[1403,583],[1418,585],[1432,586],[1444,590],[1453,586],[1460,579],[1466,624],[1471,590],[1480,586]], [1,3,4,9,10,18,7,24]),
 "V3": (2, [[1220,895],[1232,894],[1243,891],[1254,899],[1265,900],[1275,902],[1282,889],[1286,805],[1289,920],[1295,898],[1304,896],[1315,892],[1323,875],[1329,855],[1333,855],[1337,867],[1344,895],[1351,904],[1380,905],[1396,907],[1410,911],[1424,912],[1435,909],[1440,824],[1444,928],[1450,910]], [1,3,4,10,11,18,7,23]),
 "V4": (3, [[1691,289],[1703,290],[1715,293],[1725,293],[1737,295],[1747,294],[1753,289],[1760,174],[1764,303],[1769,294],[1780,293],[1791,290],[1803,285],[1810,265],[1817,258],[1821,261],[1825,284],[1831,300],[1858,300],[1872,301],[1885,305],[1900,305],[1910,305],[1918,190],[1922,316],[1930,308]], [1,3,4,10,11,18,7,23]),
 "V5": (3, [[1677,608],[1690,609],[1702,610],[1714,612],[1725,613],[1735,612],[1741,583],[1747,533],[1750,614],[1762,613],[1774,611],[1781,605],[1788,594],[1792,589],[1795,591],[1799,608],[1805,617],[1814,619],[1851,622],[1866,623],[1880,625],[1893,621],[1899,548],[1902,628],[1914,623]], [1,3,4,9,10,17,7,22]),
 "V6": (3, [[1657,927],[1669,927],[1682,925],[1694,930],[1703,930],[1710,919],[1718,874],[1721,930],[1733,930],[1745,929],[1755,924],[1761,915],[1765,914],[1769,919],[1775,931],[1783,934],[1795,936],[1835,938],[1849,938],[1861,935],[1868,882],[1872,937],[1886,937]], [1,3,4,8,9,16,6,20]),
}
# Reciprocal grid vectors (cycles/pixel for a 1-mm printed grid), estimated from each print column.
FREQUENCIES = [
 [[.13037109375,.00830078125],[-.01025390625,.1279296875]],
 [[.1298828125,.009765625],[-.01025390625,.12744140625]],
 [[.12744140625,.00927734375],[-.009765625,.1259765625]],
 [[.130859375,.00927734375],[-.0107421875,.12548828125]],
]

def sample(x, y):
    x = np.clip(x, 0, IMAGE.shape[1]-2); y = np.clip(y, 0, IMAGE.shape[0]-2)
    ix = np.floor(x).astype(int); iy = np.floor(y).astype(int)
    dx=x-ix; dy=y-iy
    return IMAGE[iy,ix]*(1-dx)*(1-dy)+IMAGE[iy,ix+1]*dx*(1-dy)+IMAGE[iy+1,ix]*(1-dx)*dy+IMAGE[iy+1,ix+1]*dx*dy

records=[]
review=Image.new("RGB",(1440,12*235),"#f6f9fb"); draw=ImageDraw.Draw(review)
for row,(lead,(column,guide,landmark_indices)) in enumerate(GUIDES.items()):
    g=np.asarray(guide,dtype=float); matrix=np.asarray(FREQUENCIES[column]); inverse=np.linalg.inv(matrix)
    paper=g@matrix.T
    # Near-vertical strokes can map onto the same paper-time coordinate; retain guide order explicitly.
    original_u=paper[:,0].copy()
    paper[:,0]=np.maximum.accumulate(paper[:,0]-np.arange(len(paper))*.003)+np.arange(len(paper))*.003
    clock_adjustment=float(np.max(np.abs(paper[:,0]-original_u))/25*1000)
    assert clock_adjustment < 18, f"Guide requires review: {lead}, {clock_adjustment} ms"
    u=np.linspace(paper[0,0],paper[-1,0],max(160,int((paper[-1,0]-paper[0,0])*8)))
    guide_v=np.interp(u,paper[:,0],paper[:,1])
    offsets=np.linspace(-.65,.65,53)
    vv=guide_v[:,None]+offsets[None,:]
    sx=inverse[0,0]*u[:,None]+inverse[0,1]*vv
    sy=inverse[1,0]*u[:,None]+inverse[1,1]*vv
    intensity=(sample(sx,sy)+sample(sx+.6,sy)+sample(sx-.6,sy)+sample(sx,sy+.6)+sample(sx,sy-.6))/5
    cost=intensity/255 + .65*offsets[None,:]**2
    peak_u=paper[landmark_indices[6],0]
    constrained=np.abs(u-peak_u)<.08
    cost[constrained,:]+=np.where(np.abs(offsets)<.3,0,5)[None,:]
    # A small continuity penalty avoids following an isolated grid mark beside a thick ink stroke.
    dp=cost[0].copy(); previous=[]
    for j in range(1,len(u)):
        transition=dp[:,None]+.5*(offsets[:,None]-offsets[None,:])**2
        back=np.argmin(transition,axis=0);previous.append(back)
        dp=cost[j]+transition[back,np.arange(len(offsets))]
    path=[int(np.argmin(dp))]
    for back in previous[::-1]:path.append(int(back[path[-1]]))
    path=path[::-1];v=vv[np.arange(len(u)),path]
    source=np.column_stack([u,v])@inverse.T
    baseline_indices=[0,landmark_indices[5]]
    base=np.interp(u,paper[baseline_indices,0],paper[baseline_indices,1])
    voltage=(base-v)/10
    origin=paper[landmark_indices[2],0]
    time=(u-origin)/25*1000
    phases={name:round((paper[index,0]-origin)/25*1000,4) for name,index in zip(['pStart','pEnd','qrsStart','qrsEnd','tStart','tEnd','qrsPeak','nextQrsPeak'],landmark_indices)}
    points=[[round(float(t),4),round(float(mv),6),round(float(x),4),round(float(y),4)] for t,mv,(x,y) in zip(time,voltage,source)]
    source_score=sample(source[:,0],source[:,1])
    records.append({'lead':lead,'column':column+1,'sourceMatrixMmPerPixel':matrix.tolist(),'guide':guide,'baselineGuideIndices':baseline_indices,'landmarkGuideIndices':landmark_indices,'landmarksMs':phases,'points':points,'faintTimeSpans':[[round(float(time[j]),4),round(float(time[j+1]),4)] for j in range(len(time)-1) if max(source_score[j],source_score[j+1])>=175],'maximumGuideClockAdjustmentMs':round(clock_adjustment,3),'inkSupportFraction':round(float(np.mean(source_score<175)),3)})
    # The paired audit graphic overlays every extracted point on the source photograph.
    x0=int(g[:,0].min())-10;y0=int(g[:,1].min())-15;x1=int(g[:,0].max())+10;y1=int(g[:,1].max())+20
    crop=Image.open(SOURCE).crop((x0,y0,x1,y1)).convert('RGB');overlay=ImageDraw.Draw(crop)
    overlay.line([(float(x-x0),float(y-y0)) for x,y in source],fill='#c63487',width=1)
    crop.thumbnail((650,210));review.paste(crop,(0,row*235+20));draw.text((8,row*235+3),lead,fill='#0b3146')
    # Digital plot: same extracted values, no template waveform or fitted P/QRS/T pulses.
    xx=760+(time-time[0])/(time[-1]-time[0])*650; yy=row*235+125-voltage*65
    draw.line(list(zip(xx.tolist(),yy.tolist())),fill='#087b91',width=2)
manifest={'version':'image-derived-1','recordingId':'B','sourceImage':'/images/reasonos/asp-001-recording-b.webp','sourceSHA256':SHA,'paperSpeedMmPerSecond':25,'gainMmPerMv':10,'pointColumns':['timeMs','mV','sourceX','sourceY'],'method':'Author-guided ink-centreline extraction from the photographed ECG; affine paper-grid coordinates; bilinear image sampling; linear display interpolation.','status':'Illustrative image-derived digitization; not native acquisition samples or clinician-adjudicated fiducials.','alignment':'Each lead is a separately phase-aligned representative beat. No simultaneous multilead acquisition is asserted.','gridMethod':'Column-wise Fourier grid pitch/orientation estimates; local affine approximation, not a global perspective correction.','records':records}
out=ROOT/'public/ecg-digitized/recording-b.json';out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(manifest,separators=(',',':'))+'\n')
review.save('/tmp/ecg-digitization-audit.png')
print(json.dumps({'output':str(out),'bytes':out.stat().st_size,'leads':[{r['lead']:{'points':len(r['points']),'inkSupport':r['inkSupportFraction']}} for r in records]},indent=2))
