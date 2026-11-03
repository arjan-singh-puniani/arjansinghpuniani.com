import {families,familyMappings,structures,coverage} from './atlas';
import {hasExplanation,productName} from './intervention-view';
import {anchorDescription,humanRegionLocators} from './annotations';
import type {RelationshipType} from './types';

const groups={
 placement:['implantation_site','tissue_interface','external_placement','delivery_location','unlocalized'],
 measurement:['measurement_site'],
 target:['physiological_target','therapeutic_action_site'],
 context:['indication_context'],
} satisfies Record<string,RelationshipType[]>;
export function comparisonRelationships(id:string,group:keyof typeof groups){
 return familyMappings(id).filter(m=>(groups[group] as RelationshipType[]).includes(m.type));
}
export function reviewRows(){
 return families.filter(hasExplanation).flatMap(f=>familyMappings(f.id).map(m=>({
  entry_id:f.id,product:productName(f),mapping_id:m.id,component:m.component,
  relationship:m.type,structure_id:m.structureId||'',structure:structures.find(s=>s.id===m.structureId)?.name||'Unlocalized',
  indexed_modalities:f.modalities.join('; '),linked_record_ids:[...f.regulatoryIds,...f.studyIds,...f.publicationIds].join('; '),
  assertion:m.assertion,recorded_state:m.state,evidence_precision:m.precision,laterality:m.laterality,
  source_url:m.sourceUrl,source_locator:m.locator,extraction_method:m.method,
  source_quote:m.evidence?.quote||'',source_sha256:m.evidence?.sourceSha||'',
  reference_display:m.structureId&&humanRegionLocators[m.structureId]?anchorDescription(m.structureId):'No reference position drawn',
  limitations:m.limitations,recorded_review_date:m.reviewedAt,snapshot_exported_at:coverage.exportedAt,
  independent_reviewer:'',independent_review_date:'',independent_assessment:'',proposed_correction:'',review_notes:'',
 })));
}
export function csvCell(value:string){
 const text=/^[\s\u0000-\u001f]*[=+\-@]/.test(value)?"'"+value:value;
 return '"'+text.replace(/"/g,'""')+'"';
}
export function reviewCsv(){
 const rows=reviewRows();
 return [Object.keys(rows[0]),...rows.map(r=>Object.values(r))].map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';
}
