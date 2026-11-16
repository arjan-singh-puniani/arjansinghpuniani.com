const question = "Which original FDA decisions belong in a U.S. essential-tremor comparison, and which later decision should be tracked separately?";
const answer = "Keep two separate rows for the original decisions. Activa uses implanted electrical stimulation. ExAblate Neuro uses focused ultrasound for thermal ablation. Track the later Activa Parkinson’s supplement separately so it does not broaden the historical tremor row.";
const followUp = "Before using the comparison in a current review, confirm the exact models and applicable labeling. Review comparative clinical evidence separately if the team needs to compare outcomes.";
const scope = "Illustrative research memo covering three historical U.S. FDA records. Current labeling, comparative outcomes and recall status remain open.";
const sources = [
  {
    title: "Activa Tremor Control System · P960009",
    date: "1997-07-31",
    finding: "The original PMA authorized unilateral thalamic stimulation for disabling upper-extremity tremor in specified patients with essential tremor or Parkinsonian tremor.",
    locator: "FDA approval order statement",
    url: "https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpma/pma.cfm?id=P960009",
  },
  {
    title: "ExAblate Neuro Model 4000 Type 1.0 · P150038",
    date: "2016-07-11",
    finding: "The original PMA authorized unilateral thalamotomy for specified adults with medication-refractory idiopathic essential tremor.",
    locator: "FDA safety and effectiveness summary, sections I–II, page 1",
    url: "https://www.accessdata.fda.gov/cdrh_docs/pdf15/P150038B.pdf",
  },
  {
    title: "Activa Parkinson’s Control Therapy · P960009/S007",
    date: "2002-01-14",
    finding: "This later supplement authorized a separate configuration for bilateral GPi or STN stimulation in a specified Parkinson’s disease population.",
    locator: "FDA supplement safety and effectiveness summary, sections I–II, pages 1–2",
    url: "https://www.accessdata.fda.gov/cdrh_docs/pdf/p960009s007b.pdf#page=2",
  },
];

const title = "Sample decision memo";
const markdown = [
  `# ${title} · BODY//ATLAS`,
  "", scope, "",
  "## Review question", question, "",
  "## Decision note", answer, "",
  "## Dated source log",
  ...sources.map(source => `- **${source.title}** · ${source.date}. ${source.finding} [${source.locator}](${source.url})`),
  "", "## Open checks", followUp, "",
].join("\n");

export default function DecisionMemo() {
  return (
    <section id="decision-memo" className="pilot-section" aria-labelledby="decision-memo-title">
      <h2 id="decision-memo-title">{title}</h2>
      <p>{scope}</p>
      <div className="pilot-grid">
        <article className="pilot-card">
          <h3>Review question</h3>
          <p>{question}</p>
          <h3>Decision note</h3>
          <p>{answer}</p>
          <h3>Open checks</h3>
          <p>{followUp}</p>
        </article>
        <article className="pilot-card">
          <h3>Dated source log</h3>
          <ul>
            {sources.map(({ title, date, finding, locator, url }) => (
              <li key={url}>
                <strong>{title}</strong> · <time dateTime={date}>{date}</time>
                <p>{finding} <a href={url} target="_blank" rel="noopener noreferrer">{locator}</a></p>
              </li>
            ))}
          </ul>
        </article>
      </div>
      <div className="pilot-actions">
        <a download="body-atlas-sample-decision-memo.md" href={`data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`}>Download sample memo</a>
        <a className="pilot-button" href="#offer">Discuss your review question</a>
      </div>
    </section>
  );
}
