"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { atlasPath } from "@/lib/deployment";
import CompanyMark from "@/components/CompanyMark";
import { pilotDraftKey, readPilotDraft, type PilotDraft } from "@/lib/pilot-draft";
import CachedFdaRecord, { archiveKey, type ArchiveVerification } from "./CachedFdaRecord";
import SupplementHistory, { loadSupplementArchive, type SelectedSupplement } from "./SupplementHistory";

export type BriefCase = {
  application: string;
  name: string;
  applicant?: string;
  decisionDate: string;
  retrievedAt: string;
  sourceSha: string;
  status: string;
  url: string;
  statement: string;
  dossierPath?: string;
  supplement?: { id: string; date: string; change: string; url: string };
  limits: string;
  relationships: {
    label: string;
    assertion: string;
    limits: string;
    state: string;
    locator: string;
    url: string;
  }[];
};

const scope = "Historical U.S. evidence. Verify current labeling and relevant supplements before relying on these records. A device authorization or shared target cannot establish comparative outcomes. Regional relationships do not specify implant coordinates.";
const missingStatement = "The indexed record does not provide a usable decision statement. Open the original FDA record.";
const missingSupplement = "No later decision has a reviewed summary in this worksheet. Check the original record for related decisions and confirm the current label separately.";
const missingRelationships = "No specific placement, recording site, or target is established in this subset.";

function searchKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function markdownText(text: string) {
  return text
    .replace(/[\r\n]+/g, " ")
    .replace(/[&<>]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[character]!)
    .replace(/[\\`*_\[\]!|]/g, "\\$&");
}

function archiveStatus(verification?: ArchiveVerification) {
  if (verification === "failed") return "Verification failed in this session. Source unresolved.";
  if (verification) return "Exact cached decision verified in this session by identifier, date and SHA-256.";
  return "Indexed match. Exact cached decision has not been verified in this session.";
}

export default function BriefBuilder({ cases, snapshot }: { cases: BriefCase[]; snapshot: string }) {
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [question, setQuestion] = useState("");
  const [selectedSupplements, setSelectedSupplements] = useState<Record<string, SelectedSupplement | undefined>>({});
  const [verifications, setVerifications] = useState<Record<string, ArchiveVerification>>({});
  const [notes, setNotes] = useState<Record<string, { finding: string; gap: string }>>({});
  const [index, setIndex] = useState<Record<string, BriefCase> | null>(null);
  const [added, setAdded] = useState<BriefCase[]>([]);
  const [search, setSearch] = useState("");
  const [lookup, setLookup] = useState<{ message: string; pending?: boolean; match?: BriefCase; results?: BriefCase[] }>({ message: "" });
  const [draftPhase, setDraftPhase] = useState<"loading" | "ready" | "blocked">("loading");
  const [draftMessage, setDraftMessage] = useState("Restoring this tab’s worksheet…");
  const savedDraft = useRef("");
  const restoreRun = useRef(0);
  const wasRestored = useRef(false);
  const match = lookup.match;
  const searchInput = useRef<HTMLInputElement>(null);
  const matchActions = useRef<HTMLDivElement>(null);
  const comparisonHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (match) matchActions.current?.querySelector<HTMLButtonElement>("button:enabled")?.focus();
  }, [match]);
  const choices = [...cases, ...added];
  const left = choices.find(item => item.application === first);
  const right = choices.find(item => item.application === second);
  const pair = left && right && left !== right ? [left, right] : [];
  const pairKey = pair.map(item => item.application).sort().join("/");
  const { finding, gap } = notes[pairKey] ?? { finding: "", gap: "" };

  async function restoreDraft() {
    const run = ++restoreRun.current;
    setDraftPhase("loading");
    try {
      const raw = sessionStorage.getItem(pilotDraftKey) || "";
      savedDraft.current = raw;
      if (!raw) { setDraftPhase("ready"); return; }
      const draft = readPilotDraft(raw);
      if (!draft) throw new Error("Unreadable draft");
      let available = Object.fromEntries(cases.map(item => [item.application, item]));
      const ids = [...new Set([...draft.applications, draft.first, draft.second, ...Object.keys(draft.supplements)])].filter(Boolean);
      if (ids.some(id => !available[id])) {
        const response = await fetch(atlasPath("/pilot/records.json"));
        if (!response.ok) throw new Error("Index unavailable");
        const current = await response.json() as Record<string, BriefCase>;
        available = { ...current, ...available };
        if (run !== restoreRun.current) return;
        setIndex(current);
      }
      if (ids.some(id => !available[id] || available[id].application !== id)) throw new Error("Saved application unavailable");
      const restoredSupplements = await Promise.all(Object.entries(draft.supplements).map(async ([application, supplement]) => {
        const path = available[application].dossierPath;
        if (!path) throw new Error("Saved supplement unavailable");
        const archive = await loadSupplementArchive(application, path);
        const row = archive.regulatory.rows.find(item => item.application === application && item.supplement === supplement);
        if (!row) throw new Error("Saved supplement unavailable");
        const source = archive.regulatory.sources.find(item => item.sha === row.sourceSha && item.file === `${row.sourceSha}.json`);
        return [application, { ...row, archiveDate: archive.reviewedAt.slice(0, 10), retrievedAt: source?.retrievedAt }] as const;
      }));
      if (run !== restoreRun.current) return;
      setAdded(ids.filter(id => !cases.some(item => item.application === id)).map(id => available[id]));
      setFirst(draft.first); setSecond(draft.second); setQuestion(draft.question); setNotes(draft.notes);
      setSelectedSupplements(Object.fromEntries(restoredSupplements));
      setVerifications({});
      wasRestored.current = true;
      setDraftPhase("ready");
    } catch {
      if (run !== restoreRun.current) return;
      setDraftPhase("blocked");
      setDraftMessage(savedDraft.current
        ? "The saved worksheet could not be restored. Its saved copy has not been replaced. Retry or download a backup before starting over."
        : "Draft saving is unavailable. Existing saved work has not been replaced. Retry or download your worksheet before leaving this page.");
    }
  }

  useEffect(() => {
    void restoreDraft();
    return () => { restoreRun.current++; };
  }, []);

  useEffect(() => {
    if (draftPhase !== "ready") return;
    const draft: PilotDraft = {
      version: 1, first, second, question, notes, applications: added.map(item => item.application),
      supplements: Object.fromEntries(Object.entries(selectedSupplements).flatMap(([id, value]) => value ? [[id, value.supplement]] : [])),
    };
    const raw = JSON.stringify(draft);
    try {
      if (!readPilotDraft(raw)) throw new Error("Draft exceeds save bounds");
      sessionStorage.setItem(pilotDraftKey, raw);
      savedDraft.current = raw;
      setDraftMessage(wasRestored.current ? "Worksheet restored and saved in this tab." : "Worksheet saved in this tab.");
    } catch { setDraftMessage("Draft saving is unavailable. Download your worksheet before leaving this page."); }
  }, [first, second, question, notes, added, selectedSupplements, draftPhase]);

  function clearDraft() {
    restoreRun.current++;
    setFirst(""); setSecond(""); setQuestion(""); setNotes({}); setAdded([]);
    setSelectedSupplements({}); setVerifications({}); setSearch(""); setLookup({ message: "" });
    savedDraft.current = ""; wasRestored.current = false; setDraftPhase("ready");
    requestAnimationFrame(() => searchInput.current?.focus());
  }

  function verifyArchive(key: string, outcome: ArchiveVerification) {
    setVerifications(current => {
      if (outcome === "failed" && current[key] && current[key] !== "failed") return current;
      return { ...current, [key]: outcome };
    });
  }

  function loadExample() {
    setFirst("P960009");
    setSecond("P150038");
    requestAnimationFrame(() => comparisonHeading.current?.focus());
  }

  async function findApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = search.trim().toUpperCase();
    const exact = /^(?:P|K|DEN)\d{6}$/.test(id);
    const name = searchKey(search);
    if (!exact && /^(?:P|K|DEN)\s*\d+(?:\s*\/?\s*S\s*\d*)?$/.test(id)) {
      setLookup({ message: "Enter an original FDA application ID such as P100026. Browse supplements after selecting its original decision." });
      return;
    }
    if (!exact && name.length < 3) {
      setLookup({ message: "Enter an FDA application ID or at least three characters of a device name." });
      return;
    }

    const known = choices.find(item => item.application === id);
    if (known) {
      setLookup({ message: "Exact application match in the original decision snapshot.", match: known });
      return;
    }

    setLookup({ message: "Looking up application…", pending: true });
    try {
      let available = index;
      if (!available) {
        const response = await fetch(atlasPath("/pilot/records.json"));
        if (!response.ok) throw new Error("Index unavailable");
        available = await response.json() as Record<string, BriefCase>;
        setIndex(available);
      }
      if (exact) {
        const match = available[id];
        setLookup(match ? { message: "Exact application match in the original decision snapshot.", match } : {
          message: "This original application is outside the snapshot. Check the FDA device databases for its record.",
        });
        return;
      }

      const terms = name.split(" ");
      const matches = Object.values(available)
        .map(item => ({ item, title: searchKey(item.name), searchable: searchKey(`${item.name} ${item.applicant || ""} ${item.application}`) }))
        .filter(({ searchable }) => terms.every(term => searchable.includes(term)))
        .sort((a, b) => Number(b.title === name) - Number(a.title === name) ||
          Number(b.title.includes(name)) - Number(a.title.includes(name)) ||
          a.title.length - b.title.length || a.item.application.localeCompare(b.item.application));
      setLookup(matches.length ? {
        message: matches.length > 8 ? "Showing 8 matches. Add a model name or FDA ID to narrow the search." :
          `${matches.length} ${matches.length === 1 ? "match" : "matches"}. Check the ID and decision date before choosing.`,
        results: matches.slice(0, 8).map(({ item }) => item),
      } : { message: "No matching names in this snapshot. Try a shorter name or an exact FDA application ID." });
    } catch {
      setLookup({ message: "The application index could not load. Try again or choose a reviewed application below." });
    }
  }

  function useApplication(match: BriefCase, slot: "first" | "second") {
    if (!choices.some(item => item.application === match.application)) setAdded([...added, match]);
    if (slot === "first") setFirst(match.application);
    else setSecond(match.application);
    setLookup({ message: `Application ${match.application} added to the ${slot} comparison slot.` });
    searchInput.current?.focus();
  }

  const brief = [
    "# BODY//ATLAS device evidence worksheet",
    "",
    `Research question: ${markdownText(question.trim()) || "Add the decision this comparison will inform."}`,
    `Snapshot exported ${snapshot} UTC.`,
    scope,
    "",
    "## Decision notes",
    `- What the sources support: ${markdownText(finding.trim()) || "Add a finding and the source that supports it."}`,
    `- What still needs checking: ${markdownText(gap.trim()) || "Add the gap and the next source to verify."}`,
    ...pair.flatMap(item => {
      const selected = selectedSupplements[item.application];
      const originalVerification = verifications[archiveKey(item.application, item.decisionDate, item.sourceSha)];
      const supplementVerification = selected && verifications[archiveKey(selected.application, selected.date, selected.sourceSha, selected.supplement)];
      return [
        "",
        `## ${markdownText(item.name)} · ${item.application}`,
        `${item.status} · ${item.decisionDate}. [Original FDA record](${item.url}). Retrieved ${item.retrievedAt} UTC.`,
        `FDA applicant: ${markdownText(item.applicant || "Not recorded in this snapshot")}.`,
        ...(item.sourceSha ? [`Original FDA archive SHA-256: ${item.sourceSha}.`] : []),
        `Original source status: ${archiveStatus(originalVerification)}`,
        `Indexed FDA decision statement: ${markdownText(item.statement || missingStatement)}`,
        ...(item.relationships.length ? item.relationships.map(relationship =>
          `- ${relationship.label} (${relationship.state}): ${markdownText(relationship.assertion)} [Source](${relationship.url}) · ${markdownText(relationship.locator)}. Limits: ${markdownText(relationship.limits)}`,
        ) : [missingRelationships]),
        "",
        "### Later FDA decisions",
        item.supplement
          ? `[${item.supplement.id}](${item.supplement.url}) · ${item.supplement.date}. ${markdownText(item.supplement.change)}`
          : missingSupplement,
        ...(selected ? [
          `Selected cached supplement: [${selected.application}/${selected.supplement}](${selected.url}) · ${selected.date} · ${markdownText(selected.decision)}.`,
          `Indexed change reason: ${markdownText(selected.reason || "Not available")}.`,
          `Indexed FDA statement: ${markdownText(selected.statement || "Not available")}.`,
          `Dossier dated ${selected.archiveDate} UTC. Inclusion records an indexed match. Verify applicability before citing this row.`,
          `Supplement source status: ${archiveStatus(supplementVerification)}`,
          ...(selected.retrievedAt ? [`Archived FDA response retrieved ${selected.retrievedAt}.`] : []),
          ...(selected.sourceSha ? [`Archive source SHA-256: ${selected.sourceSha}.`] : []),
        ] : []),
        `Evidence limits: ${markdownText(item.limits)}`,
      ];
    }),
    "",
  ].join("\n");

  return (
    <section id="build" className="pilot-section" aria-labelledby="build-title">
      <p className="pilot-kicker">Free evidence worksheet</p>
      <h2 id="build-title">Build a cited brief</h2>
      <p>Try the example pair or find two original FDA applications by device, FDA applicant or ID. Source links in the worksheet open in a new tab.</p>
      <div className="pilot-draft-status">
        <p role="status">{draftMessage}</p>
        {draftPhase === "blocked" && <div className="pilot-actions">
          <button type="button" className="pilot-outline" onClick={() => void restoreDraft()}>Retry restoring worksheet</button>
          {savedDraft.current && <a download="body-atlas-draft-backup.json" href={`data:application/json;charset=utf-8,${encodeURIComponent(savedDraft.current.toWellFormed())}`}>Download saved draft backup</a>}
        </div>}
        <details>
          <summary>Start a new worksheet</summary>
          <p>This clears the question, notes, application choices and supplements saved in this tab.</p>
          <button type="button" className="pilot-outline" onClick={clearDraft}>Clear saved worksheet and notes</button>
        </details>
      </div>
      <fieldset className="pilot-draft-fields" disabled={draftPhase === "loading"} aria-label="Worksheet builder">
      {cases.some(item => item.application === "P960009") && cases.some(item => item.application === "P150038") &&
        <button type="button" className="pilot-outline" onClick={loadExample}>Load Activa and ExAblate example</button>}
      <noscript><p>Open the FDA links in the example below or download the cited example.</p></noscript>
      <form className="pilot-fields pilot-lookup" onSubmit={findApplication}>
        <label>Find an FDA application by device name or ID
          <input ref={searchInput} value={search} maxLength={80} autoComplete="off" placeholder="InterStim or P080025" disabled={lookup.pending}
            aria-describedby="pilot-search-hint" onChange={event => { setSearch(event.target.value); setLookup({ message: "" }); }} />
        </label>
        <button className="pilot-button" disabled={lookup.pending} type="submit">Find application</button>
      </form>
      <p id="pilot-search-hint">Search a device, FDA applicant or original application ID.</p>
      <p role="status">{lookup.message}</p>
      {lookup.results && (
        <ul className="pilot-lookup-matches" aria-label="Matching FDA applications">
          {lookup.results.map(item => (
            <li key={item.application}>
              <button className="pilot-result-button" type="button"
                onClick={() => setLookup({ message: "Application selected. Choose where to compare it.", match: item })}>
                <strong>{item.application}</strong> · {item.name} · {item.decisionDate}
                {item.applicant && <span className="pilot-result-applicant">FDA applicant · {item.applicant}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {match && (
        <div className="pilot-lookup-result">
          <p>{match.application} · {match.name}</p>
          <div className="pilot-actions" ref={matchActions}>
            <button className="pilot-button" type="button" disabled={match.application === second}
              onClick={() => useApplication(match, "first")}>Use as first</button>
            <button className="pilot-button" type="button" disabled={match.application === first}
              onClick={() => useApplication(match, "second")}>Use as second</button>
          </div>
        </div>
      )}
      <div className="pilot-fields pilot-grid">
        {[
          { label: "First FDA application", value: first, set: setFirst, other: second },
          { label: "Second FDA application", value: second, set: setSecond, other: first },
        ].map(field => (
          <label key={field.label}>{field.label}
            <select value={field.value} onChange={event => field.set(event.target.value)}>
              <option value="">Choose an application</option>
              {choices.map(item => <option key={item.application} value={item.application} disabled={item.application === field.other}>
                {item.application} · {item.name}
              </option>)}
            </select>
          </label>
        ))}
        <label className="pilot-question">Decision or question (optional)
          <input value={question} onChange={event => setQuestion(event.target.value)} maxLength={240} aria-describedby="pilot-question-hint" />
        </label>
        <p id="pilot-question-hint" className="pilot-question">Your draft stays in this tab, including refreshes; nothing is sent to a server. Use public information only. Download a copy for long-term storage. Reverify archived sources after reloading.</p>
      </div>

      <p className="pilot-builder-status" role="status">{pair.length ? "Two applications ready to review." : left || right ? "Choose one more application to compare." : "Choose two different applications to prepare the worksheet."}</p>
      {pair.length > 0 && (
        <section className="pilot-worksheet" aria-label="Evidence worksheet">
          <header className="pilot-print-only">
            <p>BODY//ATLAS · Evidence worksheet</p>
            <h2>{question || "Device evidence comparison"}</h2>
            <p>Source snapshot: {snapshot} UTC. For research and internal discussion.</p>
          </header>
          <div className="pilot-comparison-heading">
            <h3 ref={comparisonHeading} tabIndex={-1}>Review the two FDA decisions</h3>
            <a href="#worksheet-notes">Jump to notes and export</a>
          </div>
          <div className="pilot-grid">
            {pair.map(item => (
              <article key={item.application} className="pilot-card">
                <h3>{item.name}</h3>
                {item.applicant && <CompanyMark organization={item.applicant} role="FDA applicant" />}
                <p>{item.status} · <time dateTime={item.decisionDate}>{item.decisionDate}</time></p>
                <a href={item.url} target="_blank" rel="noopener noreferrer">Original FDA record {item.application}</a>
                <p>Decision index · Retrieved <time dateTime={item.retrievedAt}>{item.retrievedAt}</time> UTC</p>
                <details className="pilot-decision">
                  <summary>FDA decision statement</summary>
                  <p>{item.statement || missingStatement}</p>
                </details>
                {item.sourceSha && <CachedFdaRecord application={item.application} date={item.decisionDate}
                  sourceSha={item.sourceSha} retrievedAt={item.retrievedAt}
                  verification={verifications[archiveKey(item.application, item.decisionDate, item.sourceSha)]} onVerify={verifyArchive} />}
                <h4>Anatomy evidence</h4>
                {item.relationships.length ? <ul>
                  {item.relationships.map(relationship => (
                    <li key={relationship.label}>
                      <strong>{relationship.label}</strong> · {relationship.state}. {relationship.assertion}{" "}
                      <a href={relationship.url} target="_blank" rel="noopener noreferrer">{relationship.locator || "Source"}</a>
                      <p>{relationship.limits}</p>
                    </li>
                  ))}
                </ul> : <p>{missingRelationships}</p>}
                <h4>Later FDA decisions</h4>
                {item.supplement ? (
                  <>
                    <p><a href={item.supplement.url} target="_blank" rel="noopener noreferrer">{item.supplement.id}</a> · <time dateTime={item.supplement.date}>{item.supplement.date}</time></p>
                    <p>{item.supplement.change}</p>
                  </>
                ) : <p>{missingSupplement}</p>}
                {item.dossierPath && <SupplementHistory
                  application={item.application}
                  dossierPath={item.dossierPath}
                  selected={selectedSupplements[item.application]}
                  verifications={verifications}
                  onVerify={verifyArchive}
                  onSelect={decision => setSelectedSupplements(current => ({ ...current, [item.application]: decision }))}
                />}
                {selectedSupplements[item.application] && <div className="pilot-history">
                  <p>Included in export: {item.application}/{selectedSupplements[item.application]?.supplement}.</p>
                  <button type="button" onClick={() => setSelectedSupplements(current => ({ ...current, [item.application]: undefined }))}>
                    Remove selected supplement
                  </button>
                </div>}
                <h4>Evidence limits</h4>
                <p>{item.limits}</p>
                <div className="pilot-print-only pilot-print-provenance">
                  <h4>Original decision and source provenance</h4>
                  <p>{item.statement || missingStatement}</p>
                  <p>{archiveStatus(verifications[archiveKey(item.application, item.decisionDate, item.sourceSha)])}</p>
                  {item.sourceSha && <p>Original archive SHA-256: <code>{item.sourceSha}</code></p>}
                  {selectedSupplements[item.application] && (() => {
                    const selected = selectedSupplements[item.application]!;
                    return <>
                      <h4>Selected later decision</h4>
                      <p><a href={selected.url}>{selected.application}/{selected.supplement}</a> · {selected.date} · {selected.decision}</p>
                      <p>{selected.reason || "Change reason unavailable."} {selected.statement || "Statement unavailable."}</p>
                      <p>Dossier dated {selected.archiveDate}. {archiveStatus(verifications[archiveKey(selected.application, selected.date, selected.sourceSha, selected.supplement)])}</p>
                      {selected.sourceSha && <p>Supplement archive SHA-256: <code>{selected.sourceSha}</code></p>}
                    </>;
                  })()}
                </div>
              </article>
            ))}
          </div>
          <p>{scope}</p>
          <h3 id="worksheet-notes" tabIndex={-1}>Notes and export</h3>
          <div className="pilot-fields pilot-grid">
            <label>What do the sources support?
              <textarea value={finding} rows={3} maxLength={800}
                onChange={event => setNotes({ ...notes, [pairKey]: { finding: event.target.value, gap } })} />
            </label>
            <label>What still needs checking?
              <textarea value={gap} rows={3} maxLength={800}
                onChange={event => setNotes({ ...notes, [pairKey]: { finding, gap: event.target.value } })} />
            </label>
          </div>
          <div className="pilot-print-only pilot-print-notes">
            <h4>What the sources support</h4><p>{finding || "No finding recorded."}</p>
            <h4>What still needs checking</h4><p>{gap || "No open question recorded. This does not establish completeness."}</p>
          </div>
          <div className="pilot-actions">
            <a className="pilot-button" download="body-atlas-evidence-worksheet.md" href={`data:text/markdown;charset=utf-8,${encodeURIComponent(brief.toWellFormed())}`}>Download editable worksheet</a>
            <button type="button" className="pilot-outline" onClick={() => window.print()}>Print or save PDF</button>
            <a href="#offer">Get help checking a gap</a>
          </div>
        </section>
      )}
      </fieldset>
    </section>
  );
}
