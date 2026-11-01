import{build,policy}from'../../dist/simulation.mjs';import{eventChoice,dispatchFacilities}from'../../dist/operations.mjs';
export function prepare(s){build(s,'consult',7,3);if(s.scenario!=='staffing'){policy(s,'hire','surgeon');policy(s,'hire','nurse');build(s,'care',3,0)}}
export function respond(s){if(s.operations.event?.status==='open'){if(s.operations.event.kind==='paperwork')eventChoice(s,'tray');else dispatchFacilities(s)}}
