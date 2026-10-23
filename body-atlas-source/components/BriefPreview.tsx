import {
  coverage,
  familyMappings,
  recordById,
  relationshipLabels,
  statusOf,
  timeline,
} from "@/lib/atlas";
import { interventionActions, interventionSummaries, productName } from "@/lib/intervention-view";
import { frontier } from "@/lib/curation";
import { dossiers, reviewLabels } from "@/lib/dossiers";
import { atlasPath } from "@/lib/deployment";
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
      <h2>{productName(f)}</h2>
      <p>{interventionActions[f.id]}</p>
      {interventionSummaries[f.id] && <p><a href={interventionSummaries[f.id].sourceUrl || recordById(f.regulatoryIds[0])!.url} target="_blank" rel="noopener noreferrer">Explanation source</a> · {interventionSummaries[f.id].locator}</p>}
      <div className="brief-scope">
        Cached source export: {coverage.exportedAt} (UTC). Timeline cutoff:{" "}
        {year}. See the dossier for labeling and safety review status. This is an indexed
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
      {dossiers[f.id] && <section className="brief-dossier"><h3>Regulatory, labeling & safety dossier</h3><p>Snapshot {dossiers[f.id].reviewedAt}. Source assessment: {reviewLabels[dossiers[f.id].currentLabelReview]} · {dossiers[f.id].labelReview.reviewedAt}.</p><p>{dossiers[f.id].regulatory.detail}</p><p>{dossiers[f.id].labeling.detail}</p><p>{dossiers[f.id].safety.detail}</p><p>Safety notice review: {dossiers[f.id].noticeReview}; affected model/lot review: {dossiers[f.id].modelLotReview}.</p><p>{dossiers[f.id].labelReview.scope}</p>{dossiers[f.id].labelReview.findings.map((finding,i)=><p key={i}>{finding.text} <a href={finding.sourceUrl} target="_blank" rel="noopener noreferrer">Original source</a> · {finding.locator}</p>)}{dossiers[f.id].labelReview.limitations.map(limit=><p key={limit}>Open limit: {limit}</p>)}{dossiers[f.id].sourceLinks.map(s=><p key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></p>)}<a href={atlasPath(dossiers[f.id].path)} target="_blank" rel="noopener noreferrer">Complete dossier, coverage and original source links</a></section>}
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
