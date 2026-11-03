export const PIT_LANE={garageFront:-3.7,garageBack:-15,fastLaneCenter:4.8,fastLaneHalfWidth:1.7,wall:7.3,boxHalfWidth:2.8,boxHalfLength:4.5};
// Schematic entry/exit curves share the same world coordinates as the service model.
export function pitLaneFrame(car){
    if(car.phase!=='APPROACH'&&car.phase!=='DEPARTURE')return {x:0,yaw:0};
    const departure=car.phase==='DEPARTURE',u=Math.max(0,Math.min(1,((departure?-car.position:car.position)-7)/8));
    return {x:PIT_LANE.fastLaneCenter*u*u*(3-2*u),yaw:(departure?-1:1)*Math.atan(3.6*u*(1-u))};
}
