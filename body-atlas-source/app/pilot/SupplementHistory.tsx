"use client";

import { useState } from "react";
import type { DossierData } from "@/components/Dossier";
import { atlasPath } from "@/lib/deployment";
import CachedFdaRecord from "./CachedFdaRecord";

export type SelectedSupplement = DossierData["regulatory"]["rows"][number] & { archiveDate: string };
const displayLimit = 12;

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
  const term = query.trim().toLowerCase();
  const supplementalId = term.replace(/[\s/]+/g, "");
  const results = term ? rows.filter(row =>
    (supplementalId && (row.application + row.supplement).toLowerCase().includes(supplementalId)) ||
    [row.reason, row.tradeName, row.date, row.statement].some(value => value?.toLowerCase().includes(term)),
  ) : rows.filter(row => changeIds.has(row.application + row.supplement));
  const visible = term || results.length ? results : rows;

  return (
    <div className="pilot-history pilot-fields">
      <p>Cached FDA history · {rows.length} supplements for {application} · dossier dated {archive.reviewedAt.slice(0, 10)} UTC. Verify the exact source before citing an indexed row.</p>
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
                  {source && <CachedFdaRecord application={row.application} supplement={row.supplement}
                    date={row.date} sourceSha={row.sourceSha} retrievedAt={source.retrievedAt}
                    sourcePath={source.originalSnapshot ? undefined : atlasPath(`/dossier-sources/${source.file}`)} />}
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
