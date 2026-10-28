"use client";
import { useState } from 'react';
import { atlasBasePath } from '@/lib/deployment';
import type { FDAUpdatesResult } from '@/lib/fda-updates';
import { External } from './Evidence';

export default function FDAUpdates({application}:{application:string}) {
  const [data,setData]=useState<FDAUpdatesResult|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState('');
  async function load(){
    setLoading(true);setError('');
    try {
      const response=await fetch((atlasBasePath?'/api/atlas/fda':'/api/fda')+'?application='+encodeURIComponent(application),{signal:AbortSignal.timeout(12000)});
      if(!response.ok)throw new Error('FDA unavailable');
      const result=await response.json() as FDAUpdatesResult;
      if(result.application!==application||!Array.isArray(result.entries)||! /^[a-f0-9]{64}$/.test(result.sourceSha))throw new Error('Invalid update');
      setData(result);
    }catch{setError('FDA updates are unavailable. Reviewed records below are unchanged. Try again later.');}
    finally{setLoading(false);}
  }
  return <section className="fda-updates" aria-label="Latest public FDA decisions">
    <div><h3>Latest public FDA decisions</h3><button disabled={loading} onClick={load}>{loading?'Checking FDA…':data?'Check again':'Check FDA updates'}</button></div>
    {!data&&<p>Query this exact application ({application}). Results supplement the reviewed dossier; they do not certify current labeling or safety.</p>}
    {error&&<p role="status">{error}</p>}
    {data&&<>
      <p className="fda-freshness">Retrieved {new Date(data.retrievedAt).toLocaleString()} · FDA dataset updated {data.providerUpdatedAt||'unknown'}. Responses may be cached for one hour.</p>
      <p>Showing {data.entries.length} of {data.total} public decisions for {application}. Public decisions are not all pending filings. New supplements are unreviewed here.</p>
      <ol>{data.entries.map(e=><li key={e.id}><External href={e.url}>{e.id} · {e.date}</External><span>{e.decision}</span><small>{e.name}</small>{e.change&&<small>{e.change}</small>}{e.statement&&<details><summary>Original FDA statement</summary><p>{e.statement}</p></details>}</li>)}</ol>
      <div className="fda-original"><External href={data.sourceUrl}>Original FDA API response</External><a download={application+'-fda-source.json'} href={'data:application/json;charset=utf-8,'+encodeURIComponent(data.sourceText)}>Download source JSON</a></div>
      <small>SHA-256: {data.sourceSha}</small>
    </>}
  </section>;
}
