import {
  Crosshair,
  Hand,
  Move,
  Play,
  RotateCcw,
  Unplug,
  ArrowRight,
} from "lucide-react";
import { molecules } from "../data/molecules";
import { ReplicationEngine, type Stage } from "../simulation/engine";
import "./motion.css";

export const beats: Record<
  Stage,
  { actor: string; title: string; text: string }
> = {
  TEMPLATE_EXPOSED: {
    actor: "cmg",
    title: "Open the road.",
    text: "CMG feeds parental DNA through the fork. The two exposed templates take different routes.",
  },
  PRIMER_INITIATION: {
    actor: "alpha",
    title: "Give the fragment a start.",
    text: "Pol α–primase docks on the exposed lagging template. A polymerase cannot start a strand on its own.",
  },
  RNA_PRIMER_SYNTHESIS: {
    actor: "alpha",
    title: "Lay down the primer.",
    text: "The mint starter is RNA. Its free 3′ end gives DNA synthesis somewhere to begin.",
  },
  POL_ALPHA_DNA_EXTENSION: {
    actor: "alpha",
    title: "Build the starter.",
    text: "Pol α adds a short DNA stretch to the RNA primer, extending the same 3′ end.",
  },
  RFC_PCNA_LOADING: {
    actor: "rfc",
    title: "Load. Close. Hand off.",
    text: "RFC loads PCNA around the primer–template junction. The clamp will keep Pol δ associated with DNA.",
  },
  POL_DELTA_ELONGATION: {
    actor: "delta",
    title: "Follow the growing end.",
    text: "Pol δ and PCNA travel together along the fragment. DNA grows 5′→3′, away from this fork.",
  },
  FRAGMENT_COMPLETED: {
    actor: "delta",
    title: "Meet the previous fragment.",
    text: "Extension reaches the preceding fragment. Its RNA starter still needs processing before the backbone can be sealed.",
  },
  PRIMER_PROCESSING: {
    actor: "fen1",
    title: "Clear the RNA flap.",
    text: "Pol δ displaces the preceding primer; FEN1 cuts the short flap. DNA replaces the RNA in this simplified pathway.",
  },
  NICK_READY: {
    actor: "ligase",
    title: "One bond is missing.",
    text: "The amber ring marks a nick: adjacent DNA pieces have not yet been joined in the sugar–phosphate backbone.",
  },
  LIGATION: {
    actor: "ligase",
    title: "Seal the connection.",
    text: "Ligase I docks at the nick and seals the backbone. It joins DNA pieces; it does not add a run of new bases.",
  },
  MATURE_FRAGMENT: {
    actor: "ligase",
    title: "A continuous daughter strand.",
    text: "The starter has been replaced and the nick sealed. The next fragment repeats the choreography.",
  },
};
const cues = [
  { label: "Prime", time: 1.2, actor: "alpha" },
  { label: "Clamp", time: 4.2, actor: "rfc" },
  { label: "Copy", time: 6, actor: "delta" },
  { label: "Process", time: 12, actor: "fen1" },
  { label: "Seal", time: 14.4, actor: "ligase" },
];
const consequences: Record<string, string> = {
  cmg: "No new template is exposed. Enzymes can still finish DNA already opened before you removed CMG.",
  epsilon:
    "Leading-strand synthesis stops. The lagging machinery can still work in this simplified model.",
  alpha:
    "New lagging primers cannot form. Fragments that already have a primer can still finish.",
  rfc: "A new PCNA clamp cannot be loaded. Already loaded clamps can keep working.",
  pcna: "New loading and modeled processive Pol δ extension stop until the clamp returns.",
  delta:
    "Lagging extension stops; Pol δ-dependent primer processing also waits.",
  fen1: "The short flap cannot be processed. Extension can reach the next primer, but a clean nick is not produced.",
  ligase:
    "Completed fragments keep their nicks. DNA synthesis can continue without a continuous backbone.",
  rpa: "Exposed lagging template is no longer protected. This model pauses lagging copying; real RPA depletion also triggers additional responses.",
};
interface Props {
  engine: ReplicationEngine;
  selected: string;
  interactive: boolean;
  tool: "orbit" | "grab";
  follow: boolean;
  onTool: (tool: "orbit" | "grab") => void;
  onFollow: () => void;
  onChoose: (id: string) => void;
  onChange: () => void;
  onReplay: (id: string) => void;
  onEnter: () => void;
}
export default function MotionPanel(p: Props) {
  const beat = beats[p.engine.active.stage];
  const molecule = molecules.find((m) => m.id === p.selected)!;
  const held = p.engine.held.has(p.selected);
  const blocked = p.engine.blocker(p.engine.active);
  return (
    <aside
      className={`motion-panel glass ${p.interactive ? "interactive" : "narrative"}`}
      aria-label="Molecular motion controls"
    >
      <div className="panel-eyebrow">
        {p.interactive ? "HANDLE THE MACHINERY" : "FOLLOW THE HANDOFFS"}
        <span className={`motion-live ${p.engine.paused ? "paused" : ""}`}>
          {p.engine.paused ? "PAUSED" : "LIVE"}
        </span>
      </div>
      <h2>{beat.title}</h2>
      <p className="beat-copy">{beat.text}</p>
      {!p.interactive ? (
        <div className="motion-entry">
          <button className="primary" onClick={p.onEnter}>
            Take control <Hand size={15} />
          </button>
          <button
            className="motion-follow"
            aria-pressed={p.follow}
            onClick={p.onFollow}
          >
            <Crosshair size={14} />
            {p.follow ? "Following handoffs" : "Follow the handoffs"}
          </button>
        </div>
      ) : (
        <>
          <div className="motion-tools" aria-label="Scene interaction">
            <button
              aria-pressed={p.tool === "orbit"}
              onClick={() => p.onTool("orbit")}
            >
              <Move size={14} />
              Orbit
            </button>
            <button
              aria-pressed={p.tool === "grab"}
              onClick={() => p.onTool("grab")}
            >
              <Hand size={14} />
              Handle enzymes
            </button>
          </div>
          <p className="motion-instruction">
            {p.tool === "grab"
              ? "Drag a protein away to remove it. Drop it on its glowing docking target to restore it."
              : "Drag the scene to orbit while the machine runs. Pinch or scroll to zoom."}
          </p>
          <label className="motion-select">
            YOUR MOLECULE
            <select
              aria-label="Molecule to manipulate"
              value={p.selected}
              onChange={(e) => p.onChoose(e.target.value)}
            >
              {molecules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <div className="motion-actions">
            <button
              className={held ? "restore" : "remove"}
              aria-pressed={held}
              onClick={() => {
                p.engine.setHeld(p.selected, !held);
                p.onChange();
              }}
            >
              <Unplug size={14} />
              {held ? "Return to DNA" : "Pull off DNA"}
            </button>
            <button aria-pressed={p.follow} onClick={p.onFollow}>
              <Crosshair size={14} />
              {p.follow ? "Following" : "Follow"}
            </button>
          </div>
          <p className={`motion-effect ${held ? "held" : ""}`} role="status">
            {held
              ? consequences[p.selected]
              : `${molecule.short} is available. Pull it off the DNA to test its role.`}
          </p>
          {blocked && (
            <div className="motion-blocked">
              WAITING FOR {molecules.find((m) => m.id === blocked)?.short}
            </div>
          )}
          <details className="motion-extra" open={window.innerWidth >= 700}>
            <summary>Replay a handoff</summary>
            <div className="motion-readout" aria-label="Reaction consequences">
              <span>
                Fork <strong>{p.engine.fork} nt</strong>
              </span>
              <span>
                Unsealed{" "}
                <strong>
                  {
                    p.engine.fragments.filter(
                      (f) => f.stage === "NICK_READY" || f.stage === "LIGATION",
                    ).length
                  }{" "}
                  nicks
                </strong>
              </span>
            </div>
            <div className="motion-cues">
              <span>REPLAY A HANDOFF</span>
              <div>
                {cues.map((cue) => (
                  <button
                    key={cue.label}
                    onClick={() => {
                      p.engine.seek(cue.time);
                      p.engine.paused = false;
                      p.onReplay(cue.actor);
                      p.onChange();
                    }}
                  >
                    {cue.label}
                    <ArrowRight size={10} />
                  </button>
                ))}
              </div>
            </div>
          </details>
          {p.engine.held.size > 0 && (
            <button
              className="motion-reset"
              onClick={() => {
                p.engine.held.clear();
                p.onChange();
              }}
            >
              <RotateCcw size={12} />
              Restore all molecules
            </button>
          )}
        </>
      )}
      <small className="motion-model">
        Illustrative paths & timing · human enzymes
      </small>
    </aside>
  );
}
