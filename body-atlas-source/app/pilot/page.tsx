import type { Metadata } from "next";
import { briefDataUrl, coverage, recordById } from "@/lib/atlas";
import { atlasBasePath, atlasPath } from "@/lib/deployment";
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

export default function PilotPage() {
  return (
    <div className="pilot">
      <a className="skip-link" href="#pilot-content">Skip to content</a>
      <header className="pilot-nav">
        <a className="pilot-brand" href={atlasPath("/")}>BODY<span>//</span>ATLAS</a>
        <nav aria-label="Pilot navigation">
          <a href="#example">Example</a>
          <a href="#offer">Pilot</a>
          <a href={atlasPath("/")}>Explore Atlas</a>
        </nav>
      </header>
      <main id="pilot-content">
        <section className="pilot-hero" aria-labelledby="pilot-title">
          <div>
            <p className="pilot-kicker">U.S. neurodevice evidence</p>
            <h1 id="pilot-title">Compare devices. Trace the evidence.</h1>
            <p>For neurotechnology teams scoping a U.S. device landscape. Compare how devices interact with anatomy, trace claims back to FDA records, and see which questions still need research.</p>
            <div className="pilot-actions">
              <a className="pilot-button" href="#example">See the free example</a>
              <a href="#offer">Discuss a research brief</a>
            </div>
          </div>
          <aside className="pilot-card" aria-labelledby="scope-title">
            <h2 id="scope-title">What Atlas covers</h2>
            <p>Selected U.S. FDA decisions and related research records. The public snapshot was exported <time dateTime={coverage.exportedAt}>{coverage.exportedAt.slice(0, 10)}</time>. Individual sources have their own dates.</p>
            <p>Historical labeling, incomplete supplements and recalls, and regional anatomy references with no independent adjudication. For research and internal discussion only.</p>
            {atlasBasePath && <a href="/documents/body-atlas-validation.json">Read the public validation record</a>}
          </aside>
        </section>

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
                  {record ? <a href={record.url}>Original FDA PMA {record.application} · {record.decisionDate}</a> :
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

        <section id="offer" className="pilot-section pilot-grid" aria-labelledby="offer-title">
          <div>
            <p className="pilot-kicker">Custom research</p>
            <h2 id="offer-title">A sourced brief for your review</h2>
            <p>Bring one U.S. neurodevice landscape question. Arjan Singh Puniani scopes the question with your team and researches up to three agreed devices or applications using public sources.</p>
            <ul>
              <li>A comparison brief with links, source dates, FDA decision history, and evidence gaps.</li>
              <li>A source log and a walkthrough for your team.</li>
            </ul>
            <p>Share your question to discuss scope, pricing, and timing. The pilot excludes regulatory strategy, current-label certification, exhaustive recall checks, and clinical recommendations. Future questions can be scoped as separate briefs.</p>
          </div>
          <Inquiry />
        </section>
      </main>
    </div>
  );
}
