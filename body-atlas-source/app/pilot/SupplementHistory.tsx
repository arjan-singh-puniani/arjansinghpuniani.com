"use client";

import { useState } from "react";
import type { DossierData } from "@/components/Dossier";
import { atlasPath } from "@/lib/deployment";

export type SelectedSupplement = DossierData["regulatory"]["rows"][number] & { archiveDate: string };
const displayLimit = 12;
type Decision = DossierData["regulatory"]["rows"][number];
type FdaSupplement = {
  pma_number: string;
  supplement_number: string;
  decision_date: string;
  supplement_reason?: string;
  ao_statement?: string;
};

function CachedFdaRecord({ row, source }: { row: Decision; source: NonNullable<DossierData["regulatory"]["sources"][number]> }) {
  const [record, setRecord] = useState<FdaSupplement | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const sourcePath = atlasPath(`/${source.originalSnapshot ? "sources" : "dossier-sources"}/${source.file}`);

  async function verify() {
    setStatus("loading");
    try {
      const response = await fetch(sourcePath);
      if (!response.ok) throw new Error("Cached FDA response unavailable");
      const bytes = await response.arrayBuffer();
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      const checksum = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
      if (checksum !== row.sourceSha) throw new Error("FDA response checksum mismatch");
      const payload = JSON.parse(new TextDecoder().decode(bytes)) as { results?: FdaSupplement[] };
      const match = payload.results?.find(item => item.pma_number === row.application &&
        item.supplement_number === row.supplement && item.decision_date === row.date);
      if (!match) throw new Error("Exact supplement missing in FDA response");
      setRecord(match);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  if (record) return (
    <div className="pilot-cached-source" role="status">
      <p><strong>Archived FDA record {record.pma_number}/{record.supplement_number}</strong> · {record.decision_date}</p>
      <p>{record.supplement_reason || "FDA change reason unavailable."}</p>
      <p>{record.ao_statement || "FDA decision statement unavailable."}</p>
      <p>Retrieved {source.retrievedAt?.slice(0, 10) || "date unavailable"}. Archive checksum verified.</p>
      <a href={sourcePath} target="_blank" rel="noopener noreferrer">Open the cached FDA response</a>
    </div>
  );

  return (
    <>
      <button type="button" className="pilot-source-button" onClick={verify} disabled={status === "loading"}>
        {status === "error" ? "Retry cached FDA record" : "Verify in cached FDA record"}
      </button>
      {status === "loading" && <p role="status">Verifying the archived FDA response…</p>}
      {status === "error" && <p role="alert">Could not verify the archived FDA response. Use the original link if available.</p>}
    </>
  );
}

export default function SupplementHistory({ application, dossierPath, selected, onSelect }: {
  application: string;
  dossierPath: string;
  selected?: SelectedSupplement;
  onSelect: (decision?: SelectedSupplement) => void;
}) {
  const [archive, setArchive] = useState<DossierData | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [query, setQuery] = useState("");

  async function load() {
    setState("loading");
    try {
      const response = await fetch(atlasPath(dossierPath));
      if (!response.ok) throw new Error("Archive unavailable");
      const data = await response.json() as DossierData;
      if (!data.applications?.includes(application) || !Array.isArray(data.regulatory?.rows) ||
          !Array.isArray(data.labeling?.changeIds) || !Array.isArray(data.regulatory.sources) || !data.reviewedAt) throw new Error("Invalid archive");
      setArchive(data);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  if (!archive) return (
    <div className="pilot-history">
      <button className="pilot-button" type="button" disabled={state === "loading"} onClick={load}>
        {state === "error" ? "Retry supplement history" : "Browse cached supplement history"}
      </button>
      {state === "loading" && <p role="status">Loading FDA supplement history…</p>}
      {state === "error" && <p role="alert">Could not load cached history. Open the original FDA record to check related decisions.</p>}
    </div>
  );

  const sources = new Map(archive.regulatory.sources
    .filter(source => source.sha && /^[a-f0-9]{64}$/.test(source.sha) && source.file === `${source.sha}.json`)
    .map(source => [source.sha, source]));
  const rows = archive.regulatory.rows.filter(row => row.application === application && /^S\d{3,4}$/.test(row.supplement));
  const changeIds = new Set(archive.labeling.changeIds);
  const term = query.trim().toLowerCase().replace("/", "");
  const results = term ? rows.filter(row =>
    [row.application + row.supplement, row.reason, row.tradeName, row.date, row.statement]
      .some(value => value?.toLowerCase().includes(term)),
  ) : rows.filter(row => changeIds.has(row.application + row.supplement));
  const visible = term || results.length ? results : rows;

  return (
    <div className="pilot-history pilot-fields">
      <p>Cached FDA history · {rows.length} supplements for {application} · archive checked {archive.reviewedAt.slice(0, 10)} UTC. Records shown here still require source review.</p>
      {!!rows.length && (
        <>
          <label>Filter supplements for {application}
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="ID, change reason, or keyword" maxLength={80} />
          </label>
          <p role="status">{visible.length ? `Showing ${Math.min(displayLimit, visible.length)} of ${visible.length} ${!term && results.length ? "labeling-change " : ""}matches.` : "No matching supplements in this archive."}</p>
          <ul>
            {visible.slice(0, displayLimit).map(row => {
              const source = sources.get(row.sourceSha);
              return (
                <li key={row.supplement}>
                  <a href={row.url} target="_blank" rel="noopener noreferrer">{row.application}/{row.supplement}</a> · <time dateTime={row.date}>{row.date}</time>
                  <p>{row.decision} · {row.reason || "Change reason unavailable"}</p>
                  {row.statement && <details><summary>Indexed FDA statement</summary><p>{row.statement}</p></details>}
                  {source && <CachedFdaRecord row={row} source={source} />}
                  <button className="pilot-button" type="button" disabled={selected?.supplement === row.supplement}
                    onClick={() => onSelect({ ...row, archiveDate: archive.reviewedAt.slice(0, 10) })}>
                    {selected?.supplement === row.supplement ? "Included in worksheet" : `Include ${row.supplement} in worksheet`}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
