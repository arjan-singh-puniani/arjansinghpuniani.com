"use client";
import dynamic from "next/dynamic";
import { atlasBasePath, atlasPath } from "@/lib/deployment";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Check,
  Copy,
  ChevronRight,
  CircleHelp,
  Columns2,
  Layers,
  Expand,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  coverage,
  briefDataUrl,
  catalogueCoverage,
  families,
  familyById,
  familyMappings,
  firstEventYear,
  mappings,
  matchesRegion,
  recordById,
  records,
  retrieve,
  searchFamilies,
  statusOf,
  structures,
  timeline,
} from "@/lib/atlas";
import {
  interventionNames,
  interventionSummaries,
  hasExplanation,
  inCollection,
  productName,
  interventionActions,
  primaryRecords,
  primaryLabel,
  regionRoles,
} from "@/lib/intervention-view";
import InterventionConstellation from "./InterventionConstellation";
import InterventionLabels from "./InterventionLabels";
import {
  interventionAnnotations,
  type LabelProjection,
} from "@/lib/annotations";
import { frontier } from "@/lib/curation";
import { External, SourceRecord, State } from "./Evidence";
import BriefPreview from "./BriefPreview";
import { dossiers, dossierCoverage, reviewLabels } from "@/lib/dossiers";
const Dossier = dynamic(() => import("./Dossier"));
import type { AtlasRecord, Family, Mapping } from "@/lib/types";
import "./atlas.css";

const Human = dynamic(() => import("./HumanScene"), { ssr: false });
const Brain = dynamic(() => import("./AnatomyScene"), { ssr: false });
type Dialog = "records" | "compare" | "brief" | "questions" | "about" | null;
const brainIds = [
  "UBERON:0000955",
  "UBERON:0000956",
  "UBERON:0001897",
  "UBERON:0001906",
];
const names: Record<string, string> = {
  all: "Whole body",
  "BODY:chest-wall": "Chest implants",
  "BODY:external-head": "External head",
};
const roleNames: Record<Mapping["type"], string> = {
  implantation_site: "Implanted at",
  tissue_interface: "Contacts",
  measurement_site: "Records from",
  physiological_target: "Targets",
  therapeutic_action_site: "Acts on",
  delivery_location: "Delivers to",
  external_placement: "Worn / placed at",
  unlocalized: "Location",
  indication_context: "FDA source mentions",
};
const titleFor = (id: string) =>
  names[id] || structures.find((s) => s.id === id)?.name || id;

