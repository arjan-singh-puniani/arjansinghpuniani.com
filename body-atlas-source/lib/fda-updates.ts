import { createHash } from 'node:crypto';
import applications from '../data/fda-applications.json';

export interface FDAUpdatesResult {
  application: string;
  retrievedAt: string;
  providerUpdatedAt: string | null;
  sourceUrl: string;
  sourceSha: string;
  sourceText: string;
  total: number;
  entries: {id:string;name:string;date:string;decision:string;url:string;change:string;statement:string}[];
}
const allowed=new Set(applications), cache=new Map<string,FDAUpdatesResult>(), pending=new Map<string,Promise<FDAUpdatesResult>>(), retryAfter=new Map<string,number>();
const TTL=60*60*1000, MAX_BYTES=1024*1024;
export const fdaUpdateScope=applications;
export function fdaUpdateUrl(application:string) {
  if(!allowed.has(application))return null;
  const pma=/^P\d{6}$/.test(application);
  return 'https://api.fda.gov/device/'+(pma?'pma':'510k')+'.json?'+new URLSearchParams({search:(pma?'pma_number:':'k_number:')+application,limit:'10',sort:'decision_date:desc'});
}
function date(value:unknown) {
  if(typeof value!=='string'||! /^(?:\d{8}|\d{4}-\d{2}-\d{2})$/.test(value))throw new Error('Invalid FDA decision date');
  const iso=value.length===10?value:value.slice(0,4)+'-'+value.slice(4,6)+'-'+value.slice(6);
  if(new Date(iso+'T00:00:00Z').toISOString().slice(0,10)!==iso)throw new Error('Invalid FDA decision date');
  return iso;
}
export function parseFDAUpdates(application:string,sourceText:string,retrievedAt=new Date().toISOString()):FDAUpdatesResult {
  const sourceUrl=fdaUpdateUrl(application);if(!sourceUrl)throw new Error('Application is outside reviewed scope');
  const data=JSON.parse(sourceText);
  if(!Array.isArray(data.results)||data.results.length>10||!Number.isSafeInteger(data.meta?.results?.total)||data.meta.results.total<data.results.length)throw new Error('FDA response schema changed');
  const pma=application.startsWith('P');
  const entries=data.results.map((r:Record<string,unknown>)=>{
    if((pma?r.pma_number:r.k_number)!==application)throw new Error('FDA returned a different application');
    const supplement=pma?r.supplement_number:'';
    if(typeof supplement!=='string'||! /^(?:S\d{3,4})?$/.test(supplement))throw new Error('Invalid supplement identity');
    const name=pma?r.trade_name:r.device_name;
    if(typeof name!=='string'||name.length>2000||typeof r.decision_code!=='string'||!/^[A-Z0-9]{2,8}$/.test(r.decision_code))throw new Error('Invalid FDA record');
    const code=r.decision_code;
    const text=(key:string)=>{const value=r[key];if(value===undefined)return '';if(typeof value!=='string'||value.length>20000)throw new Error('Invalid FDA text field');return value;};
    const decision=pma ? supplement ? 'PMA supplement · '+code : code==='APPR'?'Original PMA approval':'PMA decision · '+code : ['SESE','SESU','SESD'].includes(code)?'510(k) clearance':'510(k) decision · '+code;
    return {id:application+supplement,name,date:date(r.decision_date),decision,change:[text('supplement_type'),text('supplement_reason')].filter(Boolean).join(' · '),statement:text('ao_statement'),url:pma?'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpma/pma.cfm?id='+application+supplement:'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID='+application};
  });
  if(new Set(entries.map((e:{id:string})=>e.id)).size!==entries.length)throw new Error('Duplicate FDA decision identity');
  const updated=data.meta?.last_updated;
  if(updated!==undefined&&(typeof updated!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(updated)))throw new Error('Invalid provider timestamp');
  return {application,retrievedAt,providerUpdatedAt:updated||null,sourceUrl,sourceSha:createHash('sha256').update(sourceText).digest('hex'),sourceText,total:data.meta.results.total,entries};
}
async function acquire(application:string,fetcher:typeof fetch) {
  const url=fdaUpdateUrl(application)!;
  const response=await fetcher(url,{signal:AbortSignal.timeout(8000),redirect:'error',cache:'no-store',headers:{Accept:'application/json'}});
  if(!response.ok)throw new Error('FDA provider unavailable');
  if(!response.headers.get('content-type')?.includes('application/json')||Number(response.headers.get('content-length')||0)>MAX_BYTES)throw new Error('Invalid FDA response');
  const reader=response.body?.getReader();if(!reader)throw new Error('Empty FDA response');
  const chunks:Uint8Array[]=[];let size=0;
  try {while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>MAX_BYTES)throw new Error('FDA response exceeds limit');chunks.push(value);}}
  finally {await reader.cancel();}
  const result=parseFDAUpdates(application,Buffer.concat(chunks).toString('utf8'));
  cache.set(application,result);return result;
}
export async function handleFDAUpdates(request:Request,fetcher:typeof fetch=fetch):Promise<Response> {
  const params=new URL(request.url).searchParams, application=params.get('application')||'';
  if(params.size!==1||!fdaUpdateUrl(application))return Response.json({error:'Choose an application from the reviewed atlas collection.'},{status:400,headers:{'Cache-Control':'no-store'}});
  try {
    if((retryAfter.get(application)||0)>Date.now())throw new Error('Provider cooling down');
    let result=cache.get(application);
    if(!result||Date.now()-Date.parse(result.retrievedAt)>=TTL){
      let task=pending.get(application);
      if(!task){task=acquire(application,fetcher);pending.set(application,task);}
      try{result=await task;retryAfter.delete(application);}finally{pending.delete(application);}
    }
    return Response.json(result,{headers:{'Cache-Control':'public, max-age=300, s-maxage=3600','X-Content-Type-Options':'nosniff'}});
  } catch {
    if(!retryAfter.has(application)||retryAfter.get(application)!<=Date.now())retryAfter.set(application,Date.now()+60000);
    return Response.json({error:'FDA updates are unavailable. The reviewed atlas snapshot and its sources remain available.'},{status:503,headers:{'Cache-Control':'no-store','Retry-After':'60'}});
  }
}
