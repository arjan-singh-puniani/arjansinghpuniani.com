// Bound 3D fill work on Retina displays; DOM controls retain their native resolution.
export function renderScale(width,height,dpr,software=false){
    if(width<=0||height<=0)return 1;
    return Math.min(software?1:1.5,dpr>0?dpr:1,Math.sqrt(1_600_000/(width*height)));
}