function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("button")?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
      if (e.key === "Tab") {
        const list = Array.from(
          ref.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled),a[href],input,select,[tabindex="0"]',
          ) || [],
        ).filter((el) => el.getClientRects().length);
        const first = list[0],
          last = list.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, [close]);
  return (
    <div
      className="atlas-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={ref}
        className="atlas-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="atlas-modal-title"
      >
        <header>
          <h2 id="atlas-modal-title">{title}</h2>
          <button aria-label="Close dialog" onClick={close}>
            <X size={20} />
          </button>
        </header>
        <div className="atlas-modal-content">{children}</div>
      </div>
    </div>
  );
}
export default function AtlasExperience() {
  const [projection, setProjection] = useState<
    (LabelProjection & { mode: string }) | null
  >(null);
  const projectHuman = useCallback(
    (p: LabelProjection) => setProjection({ ...p, mode: "human" }),
    [],
  );
  const projectBrain = useCallback(
    (p: LabelProjection) => setProjection({ ...p, mode: "brain" }),
    [],
  );
  const [showInterventions, setShowInterventions] = useState(true);
  const [densityMap,setDensityMap]=useState(true),[collection,setCollection]=useState('explained'),[resultsLimit,setResultsLimit]=useState(60),[libraryLimit,setLibraryLimit]=useState(100);
  const [portrait,setPortrait]=useState<boolean|null>(null);
  const [copyState,setCopyState]=useState<"idle"|"copied"|"manual">("idle");
  const [shareUrl,setShareUrl]=useState("");
  const [showOrgans,setShowOrgans]=useState(true);
  const [adaptedContour,setAdaptedContour]=useState(true);
  const [anatomyExpanded, setAnatomyExpanded] = useState(false);
  const resultsRef = useRef<HTMLElement>(null);
  const [region, setRegion] = useState("all"),
    [selected, setSelected] = useState<string | null>(null),
    [mode, setMode] = useState<"human" | "brain">("human"),
    [surface, setSurface] = useState(false),
    [isolated, setIsolated] = useState(false),
    [sceneKey, setSceneKey] = useState(0),
    [sceneStatus, setSceneStatus] = useState("Loading reference…"),
    [hovered, setHovered] = useState("");
  const [query, setQuery] = useState(""),
    [modality, setModality] = useState("all"),
    [authorization, setAuthorization] = useState("all"),
    [filters, setFilters] = useState(false),
    [year, setYear] = useState(2026),
    [playing, setPlaying] = useState(false),
    [comparison, setComparison] = useState(["activa", "exablate"]),
    [dialog, setDialog] = useState<Dialog>(null),
    [tab, setTab] = useState<"components" | "dossier" | "sources" | "studies">(
      "components",
    );
  useEffect(() => {
    const params=new URLSearchParams(window.location.search);
    const isPortrait=params.get("view")==="portrait";setPortrait(isPortrait);
    if(isPortrait){setShowOrgans(false);setSurface(true);setShowInterventions(false);}
    const entry = params.get("entry");
    if (!isPortrait && entry && dossiers[entry] && familyById(entry)) {
      setSelected(entry);setRegion("all");setTab("dossier");
    }
  }, []);
  const [libraryQuery, setLibraryQuery] = useState(""),
    [sourceKind, setSourceKind] = useState("all"),
    [recordSelection, setRecordSelection] = useState<string | null>(null),
    [question, setQuestion] = useState(""),
    [answer, setAnswer] = useState<ReturnType<typeof retrieve> | null>(null);
  const close = useCallback(() => setDialog(null), []),
    ready = useCallback(() => setSceneStatus("Reference loaded"), []),
    unavailable = useCallback(
      () => setSceneStatus("3D unavailable · use the region list"),
      [],
    );
  const allAvailable = useMemo(
    () => searchFamilies(query, "all", modality, authorization, year)
      .map(r => r.family).filter(f => inCollection(f, collection)),
    [query, modality, authorization, year, collection],
  );
  const visible = useMemo(() => {
    const hits = allAvailable.filter(f => matchesRegion(f, region));
    return !hits.length && region === "UBERON:0001844" && collection !== "catalogue" &&
      !query && modality === "all" && authorization === "all" && year >= 1985
      ? [familyById("cochlear")!] : hits;
  }, [allAvailable, region, collection, query, modality, authorization, year]);
  const f = selected ? familyById(selected) : undefined;
  const explanation = f ? interventionSummaries[f.id] : undefined;
  const explanationRecord = explanation ? recordById(explanation.recordId) : undefined;
  useEffect(()=>setResultsLimit(60),[region,query,modality,authorization,year,collection]);
  useEffect(()=>setLibraryLimit(100),[libraryQuery,sourceKind]);
  const counts = useMemo(() => Object.fromEntries(
    structures.map(s => [s.id, allAvailable.filter(f => matchesRegion(f,s.id)).length]),
  ), [allAvailable]);
  const events = useMemo(() => timeline(f ? [f.id] : visible.map(f => f.id))
    .filter(e => Number(e.date.slice(0,4)) <= year), [f,visible,year]);
  const library = useMemo(
    () =>
      records.filter(
        (r) =>
          (sourceKind === "all" || r.kind === sourceKind) &&
          [
            r.title,
            r.id,
            r.application,
            r.applicant,
            r.sponsor,
            r.organization,
            ...(r.investigators || []),
          ]
            .join(" ")
            .toLowerCase()
            .includes(libraryQuery.toLowerCase()),
      ),
    [libraryQuery, sourceKind],
  );
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(
      () =>
        setYear((y) => {
          if (y >= 2026) {
            setPlaying(false);
            return 2026;
          }
          return y + 1;
        }),
      450,
    );
    return () => clearInterval(id);
  }, [playing]);
  useEffect(() => {
    if (f && firstEventYear(f) > year) setSelected(null);
  }, [f, year]);
  useEffect(() => {
    if (resultsRef.current) resultsRef.current.scrollTop = 0;
  }, [region, selected, query, tab, year]);
  function chooseRegion(id: string, keepDevice = false) {
    setAnatomyExpanded(false);
    setRegion(id);
    setHovered("");
    setQuery("");
    setIsolated(false);
    const nextMode = brainIds.includes(id) ? "brain" : "human";
    if (nextMode !== mode) setSceneStatus("Loading reference…");
    setMode(nextMode);
    if (!keepDevice || (selected && !matchesRegion(familyById(selected)!, id)))
      setSelected(null);
  }
  function chooseFamily(id: string) {
    setSelected(id);
    setTab("components");
    setAnatomyExpanded(false);
  }
  function compare(id: string) {
    setComparison((p) =>
      p.includes(id)
        ? p.filter((x) => x !== id)
        : p.length < 4
          ? [...p, id]
          : p,
    );
  }
  function source(id: string) {
    setRecordSelection(id);
    setDialog("records");
  }
  const activeMappings = useMemo(() => (f ? familyMappings(f.id) : []), [f]);
  const activeRegions = useMemo(
    () =>
      activeMappings
        .map((m) => m.structureId)
        .filter((id): id is string => !!id),
    [activeMappings],
  );
  const brainFocus =
    mode === "brain" && f && region === "UBERON:0000955"
      ? activeMappings.find(
          (m) =>
            m.structureId &&
            brainIds.slice(1).includes(m.structureId) &&
            [
              "physiological_target",
              "therapeutic_action_site",
              "tissue_interface",
            ].includes(m.type),
        )
      : undefined;
  const annotations = useMemo(
    () =>
      interventionAnnotations(
        visible,
        region,
      ),
    [visible, region],
  );
  const onInnovation = useCallback((id: string) => {
    setSelected(id);
    setTab("components");
  }, []);
  const selectedAnnotation = annotations.find((a) => a.familyId === selected);
  const showDetail = !!f;
  async function copyPortraitLink(){
    const url=new URL(window.location.href);url.search="";url.hash="";url.searchParams.set("view","portrait");
    setShareUrl(url.href);
    try{await navigator.clipboard.writeText(url.href);setCopyState("copied");}
    catch{setCopyState("manual");}
  }
  return (
    <div
      className={`human-atlas ${portrait ? "portrait-view" : ""} ${anatomyExpanded ? "anatomy-expanded" : ""} ${showInterventions ? "with-intervention-labels" : ""} ${densityMap && showInterventions ? "with-density-map" : ""}`}
    >
      <a className="skip-link" href="#body-map">
        Skip to body map
      </a>
      <header className="atlas-header">
        <a className="atlas-wordmark" href={atlasPath("/")}>
          BODY<span>//</span>ATLAS
        </a>
        <span className="atlas-tagline preview-status">Research preview</span>
        <nav aria-label="Atlas tools">
          {portrait ? <><a href={atlasPath("/")}>Explore atlas</a><button aria-label="Copy share link" onClick={copyPortraitLink}>{copyState==="copied"?<Check size={15}/>:<Copy size={15}/>} {copyState==="copied"?"Copied":"Copy link"}</button></> : <>
          <button
            className="tool-active"
            onClick={() => {
              setDialog(null);
              chooseRegion("all");
            }}
          >
            Atlas
          </button>
          <button
            onClick={() => {
              setRecordSelection(null);
              setDialog("records");
            }}
          >
            Records <small>{records.length}</small>
          </button>
          <button onClick={() => setDialog("compare")}>
            Compare <small>{comparison.length}</small>
          </button>
          <button onClick={() => setDialog("questions")}>Questions</button>
          </>}
        </nav>
        <button
          className="atlas-source-button"
          onClick={() => setDialog("about")}
          aria-label="Sources and model"
        >
          <CircleHelp size={16} />
          <span>Sources</span>
        </button>
      </header>
      <div className="atlas-layout">
        <aside className="atlas-index" aria-label="Anatomical index">
          <label className="atlas-search">
            <Search size={15} />
            <input
              aria-label="Find an intervention"
              placeholder="Find an intervention…"
              value={query}
              maxLength={500}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelected(null);
              }}
            />
          </label>
          <label className="collection-filter"><span>Evidence layer</span><select aria-label="Evidence layer" value={collection} onChange={e=>{setCollection(e.target.value);setSelected(null);}}><option value="explained">Explained interventions</option><option value="all">All indexed entries</option><option value="reviewed">Reviewed relationships</option><option value="catalogue">FDA source context</option></select></label>
          <div className="index-title">
            <span>Anatomy</span>
            <button
              aria-label="Show filters"
              aria-expanded={filters}
              onClick={() => setFilters((v) => !v)}
            >
              <SlidersHorizontal size={15} />
            </button>
          </div>
          <div className="region-list">
            <button
              aria-label="Whole body"
              aria-pressed={region === "all"}
              onClick={() => chooseRegion("all")}
            >
              <span className="region-square" />
              Whole body<small>{allAvailable.length}</small>
            </button>
            {structures
              .filter(
                (s) => s.id !== "BODY:human" && s.id !== "BODY:nervous-system",
              )
              .map((s) => (
                <button
                  key={s.id}
                  aria-label={`Select ${titleFor(s.id)}`}
                  aria-pressed={region === s.id}
                  className={s.parent === "UBERON:0000955" ? "subregion" : ""}
                  onClick={() => chooseRegion(s.id)}
                >
                  <span className="region-dot" />
                  {titleFor(s.id)}
                  <small>{counts[s.id] || 0}</small>
                </button>
              ))}
          </div>
          {filters && (
            <div className="atlas-filters">
              <label htmlFor="atlas-modality">Interaction</label>
              <select
                id="atlas-modality"
                value={modality}
                onChange={(e) => {
                  setModality(e.target.value);
                  setSelected(null);
                }}
              >
                <option value="all">All interactions</option>
                {[...new Set(families.flatMap((f) => f.modalities))].map(
                  (m) => (
                    <option key={m}>{m}</option>
                  ),
                )}
              </select>
              <label htmlFor="atlas-regulatory">Evidence</label>
              <select
                id="atlas-regulatory"
                value={authorization}
                onChange={(e) => {
                  setAuthorization(e.target.value);
                  setSelected(null);
                }}
              >
                <option value="all">All entries</option>
                <option value="authorized">FDA authorization record</option>
                <option value="research">Research / investigational</option>
              </select>
              <button
                onClick={() => {
                  setModality("all");
                  setAuthorization("all");
                  setQuery("");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
          <div className="index-bottom">
            <span className="live-symbol" />
            Whole-body collection
            <small>
              {families.filter(hasExplanation).length} explained · {catalogueCoverage.catalogueEntries} FDA-indexed entries
            </small>
            <button
              onClick={() => {
                setRecordSelection(null);
                setDialog("records");
              }}
            >
              {records.length} source records <ArrowUpRight size={12} />
            </button>
          </div>
        </aside>
        <main className="body-map" id="body-map">
          <div className="map-heading">
            <div className="map-breadcrumb">
              <button onClick={() => chooseRegion("all")}>Human</button>
              {region !== "all" && (
                <>
                  <ChevronRight size={12} />
                  <span>{titleFor(region)}</span>
                </>
              )}
            </div>
            <div className="map-view-controls">
              <button aria-label={densityMap?"Show intervention callouts":"Show dense intervention map"} aria-pressed={densityMap} onClick={()=>{setDensityMap(v=>!v);setShowInterventions(true);}}>{densityMap?'Map':'Labels'}</button>
              <button
                aria-label={
                  showInterventions
                    ? "Show region labels"
                    : "Show intervention labels"
                }
                aria-pressed={showInterventions}
                onClick={() => setShowInterventions((v) => !v)}
              >
                {showInterventions ? "Interventions" : "Regions"}
              </button>
              <button
                aria-label="Show whole human"
                aria-pressed={mode === "human"}
                onClick={() => {
                  if (mode !== "human") {
                    setMode("human");
                    setSceneStatus("Loading reference…");
                  }
                }}
              >
                Human
              </button>
              <button
                aria-label="Focus brain"
                aria-pressed={mode === "brain"}
                onClick={() => chooseRegion("UBERON:0000955")}
              >
                Brain
              </button>
            </div>
          </div>
          <div className="atlas-figure" data-testid="atlas-figure">
            <div className="vitruvian-guides" aria-hidden="true">
              <div className="vitruvian-circle" />
              <div className="vitruvian-square" />
              <div className="guide-horizontal" />
              <div className="guide-vertical" />
            </div>
            <div className="figure-canvas">
              {portrait===null ? null : mode === "human" ? (
                <Human
                  key={`human-${sceneKey}`}
                  portrait={!!portrait}
                  adapted={adaptedContour}
                  onProjection={projectHuman}
                  showLabels={!!portrait || showInterventions}
                  showOrgans={showOrgans}
                  region={region}
                  activeRegions={activeRegions}
                  counts={counts}
                  surface={surface}
                  onSelect={(id) => chooseRegion(id)}
                  onHover={setHovered}
                  onReady={ready}
                  onUnavailable={unavailable}
                />
              ) : (
                <Brain
                  key={`brain-${sceneKey}`}
                  onProjection={projectBrain}
                  region={
                    brainFocus?.structureId ||
                    (brainIds.includes(region) ? region : "UBERON:0000955")
                  }
                  dissect={isolated}
                  onSelect={(id) => chooseRegion(id)}
                  onReady={ready}
                  onUnavailable={unavailable}
                  onHover={setHovered}
                />
              )}
              {showInterventions && projection?.mode===mode && densityMap && <InterventionConstellation named={collection==='explained'} entries={annotations} projection={projection} selected={selected} onSelect={onInnovation} onRegion={id=>chooseRegion(id)}/>}
              {showInterventions && !densityMap && projection?.mode === mode && (
                <InterventionLabels
                  entries={annotations}
                  projection={projection}
                  selected={selected}
                  onSelect={onInnovation}
                  reserveCard={anatomyExpanded && !!f}
                />
              )}
            </div>
            {mode === "brain" && (
              <div className="brain-shortcuts" aria-label="Brain regions">
                {brainIds.slice(1).map((id) => (
                  <button
                    key={id}
                    aria-pressed={region === id}
                    onClick={() => chooseRegion(id)}
                  >
                    {titleFor(id)}
                    <small>{counts[id] || 0}</small>
                  </button>
                ))}
              </div>
            )}
            {showInterventions && anatomyExpanded && f && (
              <section
                className="on-model-inspector"
                aria-label="Selected intervention on anatomy"
              >
                <button
                  aria-label="Close intervention summary"
                  onClick={() => setSelected(null)}
                >
                  <X size={14} />
                </button>
                <h2>{interventionNames[f.id] || f.name}</h2>
                {f.collection==='catalogue'&&<span className="source-context-label">FDA text context · Provisional</span>}
                <p>{interventionActions[f.id] || f.description}</p>
                <div>
                  <External
                    href={
                      interventionSummaries[f.id]?.sourceUrl || selectedAnnotation?.mapping.sourceUrl ||
                      familyMappings(f.id)[0]?.sourceUrl ||
                      primaryRecords(f)[0]?.url
                    }
                  >
                    Original source
                  </External>
                  <button onClick={() => setAnatomyExpanded(false)}>
                    Full details <ChevronRight size={12} />
                  </button>
                </div>
              </section>
            )}
            <div className="figure-caption">
              {brainFocus?.structureId && (
                <div className="selected-brain-focus">
                  {titleFor(brainFocus.structureId)} ·{" "}
                  {roleNames[brainFocus.type].toLowerCase()}{" "}
                  <External href={brainFocus.sourceUrl}>Source</External>
                </div>
              )}
              <span>
                {mode === "human"
                  ? "01 / HUMAN REFERENCE"
                  : "02 / BRAIN REFERENCE"}
              </span>
              <h1>
                {mode === "human"
                  ? "Human atlas"
                  : titleFor(
                      brainIds.includes(region) ? region : "UBERON:0000955",
                    )}
              </h1>
              <p>{hovered || "Drag to rotate · Scroll or pinch to zoom"}</p>
              <button
                className="region-interventions-link"
                onClick={() => {
                  setAnatomyExpanded(false);
                  setSelected(null);
                  requestAnimationFrame(() =>
                    resultsRef.current
                      ?.querySelector<HTMLElement>(".choose-intervention")
                      ?.focus(),
                  );
                }}
              >
                {visible.length}{" "}
                {visible.length === 1 ? "intervention" : "interventions"}{" "}
                {region === "all"
                  ? "in this collection"
                  : `for ${titleFor(region)}`}{" "}
                <ChevronRight size={13} />
              </button>
            </div>
            <div className="figure-actions">
              {mode==='human'&&<button aria-label="Toggle internal organs" aria-pressed={showOrgans} onClick={()=>setShowOrgans(v=>!v)}>Organs</button>}
              {mode==='human'&&<button aria-label={adaptedContour?'Show HRA reference exterior':'Show adapted body contour'} aria-pressed={adaptedContour} onClick={()=>setAdaptedContour(v=>!v)}>{adaptedContour?'Contour':'Reference'}</button>}
              <button
                aria-label={
                  anatomyExpanded
                    ? "Show interventions alongside anatomy"
                    : "Expand 3D anatomy"
                }
                aria-pressed={anatomyExpanded}
                onClick={() => setAnatomyExpanded((v) => !v)}
              >
                {anatomyExpanded ? (
                  <Minimize2 size={15} />
                ) : (
                  <>
                    <Expand size={15} />
                    <span>Expand</span>
                  </>
                )}
              </button>
              <button
                aria-label={
                  mode === "human"
                    ? "Toggle body surface"
                    : "Isolate selected brain region"
                }
                aria-pressed={mode === "human" ? surface : isolated}
                onClick={() =>
                  mode === "human"
                    ? setSurface((v) => !v)
                    : setIsolated((v) => !v)
                }
              >
                <Layers size={16} />
                {mode === "human"
                  ? surface
                    ? "Contours"
                    : "Surface"
                  : isolated
                    ? "Show context"
                    : "Isolate"}
              </button>
              <button
                aria-label="Reset view"
                onClick={() => {
                  setSceneKey((k) => k + 1);
                  setSceneStatus("Loading reference…");
                }}
              >
                <RotateCcw size={15} />
              </button>
            </div>
            <div className="reference-credit">
              <span data-testid="scene-status">{sceneStatus}</span>
              <button onClick={() => setDialog("about")}>
                {mode==='human'&&adaptedContour?'Contour · HRA anatomy':'HRA · CC BY 4.0'} <ArrowUpRight size={10} />
              </button>
            </div>
          </div>
          {portrait&&<div className="portrait-caption"><h1>Holographic contour</h1><p>Drag to rotate · Scroll or pinch to zoom</p><button onClick={()=>setSceneKey(k=>k+1)}>Reset view</button><span role="status">{copyState==="copied"?"Share link copied":""}</span>{copyState==="manual"&&<label>Copy this link<input aria-label="Share link" readOnly value={shareUrl} onFocus={e=>e.currentTarget.select()}/></label>}</div>}
          <section className="atlas-time" aria-label="Intervention history">
            <div className="time-top">
              <button
                aria-label={playing ? "Pause history" : "Play history"}
                className="history-play"
                onClick={() => {
                  if (!playing && year === 2026) setYear(1999);
                  setPlaying((v) => !v);
                }}
              >
                {playing ? <Pause size={13} /> : <Play size={13} />}
              </button>
              <span>History</span>
              <output htmlFor="atlas-year">{year}</output>
              <span className="time-event-count">
                {events.length} dated {events.length===1?"event":"events"}
              </span>
            </div>
            <label className="sr-only" htmlFor="atlas-year">
              Documented history through year
            </label>
            <input
              id="atlas-year"
              type="range"
              min="1999"
              max="2026"
              value={year}
              onChange={(e) => {
                setYear(Number(e.target.value));
                setPlaying(false);
              }}
            />
            <div className="atlas-years">
              <span>1999</span>
              <span>2008</span>
              <span>2017</span>
              <span>2026</span>
            </div>
            <div className="atlas-events">
              {events.slice(-2).map((e) => (
                <button
                  key={e.id}
                  data-family={e.familyId}
                  onClick={() => {
                    chooseFamily(e.familyId);
                    source(e.recordId);
                  }}
                >
                  <time>{e.date}</time>
                  <span>{e.label}</span>
                  <ArrowUpRight size={12} />
                </button>
              ))}
              {!events.length && <p>No indexed events by {year}.</p>}
            </div>
          </section>
        </main>
        <aside
          ref={resultsRef}
          id="intervention-results"
          className="atlas-results"
          inert={anatomyExpanded}
          aria-label="Interventions and evidence"
        >
          <div className="results-heading">
            {showDetail ? (
              <button
                className="results-back"
                onClick={() => setSelected(null)}
              >
                <ArrowLeft size={14} />
                Interventions
              </button>
            ) : (
              <h2>
                {region === "all"
                  ? "Interventions"
                  : `${titleFor(region)} interventions`}
              </h2>
            )}
            <span>{showDetail ? "" : visible.length}</span>
          </div>
          {["BODY:uterus","BODY:vagina"].some(id => region === id || explanation?.regions.includes(id)) && <p className="reference-note" role="status">Text-only region: this male reference has no corresponding anatomy. No device position is shown.</p>}
          {year < 2026 && (
            <div className="active-history-filter">
              <span>Through {year}</span>
              <button
                onClick={() => {
                  setYear(2026);
                  setPlaying(false);
                }}
              >
                Show all years <X size={12} />
              </button>
            </div>
          )}
          {!f ? (
            <>
              <div className="region-filter-row"><div className="mobile-collection-filter"><select aria-label="Map evidence layer" value={collection} onChange={e=>{setCollection(e.target.value);setSelected(null);}}><option value="explained">Explained interventions</option><option value="all">All {families.length} indexed entries</option><option value="reviewed">10 reviewed entries</option><option value="catalogue">{catalogueCoverage.catalogueEntries} FDA context entries</option></select></div>
              <label className="regional-jump"><span>Region</span><select aria-label="Explore anatomical region" value={region} onChange={e=>chooseRegion(e.target.value)}><option value="all">Whole body · {allAvailable.length} entries</option>{structures.filter(s=>s.id!=='BODY:human'&&s.id!=='BODY:nervous-system').map(s=><option key={s.id} value={s.id}>{s.name} · {counts[s.id]||0}</option>)}</select></label></div>
              <div className="results-kicker">
                {year < 2026
                  ? `Indexed by ${year}`
                  : region === "all"
                    ? "Choose a region or an intervention"
                    : "Choose an intervention. Sources open directly."}
              </div>
              <label className="atlas-search mobile-search">
                <Search size={15} />
                <input
                  aria-label="Find an intervention on mobile"
                  placeholder="Find an intervention…"
                  value={query}
                  maxLength={500}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <div className="intervention-list">
                {visible.slice(0,resultsLimit).map((item) => (
                  <div key={item.id} className="intervention-choice" data-family={item.id}>
                    <div className="intervention-entry">
                      <button
                        className="choose-intervention"
                        onClick={() => chooseFamily(item.id)}
                        aria-label={`Inspect ${item.name}`}
                      >
                        <span
                          className={`interaction-indicator interaction-${item.modalities[0]?.split(" ")[0].toLowerCase()}`}
                        />
                        <span>
                          <strong>
                            {interventionNames[item.id] || item.name}
                          </strong>
                          {item.collection==='catalogue' && <span className="catalogue-badge">FDA text match · Provisional</span>}
                          <span className="intervention-product">
                            {productName(item)}
                          </span>
                          <small>
                            {item.id === "cochlear"
                              ? "Location not reviewed"
                              : interventionActions[item.id] ||
                                item.description}
                          </small>
                        </span>
                        <ChevronRight size={13} />
                      </button>
                      <div className="entry-evidence">
                        <span>{regionRoles(item, region).join(" · ")}</span>
                        <div>
                          {primaryRecords(item).map((r) => (
                            <External href={r.url} key={r.id}>
                              {primaryLabel(r)}
                            </External>
                          ))}
                          {familyMappings(item.id)[0] &&
                            !primaryRecords(item).some(
                              (r) =>
                                r.url === familyMappings(item.id)[0].sourceUrl,
                            ) && (
                              <External
                                href={familyMappings(item.id)[0].sourceUrl}
                              >
                                Description
                              </External>
                            )}
                          <small>
                            {primaryRecords(item)[0]?.decisionDate?.slice(
                              0,
                              4,
                            ) || "Investigational"}
                          </small>
                        </div>
                      </div>
                    </div>
                    <button
                      className="add-compare"
                      aria-label={`${comparison.includes(item.id) ? "Remove" : "Add"} ${item.name} ${comparison.includes(item.id) ? "from" : "to"} comparison`}
                      aria-pressed={comparison.includes(item.id)}
                      disabled={
                        !comparison.includes(item.id) && comparison.length >= 4
                      }
                      onClick={() => compare(item.id)}
                    >
                      {comparison.includes(item.id) ? (
                        <Check size={12} />
                      ) : (
                        <span>+</span>
                      )}
                    </button>
                  </div>
                ))}
                {visible.length>resultsLimit && <button className="load-records" onClick={()=>setResultsLimit(v=>v+60)}>Show more entries ({resultsLimit} / {visible.length})</button>}
                {!visible.length && (
                  <div className="atlas-empty">
                    <p>{collection === "explained" ? "No source-backed intervention explanation has been prepared for this region yet." : "No matching interventions in this view."}</p>
                    {collection === "explained" && <button onClick={()=>setCollection("catalogue")}>Browse unreviewed FDA text matches for this region</button>}
                    <button
                      onClick={() => {
                        setQuery("");
                        setModality("all");
                        setAuthorization("all");
                        chooseRegion("all");
                      }}
                    >
                      Show all entries <ArrowUpRight size={12} />
                    </button>
                  </div>
                )}
              </div>
              <div className="results-note">
                <span>Electrical</span>
                <span>Recording</span>
                <span>Thermal</span>
                <span>Acoustic</span>
                <span>Magnetic</span>
              </div>
            </>
          ) : (
            <>
              <div className="device-intro">
                {f.collection==='catalogue'&&<div className="catalogue-banner"><strong>FDA application entry</strong><span>Provisional anatomical text match</span></div>}
                <label className="device-switch">
                  <span>
                    {region === "all" ? "Interventions" : titleFor(region)}
                  </span>
                  <select
                    aria-label="Choose another intervention in this region"
                    value={f.id}
                    onChange={(e) => {setSelected(e.target.value);setAnatomyExpanded(false);}}
                  >
                    {[
                      ...new Map(
                        [...visible, f].map((item) => [item.id, item]),
                      ).values(),
                    ].map((item) => (
                      <option key={item.id} value={item.id}>
                        {interventionNames[item.id]} — {productName(item)}
                      </option>
                    ))}
                  </select>
                </label>
                <h2>{interventionNames[f.id] || f.name}</h2>
                <p className="device-product">{productName(f)}</p>

                <p className="device-action" aria-label="What this intervention does">
                  {interventionActions[f.id] || f.description}
                </p>
                {explanation && <section className="intervention-relevance" aria-label="Why this region">
                  <h3>Why this region</h3><p>{explanation.relevance}</p>
                  <External href={explanation.sourceUrl || primaryRecords(f)[0].url}>Read the supporting FDA source</External>
                  <small>{explanation.locator}</small>
                  {explanationRecord?.kind === "pma" && explanationRecord.statement && <details><summary>Original FDA passage</summary><blockquote>{explanationRecord.statement}</blockquote></details>}
                </section>}
                <div className="device-status">
                  {statusOf(f)}{f.regulatoryIds.length > 0 && " · Historical decision"}
                  {f.regulatoryIds.map((id) => {
                    const r = recordById(id);
                    return r && <span key={id}> · {r.decisionDate}</span>;
                  })}
                </div>
                <div
                  className="direct-evidence"
                  aria-label="Original intervention sources"
                >
                  {primaryRecords(f).map((r) => (
                    <External href={r.url} key={r.id}>
                      {primaryLabel(r)}
                    </External>
                  ))}
                  {[...new Set(activeMappings.map((m) => m.sourceUrl))]
                    .filter(
                      (url) => !primaryRecords(f).some((r) => r.url === url),
                    )
                    .slice(0, 2)
                    .map((url) => (
                      <External key={url} href={url}>
                        Device description
                      </External>
                    ))}
                  {f.publicationIds
                    .slice(0, 1)
                    .map(recordById)
                    .filter((r): r is AtlasRecord => !!r)
                    .map((r) => (
                      <External key={r.id} href={r.url}>
                        {primaryLabel(r)}
                      </External>
                    ))}
                </div>
                {dossiers[f.id] && <button className="dossier-entry" onClick={() => { setTab("dossier");document.getElementById("device-dossier")?.focus(); }}>
                  <strong>Regulatory, labeling & safety dossier <ArrowUpRight size={13} /></strong>
                  <span>{dossiers[f.id].regulatory.state === "checked" ? "Regulatory checked" : "Marketing authorization not established"} · {dossiers[f.id].safety.state === "checked" ? `${dossiers[f.id].safety.recalls} application-linked recalls` : "Safety applicability unreviewed"}</span>
                  <small>{reviewLabels[dossiers[f.id].currentLabelReview]} · assessed {dossiers[f.id].labelReview.reviewedAt}</small>
                </button>}
              </div>
              <div
                className="device-tabs"
                role="tablist"
                aria-label="Device details"
              >
                {(["components", "dossier", "sources", "studies"] as const).map(
                  (name, i) => (
                    <button
                      key={name}
                      role="tab"
                      id={`device-${name}`}
                      aria-controls="device-panel"
                      aria-selected={tab === name}
                      tabIndex={tab === name ? 0 : -1}
                      onClick={() => setTab(name)}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                          e.preventDefault();
                          const tabs = [
                            "components",
                            "dossier",
                            "sources",
                            "studies",
                          ] as const;
                          const next =
                            tabs[(i + (e.key === "ArrowRight" ? 1 : 3)) % 4];
                          setTab(next);
                          document.getElementById(`device-${next}`)?.focus();
                        }
                      }}
                    >
                      {name === "components"
                        ? "Anatomy"
                        : name === "dossier"
                          ? "Dossier"
                          : name === "sources"
                          ? "Sources"
                          : "Studies"}
                    </button>
                  ),
                )}
              </div>
              <div
                id="device-panel"
                role="tabpanel"
                aria-labelledby={`device-${tab}`}
                className="device-panel"
              >
                {tab === "dossier" ? <Dossier key={f.id} familyId={f.id} /> : tab === "components" ? (
                  <>
                    {activeMappings.map((m) => (
                      <article className="device-relationship" key={m.id}>
                        <div className="relationship-role">
                          {roleNames[m.type]}
                          <State value={m.state} />
                        </div>
                        <button
                          className="relationship-location"
                          disabled={!m.structureId}
                          onClick={() => {
                            if (m.structureId)
                              chooseRegion(m.structureId, true);
                          }}
                          aria-label={`Explore ${m.structureId ? titleFor(m.structureId) : "unlocalized"} for ${m.component}`}
                        >
                          <strong>
                            {m.structureId
                              ? titleFor(m.structureId)
                              : "No location assigned"}
                          </strong>
                          {m.structureId && <ChevronRight size={15} />}
                        </button>
                        <p className="component-name">{m.component}</p>
                        <External href={m.sourceUrl}>
                          Source · {m.locator}
                        </External>
                        <details>
                          <summary>Evidence</summary>
                          <p>{m.assertion}</p>
                          <External href={m.sourceUrl}>
                            Original source
                          </External>
                          <p className="relationship-locator">{m.locator}</p>
                          <p>{m.limitations}</p>
                          <small>
                            {m.method} · {m.reviewedAt}
                          </small>
                        </details>
                      </article>
                    ))}
                    <details className="device-limits">
                      <summary>Scope & limitations</summary>
                      <p>{f.limitations}</p>
                    </details>
                  </>
                ) : (
                  <>
                    {[...f.regulatoryIds, ...f.studyIds, ...f.publicationIds]
                      .map(recordById)
                      .filter(
                        (r): r is AtlasRecord =>
                          !!r &&
                          (tab === "sources" ||
                            ["trial", "publication"].includes(r.kind)),
                      )
                      .map((r) => (
                        <SourceRecord key={r.id} record={r} />
                      ))}
                    {tab === "studies" &&
                      !f.studyIds.length &&
                      !f.publicationIds.length && (
                        <p className="atlas-empty">
                          No studies linked in this collection.
                        </p>
                      )}
                  </>
                )}
              </div>
              <footer className="device-actions">
                <button onClick={() => setDialog("brief")}>
                  <BookOpen size={14} />
                  Brief
                </button>
                <button
                  aria-pressed={comparison.includes(f.id)}
                  onClick={() => compare(f.id)}
                  disabled={
                    !comparison.includes(f.id) && comparison.length >= 4
                  }
                >
                  <Columns2 size={14} />
                  {comparison.includes(f.id) ? "In comparison" : "Compare"}
                </button>
                <a
                  download="body-atlas-brief.md"
                  href={atlasBasePath ? briefDataUrl([f.id], year) : `/api/brief?ids=${f.id}&year=${year}`}
                  aria-label={`Export ${f.name} brief`}
                >
                  <ArrowDownToLine size={15} />
                </a>
              </footer>
            </>
          )}
        </aside>
      </div>
      {dialog && (
        <Modal
          close={close}
          title={
            {
              records: "Source records",
              compare: "Compare interventions",
              brief: "Research brief",
              questions: "Research questions",
              about: "Sources & model",
            }[dialog]
          }
        >
          {dialog === "records" &&
            (recordSelection && recordById(recordSelection) ? (
              <>
                <button
                  className="plain-back"
                  onClick={() => setRecordSelection(null)}
                >
                  <ArrowLeft size={14} />
                  All records
                </button>
                <SourceRecord record={recordById(recordSelection)!} />
              </>
            ) : (
              <>
                <div className="record-search">
                  <label className="atlas-search">
                    <Search size={15} />
                    <input
                      aria-label="Search source records"
                      value={libraryQuery}
                      onChange={(e) => setLibraryQuery(e.target.value)}
                      maxLength={500}
                      placeholder="Device, identifier, applicant…"
                    />
                  </label>
                  <select
                    aria-label="Filter record source"
                    value={sourceKind}
                    onChange={(e) => setSourceKind(e.target.value)}
                  >
                    <option value="all">All sources</option>
                    {[
                      "510k",
                      "pma",
                      "de_novo",
                      "classification",
                      "trial",
                      "publication",
                      "grant",
                    ].map((kind) => (
                      <option key={kind}>{kind}</option>
                    ))}
                  </select>
                </div>
                <p className="dialog-note">
                  {library.length} records · cached{" "}
                  {coverage.exportedAt.slice(0, 10)}
                </p>
                <div className="record-list">
                  {library.slice(0,libraryLimit).map((r) => (
                    <button key={r.id} onClick={() => setRecordSelection(r.id)}>
                      <span>
                        <small>
                          {r.id} · {r.kind}
                        </small>
                        <strong>{r.title}</strong>
                        <small>
                          {r.applicant ||
                            r.sponsor ||
                            r.journal ||
                            r.organization}
                        </small>
                      </span>
                      <ArrowUpRight size={14} />
                    </button>
                  ))}
                </div>
                {library.length>libraryLimit&&<button className="load-records" onClick={()=>setLibraryLimit(v=>v+100)}>Show more records ({libraryLimit} / {library.length})</button>}
              </>
            ))}
          {dialog === "compare" && (
            <>
              <div className="compare-options">
                {families.filter(item=>hasExplanation(item)||comparison.includes(item.id)).map((item) => (
                  <button
                    key={item.id}
                    aria-pressed={comparison.includes(item.id)}
                    onClick={() => compare(item.id)}
                    disabled={
                      !comparison.includes(item.id) && comparison.length >= 4
                    }
                  >
                    {comparison.includes(item.id) ? <Check size={12} /> : "+"}
                    {productName(item)}
                  </button>
                ))}
              </div>
              <p className="dialog-note">
                Up to four entries. Shared anatomy does not establish comparable
                effectiveness.
              </p>
              {comparison.length > 0 ? (
                <>
                  <div className="compare-table-scroll">
                    <table>
                      <caption className="sr-only">
                        Intervention comparison
                      </caption>
                      <thead>
                        <tr>
                          <th>Interaction</th>
                          {comparison.map((id) => (
                            <th key={id}>{productName(familyById(id)!)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          "Modality",
                          "Physical interface / placement",
                          "Physiological target / action",
                          "Regulatory evidence",
                          "Limits",
                        ].map((label, i) => (
                          <tr key={label}>
                            <th scope="row">{label}</th>
                            {comparison.map((id) => {
                              const item = familyById(id)!;
                              return (
                                <td key={id}>
                                  {i === 0 ? (
                                    item.modalities.join("; ")
                                  ) : i === 1 || i === 2 ? (
                                    familyMappings(id)
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
                                            Source
                                          </External>
                                        </p>
                                      ))
                                  ) : i === 3 ? (
                                    <>
                                      {statusOf(item)}
                                      {item.regulatoryIds.map((rid) => {
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
                                  ) : (
                                    item.limitations
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <a
                    className="atlas-primary"
                    download="body-atlas-brief.md"
                    href={atlasBasePath ? briefDataUrl(comparison, year) : `/api/brief?ids=${comparison.join(",")}&year=${year}`}
                  >
                    <ArrowDownToLine size={14} />
                    Export comparison
                  </a>
                </>
              ) : (
                <p>Select an intervention above.</p>
              )}
            </>
          )}
          {dialog === "brief" &&
            (f ? (
              <>
                <div className="brief-toolbar">
                  <a
                    className="atlas-primary"
                    download="body-atlas-brief.md"
                  href={atlasBasePath ? briefDataUrl([f.id], year) : `/api/brief?ids=${f.id}&year=${year}`}
                  >
                    <ArrowDownToLine size={14} />
                    Export Markdown
                  </a>
                  <button onClick={() => window.print()}>
                    Print / Save PDF
                  </button>
                </div>
                <BriefPreview family={f} year={year} />
              </>
            ) : (
              <p>Select an intervention to make a brief.</p>
            ))}
          {dialog === "questions" && (
            <>
              <div className="question-cards">
                {frontier.map((item) => (
                  <article key={item.id}>
                    <h3>{item.question}</h3>
                    <p>{item.known}</p>
                    <details>
                      <summary>What remains uncertain</summary>
                      <p>{item.uncertain}</p>
                      <p>{item.challenges}</p>
                      <p>{item.group}</p>
                    </details>
                    <div className="question-links">
                      {item.sources.map((url, i) => (
                        <External href={url} key={url}>
                          Source {i + 1}
                        </External>
                      ))}
                    </div>
                    <button
                      className="atlas-primary"
                      onClick={() => {
                        setComparison(item.families);
                        setDialog("compare");
                      }}
                    >
                      Compare these approaches <ChevronRight size={14} />
                    </button>
                  </article>
                ))}
              </div>
              <form
                className="atlas-retrieval"
                onSubmit={(e) => {
                  e.preventDefault();
                  setAnswer(retrieve(question));
                }}
              >
                <label htmlFor="atlas-question">
                  Search the indexed evidence
                </label>
                <div>
                  <input
                    id="atlas-question"
                    value={question}
                    maxLength={500}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Which devices interface with the vagus nerve?"
                    required
                  />
                  <button type="submit">
                    Search <ArrowUpRight size={13} />
                  </button>
                </div>
              </form>
              {answer && (
                <div role="status">
                  <p>{answer.answer}</p>
                  {answer.records.map((r) => (
                    <SourceRecord record={r} key={r.id} />
                  ))}
                </div>
              )}
            </>
          )}
          {dialog === "about" && (
            <div className="atlas-methods">
              <h3>Exterior contour, reference anatomy</h3>
              <p><a href={atlasPath("/?view=portrait")}>Open shareable contour view <ArrowUpRight size={12}/></a></p>
              <p>The contour is an artistic exterior with sculpted facial features and muscle definition, without photographic textures. It is an approximation, not a measured body scan. Organs, nerves and intervention anchors remain in the original HRA reference frame. Use Contour / Reference to compare surfaces.</p>
              <h3>Reference anatomy</h3>
              <p>
                Human surface, registered brain and spinal cord, and detailed
                brain: Human Reference Atlas, Kristen Browne and Heidi
                Schlehlein, CC BY 4.0. The body surface is extracted from the
                male v1.5 assembly; the brain is v1.3.
              </p>
              <p>
                <External href="https://doi.org/10.48539/HBM646.RKKC.257">
                  Human reference
                </External>{" "}
                ·{" "}
                <External href="https://doi.org/10.48539/HBM929.XKCL.339">
                  Brain reference
                </External>
              </p>
              <h3>What the diagram means</h3>
              <p>
                Intervention leader lines end at regional navigation locators,
                not device coordinates. Labels show the supported relationship
                type. Multiple innovations may share a region. The detailed
                brain uses source-mesh regional centers; these do not establish
                precise device placement. Unknown locations are omitted. Body
                labels link to broad regions. They are navigation guides, not
                device coordinates. A chest generator, a neural lead, and an
                intended physiological target are separate relationships.
              </p>
              <p>
                Brain surface clicks identify the picked reference structure and
                select its available regional group. Unmapped structures do not
                acquire inferred device relationships.
              </p>
              <h3>Dossier coverage</h3><p>{dossierCoverage.entries} explained entries have dossiers. {dossierCoverage.regulatory} original marketing decisions and {dossierCoverage.recalls} application-based recall searches checked; {dossierCoverage.labels} entries have original labeling links. All {dossierCoverage.assessed} have individual source assessments; {dossierCoverage.labelGaps} still lack an adequate product-specific label. Published IFUs, public safety summaries and historical sources are distinguished. Recall fields are audited; individual unit applicability is not determined. The two investigational entries have no established public marketing application.</p>
              <h3>Source coverage</h3>
              <p>
                {records.length} authentic API records; {families.filter(f=>f.collection!=='catalogue').length} reviewed entries and {catalogueCoverage.catalogueEntries} source-indexed applications. Anatomical text matches are Provisional, not reviewed physical placements. Snapshot exported {coverage.exportedAt} UTC.
                This is cached evidence, not a live feed or a complete history.
              </p>
              <p>
                Historical FDA decisions do not establish current labeling.
                Trial registration is not a successful clinical outcome. PubMed
                metadata is provided via NLM; linked content may carry
                third-party rights.
              </p>
              <h3>Evidence states</h3>
              <p>
                Verified: explicit source assertion checked. Supported:
                identified source with limitations. Provisional: awaiting
                review. Unknown: no accepted location. No independent anatomical
                precision score is claimed.
              </p>
              <h3>Ingestion</h3>
              <p>
                {coverage.jobs.filter((j) => j.state === "complete").length}{" "}
                source jobs completed;{" "}
                {coverage.jobs.filter((j) => j.state === "failed").length}{" "}
                source inquiry failed. Earlier records are retained.
              </p>
              <details>
                <summary>Job details</summary>
                {coverage.jobs.map((j) => (
                  <p key={j.id}>
                    {j.id}: {j.state}
                    {j.error ? ` — ${j.error}` : ""}
                  </p>
                ))}
              </details>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
