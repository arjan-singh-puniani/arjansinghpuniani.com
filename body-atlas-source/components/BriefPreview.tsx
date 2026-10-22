import {
  coverage,
  familyMappings,
  recordById,
  relationshipLabels,
  statusOf,
  timeline,
} from "@/lib/atlas";
import { frontier } from "@/lib/curation";
import type { Family } from "@/lib/types";
export default function BriefPreview({
  family: f,
  year,
}: {
  family: Family;
  year: number;
}) {
  return (
    <article className="brief-document">
      <div className="eyebrow">BODY//ATLAS / RESEARCH BRIEF</div>
      <h2>{f.name}</h2>
      <p>{f.description}</p>
      <div className="brief-scope">
        Cached source export: {coverage.exportedAt} (UTC). Timeline cutoff:{" "}
        {year}. Historical records are not current labeling. This is an indexed
        evidence extract, not a clinical recommendation.
      </div>
      <h3>Technology and regulatory landscape</h3>
      <p>
        {statusOf(f)}. Modalities: {f.modalities.join("; ")}.
      </p>
      <h3>Anatomy: components and targets</h3>
      {familyMappings(f.id).map((m) => (
        <section key={m.id}>
          <h4>
            {relationshipLabels[m.type]} · {m.component}
          </h4>
          <p>{m.assertion}</p>
          <p className="brief-citation">
            <a href={m.sourceUrl} target="_blank" rel="noopener noreferrer">
              Original evidence
            </a>{" "}
            · {m.locator} · {m.state}; {m.precision}; {m.laterality}.
          </p>
          <p>Limit: {m.limitations}</p>
        </section>
      ))}
      <h3>Indexed source records</h3>
      {[...f.regulatoryIds, ...f.studyIds, ...f.publicationIds].map((id) => {
        const r = recordById(id);
        return (
          r && (
            <section key={id}>
              <h4>
                <a href={r.url} target="_blank" rel="noopener noreferrer">
                  {r.title}
                </a>
              </h4>
              <p>
                {r.id} · {r.status || r.publicationDate || ""} ·{" "}
                {r.decisionDate || r.firstPosted || ""}
              </p>
              <p className="brief-citation">
                Retrieved {r.retrievedAt}. Source SHA-256:{" "}
                <span className="hash">{r.sourceSha}</span>.
              </p>
            </section>
          )
        );
      })}
      <h3>Documented milestones</h3>
      <ul>
        {timeline([f.id])
          .filter((e) => Number(e.date.slice(0, 4)) <= year)
          .map((e) => (
            <li key={e.id}>
              <time>{e.date}</time> ·{" "}
              <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer">
                {e.label}
              </a>{" "}
              · {e.kind}
            </li>
          ))}
      </ul>
      <h3>Unresolved questions</h3>
      {frontier
        .filter((item) => item.families.includes(f.id))
        .map((item) => (
          <section key={item.id}>
            <h4>{item.question}</h4>
            <p>{item.uncertain}</p>
            <p>Challenges: {item.challenges}</p>
            <p className="brief-citation">
              {item.sources.map((s, i) => (
                <a key={s} href={s} target="_blank" rel="noopener noreferrer">
                  Source {i + 1}{" "}
                </a>
              ))}
            </p>
          </section>
        ))}
      <p>
        The bounded index does not establish the absence of unindexed research
        or comparative trials. Confirm current labeling, evidence quality,
        selection criteria, and follow-up before drawing conclusions.
      </p>
      <h3>Limits of this investigation</h3>
      <p>{f.limitations}</p>
    </article>
  );
}
