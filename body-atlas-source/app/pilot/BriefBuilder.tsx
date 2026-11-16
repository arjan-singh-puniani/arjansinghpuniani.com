"use client";

import { useState } from "react";

export type BriefCase = {
  application: string;
  name: string;
  decisionDate: string;
  retrievedAt: string;
  status: string;
  url: string;
  statement: string;
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
  const left = cases.find(item => item.application === first);
  const right = cases.find(item => item.application === second);
  const pair = left && right && left !== right ? [left, right] : [];

  const brief = [
    "# BODY//ATLAS device evidence worksheet",
    "",
    `Research question: ${markdownText(question.trim()) || "Add the decision this comparison will inform."}`,
    `Snapshot exported ${snapshot} UTC.`,
    scope,
    ...pair.flatMap(item => [
      "",
      `## ${markdownText(item.name)} · ${item.application}`,
      `${item.status} · ${item.decisionDate}. [Original FDA record](${item.url}). Retrieved ${item.retrievedAt} UTC.`,
      `FDA decision statement: ${markdownText(item.statement || missingStatement)}`,
      ...(item.relationships.length ? item.relationships.map(relationship =>
        `- ${relationship.label} (${relationship.state}): ${markdownText(relationship.assertion)} [Source](${relationship.url}) · ${markdownText(relationship.locator)}. Limits: ${markdownText(relationship.limits)}`,
      ) : [missingRelationships]),
      `Evidence limits: ${markdownText(item.limits)}`,
    ]),
    "",
    "## Decision notes",
    "- What these sources support:",
    "- Open question or conflicting evidence:",
    "- Next source to verify:",
    "",
  ].join("\n");

  return (
    <section id="build" className="pilot-section" aria-labelledby="build-title">
      <p className="pilot-kicker">Free evidence worksheet</p>
      <h2 id="build-title">Build a cited brief</h2>
      <p>Choose two original FDA applications from the reviewed neurodevice collection. Read the decision statements, check selected anatomy claims, and download an editable worksheet for your review.</p>
      <noscript><p>Open the FDA links in the example below or download the cited example.</p></noscript>
      <div className="pilot-fields pilot-grid">
        {[
          { label: "First FDA application", value: first, set: setFirst, other: second },
          { label: "Second FDA application", value: second, set: setSecond, other: first },
        ].map(field => (
          <label key={field.label}>{field.label}
            <select value={field.value} onChange={event => field.set(event.target.value)}>
              <option value="">Choose an application</option>
              {cases.map(item => <option key={item.application} value={item.application} disabled={item.application === field.other}>
                {item.application} · {item.name}
              </option>)}
            </select>
          </label>
        ))}
        <label className="pilot-question">Decision or question (optional)
          <input value={question} onChange={event => setQuestion(event.target.value)} maxLength={240} aria-describedby="pilot-question-hint" />
        </label>
        <p id="pilot-question-hint" className="pilot-question">Your question stays on this page and in your download.</p>
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
                <h4>Evidence limits</h4>
                <p>{item.limits}</p>
              </article>
            ))}
          </div>
          <p>{scope}</p>
          <div className="pilot-actions">
            <a className="pilot-button" download="body-atlas-evidence-worksheet.md" href={`data:text/markdown;charset=utf-8,${encodeURIComponent(brief.toWellFormed())}`}>Download editable worksheet</a>
            <a href="#offer">Get help checking a gap</a>
          </div>
        </>
      )}
    </section>
  );
}
