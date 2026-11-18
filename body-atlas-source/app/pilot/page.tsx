import type { Metadata } from "next";
import { briefDataUrl, coverage, families, recordById, relationshipLabels } from "@/lib/atlas";
import { atlasBasePath, atlasPath } from "@/lib/deployment";
import { dossiers } from "@/lib/dossiers";
import { comparisonRelationships } from "@/lib/research-workflow";
import BriefBuilder, { type BriefCase } from "./BriefBuilder";
import DecisionMemo from "./DecisionMemo";
import Inquiry from "./Inquiry";
import "./pilot.css";

export const metadata: Metadata = {
  title: "Neurodevice evidence brief pilot | BODY//ATLAS",
  description: "Compare original FDA decisions and request a fixed-scope U.S. neurodevice evidence brief.",
};

const example = [
  {
    name: "Activa Tremor Control System",
    source: "FDA:P960009:",
    summary: "An implanted lead delivers electrical stimulation to the thalamic VIM.",
  },
  {
    name: "ExAblate Neuro",
    source: "FDA:P150038:",
    summary: "External equipment focuses ultrasound to thermally ablate tissue at the intended thalamic target.",
  },
];

const reviewedSupplements: Record<string, NonNullable<BriefCase["supplement"]>> = {
  P960009: {
    id: "P960009/S007",
    date: "2002-01-14",
    change: "The supplement authorized a separate Parkinson’s configuration for bilateral GPi or STN stimulation in the population specified by FDA. The original decision concerned unilateral thalamic stimulation for tremor.",
    url: "https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpma/pma.cfm?id=P960009S007",
  },
  P150038: {
    id: "P150038/S037",
    date: "2025-07-03",
    change: "The supplement added specified pallidothalamic tractotomy uses for Parkinson’s disease, including staged treatment on the opposite side after at least six months. The original decision concerned unilateral thalamotomy for essential tremor.",
    url: "https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpma/pma.cfm?id=P150038S037",
  },
};

const decisionTypes = new Set(["PMA approval", "510(k) clearance", "De Novo authorization"]);
const briefCases = families.flatMap((family): BriefCase[] => {
  if (family.collection === "catalogue" || family.regulatoryIds.length !== 1) return [];
  const record = recordById(family.regulatoryIds[0]);
  if (!record?.application || record.supplement || !record.decisionDate || !record.status ||
      !decisionTypes.has(record.status)) return [];
  const relationships = (["placement", "measurement", "target"] as const).flatMap(group => {
    const mapping = comparisonRelationships(family.id, group).find(item =>
      (item.state === "Verified" || item.state === "Supported") && item.type !== "unlocalized",
    );
    return mapping ? [{
      label: `${relationshipLabels[mapping.type]} · ${mapping.component}`,
      assertion: mapping.assertion,
      limits: mapping.limitations,
      state: mapping.state,
      locator: mapping.locator,
      url: mapping.sourceUrl,
    }] : [];
  });
  return [{
    application: record.application,
    name: family.name,
    decisionDate: record.decisionDate,
    retrievedAt: record.retrievedAt.slice(0, 10),
    sourceSha: record.sourceSha,
    status: record.status,
    url: record.url,
    statement: record.statement?.trim() || "",
    limits: family.limitations,
    supplement: reviewedSupplements[record.application],
    dossierPath: record.application.startsWith("P") ? dossiers[family.id]?.path : undefined,
    relationships,
  }];
}).sort((a, b) => a.name.localeCompare(b.name));

