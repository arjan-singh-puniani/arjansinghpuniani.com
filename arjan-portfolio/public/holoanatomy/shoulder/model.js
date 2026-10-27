import { ATLAS_GROUPS, ATLAS_IDS } from "./atlas.js";
export { ATLAS_GROUPS, ATLAS_IDS };
/** Pure domain state. World +X=left, +Y=superior, +Z=anterior. */
export const SITS = ["FJ1506", "FJ1500", "FJ1508", "FJ1504"];
export const BONES = ["FJ3384", "FJ3362", "FJ3368"];
export const DELTOID = ["FJ1467", "FJ1468", "FJ1513"];
export const VESSELS = [
  "FJ3579",
  "FJ2268",
  "FJ2303",
  "FJ2298",
  "FJ2273",
  "FJ2269",
  "FJ2302",
  "FJ2299",
  "FJ2274",
];
export const LEGACY_IDS = [...BONES, ...SITS, ...DELTOID, "FJ1478", ...VESSELS];
export const ALL = [...LEGACY_IDS, ...ATLAS_IDS];
export const TISSUES = {
  BONE: {
    baseColor: "#cec2a6",
    roughness: 0.76,
    specular: 0.22,
    ghostAlpha: 0.12,
  },
  SKELETAL_MUSCLE: {
    baseColor: "#974f44",
    roughness: 0.52,
    specular: 0.32,
    ghostAlpha: 0.09,
  },
  TENDON: {
    baseColor: "#d6cbb6",
    roughness: 0.78,
    specular: 0.2,
    ghostAlpha: 0.12,
  },
  CARTILAGE: {
    baseColor: "#9bb5b1",
    roughness: 0.54,
    specular: 0.3,
    ghostAlpha: 0.13,
  },
  ARTERY: {
    baseColor: "#983d36",
    roughness: 0.64,
    specular: 0.24,
    ghostAlpha: 0.13,
  },
  VEIN: {
    baseColor: "#576778",
    roughness: 0.7,
    specular: 0.22,
    ghostAlpha: 0.13,
  },
  NERVE: {
    baseColor: "#b8ab77",
    roughness: 0.78,
    specular: 0.2,
    ghostAlpha: 0.15,
  },
  CONNECTIVE_TISSUE: {
    baseColor: "#c4b5a4",
    roughness: 0.82,
    specular: 0.18,
    ghostAlpha: 0.12,
  },
  GENERIC_SOFT_TISSUE: {
    baseColor: "#a18174",
    roughness: 0.75,
    specular: 0.2,
    ghostAlpha: 0.1,
  },
};
export const CUFF_COLORS = {
  ZA_infra: "#985e56",
  ZA_supra: "#a7815f",
  ZA_teres: "#a57770",
  ZA_subscap: "#b2664b",
  FJ1506: "#a7815f",
  FJ1500: "#985e56",
  FJ1508: "#a57770",
  FJ1504: "#b2664b",
};
export function tissueFor(part) {
  if (TISSUES[part.tissue]) return part.tissue;
  return (
    {
      skeleton: "BONE",
      muscles: "SKELETAL_MUSCLE",
      arteries: "ARTERY",
      veins: "VEIN",
      nerves: "NERVE",
    }[part.layer] || "GENERIC_SOFT_TISSUE"
  );
}
function preset(
  label,
  yaw,
  pitch,
  distance,
  visible,
  ghost,
  purpose,
  labels,
  target = [0, 0.12, 0],
) {
  return {
    label,
    yaw,
    pitch,
    distance,
    fov: 32,
    target,
    visible,
    ghost,
    hidden: ALL.filter((id) => !visible.includes(id) && !ghost.includes(id)),
    purpose,
    labels,
  };
}
export const PRESETS = {
  posterior: preset(
    "Posterior cuff",
    -2.85,
    0.17,
    3.9,
    [...BONES, ...SITS],
    [],
    "Compare the cuff behind the scapula.",
    SITS.slice(0, 3),
  ),
  anterior: preset(
    "Anterior cuff",
    -0.35,
    0.1,
    3.9,
    [...BONES, ...SITS],
    [],
    "Find subscapularis on the costal surface.",
    ["FJ1504", "FJ1506"],
  ),
  superior: preset(
    "Superior · supraspinatus",
    -0.8,
    1.18,
    3.25,
    [...BONES, "FJ1506"],
    ["FJ1500", "FJ1504", "FJ1508"],
    "Follow supraspinatus above the scapular spine.",
    ["FJ1506"],
  ),
  lateral: preset(
    "Lateral insertion",
    -Math.PI / 2,
    0.1,
    3.5,
    [...BONES, ...SITS],
    [],
    "Inspect the relationship to the proximal humerus; footprints are not segmented.",
    ["FJ1506", "FJ1500", "FJ1508"],
  ),
  joint: preset(
    "Glenohumeral context",
    -0.8,
    0.22,
    3.8,
    BONES,
    SITS,
    "Locate the humeral head and glenoid with ghosted cuff context.",
    [],
    [-0.18, 0.06, 0],
  ),
  vascular: preset(
    "Regional vessels",
    -0.55,
    0.15,
    5.3,
    [...BONES, ...VESSELS],
    SITS,
    "Inspect the supplied regional vessels. This is an incomplete vascular tree.",
    [],
    [-0.2, -0.4, 0],
  ),
};
export const ATLAS_VIEWS = {
  atlas_joint: { title: "Joint surfaces & ligaments", group: "joint", text: "Inspect the labrum, source-classified cartilage surfaces and shoulder ligaments. These structures use their matching Z-Anatomy bones." },
  atlas_capsule: { title: "Capsule & bursae", group: "capsule", text: "Explore the source-authored joint capsule and subacromial and subdeltoid bursae. Their thickness and distension are illustrative." },
  atlas_neurovascular: { title: "Shoulder nerves & vessels", group: "neurovascular", text: "Follow the supplied axillary, suprascapular and subscapular nerves alongside regional vessels. This is not a complete plexus or vascular tree." },
  atlas_attachments: { title: "Tendon & insertion regions", group: "attachments", text: "Inspect the infraspinatus tendon-classified region and four authored insertion regions. These are source annotations, not measured footprints or four complete tendons." },
};
for (const [id, view] of Object.entries(ATLAS_VIEWS)) {
  PRESETS[id] = preset(view.title, -0.8, 0.22, view.group === "neurovascular" ? 3.8 : 2.8,
    [...ATLAS_GROUPS[view.group]],
    [...ATLAS_GROUPS.bones, ...(view.group === "attachments" ? ATLAS_GROUPS.cuff : [])],
    view.title + " in their source context.",
    ATLAS_GROUPS[view.group].filter((id) => !id.endsWith("_vein")).slice(0, 3),
    [0, 0, 0]);
}
export function atlasViewFor(id) {
  return Object.keys(ATLAS_VIEWS).find((view) => ATLAS_GROUPS[ATLAS_VIEWS[view].group].includes(id)) || "atlas_attachments";
}
// Study stations are teaching exposures, not a surgical approach or depth map.
export const DISSECTION = [
  {title: "Uncover the cuff", groups: ["bones", "cuff", "capsule"], target: "ZA_subacromial", task: "Probe the subacromial bursa, then lift it away to compare the underlying cuff surfaces."},
  {title: "Follow the attachment", groups: ["bones", "cuff", "attachments"], target: "ZA_infra_tendon", task: "Lift individual cuff muscles. Probe the supplied infraspinatus tendon region; compare it with the insertion annotations."},
  {title: "Open the capsule study", groups: ["bones", "capsule", "joint"], target: "ZA_capsule", task: "Find the joint capsule with the probe. Lift it away and inspect the structures revealed inside."},
  {title: "Explore the joint rim", groups: ["bones", "joint"], target: "ZA_labrum", task: "Probe the glenoid labrum. Lift individual ligaments or cartilage surfaces to compare the joint rim with its bony context."},
  {title: "Trace the nerve routes", groups: ["bones", "neurovascular"], target: "ZA_axillary", task: "Find the axillary nerve with the probe. Lift overlapping regional vessels to follow its supplied course."},
];
export function dissectionIds(state) {
  const ids=DISSECTION[state.dissection.step].groups.flatMap(group => ATLAS_GROUPS[group]);
  if(ids.includes("ZA_infra"))ids.push("ZA_infra_tendon");
  return [...new Set(ids)];
}
export function dissect(state, id) {
  const d = state.dissection;
  if (!d.active || !dissectionIds(state).includes(id)) return false;
  if (d.tool === "probe") {
    state.selected = id;
    if (id === DISSECTION[d.step].target && !d.found.includes(d.step)) d.found.push(d.step);
    return true;
  }
  if (ATLAS_GROUPS.bones.includes(id) || d.removed.includes(id)) return false;
  d.undo.push([...d.removed]);
  d.removed.push(id);
  state.selected = null;
  return true;
}
export const LESSON = [
  {
    title: "A mobile joint. A stabilizing cuff.",
    text: "Start with the scapula and humeral head. The cuff helps keep the head centered as the arm moves.",
    view: "joint",
  },
  {
    title: "Above the spine",
    text: "Find supraspinatus in the supraspinous fossa. Select the highlighted muscle to inspect its source.",
    view: "posterior",
    id: "FJ1506",
  },
  {
    title: "Look from above",
    text: "Rotate superiorly and see its relationship to the acromion. A separate tendon is not provided by this mesh.",
    view: "superior",
    id: "FJ1506",
  },
  {
    title: "The posterior cuff",
    text: "Infraspinatus spreads below the scapular spine. Follow its broad form toward the humerus.",
    view: "posterior",
    id: "FJ1500",
  },
  {
    title: "Similar direction, different scale",
    text: "Teres minor sits inferior to infraspinatus. Compare the slender teres minor with its broad neighbor.",
    view: "posterior",
    id: "FJ1508",
  },
  {
    title: "Turn to the front",
    text: "Move around the rib-facing surface of the scapula. The anterior cuff comes into view.",
    view: "anterior",
  },
  {
    title: "Subscapularis",
    text: "This broad anterior muscle inserts on the lesser tubercle. Its insertion footprint is described in text, not drawn on this model.",
    view: "anterior",
    id: "FJ1504",
  },
  {
    title: "Reconstruct the cuff",
    text: "Orbit around the four muscles. One superior, two posterior, one anterior: a spatial arrangement around the joint.",
    view: "lateral",
  },
  {
    title: "Now find them yourself",
    text: "Use the 3D model to identify the muscles. Labels are removed in Quiz. A first-attempt answer earns a point; retries are for learning.",
    view: "posterior",
    quiz: true,
  },
];
export const CURRICULUM = {
  FJ1506: {
    name: "Supraspinatus",
    origin: "Supraspinous fossa of the scapula.",
    insertion: "Superior facet of the greater tubercle of the humerus.",
    action: "Assists arm abduction and joint stabilization.",
    innervation: "Suprascapular nerve (C5–C6).",
    relationship: "Above the scapular spine; passes beneath the acromion.",
    clinical: "A frequent site of rotator-cuff tendon injury.",
  },
  FJ1500: {
    name: "Infraspinatus",
    origin: "Infraspinous fossa of the scapula.",
    insertion: "Middle facet of the greater tubercle of the humerus.",
    action: "External rotation; helps stabilize the humeral head.",
    innervation: "Suprascapular nerve (C5–C6).",
    relationship: "Broad posterior cuff, inferior to the scapular spine.",
    clinical:
      "External-rotation weakness can accompany posterior cuff dysfunction.",
  },
  FJ1508: {
    name: "Teres minor",
    origin: "Lateral border of the scapula.",
    insertion: "Inferior facet of the greater tubercle of the humerus.",
    action: "External rotation and joint stabilization.",
    innervation: "Axillary nerve (C5–C6).",
    relationship:
      "Inferior to infraspinatus, forming the lower posterior cuff.",
    clinical: "Axillary nerve injury may impair its function.",
  },
  FJ1504: {
    name: "Subscapularis",
    origin: "Subscapular fossa on the anterior scapula.",
    insertion: "Lesser tubercle of the humerus.",
    action: "Internal rotation and joint stabilization.",
    innervation: "Upper and lower subscapular nerves (primarily C5–C6).",
    relationship: "Between the scapula and thoracic wall.",
    clinical:
      "Subscapularis dysfunction may reduce internal-rotation strength.",
  },
};
// Functional groups are curriculum annotations on static source surfaces, not activation data.
export const FUNCTION_STUDIES = {
  elevation: {
    title: "Help lift the arm",
    label: "Elevation",
    view: "superior",
    ids: ["FJ1506"],
    text: "Supraspinatus contributes to abduction. Look above the scapular spine, then follow the supplied surface toward the humerus.",
    task: "Orbit beneath the acromion. Which parts of the muscle become hidden?",
    boundary:
      "The model shows a muscle surface, not a separately segmented tendon or a moving subacromial space.",
  },
  external: {
    title: "Two posterior rotators",
    label: "External rotation",
    view: "posterior",
    ids: ["FJ1500", "FJ1508"],
    text: "Infraspinatus and teres minor contribute to external rotation. Compare the broad posterior muscle with its smaller, inferior neighbor.",
    task: "Select each muscle. Compare their position and innervation in the structure notes.",
    boundary:
      "Highlighting identifies a functional group; brightness does not represent force or muscle activation.",
  },
  internal: {
    title: "Find the anterior rotator",
    label: "Internal rotation",
    view: "anterior",
    ids: ["FJ1504"],
    text: "Subscapularis contributes to internal rotation. Turn toward the rib-facing surface to find the anterior member of the cuff.",
    task: "Orbit from anterior to posterior. Notice why one view cannot show the entire cuff.",
    boundary:
      "The lesser-tubercle insertion is described in the curriculum. Its footprint is not segmented on this surface.",
  },
  stability: {
    title: "A cuff around a mobile joint",
    label: "Stability",
    view: "lateral",
    ids: [...SITS],
    text: "The four cuff muscles help stabilize the glenohumeral joint. Inspect how their surfaces are distributed around the proximal humerus.",
    task: "Compare anterior and posterior perspectives with the orientation cube. Locate all four muscles without separating them.",
    boundary:
      "This is a static anatomical study. Joint forces, tissue deformation and scapulohumeral rhythm are not simulated.",
  },
};
export const QUIZ_LENGTH = 12;
export function quizComplete(state) {
  return state.quiz.index >= QUIZ_LENGTH;
}
export function quizSummary(state) {
  return ["Identification", "Relationships", "Function"].map((level) => {
    const rows = state.quiz.history.filter((r) => r.level === level);
    return {
      level,
      correct: rows.filter((r) => r.firstAttempt).length,
      total: rows.length,
    };
  });
}
export const SOURCES = [
  {
    title: "Anatomy, Rotator Cuff · StatPearls / NCBI",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK441844/",
  },
  {
    title: "Scapulohumeral Muscles · StatPearls / NCBI",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK546633/",
  },
  {
    title: "US anatomy of the shoulder · peer-reviewed pictorial essay",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3553044/",
  },
];
export function createState() {
  const order = [];
  for (let round = 0; round < 3; round++) {
    const remaining = [...SITS];
    while (remaining.length) {
      const candidates = remaining.filter((id) => id !== order.at(-1));
      const id = candidates[Math.floor(Math.random() * candidates.length)];
      order.push(id);
      remaining.splice(remaining.indexOf(id), 1);
    }
  }
  return {
    dissection: { active: false, step: 0, tool: "probe", removed: [], offsets: {}, undo: [], found: [] },
    mode: "explore",
    presenting: false,
    study: null,
    view: "posterior",
    selected: null,
    isolated: false,
    atlas: true,
    peel: 2,
    staged: [],
    undo: [],
    lesson: 0,
    quiz: {
      order,
      index: 0,
      score: 0,
      answered: false,
      retried: false,
      previous: null,
      history: [],
    },
    section: false,
  };
}
export function visibility(state, id) {
  if (state.mode === "peel" && state.dissection.active) {
    if (!dissectionIds(state).includes(id)) return "hidden";
    return (ATLAS_GROUPS.bones.includes(id) || state.isolated && state.selected && state.selected !== id) && state.selected !== id ? "ghost" : "visible";
  }
  const p = PRESETS[state.view];
  const atlasView = Boolean(ATLAS_VIEWS[state.view]);
  if (ATLAS_IDS.includes(id) && (!atlasView || state.mode !== "explore")) return "hidden";
  if (atlasView && state.mode === "explore" && !ATLAS_IDS.includes(id)) return "hidden";
  let value = p.visible.includes(id)
    ? "visible"
    : p.ghost.includes(id)
      ? "ghost"
      : "hidden";
  if (state.mode === "peel") {
    value = [...BONES, ...SITS].includes(id) ? "visible" : "hidden";
    if (DELTOID.includes(id))
      value =
        state.peel === 0 ? "visible" : state.peel === 1 ? "ghost" : "hidden";
    if (state.peel === 4 && SITS.includes(id) && id !== state.selected)
      value = "ghost";
  }
  if (state.mode === "learn" && FUNCTION_STUDIES[state.study]) {
    const group = FUNCTION_STUDIES[state.study].ids;
    value =
      BONES.includes(id) || group.includes(id)
        ? "visible"
        : SITS.includes(id)
          ? "ghost"
          : "hidden";
  }
  if (state.selected === id && state.mode !== "quiz") value = "visible";
  if (state.mode === "quiz" && SITS.includes(id)) value = "visible";
  if (
    state.isolated &&
    state.selected &&
    id !== state.selected &&
    value === "visible"
  )
    value = "ghost";
  return value;
}
export function stage(state, id) {
  if (!SITS.includes(id) || state.staged.includes(id)) return;
  state.undo.push([...state.staged]);
  state.staged.push(id);
  state.peel = 3;
}
export function undoStage(state) {
  if (state.undo.length) state.staged = state.undo.pop();
}
export function reassemble(state) {
  if (state.staged.length) state.undo.push([...state.staged]);
  state.staged = [];
}
export function question(state) {
  if (quizComplete(state)) return null;
  const id = state.quiz.order[state.quiz.index],
    level = Math.floor(state.quiz.index / 4);
  const relation = {
    FJ1506: "Select the cuff muscle above the scapular spine.",
    FJ1504: "Select the anterior rotator-cuff muscle.",
    FJ1500: "Select the broad posterior muscle below the scapular spine.",
    FJ1508: "Which cuff muscle lies inferior to infraspinatus?",
  };
  return {
    id,
    prompt:
      level >= 2
        ? {
            FJ1506:
              "Which cuff muscle above the scapular spine contributes to arm abduction?",
            FJ1504:
              "Select the cuff muscle that contributes to internal rotation.",
            FJ1500:
              "Select the broad posterior external rotator supplied by the suprascapular nerve.",
            FJ1508:
              "Select the smaller posterior external rotator supplied by the axillary nerve.",
          }[id]
        : level
          ? relation[id]
          : `Identify ${CURRICULUM[id].name.toLowerCase()}.`,
    view: level === 0 ? (id === "FJ1504" ? "anterior" : "posterior") : "lateral",
    level: level >= 2 ? "Function" : level ? "Relationships" : "Identification",
  };
}
export function answer(state, id) {
  if (quizComplete(state) || state.quiz.answered) return "answered";
  const correct = id === question(state).id;
  if (correct) {
    state.quiz.answered = true;
    if (!state.quiz.retried) state.quiz.score++;
    state.quiz.history.push({
      id,
      level: question(state).level,
      firstAttempt: !state.quiz.retried,
    });
    return "correct";
  }
  state.quiz.retried = true;
  return "retry";
}
export function nextQuestion(state) {
  if (quizComplete(state) || !state.quiz.answered) return false;
  state.quiz.previous = question(state).id;
  state.quiz.index++;
  state.quiz.answered = false;
  state.quiz.retried = false;
  return true;
}
export function layoutLabels(items, width, height) {
  const gap = 44,
    margin = 18;
  const sides = [[], []];
  for (const item of items) sides[item.x < width / 2 ? 0 : 1].push(item);
  return sides.flatMap((side, i) => {
    side.sort((a, b) => a.y - b.y);
    const maxY = height - 70;
    let y = Math.min(220, Math.max(70, maxY - (side.length - 1) * gap));
    return side.map((item, index) => {
      y = Math.max(y, Math.min(item.y, maxY - (side.length - index - 1) * gap));
      const out = { ...item, labelX: i ? width - 180 : margin, labelY: y };
      y += gap;
      return out;
    });
  });
}
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export function zoomDistance(distance, delta) {
  return clamp(distance * Math.exp(delta), 1.4, 7.5);
}
export function isClick(start, end, multi) {
  return !multi && Math.hypot(end.x - start.x, end.y - start.y) < 6;
}
