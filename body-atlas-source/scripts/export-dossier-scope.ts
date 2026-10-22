import {writeFileSync} from 'node:fs';
import {families,recordById,familyMappings} from '../lib/atlas';
import {hasExplanation,productName,interventionSummaries} from '../lib/intervention-view';
const scope=families.filter(hasExplanation).map(f=>({id:f.id,name:productName(f),regulatory:f.regulatoryIds.map(recordById),studies:f.studyIds.map(recordById),publications:f.publicationIds.map(recordById)}));
if(scope.length!==91||scope.some(f=>f.regulatory.some(r=>!r)))throw new Error('Dossier scope must resolve all 91 entries');
writeFileSync('data/dossier-scope.json',JSON.stringify(scope,null,2)+'\n');
console.log(`Exported ${scope.length} dossier identities`);

writeFileSync('data/dossier-description-documents.json',JSON.stringify(scope.flatMap(f=>f.regulatory.filter(r=>r?.kind==='510k').map(r=>({application:r!.application,sourceUrl:interventionSummaries[f.id]?.sourceUrl || familyMappings(f.id).find(m=>m.sourceUrl.endsWith('.pdf'))?.sourceUrl}))),null,2)+'\n');