export default function PilotPage() {
  return (
    <div className="pilot">
      <a className="skip-link" href="#pilot-content">Skip to content</a>
      <header className="pilot-nav">
        <a className="pilot-brand" href={atlasPath("/")}>BODY<span>//</span>ATLAS</a>
        <nav aria-label="Pilot navigation">
          <a href="#build">Brief builder</a>
          <a href="#example">Example</a>
          <a href="#offer">Pilot</a>
          <a href={atlasPath("/")}>Explore Atlas</a>
        </nav>
      </header>
      <main id="pilot-content">
        <section className="pilot-hero" aria-labelledby="pilot-title">
          <div>
            <p className="pilot-kicker">U.S. neurodevice R&amp;D</p>
            <h1 id="pilot-title">Compare devices. Trace the evidence.</h1>
            <p>Prepare a device comparison for your next R&amp;D review. Check the original FDA decisions, flag what still needs verification, and export a cited worksheet.</p>
            <div className="pilot-actions">
              <a className="pilot-button" href="#build">Build a cited brief</a>
              <a href="#decision-memo">See a sample paid deliverable</a>
            </div>
          </div>
          <aside className="pilot-card pilot-preview" aria-labelledby="scope-title">
            <h2 id="scope-title">Inside the example comparison</h2>
            <dl>
              <div><dt>Activa · P960009</dt><dd>Implanted electrical stimulation</dd></div>
              <div><dt>ExAblate · P150038</dt><dd>Focused ultrasound ablation</dd></div>
            </dl>
            <p>Selected U.S. FDA records · snapshot <time dateTime={coverage.exportedAt}>{coverage.exportedAt.slice(0, 10)}</time></p>
            <p>Historical labeling, incomplete supplements and recalls, and regional anatomy references with no independent adjudication. For research and internal discussion only.</p>
            {atlasBasePath && <a href="/documents/body-atlas-validation.json">Read the public validation record</a>}
          </aside>
        </section>

        <BriefBuilder cases={briefCases} snapshot={coverage.exportedAt.slice(0, 10)} />

        <section id="example" className="pilot-section" aria-labelledby="example-title">
          <p className="pilot-kicker">Free comparison</p>
          <h2 id="example-title">Two approaches to a thalamic target</h2>
          <p>Compare the original FDA decisions for electrical stimulation and focused ultrasound. The market authorization dates below refer to the original applications.</p>
          <div className="pilot-grid">
            {example.map(({ name, source, summary }) => {
              const record = recordById(source);
              return (
                <article className="pilot-card" key={source}>
                  <h3>{name}</h3>
                  <p>{summary}</p>
                  {record ? <a href={record.url} target="_blank" rel="noopener noreferrer">Original FDA PMA {record.application} · {record.decisionDate}</a> :
                    <p>Original record is missing from this snapshot.</p>}
                </article>
              );
            })}
          </div>
          <p>Shared anatomy does not establish equivalent outcomes. Later indications, models, and safety actions require separate source checks.</p>
          <div className="pilot-actions">
            <a className="pilot-button" href={atlasPath("/?demo=tremor")}>Open the interactive comparison</a>
            <a download="body-atlas-example.md" href={briefDataUrl(["activa", "exablate"], 2026)}>Download the cited example</a>
          </div>
        </section>

        <DecisionMemo />

        <section id="offer" className="pilot-section pilot-grid" aria-labelledby="offer-title">
          <div>
            <p className="pilot-kicker">Custom research</p>
            <h2 id="offer-title">A sourced brief for your review</h2>
            <p>Bring one U.S. neurodevice question. Arjan Singh Puniani scopes it with your team and compares two agreed FDA applications using public sources.</p>
            <ul>
              <li>A one-page decision memo, an editable device comparison and a source log with dates and exact locations for material findings.</li>
              <li>An open-check list, a qualified reviewer spot check, a team walkthrough and one round of factual corrections.</li>
            </ul>
            <p>Tell us which review the brief needs to support. We’ll agree on the scope, fixed fee and delivery date before work starts. The pilot excludes regulatory strategy, current-label certification, exhaustive recall checks, and clinical recommendations. Future questions can be scoped as separate briefs.</p>
            <p>Start with a public-source question. Arjan reviews it by email and confirms fit, reviewer availability and timing before sending a quote.</p>
            <p><a href="#decision-memo">See the sample decision memo</a></p>
          </div>
          <Inquiry />
        </section>
      </main>
    </div>
  );
}
