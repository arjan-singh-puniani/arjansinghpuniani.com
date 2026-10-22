"use client";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Crosshair,
  Database,
  FlaskConical,
  Focus,
  Layers3,
  Microscope,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  authorized,
  brief,
  coverage,
  descendants,
  families,
  familyById,
  familyMappings,
  firstEventYear,
  mappings,
  recordById,
  records,
  relationshipLabels,
  retrieve,
  searchFamilies,
  statusOf,
  structures,
  timeline,
} from "@/lib/atlas";
import { frontier } from "@/lib/curation";
import Topography from "./Topography";
import BriefPreview from "./BriefPreview";
import { External, State, SourceRecord } from "./Evidence";
import type { AtlasRecord, EvidenceState, Family } from "@/lib/types";
const Scene = dynamic(() => import("./AnatomyScene"), {
  ssr: false,
  loading: () => <div className="scene-fallback">Loading anatomy viewer…</div>,
});
type View =
  | "atlas"
  | "library"
  | "frontier"
  | "compare"
  | "mission"
  | "coverage";
type InspectorTab = "anatomy" | "sources" | "research";
const date = (value: string) => value.slice(0, 10);
export default function Observatory() {
  const [view, setView] = useState<View>("atlas"),
    [region, setRegion] = useState("UBERON:0000955"),
    [query, setQuery] = useState(""),
    [modality, setModality] = useState("all"),
    [authorization, setAuthorization] = useState("all"),
    [year, setYear] = useState(2026);
  const [selected, setSelected] = useState("rns"),
    [tab, setTab] = useState<InspectorTab>("anatomy"),
    [comparison, setComparison] = useState<string[]>(["activa", "exablate"]),
    [dissect, setDissect] = useState(false),
    [sceneReady, setSceneReady] = useState(false),
    [sceneUnavailable, setSceneUnavailable] = useState(false),
    [sceneKey, setSceneKey] = useState(0);
  const [libraryQuery, setLibraryQuery] = useState(""),
    [sourceKind, setSourceKind] = useState("all"),
    [selectedRecord, setSelectedRecord] = useState<string | null>(null),
    [question, setQuestion] = useState(""),
    [answer, setAnswer] = useState<ReturnType<typeof retrieve> | null>(null);
  const f = familyById(selected)!;
  const rows = useMemo(
    () => searchFamilies(query, region, modality, authorization, year),
    [query, region, modality, authorization, year],
  );
  const allRegionRows = useMemo(() => searchFamilies("", region), [region]);
  const events = useMemo(
    () => timeline(allRegionRows.map((r) => r.family.id)),
    [allRegionRows],
  );
  const displayRegion = structures.find((s) => s.id === region),
    isBrain = descendants("UBERON:0000955").includes(region);
  const filteredRecords = useMemo(
    () =>
      records.filter(
        (r) =>
          (sourceKind === "all" || r.kind === sourceKind) &&
          [
            r.title,
            r.id,
            r.applicant,
            r.sponsor,
            r.organization,
            r.productCode,
            ...(r.investigators || []),
          ]
            .join(" ")
            .toLowerCase()
            .includes(libraryQuery.toLowerCase()),
      ),
    [libraryQuery, sourceKind],
  );
  const onReady = useCallback(() => {
    setSceneReady(true);
    setSceneUnavailable(false);
  }, []);
  const onUnavailable = useCallback(() => {
    setSceneReady(false);
    setSceneUnavailable(true);
  }, []);
  function selectFamily(id: string) {
    setSelected(id);
    setSelectedRecord(null);
    setTab("anatomy");
    if (window.matchMedia("(max-width:960px)").matches)
      requestAnimationFrame(() =>
        document
          .querySelector(".inspector")
          ?.scrollIntoView({ block: "start" }),
      );
  }
  function selectRegion(id: string) {
    if (id !== region) setSceneReady(false);
    setRegion(id);
    setView("atlas");
    setDissect(id !== "UBERON:0000955");
  }
  function toggleComparison(id: string) {
    setComparison((p) =>
      p.includes(id)
        ? p.filter((x) => x !== id)
        : p.length < 4
          ? [...p, id]
          : p,
    );
  }
  const exportUrl = `/api/brief?ids=${comparison.length && view === "compare" ? comparison.join(",") : selected}&year=${year}`;
  const linked = [...f.regulatoryIds, ...f.studyIds, ...f.publicationIds]
    .map(recordById)
    .filter((r): r is AtlasRecord => !!r);
  const existing = selectedRecord ? recordById(selectedRecord) : null;
  const nav: { id: View; label: string; icon: typeof Crosshair }[] = [
    { id: "atlas", label: "Observatory", icon: Crosshair },
    { id: "library", label: "Evidence library", icon: BookOpen },
    { id: "frontier", label: "Research frontier", icon: FlaskConical },
  ];
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to research workspace
      </a>
      <header className="topbar">
        <a className="brand" href="/" aria-label="BODY ATLAS home">
          BODY<span>//</span>ATLAS<sup>01</sup>
        </a>
        <div className="brand-caption">
          THE HUMAN INTERVENTION
          <br />
          OBSERVATORY
        </div>
        <nav aria-label="Primary navigation">
          {nav.map((n) => (
            <button
              key={n.id}
              className={view === n.id ? "nav-active" : ""}
              onClick={() => setView(n.id)}
            >
              <n.icon size={15} />
              {n.label}
            </button>
          ))}
        </nav>
        <button
          className="snapshot-indicator"
          onClick={() => setView("coverage")}
        >
          <span />
          Cached public evidence
          <ChevronRight size={13} />
        </button>
      </header>
      <div className="contextbar">
        <span>
          <span className="tiny-square" /> NEUROTECHNOLOGY COLLECTION
        </span>
        <span>
          {families.length} curated entries <b>/</b>{" "}
          {
            records.filter((r) => ["pma", "510k", "de_novo"].includes(r.kind))
              .length
          }{" "}
          regulatory records <b>/</b>{" "}
          {mappings.filter((m) => m.state !== "Unknown").length} sourced
          anatomical relationships
        </span>
        <button onClick={() => setView("coverage")}>
          Coverage & limitations <ArrowUpRight size={12} />
        </button>
      </div>
      <div className="workspace">
        <aside className="explorer" aria-label="Exploration controls">
          <div className="panel-heading">
            <span>EXPLORE</span>
            <SlidersHorizontal size={14} />
          </div>
          <label className="search-field">
            <Search size={16} />
            <input
              aria-label="Search technologies"
              placeholder="Target, technology, topic…"
              value={query}
              maxLength={500}
              onChange={(e) => {
                setQuery(e.target.value);
                setView("atlas");
              }}
            />
          </label>
          <div className="section-label">
            ANATOMICAL INDEX <span>HUMAN</span>
          </div>
          <div className="anatomy-tree">
            <button
              className={region === "all" ? "tree-active" : ""}
              onClick={() => selectRegion("all")}
            >
              <Layers3 size={15} />
              All indexed anatomy<span>{families.length}</span>
            </button>
            <div className="tree-group">
              <span>
                <ChevronDown size={12} />
                Nervous system
              </span>
              {structures
                .filter((s) =>
                  [
                    "UBERON:0000955",
                    "UBERON:0000956",
                    "UBERON:0001897",
                    "UBERON:0001906",
                    "UBERON:0001759",
                    "UBERON:0002240",
                    "BODY:spinal-epidural",
                    "UBERON:0001844",
                  ].includes(s.id),
                )
                .map((s) => (
                  <button
                    key={s.id}
                    className={`${region === s.id ? "tree-active" : ""} ${s.parent === "UBERON:0000955" ? "tree-child" : ""}`}
                    onClick={() => selectRegion(s.id)}
                  >
                    <span className="tree-dot" />
                    {s.name}
                    <span>{searchFamilies("", s.id).length}</span>
                  </button>
                ))}
            </div>
            <div className="tree-group">
              <span>OTHER COMPONENT SITES</span>
              {structures
                .filter((s) =>
                  [
                    "UBERON:0003129",
                    "BODY:chest-wall",
                    "BODY:external-head",
                  ].includes(s.id),
                )
                .map((s) => (
                  <button
                    key={s.id}
                    className={region === s.id ? "tree-active" : ""}
                    onClick={() => selectRegion(s.id)}
                  >
                    {s.name}
                    <span>{searchFamilies("", s.id).length}</span>
                  </button>
                ))}
            </div>
          </div>
          <div className="filter-block">
            <label htmlFor="modality">INTERVENTION MODALITY</label>
            <select
              id="modality"
              aria-label="Intervention modality"
              value={modality}
              onChange={(e) => setModality(e.target.value)}
            >
              <option value="all">All physical interactions</option>
              {[...new Set(families.flatMap((f) => f.modalities))].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
            <label htmlFor="authorization">REGULATORY EVIDENCE</label>
            <select
              id="authorization"
              aria-label="Regulatory evidence"
              value={authorization}
              onChange={(e) => setAuthorization(e.target.value)}
            >
              <option value="all">All evidence pathways</option>
              <option value="authorized">
                Indexed marketing authorization
              </option>
              <option value="research">Investigational / research</option>
            </select>
          </div>
          <button
            className="reset-link"
            onClick={() => {
              setRegion("UBERON:0000955");
              setQuery("");
              setModality("all");
              setAuthorization("all");
              setYear(2026);
              setDissect(false);
            }}
          >
            <RotateCcw size={12} />
            Reset exploration
          </button>
          <div className="explorer-note">
            <ShieldCheck size={18} />
            <p>
              Follow the assertion.
              <br />
              <span>
                Every anatomical assignment exposes its source and its limits.
              </span>
            </p>
          </div>
        </aside>
        <main id="main" className={`main-panel view-${view}`}>
          {view === "atlas" && (
            <>
              <div className="atlas-title">
                <div>
                  <div className="eyebrow">
                    HUMAN REFERENCE ATLAS / NEURAL SYSTEMS
                  </div>
                  <h1>
                    {displayRegion?.name || "All indexed anatomy"}
                    <span> / </span>
                    <small>Interventions</small>
                  </h1>
                  <p>
                    What have we attempted here — and what does the evidence
                    support?
                  </p>
                </div>
                <button
                  className="icon-button"
                  aria-label="View source coverage"
                  onClick={() => setView("coverage")}
                >
                  <Database size={17} />
                </button>
              </div>
              <section
                className="anatomy-stage"
                aria-label="Anatomical observatory"
              >
                <div className="stage-topline">
                  <span>
                    <span className="status-dot" />
                    {isBrain
                      ? "HRA MALE BRAIN v1.3"
                      : "REGIONAL EVIDENCE INDEX"}
                  </span>
                  <span>REFERENCE GEOMETRY · NO DEVICE COORDINATES</span>
                </div>
                {isBrain ? (
                  <>
                    <div className="anatomy-canvas" data-testid="anatomy-scene">
                      <Scene
                        key={sceneKey}
                        region={region}
                        dissect={dissect}
                        onSelect={selectRegion}
                        onReady={onReady}
                        onUnavailable={onUnavailable}
                      />
                    </div>
                    <div className="scene-title">
                      <span>01 / NEURAL REFERENCE</span>
                      <strong>{displayRegion?.name}</strong>
                      <p>
                        {region === "UBERON:0001897"
                          ? "Regional highlight. VIM is not separately localized."
                          : "Select a structure or use the anatomical index."}
                      </p>
                    </div>
                    <div className="scene-controls">
                      <button
                        onClick={() => setDissect((v) => !v)}
                        aria-pressed={dissect}
                      >
                        <Layers3 size={14} />
                        {dissect ? "Show context" : "Isolate region"}
                      </button>
                      <button
                        onClick={() => {
                          setSceneKey((k) => k + 1);
                          setSceneReady(false);
                        }}
                        aria-label="Reset anatomical view"
                      >
                        <Focus size={16} />
                      </button>
                    </div>
                    <div className="scene-bottomline">
                      <span data-testid="scene-status">
                        {sceneUnavailable
                          ? "3D unavailable · text exploration remains available"
                          : sceneReady
                            ? "Reference loaded · drag to rotate · scroll to zoom"
                            : "Loading licensed reference geometry…"}
                      </span>
                      <External href="https://doi.org/10.48539/HBM929.XKCL.339">
                        Browne & Schlehlein · CC BY 4.0
                      </External>
                    </div>
                  </>
                ) : (
                  <div className="regional-fallback">
                    <Crosshair size={38} />
                    <h2>{displayRegion?.name || "Anatomical relationships"}</h2>
                    <p>
                      {displayRegion?.name
                        ? "No licensed reference geometry for this site is bundled."
                        : "Choose Brain to explore the licensed 3D reference."}{" "}
                      Use the intervention stack and evidence inspector to
                      inspect supported regional relationships.
                    </p>
                    <button onClick={() => selectRegion("UBERON:0000955")}>
                      Open brain reference <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </section>
              <Topography year={year} selectRegion={selectRegion} />
              <section
                className="time-machine"
                aria-labelledby="timeline-title"
              >
                <div className="timeline-heading">
                  <div>
                    <span className="eyebrow">INTERVENTION TIME MACHINE</span>
                    <h2 id="timeline-title">
                      A documented history, in context.
                    </h2>
                  </div>
                  <output htmlFor="year">{year}</output>
                </div>
                <label className="sr-only" htmlFor="year">
                  Documented history through year
                </label>
                <input
                  id="year"
                  type="range"
                  min="1980"
                  max="2026"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                />
                <div className="range-labels">
                  <span>1980</span>
                  <span>1990</span>
                  <span>2000</span>
                  <span>2010</span>
                  <span>2026</span>
                </div>
                <div className="event-strip">
                  {events
                    .filter((e) => Number(e.date.slice(0, 4)) <= year)
                    .slice(-3)
                    .map((e) => (
                      <button
                        key={e.id}
                        onClick={() => {
                          selectFamily(e.familyId);
                          setSelectedRecord(e.recordId);
                          setTab("sources");
                        }}
                      >
                        <time>{e.date}</time>
                        <span>{e.label}</span>
                        <ArrowUpRight size={13} />
                      </button>
                    ))}
                  {!events.some((e) => Number(e.date.slice(0, 4)) <= year) && (
                    <p className="empty-text">
                      No indexed event for this region before {year}. This does
                      not establish that no technology existed.
                    </p>
                  )}
                </div>
                <p className="microcopy">
                  Dates describe sourced events, not invention dates. Technology
                  visibility uses the first indexed event. Retrieval dates are
                  shown in evidence.
                </p>
              </section>
              <section className="intervention-stack">
                <div className="stack-heading">
                  <div>
                    <span className="eyebrow">THE INTERVENTION STACK</span>
                    <h2>
                      {rows.length}{" "}
                      {rows.length === 1 ? "approach" : "approaches"} in this
                      view
                    </h2>
                  </div>
                  <button onClick={() => setView("compare")}>
                    Compare ({comparison.length}) <ChevronRight size={14} />
                  </button>
                </div>
                <div aria-live="polite" className="sr-only">
                  {rows.length} matching approaches
                </div>
                {rows.map(({ family: fam }) => (
                  <article
                    className={`technology-row ${selected === fam.id ? "selected" : ""}`}
                    key={fam.id}
                  >
                    <button
                      className="technology-main"
                      onClick={() => selectFamily(fam.id)}
                    >
                      <span className={`modality-symbol modality-${fam.id}`}>
                        <Activity size={19} />
                      </span>
                      <span>
                        <strong>{fam.name}</strong>
                        <small>{fam.modalities.slice(0, 2).join(" / ")}</small>
                      </span>
                      <span className="technology-status">
                        {authorized(fam) ? "FDA record" : "Research"}
                        <small>{firstEventYear(fam)}</small>
                      </span>
                      <ChevronRight size={15} />
                    </button>
                    <button
                      className="compare-toggle"
                      aria-label={`${comparison.includes(fam.id) ? "Remove" : "Add"} ${fam.name} ${comparison.includes(fam.id) ? "from" : "to"} comparison`}
                      aria-pressed={comparison.includes(fam.id)}
                      disabled={
                        !comparison.includes(fam.id) && comparison.length >= 4
                      }
                      onClick={() => toggleComparison(fam.id)}
                    >
                      {comparison.includes(fam.id) ? <Check size={13} /> : "+"}
                    </button>
                  </article>
                ))}
                {!rows.length && (
                  <div className="empty-state">
                    No indexed approaches match these filters. Try another
                    region or reset exploration. The collection is not
                    exhaustive.
                  </div>
                )}
              </section>
            </>
          )}
          {view === "library" && (
            <section className="content-page">
              <span className="eyebrow">
                EVIDENCE LIBRARY / AUTHENTIC CACHED RECORDS
              </span>
              <h1>Go straight to the source.</h1>
              <p>
                Regulatory decisions, study registrations, literature metadata,
                and grants remain distinct entities. {records.length} records
                are indexed.
              </p>
              <div className="library-filters">
                <label className="search-field">
                  <Search size={16} />
                  <input
                    aria-label="Search source records"
                    placeholder="Identifier, device, applicant, investigator…"
                    value={libraryQuery}
                    onChange={(e) => setLibraryQuery(e.target.value)}
                    maxLength={500}
                  />
                </label>
                <select
                  aria-label="Filter data source"
                  value={sourceKind}
                  onChange={(e) => setSourceKind(e.target.value)}
                >
                  <option value="all">All source types</option>
                  {[
                    "510k",
                    "pma",
                    "de_novo",
                    "classification",
                    "trial",
                    "publication",
                    "grant",
                  ].map((k) => (
                    <option key={k} value={k}>
                      {
                        (
                          {
                            "510k": "FDA 510(k)",
                            pma: "FDA PMA",
                            de_novo: "FDA De Novo",
                            classification: "FDA classification",
                            trial: "ClinicalTrials.gov",
                            publication: "PubMed",
                            grant: "NIH RePORTER",
                          } as Record<string, string>
                        )[k]
                      }
                    </option>
                  ))}
                </select>
              </div>
              <div className="result-count" aria-live="polite">
                {filteredRecords.length} source records
              </div>
              {filteredRecords.map((r) => (
                <button
                  className={`library-row ${selectedRecord === r.id ? "selected" : ""}`}
                  key={r.id}
                  onClick={() => {
                    setSelectedRecord(r.id);
                    setTab("sources");
                  }}
                >
                  <span className="eyebrow">
                    {r.kind} · {r.id}
                  </span>
                  <strong>{r.title}</strong>
                  <span>
                    {r.applicant || r.sponsor || r.organization || r.journal}
                  </span>
                  <small>
                    {r.decisionDate ||
                      r.firstPosted ||
                      r.publicationDate ||
                      r.projectNumber}{" "}
                    <ArrowUpRight size={12} />
                  </small>
                </button>
              ))}
              {!filteredRecords.length && (
                <div className="empty-state">
                  No records match. Try a shorter query or another source type.
                </div>
              )}
            </section>
          )}
          {view === "frontier" && (
            <section className="content-page">
              <span className="eyebrow">
                RESEARCH FRONTIER / QUESTIONS, NOT CLAIMS
              </span>
              <h1>The unresolved is worth mapping.</h1>
              <p>
                Each question starts with identifiable source evidence. Absence
                from this collection does not establish an absence of research.
              </p>
              {frontier.map((item, i) => (
                <article className="frontier-item" key={item.id}>
                  <div className="frontier-number">0{i + 1}</div>
                  <h2>{item.title}</h2>
                  <dl>
                    <dt>What is known</dt>
                    <dd>{item.known}</dd>
                    <dt>What remains uncertain</dt>
                    <dd>{item.uncertain}</dd>
                    <dt>A testable research question</dt>
                    <dd className="research-question">{item.question}</dd>
                    <dt>Methodological challenges</dt>
                    <dd>{item.challenges}</dd>
                    <dt>Identified actors</dt>
                    <dd>{item.group}</dd>
                  </dl>
                  <div className="frontier-sources">
                    {item.sources.map((s, i) => (
                      <External key={s} href={s}>
                        Source {i + 1}
                      </External>
                    ))}
                  </div>
                  <button
                    className="solid-button"
                    onClick={() => {
                      setComparison(item.families);
                      setView("compare");
                    }}
                  >
                    Compare these approaches <ArrowUpRight size={14} />
                  </button>
                </article>
              ))}
              <section className="retrieval-panel">
                <Microscope size={21} />
                <h2>Ask the indexed evidence.</h2>
                <p>
                  Deterministic retrieval with linked records. This assistant
                  does not generate unsupported scientific conclusions.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setAnswer(retrieve(question));
                  }}
                >
                  <label htmlFor="research-question">Research query</label>
                  <div className="query-input">
                    <input
                      id="research-question"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      maxLength={500}
                      placeholder="Which authorized devices interface with the vagus nerve?"
                      required
                    />
                    <button type="submit">
                      Retrieve <ArrowUpRight size={14} />
                    </button>
                  </div>
                </form>
                {answer && (
                  <div role="status">
                    <p>{answer.answer}</p>
                    {answer.families.map((f) => (
                      <button
                        className="retrieval-hit"
                        key={f.id}
                        onClick={() => {
                          selectFamily(f.id);
                          setTab("sources");
                        }}
                      >
                        {f.name}
                        <span>{f.score} term matches</span>
                      </button>
                    ))}
                    {answer.records.map((r) => (
                      <SourceRecord key={r.id} record={r} />
                    ))}
                  </div>
                )}
              </section>
            </section>
          )}
          {view === "compare" && (
            <section className="content-page">
              <button className="back-link" onClick={() => setView("atlas")}>
                <ArrowLeft size={14} />
                Back to atlas
              </button>
              <span className="eyebrow">INTERVENTION STACK / COMPARISON</span>
              <h1>Compare the physical interaction.</h1>
              <p>
                Choose up to four entries. Authorization, engineering approach,
                and clinical evidence are independent dimensions.
              </p>
              <div className="comparison-pills">
                {families.map((fam) => (
                  <button
                    key={fam.id}
                    aria-pressed={comparison.includes(fam.id)}
                    disabled={
                      !comparison.includes(fam.id) && comparison.length >= 4
                    }
                    onClick={() => toggleComparison(fam.id)}
                  >
                    {comparison.includes(fam.id) ? <Check size={13} /> : "+"}
                    {fam.name}
                  </button>
                ))}
              </div>
              {comparison.length ? (
                <>
                  <div className="table-scroll">
                    <table>
                      <caption className="sr-only">
                        Comparison of selected neurotechnology approaches
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Dimension</th>
                          {comparison.map((id) => (
                            <th scope="col" key={id}>
                              {familyById(id)?.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          "Physical interaction",
                          "Physical placement / interface",
                          "Intended target / action",
                          "Regulatory evidence",
                          "Clinical evidence",
                          "Limitations",
                        ].map((row, i) => (
                          <tr key={row}>
                            <th scope="row">{row}</th>
                            {comparison.map((id) => {
                              const fam = familyById(id)!;
                              const ms = familyMappings(id);
                              return (
                                <td key={id}>
                                  {i === 0 ? (
                                    fam.modalities.join("; ")
                                  ) : i === 1 || i === 2 ? (
                                    ms
                                      .filter((m) =>
                                        i === 1
                                          ? [
                                              "implantation_site",
                                              "tissue_interface",
                                              "external_placement",
                                              "unlocalized",
                                            ].includes(m.type)
                                          : [
                                              "physiological_target",
                                              "therapeutic_action_site",
                                            ].includes(m.type),
                                      )
                                      .map((m) => (
                                        <p key={m.id}>
                                          {m.assertion}{" "}
                                          <External href={m.sourceUrl}>
                                            Evidence
                                          </External>
                                        </p>
                                      ))
                                  ) : i === 3 ? (
                                    <>
                                      {statusOf(fam)}
                                      {fam.regulatoryIds.map((rid) => {
                                        const r = recordById(rid);
                                        return (
                                          r && (
                                            <p key={rid}>
                                              <External href={r.url}>
                                                {r.application} ·{" "}
                                                {r.decisionDate}
                                              </External>
                                            </p>
                                          )
                                        );
                                      })}
                                    </>
                                  ) : i === 4 ? (
                                    <>
                                      {fam.studyIds.length} linked study
                                      registrations; {fam.publicationIds.length}{" "}
                                      curated related publications. No common
                                      outcome comparison is established.
                                    </>
                                  ) : (
                                    fam.limitations
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <a className="solid-button" href={exportUrl}>
                    <ArrowDownToLine size={15} />
                    Export comparison brief
                  </a>
                </>
              ) : (
                <div className="empty-state">
                  Choose approaches above to start a comparison.
                </div>
              )}
            </section>
          )}
          {view === "mission" && (
            <section className="content-page mission-page">
              <span className="eyebrow">
                MISSION MODE / {f.name.toUpperCase()}
              </span>
              <h1>Walk into the meeting informed.</h1>
              <p>
                A reproducible source extract for the selected technology.
                Original approval, anatomy assertions, studies, and limitations
                travel together.
              </p>
              <div className="mission-actions">
                <a className="solid-button" href={exportUrl}>
                  <ArrowDownToLine size={15} />
                  Export Markdown
                </a>
                <button onClick={() => window.print()}>
                  Print / Save PDF <ArrowUpRight size={14} />
                </button>
              </div>
              <BriefPreview family={f} year={year} />
            </section>
          )}
          {view === "coverage" && (
            <section className="content-page">
              <span className="eyebrow">
                COLLECTION HEALTH / SOURCE COVERAGE
              </span>
              <h1>Know what the atlas knows.</h1>
              <div className="coverage-callout">
                <Database size={24} />
                <div>
                  <strong>Cached authentic snapshot</strong>
                  <p>
                    Exported {coverage.exportedAt} (UTC). This is a bounded
                    research collection, not a live feed or a complete
                    regulatory history.
                  </p>
                </div>
              </div>
              <dl className="coverage-metrics">
                <div>
                  <dt>Source records</dt>
                  <dd>{records.length}</dd>
                </div>
                <div>
                  <dt>Curated approaches</dt>
                  <dd>{families.length}</dd>
                </div>
                <div>
                  <dt>Anatomical assertions</dt>
                  <dd>
                    {mappings.filter((m) => m.state !== "Unknown").length}
                  </dd>
                </div>
                <div>
                  <dt>Failed ingestion jobs</dt>
                  <dd>
                    {coverage.jobs.filter((j) => j.state === "failed").length}
                  </dd>
                </div>
              </dl>
              <h2>What these counts mean</h2>
              <p>
                Regulatory records count submissions and decisions. They do not
                count unique implanted devices, treated patients, or effective
                therapies. Curated product entries are manually separated from
                applications.
              </p>
              <h2>Anatomical reference</h2>
              <p>
                The HRA male brain v1.3 is based on an Allen human reference
                hemisphere mirrored into a whole brain and resized for the
                Visible Human body. It is a reference assembly, not
                patient-specific anatomy. Display transformations are for
                viewing; no device coordinates are assigned.
              </p>
              <p>
                <External href="https://doi.org/10.48539/HBM929.XKCL.339">
                  Kristen Browne & Heidi Schlehlein, 2023 · HRA
                </External>{" "}
                ·{" "}
                <External href="https://creativecommons.org/licenses/by/4.0/">
                  CC BY 4.0 license
                </External>
              </p>
              <h2>Source reuse and attribution</h2>
              <p>
                PubMed metadata is provided through NLM. NLM does not endorse
                this service; third-party rights may apply to linked content.
                Article full text and abstracts are not included here.{" "}
                <External href="https://www.ncbi.nlm.nih.gov/home/about/policies/">
                  NLM data usage and copyright policies
                </External>
              </p>
              <h2>Evidence states</h2>
              <dl>
                {(
                  [
                    "Verified",
                    "Supported",
                    "Provisional",
                    "Unknown",
                  ] as EvidenceState[]
                ).map((s, i) => (
                  <div key={s}>
                    <dt>
                      <State value={s} />
                    </dt>
                    <dd>
                      {
                        [
                          "An explicit assertion checked against an authoritative original source. This is not an independent anatomical validation score.",
                          "An identified source supports the relationship, with limitations such as registry reporting or broad target resolution.",
                          "A candidate interpretation awaiting review; excluded from accepted mappings.",
                          "Insufficient evidence. No spatial assignment is made.",
                        ][i]
                      }
                    </dd>
                  </div>
                ))}
              </dl>
              <h2>Ingestion status</h2>
              <div className="job-list">
                {coverage.jobs.map((j) => (
                  <div key={j.id}>
                    <span>{j.id}</span>
                    <span className={j.state === "failed" ? "job-failed" : ""}>
                      {j.state} · {j.attempts} attempt
                      {j.attempts === 1 ? "" : "s"}
                    </span>
                    {j.error && <small>{j.error}</small>}
                  </div>
                ))}
              </div>
              <h2>Known limits</h2>
              <p>
                No complete whole-body geometry, comprehensive recall
                surveillance, validated automated anatomy classifier, private
                cloud workspace, or systematic effectiveness review is included.
                The 95% mapping precision target has not been established. No
                production hosting or DNS has been changed.
              </p>
            </section>
          )}
        </main>
        <aside className="inspector" aria-label="Evidence inspector">
          <div className="panel-heading">
            <span>EVIDENCE INSPECTOR</span>
            <button
              className="icon-button"
              aria-label="Open selected technology mission"
              onClick={() => {
                setSelectedRecord(null);
                setView("mission");
              }}
            >
              <BookOpen size={15} />
            </button>
          </div>
          <div className="inspector-title">
            <div className="eyebrow">
              {existing
                ? "SOURCE RECORD"
                : `${authorized(f) ? "REGULATORY EVIDENCE" : "INVESTIGATIONAL RESEARCH"} / ${f.id.toUpperCase()}`}
            </div>
            <h2>{existing ? existing.title : f.name}</h2>
            <p>{existing ? existing.id : f.description}</p>
            {!existing && (
              <span className="regulatory-badge">{statusOf(f)}</span>
            )}
            {view === "atlas" &&
              !rows.some((row) => row.family.id === selected) && (
                <p className="retained-selection" role="status">
                  Pinned evidence outside the current filters. Choose an
                  approach in the current stack to inspect this view.
                </p>
              )}
          </div>
          <div
            className="inspector-tabs"
            role="tablist"
            aria-label="Evidence categories"
          >
            {(["anatomy", "sources", "research"] as InspectorTab[]).map((t) => (
              <button
                key={t}
                id={`tab-${t}`}
                role="tab"
                aria-selected={tab === t}
                aria-controls="inspector-content"
                tabIndex={tab === t ? 0 : -1}
                onKeyDown={(e) => {
                  if (
                    ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
                  ) {
                    e.preventDefault();
                    const ts: InspectorTab[] = [
                      "anatomy",
                      "sources",
                      "research",
                    ];
                    const index =
                      e.key === "Home"
                        ? 0
                        : e.key === "End"
                          ? 2
                          : (ts.indexOf(tab) +
                              (e.key === "ArrowRight" ? 1 : 2)) %
                            3;
                    setTab(ts[index]);
                    document.getElementById(`tab-${ts[index]}`)?.focus();
                  }
                }}
                onClick={() => setTab(t)}
              >
                {t === "anatomy"
                  ? "Anatomy"
                  : t === "sources"
                    ? "Evidence"
                    : "Research"}
              </button>
            ))}
          </div>
          <div
            className="inspector-content"
            id="inspector-content"
            role="tabpanel"
            aria-labelledby={`tab-${tab}`}
          >
            {existing ? (
              <>
                <button
                  className="back-link"
                  onClick={() => setSelectedRecord(null)}
                >
                  <ArrowLeft size={13} />
                  Return to selected approach
                </button>
                <SourceRecord record={existing} />
                <div className="inspector-warning">
                  <State value="Unknown" />
                  <p>
                    Source identity alone does not establish anatomical
                    placement. Only explicitly curated device relationships are
                    accepted.
                  </p>
                </div>
              </>
            ) : tab === "anatomy" ? (
              <>
                <div className="inspector-section-heading">
                  <h3>Placement ≠ target</h3>
                  <span>{familyMappings(f.id).length} assertions</span>
                </div>
                <p className="microcopy">
                  Inspect components separately. A source-backed region does not
                  justify a precise device coordinate.
                </p>
                {familyMappings(f.id).map((m) => (
                  <article className="mapping-assertion" key={m.id}>
                    <div className="mapping-top">
                      <span className="eyebrow">
                        {relationshipLabels[m.type]}
                      </span>
                      <State value={m.state} />
                    </div>
                    <h4>{m.component}</h4>
                    <p>{m.assertion}</p>
                    <div className="mapping-place">
                      {structures.find((s) => s.id === m.structureId)?.name ||
                        "No location assigned"}
                      <span>{m.laterality}</span>
                    </div>
                    <details>
                      <summary>
                        Evidence X-Ray <ChevronDown size={12} />
                      </summary>
                      <dl>
                        <dt>Supported assertion</dt>
                        <dd>{m.assertion}</dd>
                        <dt>Original evidence</dt>
                        <dd>
                          <External href={m.sourceUrl}>
                            Open source document
                          </External>
                          <br />
                          {m.locator}
                        </dd>
                        <dt>Extraction / review</dt>
                        <dd>
                          {m.method}. Checked {m.reviewedAt}.
                        </dd>
                        <dt>Spatial resolution</dt>
                        <dd>{m.precision}; no coordinate assignment</dd>
                        <dt>Limitations</dt>
                        <dd>{m.limitations}</dd>
                      </dl>
                    </details>
                  </article>
                ))}
                <div className="inspector-warning">
                  <ShieldCheck size={15} />
                  <p>{f.limitations}</p>
                </div>
              </>
            ) : tab === "sources" ? (
              <>
                <h3>Regulatory evidence</h3>
                <p className="microcopy">
                  A clearance, approval, trial registration, and publication
                  make different claims.
                </p>
                {linked
                  .filter((r) => ["pma", "510k", "de_novo"].includes(r.kind))
                  .map((r) => (
                    <SourceRecord key={r.id} record={r} />
                  ))}
                {!f.regulatoryIds.length && (
                  <div className="empty-state">
                    No FDA marketing authorization is asserted for this research
                    entry.
                  </div>
                )}
                <h3>Related indexed records</h3>
                {linked
                  .filter((r) => ["trial", "publication"].includes(r.kind))
                  .map((r) => (
                    <SourceRecord key={r.id} record={r} />
                  ))}
                {!f.studyIds.length && !f.publicationIds.length && (
                  <p className="empty-text">
                    Study and literature links have not been curated for this
                    entry.
                  </p>
                )}
              </>
            ) : (
              <>
                <h3>Research context</h3>
                <p className="microcopy">
                  Named-system or topical relationships are curated explicitly.
                  Related publications are not automatically treated as results
                  of a linked trial.
                </p>
                {linked
                  .filter((r) => ["trial", "publication"].includes(r.kind))
                  .map((r) => (
                    <SourceRecord key={r.id} record={r} />
                  ))}
                {!linked.some((r) =>
                  ["trial", "publication"].includes(r.kind),
                ) && (
                  <p className="empty-text">
                    No curated study or literature links for this entry. Search
                    the evidence library or investigate the original summary.
                  </p>
                )}
                <button
                  className="wide-button"
                  onClick={() => setView("frontier")}
                >
                  Explore sourced research questions <ChevronRight size={14} />
                </button>
              </>
            )}
          </div>
          <div className="inspector-footer">
            <button onClick={() => setView("mission")}>
              <BookOpen size={14} />
              Mission brief
            </button>
            <a
              href={`/api/brief?ids=${selected}&year=${year}`}
              aria-label={`Export ${f.name} brief`}
            >
              <ArrowDownToLine size={15} />
              Export
            </a>
          </div>
        </aside>
      </div>
      <footer className="app-footer">
        <span>
          BODY//ATLAS <b>·</b> RESEARCH INSTRUMENT / LOCAL PREVIEW
        </span>
        <span>Source-backed. Region-aware. Uncertainty visible.</span>
        <button onClick={() => setView("coverage")}>
          DATA PROVENANCE <ArrowUpRight size={11} />
        </button>
      </footer>
    </div>
  );
}
