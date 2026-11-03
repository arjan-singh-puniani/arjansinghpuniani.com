export const ARCHIVE_KEY='hospitalsim-hospital-archive';
export function hospitalArchives(storage){
 const entries=JSON.parse(storage.getItem(ARCHIVE_KEY)||'[]');
 if(!Array.isArray(entries)||entries.some(e=>!e||typeof e.savedAt!=='string'||!e.state))throw Error('The hospital archive could not be read. Export your current checkpoint before starting over.');
 return entries;
}
export function archiveHospital(storage,state){
 if(!state.rooms.length&&!state.staff.length&&!state.arrivals)return;
 const entries=hospitalArchives(storage);entries.push({savedAt:new Date().toISOString(),state});
 // Write before replacing the active shift; a full device store must not lose it.
 storage.setItem(ARCHIVE_KEY,JSON.stringify(entries));
}
