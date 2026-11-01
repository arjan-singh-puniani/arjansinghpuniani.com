// Registration against the displayed reference triangles; not tissue-contact mechanics.
function clip(poly,axis,bound,keepLess){
 const result=[];
 for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],inside=p=>keepLess?p[axis]<=bound+1e-10:p[axis]>=bound-1e-10;
  const ai=inside(a),bi=inside(b);
  if(ai)result.push(a);
  if(ai!==bi){const t=(bound-a[axis])/(b[axis]-a[axis]);result.push(a.map((v,j)=>v+t*(b[j]-v)));}
 }
 return result;
}
export function clipFootprint(triangle,span){
 let polygon=triangle;
 for(const [axis,bound,less] of [[0,span/2,true],[0,-span/2,false],[2,span/2,true],[2,-span/2,false]])polygon=clip(polygon,axis,bound,less);
 return polygon;
}
export function fitDevice(meshes,{target,normal,u,v,span=12.4,minRigidY=-.2,clearance=.3,sampleSpan=16}){
 const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],triangles=[];
 let maximum=-Infinity,visited=0;
 for(const mesh of meshes){
  const p=mesh.positions,indices=mesh.indices,local=new Float64Array(p.length);
  for(let i=0;i<p.length;i+=3){
   const d=[p[i]-target[0],p[i+1]-target[1],p[i+2]-target[2]];
   local[i]=dot(d,u);local[i+1]=dot(d,normal);local[i+2]=-dot(d,v);
  }
  for(let i=0;i<indices.length;i+=3){
   visited++;const a=Array.from(local.subarray(indices[i]*3,indices[i]*3+3)),b=Array.from(local.subarray(indices[i+1]*3,indices[i+1]*3+3)),c=Array.from(local.subarray(indices[i+2]*3,indices[i+2]*3+3));
   if(Math.min(a[0],b[0],c[0])>sampleSpan/2||Math.max(a[0],b[0],c[0])<-sampleSpan/2||Math.min(a[2],b[2],c[2])>sampleSpan/2||Math.max(a[2],b[2],c[2])<-sampleSpan/2)continue;
   triangles.push([a,b,c]);
   for(const point of clipFootprint([a,b,c],span))maximum=Math.max(maximum,point[1]);
  }
 }
 if(!Number.isFinite(maximum))throw new Error('No reference cortex intersects the full device footprint.');
 const datum=maximum-minRigidY+clearance;
 function surfaceAt(x,z){
  let y=-Infinity;
  for(const [a,b,c] of triangles){
   const denominator=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);
   if(Math.abs(denominator)<1e-12)continue;
   const wa=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/denominator,wb=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/denominator,wc=1-wa-wb;
   if(wa>=-1e-8&&wb>=-1e-8&&wc>=-1e-8)y=Math.max(y,wa*a[1]+wb*b[1]+wc*c[1]);
  }
  return Number.isFinite(y)?y-datum:null;
 }
 const contactSamples=[];
 for(let i=0;i<=20;i++)for(let j=0;j<=20;j++){const h=surfaceAt(i/2-5,j/2-5);if(h!==null)contactSamples.push(h);}
 if(contactSamples.length!==441)throw new Error('Reference cortex does not cover the assumed 10 × 10 mm contact projection.');
 return{datum,surfaceAt,maximum,minimumRigidClearance:datum+minRigidY-maximum,contactThicknessRange:[-Math.max(...contactSamples),-Math.min(...contactSamples)],sourceTriangleCount:visited,candidateTriangleCount:triangles.length,rigidSpan:span,assumedClearance:clearance};
}
