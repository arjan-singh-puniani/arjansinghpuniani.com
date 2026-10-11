import { useEffect, useRef, useState } from "react";
import {
  Dna,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  Settings2,
  ChevronRight,
  X,
  ArrowUpRight,
  Move,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Check,
  BookOpen,
  ChevronDown,
  Crosshair,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import {
  MolecularScene,
  type Representation,
  type CameraMode,
  type Quality,
} from "./experience/Scene";
import {
  ReplicationEngine,
  STAGES,
  stageTitle,
  type Mode,
  type Action,
} from "./simulation/engine";
import { molecules } from "./data/molecules";
import StudyStudio from "./study/StudyStudio";
import MotionPanel, { beats } from "./motion/MotionPanel";

const read = (key: string, fallback: string) => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};
const save = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Storage can be unavailable in private contexts. */
  }
};
function IconButton({
  label,
  onClick,
  children,
  active = false,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      className={`icon-button ${active ? "active" : ""}`}
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  );
}
export default function App() {
  const engine = useRef(new ReplicationEngine()).current;
  const [, render] = useState(0);
  const [mode, setMode] = useState<Mode>("watch");
  const [selected, setSelected] = useState("cmg");
  const [inspector, setInspector] = useState(false);
  const [tool, setTool] = useState<"orbit" | "grab">("orbit");
  const [follow, setFollow] = useState(false);
  const [tier, setTier] = useState<"overview" | "mechanism" | "evidence">(
    "overview",
  );
  const [labels, setLabels] = useState(true);
  const [settings, setSettings] = useState(false);
  const [sources, setSources] = useState(false);
  const [study, setStudy] = useState(false);
  const studyRef = useRef(study);
  const studyLaunchRef = useRef<HTMLButtonElement>(null);
  studyRef.current = study;
  const [rep, setRep] = useState<Representation>("surface");
  const [camera, setCamera] = useState<CameraMode>("cinematic");
  const [quality, setQuality] = useState<Quality>(
    window.innerWidth < 600 ? "Mobile" : "High",
  );
  const [reduced, setReduced] = useState(
    matchMedia("(prefers-reduced-motion: reduce)").matches ||
      read("replisome-motion", "false") === "true",
  );
  const [muted, setMuted] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [resetKey, setResetKey] = useState(0);
  const [status, setStatus] = useState("loading");
  const [notice, setNotice] = useState("");
  const [best, setBest] = useState(Number(read("replisome-best", "0")));
  const audio = useRef<AudioContext | null>(null);
  const lastEvent = useRef(0);
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  useEffect(() => {
    if (!study) return;
    const wasPaused = engine.paused;
    engine.paused = true;
    return () => {
      engine.paused = wasPaused;
    };
  }, [study, engine]);
  useEffect(() => {
    if (!sources) return;
    const previous = document.activeElement as HTMLElement | null;
    const modal = document.querySelector(".sources-modal")!;
    const focusable = () =>
      Array.from(
        modal.querySelectorAll<HTMLElement>("button,a,summary"),
      ).filter((el) => el.offsetParent !== null);
    focusable()[0]?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const nodes = focusable(),
        first = nodes[0],
        last = nodes.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [sources]);
  const molecule = molecules.find((m) => m.id === selected)!;
  const f = engine.active;
  const stage = STAGES.indexOf(f.stage);
  useEffect(() => {
    let frame = 0,
      last = performance.now(),
      lastUI = 0;
    const run = (now: number) => {
      const dt = Math.min((now - last) / 1000, Math.max(0, 600 - engine.time));
      last = now;
      engine.advance(dt * speedRef.current);
      if (engine.time >= 600) engine.paused = true;
      if (!studyRef.current && now - lastUI > 80) {
        render((n) => n + 1);
        lastUI = now;
      }
      if (engine.events.length !== lastEvent.current) {
        lastEvent.current = engine.events.length;
        if (!mutedRef.current && audio.current?.state === "running") {
          const ctx = audio.current,
            osc = ctx.createOscillator(),
            gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(
            engine.active.stage === "MATURE_FRAGMENT" ? 680 : 260,
            ctx.currentTime,
          );
          gain.gain.setValueAtTime(0.035, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
          osc.connect(gain).connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.2);
        }
      }
      frame = requestAnimationFrame(run);
    };
    frame = requestAnimationFrame(run);
    return () => cancelAnimationFrame(frame);
  }, [engine]);
  useEffect(() => {
    if (engine.finished && engine.score > best) {
      setBest(engine.score);
      save("replisome-best", String(engine.score));
    }
  }, [engine.finished, engine.score, best]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (study) return;
      if ((e.target as HTMLElement).closest("button,input,select,textarea"))
        return;
      if (e.code === "Space") {
        e.preventDefault();
        engine.paused = !engine.paused;
        render((n) => n + 1);
      }
      if (e.key === "Escape") {
        setSettings(false);
        setSources(false);
      }
      if (e.key.toLowerCase() === "l") setLabels((v) => !v);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [engine, study]);
  const switchMode = (m: Mode) => {
    if (m === mode) return;
    if (m === "play") engine.reset("play");
    else {
      if (mode === "play") engine.reset(m);
      engine.mode = m;
    }
    setMode(m);
    setCamera(m === "explore" ? "free" : "cinematic");
    setInspector(false);
    setFollow(false);
    setTool("orbit");
    if (m === "play") engine.held.clear();
    setSettings(false);
  };
  const choose = (id: string) => {
    setSelected(id);
    setInspector(mode === "watch");
    setTier("overview");
  };
  const action = (a: Action, position?: number) => {
    engine.act(a, position);
    render((n) => n + 1);
  };
  const toggleSound = async () => {
    if (muted) {
      audio.current ??= new AudioContext();
      await audio.current.resume();
    }
    setMuted((v) => !v);
  };
  const reset = () => {
    engine.reset(mode);
    setResetKey((n) => n + 1);
    setNotice("Simulation restarted.");
    render((n) => n + 1);
  };
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen)
        await document.documentElement.requestFullscreen();
      else
        setNotice(
          "Use your browser’s full-screen viewing controls on this device.",
        );
    } catch {
      setNotice("Full-screen mode is unavailable in this browser.");
    }
  };
  const cameraAction = (action: string) =>
    window.dispatchEvent(
      new CustomEvent("replisome-camera", { detail: action }),
    );
  let gameTitle = "",
    gameText = "";
  if (stage === 0) {
    gameTitle = "Find the starting point";
    gameText =
      "A primer belongs on newly exposed lagging template, just behind the fork.";
  } else if (stage < 4) {
    gameTitle = "A small but essential beginning";
    gameText =
      "Primase makes 10 RNA nucleotides; Pol α adds 20 DNA nucleotides. Watch the mint-colored starter form.";
  } else if (stage === 4) {
    gameTitle = "Load the sliding clamp";
    gameText =
      "Align PCNA with the RNA–DNA primer junction. RFC uses ATP to load the clamp.";
  } else if (stage === 5 && !f.polymerase) {
    gameTitle = "Make the handoff";
    gameText =
      "Which polymerase performs processive lagging-strand synthesis with PCNA?";
  } else if (stage === 5 && engine.paired < 4) {
    gameTitle = f.mismatch ? "Recover the mismatch" : "Read the template";
    gameText = f.mismatch
      ? "Pol δ can proofread a wrong base. Remove it before continuing."
      : "Choose the complementary dNTP. The daughter extends 5′→3′ away from the fork.";
  } else if (stage === 5) {
    gameTitle = "One nucleotide at a time";
    gameText =
      "Pol δ extends this 150-nucleotide fragment toward the preceding fragment.";
  } else if (stage === 6) {
    gameTitle = "Process the remaining primer";
    gameText =
      "Pol δ has reached the preceding fragment. Choose the machinery for the short-flap pathway.";
  } else if (stage === 7) {
    gameTitle = "A clean junction";
    gameText =
      "Strand displacement and FEN1 cleavage replace the primer. Other cellular processing pathways also exist.";
  } else if (stage === 8) {
    gameTitle = "Make the final connection";
    gameText =
      "The primer is gone. One nick remains between a 3′ hydroxyl and a 5′ phosphate.";
  } else if (stage === 9) {
    gameTitle = "The backbone becomes continuous";
    gameText =
      "Ligase I seals the phosphodiester bond. The nick disappears from the molecular state.";
  }
  return (
    <main className="experience" data-mode={mode}>
      <MolecularScene
        engine={engine}
        representation={rep}
        cameraMode={follow ? "follow" : camera}
        quality={quality}
        reduceMotion={reduced}
        onSelect={choose}
        onReady={setStatus}
        resetKey={resetKey}
        selected={follow && mode === "watch" ? beats[f.stage].actor : selected}
        manipulationTool={mode === "explore" ? tool : "orbit"}
        onHeld={(id, held) => {
          engine.setHeld(id, held);
          setSelected(id);
          setNotice(
            held ? `${id} removed from DNA.` : `${id} returned to DNA.`,
          );
          render((n) => n + 1);
        }}
        suspended={study}
        labels={labels}
      />
      <div className="vignette" />
      <header className="topbar">
        <a href="./index.html" className="brand" aria-label="Replisome home">
          <span className="brand-symbol">
            <Dna size={26} />
          </span>
          <span>
            REPLISOME<small>A MOLECULAR EXPERIENCE</small>
          </span>
        </a>
        <nav className="mode-tabs" aria-label="Experience mode">
          {(["watch", "explore", "play"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={mode === m ? "selected" : ""}
              aria-pressed={mode === m}
            >
              {m === "watch" ? (
                <Eye size={14} />
              ) : m === "explore" ? (
                <Move size={14} />
              ) : (
                <Play size={13} />
              )}
              <span>{m.toUpperCase()}</span>
            </button>
          ))}
        </nav>
        <div className="header-right">
          <button
            ref={studyLaunchRef}
            className="study-launch"
            onClick={() => {
              setSettings(false);
              setSources(false);
              setStudy(true);
            }}
          >
            <BookOpen size={15} /> <span>MCAT lens</span>
          </button>
          <IconButton
            label="Settings"
            onClick={() => setSettings((v) => !v)}
            active={settings}
          >
            <Settings2 size={19} />
          </IconButton>
        </div>
      </header>
      <section className="intro">
        <div className="eyebrow">
          <span>01</span> INSIDE THE REPLICATION FORK
        </div>
        <h1>
          Life.
          <br />
          <em>Copied.</em>
        </h1>
        <p>
          One fork. Two strands.
          <br />
          Billions of instructions.
        </p>
        <button className="text-button" onClick={() => setSources(true)}>
          Discover the science <ArrowUpRight size={15} />
        </button>
      </section>
      <div className="scene-top-note">
        <span className="thin-line" /> A LIVING MOLECULAR MACHINE
      </div>
      <section className="hud" aria-label="Live simulation counters">
        <div className="hud-card">
          <div className="hud-label cyan">
            DNA REPLICATED <Dna size={13} />
          </div>
          <strong>
            {String(engine.replicated).padStart(3, "0")}
            <small>bp</small>
          </strong>
          <span className="hud-caption">Mature copied positions</span>
        </div>
        <div className="hud-card">
          <div className="hud-label gold">
            MODELED ATP USED <span>ϟ</span>
          </div>
          <strong>
            {String(engine.atp).padStart(3, "0")}
            <small>ATP</small>
          </strong>
          <span className="hud-caption">Illustrative reaction model</span>
        </div>
        <div className="hud-card fragment-card">
          <div
            className="progress-ring"
            style={
              {
                "--progress": `${engine.percent * 3.6}deg`,
              } as React.CSSProperties
            }
          >
            <span>
              {engine.percent}
              <small>%</small>
            </span>
          </div>
          <div>
            <div className="hud-label cyan">
              OKAZAKI
              <br />
              FRAGMENT {String(f.id).padStart(2, "0")}
            </div>
            <div className="stage-dots">
              {[0, 2, 4, 5, 7, 10].map((s) => (
                <i key={s} className={stage >= s ? "filled" : ""} />
              ))}
            </div>
          </div>
        </div>
      </section>
      {mode === "watch" && inspector && !sources && !settings && (
        <aside className="inspector glass">
          <div className="panel-eyebrow">
            MOLECULAR SPOTLIGHT{" "}
            <IconButton
              label="Close inspector"
              onClick={() => setInspector(false)}
            >
              <X size={15} />
            </IconButton>
          </div>
          <div className="molecule-heading">
            <i style={{ background: molecule.color }} />
            <span>{molecule.short}</span>
          </div>
          <h2>{molecule.name}</h2>
          <div className="inspector-tabs">
            {(["overview", "mechanism", "evidence"] as const).map((t) => (
              <button
                onClick={() => setTier(t)}
                key={t}
                className={tier === t ? "selected" : ""}
              >
                {t}
              </button>
            ))}
          </div>
          <p>
            {tier === "overview"
              ? molecule.role
              : tier === "mechanism"
                ? molecule.detail
                : molecule.evidence}
          </p>
          {tier === "evidence" && molecule.pdb && (
            <a
              className="source-link"
              href={`https://www.rcsb.org/structure/${molecule.pdb}`}
              target="_blank"
              rel="noreferrer"
            >
              PDB {molecule.pdb} <ArrowUpRight size={14} />
            </a>
          )}
          <div className="inspector-footer">
            <span className="tag">
              {molecule.pdb ? "STRUCTURE-INFORMED" : "CONCEPTUAL MODEL"}
            </span>
            <button
              onClick={() => {
                setFollow(false);
                setCamera("detail");
              }}
            >
              Focus <Crosshair size={13} />
            </button>
          </div>
        </aside>
      )}
      {mode !== "play" &&
        !sources &&
        !settings &&
        !(mode === "watch" && inspector) && (
          <MotionPanel
            engine={engine}
            selected={selected}
            interactive={mode === "explore"}
            tool={tool}
            follow={follow}
            onTool={(t) => {
              if (t === "grab") setRep("surface");
              setTool(t);
              setFollow(false);
              setCamera("free");
            }}
            onFollow={() => {
              setFollow((v) => !v);
              setTool("orbit");
            }}
            onChoose={(id) => {
              setSelected(id);
              setInspector(false);
            }}
            onReplay={(id) => {
              setSelected(id);
              setFollow(true);
              setTool("orbit");
              setInspector(false);
            }}
            onChange={() => render((n) => n + 1)}
            onEnter={() => {
              setRep("surface");
              switchMode("explore");
            }}
          />
        )}
      {mode === "play" && !settings && !sources && (
        <aside className="challenge glass">
          <div className="panel-eyebrow">
            THE REPLICATION CHALLENGE <span>LEVEL 01</span>
          </div>
          {engine.finished ? (
            <>
              <div className="complete-symbol">
                <Check size={30} />
              </div>
              <h2>
                One fragment.
                <br />
                One continuous strand.
              </h2>
              <p>
                You initiated, extended, processed and ligated a complete
                Okazaki fragment.
              </p>
              <div className="score-line">
                <span>YOUR SCORE</span>
                <strong>{engine.score}</strong>
              </div>
              <p className="subtle">
                Best {best} · {engine.mistakes} recoverable errors · 150 nt
                matured
              </p>
              <button className="primary" onClick={reset}>
                Play again <RotateCcw size={16} />
              </button>
              <button
                className="secondary"
                onClick={() => switchMode("explore")}
              >
                Explore the machinery <ChevronRight size={15} />
              </button>
            </>
          ) : (
            <>
              <div className="level-name">The first Okazaki fragment</div>
              <div className="game-progress">
                <span style={{ width: `${(stage / 10) * 100}%` }} />
              </div>
              <h2>{gameTitle}</h2>
              <p>{gameText}</p>
              <div className="game-actions">
                {stage === 0 && (
                  <>
                    <button onClick={() => action("prime", engine.fork + 12)}>
                      Ahead of the fork <span>Unopened duplex</span>
                    </button>
                    <button
                      onClick={() =>
                        action(
                          "prime",
                          Math.max(150, Math.floor(engine.fork) - 8),
                        )
                      }
                    >
                      Just behind the fork <span>Exposed lagging template</span>
                    </button>
                    <button onClick={() => action("prime", 0)}>
                      Far behind the fork <span>Previously copied region</span>
                    </button>
                  </>
                )}
                {stage === 4 && (
                  <>
                    <div className="junction">
                      <span>RNA</span>
                      <span>DNA</span>
                      <i>3′</i>
                    </div>
                    <button className="primary" onClick={() => action("clamp")}>
                      Align & load PCNA <Crosshair size={16} />
                    </button>
                    <small>At the primer’s 3′ end · conceptual alignment</small>
                  </>
                )}
                {stage === 5 &&
                  !f.polymerase &&
                  (["alpha", "epsilon", "delta"] as const).map((p, i) => (
                    <button key={p} onClick={() => action(p)}>
                      DNA polymerase {["α", "ε", "δ"][i]}
                      <ChevronRight size={15} />
                    </button>
                  ))}
                {stage === 5 &&
                  f.polymerase &&
                  engine.paired < 4 &&
                  !f.mismatch && (
                    <>
                      <div className="pairing-template">
                        <span>TEMPLATE BASE</span>
                        <strong>
                          {engine.template(f.start - 31 - engine.paired)}
                        </strong>
                        <small>{engine.paired + 1} / 4</small>
                      </div>
                      <div className="base-choices">
                        {(["A", "T", "C", "G"] as const).map((b) => (
                          <button key={b} onClick={() => action(b)}>
                            {b}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                {f.mismatch && (
                  <button
                    className="primary"
                    onClick={() => action("proofread")}
                  >
                    Proofread the mismatch <RotateCcw size={15} />
                  </button>
                )}
                {stage === 6 && (
                  <>
                    <button onClick={() => action("ligate")}>
                      DNA ligase I <span>Seal immediately</span>
                    </button>
                    <button onClick={() => action("process")}>
                      Pol δ + FEN1{" "}
                      <span>Displace and cleave the primer flap</span>
                    </button>
                  </>
                )}
                {stage === 8 && (
                  <button className="primary" onClick={() => action("ligate")}>
                    Seal with DNA ligase I <Check size={16} />
                  </button>
                )}
                {([1, 2, 3, 7, 9].includes(stage) ||
                  (stage === 5 && engine.paired === 4)) && (
                  <div className="reaction-in-progress">
                    <i /> {stageTitle[f.stage]}
                  </div>
                )}
              </div>
              <div className="game-feedback" role="status">
                {engine.message || "Choose a molecular action to begin."}
              </div>
              <div className="game-footer">
                <span>
                  Score <strong>{engine.score}</strong>
                </span>
                <button onClick={reset}>
                  Restart <RotateCcw size={13} />
                </button>
              </div>
            </>
          )}
        </aside>
      )}
      {settings && (
        <aside className="settings-panel glass">
          <div className="panel-eyebrow">
            EXPERIENCE SETTINGS{" "}
            <IconButton
              label="Close settings"
              onClick={() => setSettings(false)}
            >
              <X size={15} />
            </IconButton>
          </div>
          <label>
            Representation
            <select
              aria-label="Representation"
              value={rep}
              onChange={(e) => setRep(e.target.value as Representation)}
            >
              <option value="surface">Molecular surface · residue beads</option>
              <option value="cartoon">Protein cartoon · backbone</option>
              <option value="structure">
                Structural evidence · assemblies
              </option>
            </select>
          </label>
          <label>
            Camera
            <select
              aria-label="Camera"
              value={camera}
              onChange={(e) => {
                setFollow(false);
                setCamera(e.target.value as CameraMode);
              }}
            >
              <option value="cinematic">Cinematic</option>
              <option value="free">Free exploration</option>
              <option value="polymerase">Follow polymerase ε</option>
              <option value="okazaki">Okazaki focus</option>
              <option value="detail">Molecular detail</option>
            </select>
          </label>
          <label>
            Quality
            <select
              aria-label="Quality"
              value={quality}
              onChange={(e) => setQuality(e.target.value as Quality)}
            >
              {(["Ultra", "High", "Balanced", "Mobile"] as Quality[]).map(
                (q) => (
                  <option key={q}>{q}</option>
                ),
              )}
            </select>
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={reduced}
              onChange={(e) => {
                setReduced(e.target.checked);
                save("replisome-motion", String(e.target.checked));
              }}
            />{" "}
            Reduce motion
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={labels}
              onChange={(e) => setLabels(e.target.checked)}
            />{" "}
            Show molecular labels
          </label>
          <p className="subtle">
            Quality adapts to slow rendering. Structural view keeps the original
            relationships within each independently solved assembly.
          </p>
        </aside>
      )}
      {(status === "loading" ||
        status === "degraded" ||
        status === "lost" ||
        status === "unavailable") && (
        <div className={`asset-status ${status}`} role="status">
          {status === "loading"
            ? "Preparing molecular structures…"
            : status === "degraded"
              ? "Structural assets unavailable · showing conceptual geometry"
              : status === "lost"
                ? "Graphics context interrupted · waiting for restoration"
                : "3D graphics unavailable. Explore molecule descriptions and play the challenge below."}
        </div>
      )}
      <div className="bottom-area">
        <div className="current-reaction">
          <i />
          <span>{stageTitle[f.stage]}</span>
          <small>FORK {engine.fork} nt</small>
        </div>
        <div className="transport">
          <div className="playback">
            <IconButton
              label={engine.paused ? "Resume simulation" : "Pause simulation"}
              onClick={() => {
                engine.paused = !engine.paused;
                render((n) => n + 1);
              }}
            >
              {engine.paused ? <Play size={17} /> : <Pause size={17} />}
            </IconButton>
            <IconButton label="Restart simulation" onClick={reset}>
              <RotateCcw size={17} />
            </IconButton>
            <button
              className="speed-button"
              onClick={() =>
                setSpeed((s) =>
                  s === 0.5 ? 1 : s === 1 ? 2 : s === 2 ? 4 : 0.5,
                )
              }
              aria-label={`Simulation speed ${speed} times; change speed`}
            >
              {speed}×
            </button>
          </div>
          <div className="timeline">
            <span>
              {Math.floor(engine.time / 60)
                .toString()
                .padStart(2, "0")}
              :
              {Math.floor(engine.time % 60)
                .toString()
                .padStart(2, "0")}
            </span>
            <input
              aria-label="Replay simulation timeline"
              type="range"
              min="0"
              max="90"
              step=".1"
              value={Math.min(90, engine.time)}
              disabled={mode === "play"}
              onChange={(e) => {
                engine.seek(Number(e.target.value));
                render((n) => n + 1);
              }}
            />
            <span>01:30</span>
          </div>
          <div className="view-controls">
            <IconButton
              label={labels ? "Hide labels" : "Show labels"}
              onClick={() => setLabels((v) => !v)}
              active={labels}
            >
              {labels ? <Eye size={18} /> : <EyeOff size={18} />}
            </IconButton>
            <IconButton
              label={muted ? "Enable sound" : "Mute sound"}
              onClick={() => {
                void toggleSound();
              }}
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </IconButton>
            <IconButton
              label="Reset camera"
              onClick={() => {
                setFollow(false);
                setCamera(mode === "explore" ? "free" : "cinematic");
                setResetKey((n) => n + 1);
              }}
            >
              <Crosshair size={18} />
            </IconButton>
            <IconButton
              label="Fullscreen"
              onClick={() => {
                void fullscreen();
              }}
            >
              <Maximize size={18} />
            </IconButton>
          </div>
        </div>
        <footer>
          <span>
            HUMAN DNA REPLICATION <i /> STRUCTURE-INFORMED · EDUCATIONAL MODEL
          </span>
          <button onClick={() => setSources(true)}>
            <BookOpen size={13} /> Sources & model notes{" "}
            <ArrowUpRight size={12} />
          </button>
        </footer>
      </div>
      {mode === "explore" && (
        <div className="exploration-tools glass">
          <span>
            {tool === "grab"
              ? "DRAG AN ENZYME · RETURN TO ITS TARGET"
              : "DRAG TO ORBIT · PINCH TO ZOOM"}
          </span>
          <div>
            <IconButton
              label="Rotate left"
              onClick={() => cameraAction("left")}
            >
              <ArrowLeft size={16} />
            </IconButton>
            <IconButton
              label="Rotate right"
              onClick={() => cameraAction("right")}
            >
              <ArrowRight size={16} />
            </IconButton>
            <IconButton label="Zoom in" onClick={() => cameraAction("in")}>
              <ZoomIn size={16} />
            </IconButton>
            <IconButton label="Zoom out" onClick={() => cameraAction("out")}>
              <ZoomOut size={16} />
            </IconButton>
          </div>
        </div>
      )}
      <div className="molecule-picker">
        <button
          className="picker-trigger"
          onClick={() => setInspector((v) => !v)}
        >
          <span style={{ background: molecule.color }} /> {molecule.name}
          <ChevronDown size={13} />
        </button>
        <div className="picker-options" aria-label="Select a molecule">
          {molecules.map((m) => (
            <button
              key={m.id}
              title={m.name}
              aria-label={`Inspect ${m.name}`}
              onClick={() => choose(m.id)}
              className={selected === m.id ? "selected" : ""}
            >
              <i style={{ background: m.color }} />
              {m.id === "epsilon"
                ? "Pol ε"
                : m.id === "alpha"
                  ? "Pol α"
                  : m.id === "delta"
                    ? "Pol δ"
                    : m.id.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="sr-only" role="status">
        {notice}
      </div>
      {study && (
        <StudyStudio
          onClose={() => {
            setStudy(false);
            requestAnimationFrame(() => studyLaunchRef.current?.focus());
          }}
        />
      )}
      {sources && (
        <div className="modal-backdrop" onClick={() => setSources(false)}>
          <section
            className="sources-modal glass"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sources-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="panel-eyebrow">
              THE SCIENCE BEHIND THE SCENE{" "}
              <IconButton
                label="Close scientific sources"
                onClick={() => setSources(false)}
              >
                <X size={20} />
              </IconButton>
            </div>
            <h2 id="sources-title">
              Real structures.
              <br />
              <em>An illustrative choreography.</em>
            </h2>
            <p>
              The primary scene combines independently solved human protein
              structures in an educational arrangement. It is not a single
              experimentally validated atomic replisome.
            </p>
            <div className="source-list">
              {[
                [
                  "7PFO",
                  "Core human replisome",
                  "CMG, Pol ε and accessory factors · cryo-EM, 3.2 Å",
                ],
                [
                  "8QJ7",
                  "Human Pol α–primase",
                  "Pre-initiation stage 1 · independently solved",
                ],
                [
                  "6TNZ",
                  "Pol δ–FEN1–PCNA toolbelt",
                  "Lagging-strand machinery · independently solved",
                ],
                ["6TNY", "Processive Pol δ holoenzyme", "Supporting reference"],
                [
                  "8YJZ",
                  "PCNA–FEN1–RNase H2",
                  "Alternative processing context",
                ],
              ].map(([id, title, caption]) => (
                <a
                  key={id}
                  href={`https://www.rcsb.org/structure/${id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="source-id">{id}</span>
                  <span>
                    <strong>{title}</strong>
                    <small>{caption}</small>
                  </span>
                  <ArrowUpRight size={15} />
                </a>
              ))}
            </div>
            <details>
              <summary>What this model simplifies</summary>
              <p>
                Residue beads approximate protein shape; they are not a
                solvent-accessible atomic surface. RNA primers are 10 nt, Pol α
                extends 20 nt, and representative fragments are 150 nt. Spacing
                and cinematic reaction timing are exaggerated for legibility.
                DNA has a right-handed 10.5 bp twist; the exhibit is not drawn
                to a unified nanometer scale.
              </p>
              <p>
                DNA replicated counts unique template positions whose leading
                copy and lagging fragment are mature. dNTP incorporation is
                separate from ATP: this model estimates 1 motor ATP / 10 nt, 2 /
                clamp loading, and 1 / ligation. Motor and RFC values are
                illustrative, not experimentally calibrated.
              </p>
              <p>
                The modeled maturation pathway is Pol δ strand displacement
                followed by FEN1 short-flap cleavage and ligation. DNA2 and
                RNase H pathways also exist. Individual DNA links and protein
                conformational motions are explanatory.
              </p>
            </details>
            <a
              className="source-link"
              href="https://doi.org/10.1146/annurev-biochem-061516-044709"
              target="_blank"
              rel="noreferrer"
            >
              Eukaryotic DNA Replication Fork · Annual Review of Biochemistry{" "}
              <ArrowUpRight size={14} />
            </a>
            <p className="subtle">
              Coordinates from wwPDB / RCSB PDB biological assembly 1. Switch to
              Structural evidence in Settings to inspect preserved assembly
              geometry.
            </p>
            <button className="primary" onClick={() => setSources(false)}>
              Back to the molecular world <ChevronRight size={16} />
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
