import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import {
  SITS,
  LEGACY_IDS,
  ATLAS_IDS,
  ATLAS_GROUPS,
  ATLAS_VIEWS,
  FUNCTION_STUDIES,
  QUIZ_LENGTH,
  quizComplete,
  quizSummary,
  ALL,
  TISSUES,
  PRESETS,
  CURRICULUM,
  createState,
  tissueFor,
  visibility,
  stage,
  undoStage,
  reassemble,
  question,
  answer,
  nextQuestion,
  layoutLabels,
  isClick,
  zoomDistance,
} from "../../public/holoanatomy/shoulder/model.js";
import { parseOBJ } from "../../public/holoanatomy/src/engine/obj.js";
const base = new URL(
  "../../public/holoanatomy/shoulder/assets/",
  import.meta.url,
);
const provenance = JSON.parse(await readFile(new URL("provenance.json", base)));
function glbJSON(data) {
  assert.equal(data.toString("utf8", 0, 4), "glTF");
  assert.equal(data.readUInt32LE(4), 2);
  assert.equal(data.readUInt32LE(8), data.length);
  return JSON.parse(data.toString("utf8", 20, 20 + data.readUInt32LE(12)));
}
test("all source IDs unique and SITS complete", () => {
  assert.equal(new Set(LEGACY_IDS).size, 20);
  assert.equal(new Set(ALL).size, 54);
  assert.equal(SITS.length, 4);
  assert.deepEqual(
    new Set(provenance.structures.map((p) => p.id)),
    new Set(LEGACY_IDS),
  );
  for (const id of SITS)
    assert.ok(CURRICULUM[id].innervation && CURRICULUM[id].insertion);
});
test("tissue classification does not fabricate tendons", () => {
  for (const p of provenance.structures) {
    assert.ok(TISSUES[tissueFor(p)]);
    if (p.layer === "muscles") assert.equal(tissueFor(p), "SKELETAL_MUSCLE");
  }
});
test("all nine material classes have bounded roughness and restrained ghost alpha", () => {
  assert.equal(Object.keys(TISSUES).length, 9);
  for (const m of Object.values(TISSUES)) {
    assert.match(m.baseColor, /^#[0-9a-f]{6}$/);
    assert.ok(m.roughness >= 0 && m.roughness <= 1);
    assert.ok(m.ghostAlpha > 0 && m.ghostAlpha < 0.3);
  }
});
test("provenance is complete, source geometry is untextured, and normals are valid", () => {
  for (const p of provenance.structures) {
    for (const key of [
      "structureId",
      "name",
      "FMA",
      "source",
      "sourceVersion",
      "license",
      "attribution",
      "geometryType",
      "vertexCount",
      "faceCount",
      "hasUV",
      "hasNormals",
      "hasTangents",
      "textures",
      "derivedOperations",
      "reviewStatus",
    ])
      assert.notEqual(p[key], undefined, `${p.id} ${key}`);
    assert.equal(p.hasUV, false);
    assert.equal(p.hasTangents, false);
    assert.equal(p.hasNormals, true);
    assert.equal(p.zeroNormals, 0);
    assert.equal(p.textures.length, 0);
    assert.match(p.reviewStatus, /no independent clinical review/);
  }
});
test("all presets explicitly partition every structure and have meaningful purposes", () => {
  assert.equal(Object.keys(PRESETS).length, 10);
  for (const p of Object.values(PRESETS)) {
    assert.deepEqual(
      new Set([...p.visible, ...p.ghost, ...p.hidden]),
      new Set(ALL),
    );
    assert.equal(p.visible.length + p.ghost.length + p.hidden.length, ALL.length);
    assert.ok(p.distance >= 1.4 && p.distance <= 7.5);
    assert.ok(Math.abs(p.pitch) < 1.5);
    assert.ok(p.purpose.length > 20);
    for (const id of p.labels) assert.ok(p.visible.includes(id));
  }
});
test("isolation ghosts context; hidden objects remain hidden", () => {
  const s = createState();
  s.selected = SITS[0];
  s.isolated = true;
  assert.equal(visibility(s, SITS[0]), "visible");
  assert.equal(visibility(s, SITS[1]), "ghost");
  assert.equal(visibility(s, "FJ3579"), "hidden");
});
test("peel staging is bounded, reversible and only moves cuff structures", () => {
  const s = createState();
  s.mode = "peel";
  stage(s, "FJ3384");
  assert.equal(s.staged.length, 0);
  stage(s, SITS[0]);
  stage(s, SITS[0]);
  assert.deepEqual(s.staged, [SITS[0]]);
  undoStage(s);
  assert.deepEqual(s.staged, []);
  stage(s, SITS[1]);
  reassemble(s);
  assert.deepEqual(s.staged, []);
  undoStage(s);
  assert.deepEqual(s.staged, [SITS[1]]);
});
test("peel exposures use source deltoid and cuff without adding geometry", () => {
  const s = createState();
  s.mode = "peel";
  s.peel = 0;
  assert.equal(visibility(s, "FJ1467"), "visible");
  s.peel = 1;
  assert.equal(visibility(s, "FJ1467"), "ghost");
  s.peel = 2;
  assert.equal(visibility(s, "FJ1467"), "hidden");
  assert.equal(visibility(s, SITS[0]), "visible");
});
test("quiz retries do not reward random clicking; no immediate repetition", () => {
  const s = createState();
  const first = question(s).id;
  assert.equal(answer(s, "FJ3384"), "retry");
  assert.equal(answer(s, first), "correct");
  assert.equal(s.quiz.score, 0);
  assert.equal(answer(s, first), "answered");
  assert.equal(nextQuestion(s), true);
  assert.notEqual(question(s).id, first);
  assert.equal(nextQuestion(s), false);
  assert.equal(answer(s, question(s).id), "correct");
  assert.equal(s.quiz.score, 1);
  for (let i = 0; i < 4; i++) {
    const old = question(s).id;
    answer(s, old);
    nextQuestion(s);
    assert.notEqual(question(s).id, old);
  }
  assert.equal(question(s).level, "Relationships");
});
test("orbit drag or multi-touch cannot be interpreted as a click", () => {
  assert.equal(isClick({ x: 0, y: 0 }, { x: 3, y: 2 }, false), true);
  assert.equal(isClick({ x: 0, y: 0 }, { x: 20, y: 0 }, false), false);
  assert.equal(isClick({ x: 0, y: 0 }, { x: 0, y: 0 }, true), false);
  assert.ok(zoomDistance(4, -0.2) < 4);
  assert.equal(zoomDistance(4, -10), 1.4);
  assert.equal(zoomDistance(4, 10), 7.5);
});
test("labels retain structure references and avoid collisions at narrow widths", () => {
  const input = SITS.map((id, i) => ({ id, x: 50, y: 150 + i }));
  const result = layoutLabels(input, 390, 489);
  assert.deepEqual(
    result.map((x) => x.id),
    SITS,
  );
  for (let i = 1; i < result.length; i++)
    assert.ok(result[i].labelY - result[i - 1].labelY >= 44);
  for (const l of result) assert.ok(l.labelY < 489 && l.labelY >= 0);
});
test("every OBJ fallback exists, parses and matches source triangle inventory", async () => {
  for (const p of provenance.structures) {
    const url = new URL(
      `../../public/holoanatomy/anatomy/${p.id}.obj`,
      import.meta.url,
    );
    await access(url);
    const geo = parseOBJ(await readFile(url, "utf8"));
    assert.equal(geo.triangles, p.triangleCount);
    assert.ok(geo.positions.every(Number.isFinite));
  }
});
test("all GLB LODs have indexed normals, named nodes, and preserve scarce cuff topology", async () => {
  let counts0;
  for (let level = 0; level < 3; level++) {
    const json = glbJSON(
      await readFile(new URL(`shoulder-lod${level}.glb`, base)),
    );
    const counts = {};
    for (const node of json.nodes) {
      if (node.mesh === undefined) continue;
      assert.ok(ALL.includes(node.name));
      assert.equal(node.extras.structureId, node.name);
      counts[node.name] = 0;
      for (const p of json.meshes[node.mesh].primitives) {
        assert.ok(p.indices !== undefined && p.attributes.NORMAL !== undefined);
        counts[node.name] += json.accessors[p.indices].count / 3;
      }
    }
    assert.equal(Object.keys(counts).length, 20);
    if (!level) {
      counts0 = counts;
      for (const p of provenance.structures)
        assert.equal(counts[p.id], p.triangleCount);
    } else {
      for (const id of SITS) assert.equal(counts[id], counts0[id]);
      assert.ok(counts.FJ3384 < counts0.FJ3384);
    }
  }
});
test("production entry is self-contained and references vendored runtime", async () => {
  const html = await readFile(
    new URL("../../public/holoanatomy/shoulder/index.html", import.meta.url),
    "utf8",
  );
  assert.match(html, /\.\/vendor\/three.module.min.js/);
  assert.match(html, /\.\/app.js/);
  assert.doesNotMatch(html, /https:\/\/.*\.js/);
});

test("function studies highlight source groups and preserve bone context", () => {
  const state = createState();
  state.mode = "learn";
  for (const [id, study] of Object.entries(FUNCTION_STUDIES)) {
    state.study = id;
    state.view = study.view;
    assert.ok(PRESETS[study.view]);
    assert.ok(study.boundary);
    assert.equal(visibility(state, "FJ3384"), "visible");
    for (const muscle of SITS)
      assert.equal(
        visibility(state, muscle),
        study.ids.includes(muscle) ? "visible" : "ghost",
      );
    assert.equal(visibility(state, "FJ3579"), "hidden");
  }
});
test("assessment ends at twelve, records retries once and cannot inflate a completed score", () => {
  const state = createState();
  let previous;
  for (let i = 0; i < QUIZ_LENGTH; i++) {
    const q = question(state);
    assert.notEqual(q.id, previous);
    assert.equal(
      q.level,
      ["Identification", "Relationships", "Function"][Math.floor(i / 4)],
    );
    if (i % 2 === 0) assert.equal(answer(state, "FJ3384"), "retry");
    assert.equal(answer(state, q.id), "correct");
    assert.equal(answer(state, q.id), "answered");
    assert.equal(state.quiz.history.length, i + 1);
    previous = q.id;
    assert.equal(nextQuestion(state), true);
  }
  assert.equal(quizComplete(state), true);
  assert.equal(question(state), null);
  assert.equal(state.quiz.score, 6);
  assert.equal(nextQuestion(state), false);
  assert.equal(answer(state, SITS[0]), "answered");
  assert.deepEqual(
    quizSummary(state).map((row) => [row.correct, row.total]),
    [
      [2, 4],
      [2, 4],
      [2, 4],
    ],
  );
});

test("Blender shading candidate preserves every source triangle and position", async () => {
  const directory = new URL(
    "../../Documentation/shoulder-conference-qa/blender/",
    import.meta.url,
  );
  const oldData = await readFile(new URL("source-lod0.glb", directory));
  const newData = await readFile(new URL("shoulder-lod0.glb", base));
  function triangles(data) {
    const json = glbJSON(data),
      binaryStart = 28 + data.readUInt32LE(12);
    const result = {};
    function accessor(index) {
      const a = json.accessors[index],
        view = json.bufferViews[a.bufferView];
      const components = a.type === "VEC3" ? 3 : 1;
      const bytes = a.componentType === 5123 ? 2 : 4;
      const values = [];
      for (let i = 0; i < a.count; i++) {
        const row = [];
        for (let c = 0; c < components; c++) {
          const offset =
            binaryStart +
            (view.byteOffset || 0) +
            (a.byteOffset || 0) +
            i * (view.byteStride || components * bytes) +
            c * bytes;
          row.push(
            a.componentType === 5126
              ? data.readFloatLE(offset)
              : bytes === 2
                ? data.readUInt16LE(offset)
                : data.readUInt32LE(offset),
          );
        }
        values.push(row);
      }
      return values;
    }
    for (const node of json.nodes.filter((n) => n.mesh !== undefined)) {
      const p = json.meshes[node.mesh].primitives[0];
      const positions = accessor(p.attributes.POSITION),
        indices = accessor(p.indices).flat();
      const faces = [];
      for (let i = 0; i < indices.length; i += 3)
        faces.push(
          indices
            .slice(i, i + 3)
            .map((index) => positions[index].join(","))
            .sort()
            .join(";"),
        );
      result[node.name] = faces.sort();
      assert.equal(
        p.attributes.TEXCOORD_0,
        undefined,
        "No unused baked maps shipped",
      );
    }
    assert.equal((json.textures || []).length, 0);
    return result;
  }
  assert.deepEqual(triangles(newData), triangles(oldData));
});


test("quiz covers every muscle per round without adjacent repeats or later camera clues", () => {
  const decks = new Set();
  for (let session = 0; session < 100; session++) {
    const state = createState();
    const order = state.quiz.order;
    decks.add(order.join(","));
    assert.equal(order.length, 12);
    for (let round = 0; round < 3; round++)
      assert.deepEqual([...order.slice(round * 4, round * 4 + 4)].sort(), [...SITS].sort());
    for (let i = 0; i < 12; i++) {
      if (i) assert.notEqual(order[i], order[i - 1]);
      state.quiz.index = i;
      assert.equal(question(state).id, order[i]);
      if (i >= 4) assert.equal(question(state).view, "lateral");
    }
  }
  assert.ok(decks.size > 1);
});


test("joint study has source-backed geometry, attribution and normalized OBJ fallback for every part", async () => {
  const { createHash } = await import("node:crypto");
  const atlas = JSON.parse(await readFile(new URL("atlas/provenance.json", base)));
  const config = JSON.parse(await readFile(new URL("../blender/shoulder_atlas.json", import.meta.url)));
  assert.deepEqual(atlas.structures.map(p => p.id).sort(), [...ATLAS_IDS].sort());
  const glb = glbJSON(await readFile(new URL("atlas/shoulder-atlas.glb", base)));
  const nodes = glb.nodes.filter(n => n.mesh !== undefined);
  assert.equal(nodes.length, ATLAS_IDS.length);
  for (const p of atlas.structures) {
    const source = config.find(s => s.id === p.id);
    assert.equal(source.sourceObject, p.sourceObject);
    assert.equal(tissueFor(p), source.tissue);
    assert.equal(p.license, "CC BY-SA 4.0");
    assert.match(p.attribution, /BodyParts3D.*Z-Anatomy/);
    assert.match(p.reviewStatus, /no independent clinical review/);
    assert.equal(p.FMA, null, "Do not invent an unverified FMA mapping");
    assert.ok(p.inverseTransformMaxErrorMetres < 1e-6);
    const node = nodes.find(n => n.extras.structureId === p.id);
    assert.ok(node, p.id);
    const triangles = glb.meshes[node.mesh].primitives.reduce((sum, primitive) => {
      assert.ok(primitive.attributes.NORMAL !== undefined);
      return sum + glb.accessors[primitive.indices].count / 3;
    }, 0);
    assert.equal(triangles, p.triangleCount, p.id);
    const obj = await readFile(new URL(`atlas/${p.id}.obj`, base));
    assert.equal(createHash("sha256").update(obj).digest("hex"), p.objSha256);
    const parsed = parseOBJ(obj.toString());
    assert.equal(parsed.triangles, p.triangleCount);
    assert.ok(parsed.positions.every(Number.isFinite));
  }
  assert.equal(atlas.structures.filter(p => p.tissue === "TENDON").length, 1);
  assert.equal(atlas.structures.find(p => p.id === "ZA_infra_tendon").sourceMaterial, "Tendon");
  assert.match(await readFile(new URL("atlas/LICENSE.txt", base), "utf8"), /ShareAlike/);
});

test("joint views preserve source coherence and cannot contaminate cuff lessons or quizzes", () => {
  const state = createState();
  for (const view of Object.keys(ATLAS_VIEWS)) {
    state.view = view;
    for (const id of LEGACY_IDS) {
      state.selected = id;
      assert.equal(visibility(state, id), "hidden");
    }
    state.selected = null;
    for (const id of ATLAS_GROUPS[ATLAS_VIEWS[view].group]) assert.equal(visibility(state, id), "visible");
    for (const id of ATLAS_GROUPS.bones) assert.equal(visibility(state, id), "ghost");
  }
  for (const mode of ["explore", "peel", "learn", "quiz"]) {
    state.mode = mode;
    state.view = "posterior";
    for (const id of ATLAS_IDS) {
      state.selected = id;
      assert.equal(visibility(state, id), "hidden");
    }
  }
});

test("deep dissection hides lifted anatomy, preserves source context and records probe observations", async () => {
  const { DISSECTION, dissectionIds, dissect } = await import('../../public/holoanatomy/shoulder/model.js');
  const s = createState(); s.mode = 'peel'; s.dissection.active = true;
  for (let step = 0; step < DISSECTION.length; step++) {
    s.dissection.step = step;
    const id = DISSECTION[step].target;
    assert.ok(dissectionIds(s).includes(id));
    assert.equal(visibility(s, 'FJ1506'), 'hidden');
    s.dissection.tool = 'probe'; assert.equal(dissect(s, id), true);
    dissect(s, id); assert.equal(s.dissection.found.filter(i => i === step).length, 1);
    s.dissection.tool = 'lift'; assert.equal(dissect(s, 'ZA_scapula'), false);
    assert.equal(dissect(s, 'FJ1506'), false);
    assert.equal(dissect(s, id), true); assert.equal(visibility(s, id), 'hidden');
    assert.equal(dissect(s, id), false);
    s.dissection.removed = s.dissection.undo.pop(); assert.equal(visibility(s, id), 'visible');
  }
  assert.equal(s.dissection.found.length, 5);
});
