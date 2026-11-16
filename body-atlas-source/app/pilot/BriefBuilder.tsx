"use client";

import { useState, type FormEvent } from "react";
import { atlasPath } from "@/lib/deployment";
import SupplementHistory, { type SelectedSupplement } from "./SupplementHistory";

export type BriefCase = {
  application: string;
  name: string;
  decisionDate: string;
  retrievedAt: string;
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

function markdownText(text: string) {
  return text
    .replace(/[\r\n]+/g, " ")
    .replace(/[&<>]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[character]!)
    .replace(/[\\`*_\[\]!|]/g, "\\$&");
}

export default function BriefBuilder({ cases, snapshot }: { cases: BriefCase[]; snapshot: string }) {
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [question, setQuestion] = useState("");
  const [selectedSupplements, setSelectedSupplements] = useState<Record<string, SelectedSupplement | undefined>>({});
  const [notes, setNotes] = useState({ pair: "", finding: "", gap: "" });
  const [index, setIndex] = useState<Record<string, BriefCase> | null>(null);
  const [added, setAdded] = useState<BriefCase[]>([]);
  const [application, setApplication] = useState("");
  const [lookup, setLookup] = useState<{ message: string; pending?: boolean; match?: BriefCase }>({ message: "" });
  const match = lookup.match;
  const choices = [...cases, ...added];
  const left = choices.find(item => item.application === first);
  const right = choices.find(item => item.application === second);
  const pair = left && right && left !== right ? [left, right] : [];
  const pairKey = pair.map(item => item.application).join("/");
  const finding = notes.pair === pairKey ? notes.finding : "";
  const gap = notes.pair === pairKey ? notes.gap : "";

  async function findApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = application.trim().toUpperCase();
    if (!/^(?:P|K|DEN)\d{6}$/.test(id)) {
      setLookup({ message: "Enter an original FDA application ID such as P100026, K130233 or DEN160019." });
      return;
    }

    const known = choices.find(item => item.application === id);
    if (known) {
      setLookup({ message: "Application found.", match: known });
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
      const match = available[id];
      setLookup(match ? { message: "Application found in the original decision snapshot.", match } : {
        message: "This original application is outside the snapshot. Check the FDA device databases for its record.",
      });
    } catch {
      setLookup({ message: "The application index could not load. Try again or choose a reviewed application below." });
    }
  }

  function useApplication(match: BriefCase, slot: "first" | "second") {
    if (!choices.some(item => item.application === match.application)) setAdded([...added, match]);
    if (slot === "first") setFirst(match.application);
    else setSecond(match.application);
    setLookup({ message: `Application ${match.application} added to the ${slot} comparison slot.` });
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
      return [
        "",
        `## ${markdownText(item.name)} · ${item.application}`,
        `${item.status} · ${item.decisionDate}. [Original FDA record](${item.url}). Retrieved ${item.retrievedAt} UTC.`,
        `FDA decision statement: ${markdownText(item.statement || missingStatement)}`,
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
          `FDA statement in the archive: ${markdownText(selected.statement || "Not available")}.`,
          `Archive checked ${selected.archiveDate} UTC. Verify the original source for applicability.`,
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
      <p>Find exact FDA application IDs in the snapshot or choose reviewed neurodevices below. Compare original decisions, check reviewed changes where available, and download an editable worksheet.</p>
      <noscript><p>Open the FDA links in the example below or download the cited example.</p></noscript>
      <form className="pilot-fields pilot-lookup" onSubmit={findApplication}>
        <label>Find an FDA application by ID
          <input value={application} maxLength={12} autoComplete="off" placeholder="P960009" disabled={lookup.pending}
            onChange={event => { setApplication(event.target.value); setLookup({ message: "" }); }} />
        </label>
        <button className="pilot-button" disabled={lookup.pending} type="submit">Find application</button>
      </form>
      <p role="status">{lookup.message}</p>
      {match && (
        <div className="pilot-lookup-result">
          <p>{match.application} · {match.name}</p>
          <div className="pilot-actions">
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
        <p id="pilot-question-hint" className="pilot-question">Your question and decision notes stay on this page and in your download.</p>
      </div>

      <p className="pilot-builder-status" role="status">{pair.length ? "Two applications ready to review." : "Choose two different applications to prepare the worksheet."}</p>
      {pair.length > 0 && (
        <>
          <div className="pilot-grid">
            {pair.map(item => (
              <article key={item.application} className="pilot-card">
                <h3>{item.name}</h3>
                <p>{item.status} · <time dateTime={item.decisionDate}>{item.decisionDate}</time></p>
                <a href={item.url}>Original FDA record {item.application}</a>
                <p>Retrieved <time dateTime={item.retrievedAt}>{item.retrievedAt}</time> UTC</p>
                <details className="pilot-decision">
                  <summary>FDA decision statement</summary>
                  <p>{item.statement || missingStatement}</p>
                </details>
                <h4>Anatomy evidence</h4>
                {item.relationships.length ? <ul>
                  {item.relationships.map(relationship => (
                    <li key={relationship.label}>
                      <strong>{relationship.label}</strong> · {relationship.state}. {relationship.assertion}{" "}
                      <a href={relationship.url}>{relationship.locator || "Source"}</a>
                      <p>{relationship.limits}</p>
                    </li>
                  ))}
                </ul> : <p>{missingRelationships}</p>}
                <h4>Later FDA decisions</h4>
                {item.supplement ? (
                  <>
                    <p><a href={item.supplement.url}>{item.supplement.id}</a> · <time dateTime={item.supplement.date}>{item.supplement.date}</time></p>
                    <p>{item.supplement.change}</p>
                  </>
                ) : <p>{missingSupplement}</p>}
                {item.dossierPath && <SupplementHistory
                  application={item.application}
                  dossierPath={item.dossierPath}
                  selected={selectedSupplements[item.application]}
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
              </article>
            ))}
          </div>
          <p>{scope}</p>
          <div className="pilot-fields pilot-grid">
            <label>What do the sources support?
              <textarea value={finding} rows={3} maxLength={800}
                onChange={event => setNotes({ pair: pairKey, finding: event.target.value, gap })} />
            </label>
            <label>What still needs checking?
              <textarea value={gap} rows={3} maxLength={800}
                onChange={event => setNotes({ pair: pairKey, finding, gap: event.target.value })} />
            </label>
          </div>
          <div className="pilot-actions">
            <a className="pilot-button" download="body-atlas-evidence-worksheet.md" href={`data:text/markdown;charset=utf-8,${encodeURIComponent(brief.toWellFormed())}`}>Download editable worksheet</a>
            <a href="#offer">Get help checking a gap</a>
          </div>
        </>
      )}
    </section>
  );
}
