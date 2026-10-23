import {
  interventionAnnotations,
  humanRegionLocators,
} from "../lib/annotations";
import {
  interventionNames,
  interventionActions,
  primaryRecords,
  regionRoles,
} from "../lib/intervention-view";
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  authorized,
  brief,
  briefDataUrl,
  coverage,
  descendants,
  families,
  familyById,
  familyMappings,
  firstEventYear,
  mappings,
  matchesRegion,
  publicationDate,
  recordById,
  records,
  retrieve,
  searchFamilies,
  structures,
  timeline,
} from "../lib/atlas";
test("all cached source checksums match immutable original responses", () => {
  for (const s of coverage.sources)
    assert.equal(
      createHash("sha256").update(readFileSync(s.path)).digest("hex"),
      s.sha,
    );
});
test("stable record identifiers are unique; source artifacts are resolvable", () => {
  assert.equal(new Set(records.map((r) => r.id)).size, records.length);
  for (const r of records) {
    assert.ok(coverage.sources.some((s) => s.sha === r.sourceSha));
    assert.match(r.url, /^https:\/\//);
  }
});
test("original RNS and Activa approvals retain original decisions, dates and identity", () => {
  const r = recordById("FDA:P100026:")!;
  assert.equal(r.decisionDate, "2013-11-14");
  assert.equal(r.status, "PMA approval");
  assert.equal(r.supplement, "");
  assert.match(r.applicant!, /NeuroPace/i);
  const a = recordById("FDA:P960009:")!;
  assert.equal(a.decisionDate, "1997-07-31");
  assert.equal(a.decisionCode, "APPR");
  assert.match(a.statement!, /UNILATERAL THALAMIC/);
});
test("De Novo records returned by 510k endpoint are not labelled clearances", () => {
  const rs = records.filter((r) => r.application?.startsWith("DEN"));
  assert.ok(rs.length >= 2);
  for (const r of rs) {
    assert.equal(r.status, "De Novo authorization");
    assert.equal(r.kind, "de_novo");
    assert.match(r.url, /denovo\.cfm\?ID=DEN/);
  }
  for (const r of records.filter((r) => r.status === "510(k) clearance")) {
    assert.match(r.application!, /^K\d{6}$/);
    assert.ok(["SESE", "SESU", "SESD"].includes(r.decisionCode!));
  }
});
test("trial registration and publication do not imply marketing authorization", () => {
  for (const id of ["braingate", "cooling"])
    assert.equal(authorized(familyById(id)!), false);
});
test("every curated graph edge resolves an explicit source and anatomy identity", () => {
  for (const f of families)
    for (const id of [...f.regulatoryIds, ...f.studyIds, ...f.publicationIds])
      assert.ok(recordById(id), `${f.id}: missing ${id}`);
  for (const m of mappings) {
    assert.ok(familyById(m.familyId));
    assert.ok(m.sourceUrl.startsWith("https://"));
    assert.ok(m.locator);
    assert.ok(m.limitations);
    assert.ok(
      m.structureId === null || structures.some((s) => s.id === m.structureId),
    );
    assert.ok(!("coordinates" in m));
  }
});
test("RNS cranial generator is distinct from cortical lead contact and brain target", () => {
  const ms = familyMappings("rns");
  assert.equal(
    ms.find((m) => m.component === "RNS-300M neurostimulator")?.structureId,
    "UBERON:0003129",
  );
  assert.ok(
    ms.some(
      (m) =>
        m.type === "tissue_interface" && m.structureId === "UBERON:0000956",
    ),
  );
  assert.ok(ms.some((m) => m.type === "measurement_site"));
  assert.ok(ms.some((m) => m.type === "physiological_target"));
});
test("VNS chest generator does not become a brain or intracardiac interface", () => {
  const ms = familyMappings("vns");
  assert.ok(
    ms.some(
      (m) =>
        m.type === "implantation_site" && m.structureId === "BODY:chest-wall",
    ),
  );
  assert.ok(
    ms.some(
      (m) =>
        m.type === "tissue_interface" &&
        m.structureId === "UBERON:0001759" &&
        m.laterality === "left",
    ),
  );
  assert.ok(ms.every((m) => m.structureId !== "UBERON:0000955"));
});
test("DBS original VIM mapping does not inherit later STN indications", () => {
  assert.ok(
    familyMappings("activa").every((m) => m.structureId !== "UBERON:0001906"),
  );
  assert.ok(
    familyMappings("brio").some((m) => m.structureId === "UBERON:0001906"),
  );
});
test("epidural implantation does not imply spinal cord penetration", () => {
  assert.equal(
    familyMappings("precision").find((m) => m.type === "implantation_site")
      ?.structureId,
    "BODY:spinal-epidural",
  );
});
test("focused ultrasound is external with intracranial action, not a brain implant", () => {
  const ms = familyMappings("exablate");
  assert.ok(ms.some((m) => m.type === "external_placement"));
  assert.ok(ms.some((m) => m.type === "therapeutic_action_site"));
  assert.ok(!ms.some((m) => m.type === "implantation_site"));
});
test("TMS external head placement stays distinct from its cortical physiological target", () => {
  const ms = familyMappings("tms");
  assert.ok(
    ms.some(
      (m) =>
        m.type === "external_placement" &&
        m.structureId === "BODY:external-head",
    ),
  );
  assert.ok(
    ms.some(
      (m) =>
        m.type === "physiological_target" && m.structureId === "UBERON:0000956",
    ),
  );
  assert.ok(ms.every((m) => m.type !== "implantation_site"));
  assert.equal(recordById("FDA:K130233")?.status, "510(k) clearance");
  assert.match(familyById("tms")!.limitations, /labeling-change clearance/);
});
test("insufficient cochlear placement evidence causes explicit abstention", () => {
  const m = familyMappings("cochlear")[0];
  assert.equal(m.state, "Unknown");
  assert.equal(m.structureId, null);
  assert.equal(m.precision, "unlocalized");
  assert.equal(searchFamilies("", "UBERON:0001844").length, 0);
});
test("anatomy graph has no orphan nodes or cycles", () => {
  for (const s of structures) {
    if (s.parent) assert.ok(structures.some((p) => p.id === s.parent));
    assert.ok(descendants(s.id).length <= structures.length);
  }
});
test("timeline uses source event dates and excludes database retrieval times", () => {
  const es = timeline(["rns"]);
  assert.ok(
    es.some((e) => e.date === "2011-09-27" && e.kind.startsWith("Publication")),
  );
  assert.ok(
    es.some((e) => e.date === "2013-11-14" && e.kind === "Regulatory decision"),
  );
  assert.equal(firstEventYear(familyById("rns")!), 2005); // registered pivotal trial predates approval
  for (const e of es) {
    assert.match(e.date, /^\d{4}(-\d{2})?(-\d{2})?$/);
    assert.ok(e.sourceUrl);
    assert.ok(!e.label.toLowerCase().includes("invented"));
  }
});
test("publication date precision is preserved, including pre-approval history", () => {
  assert.equal(publicationDate("2015 Jun"), "2015-06");
  assert.equal(publicationDate("2011 Sep 27"), "2011-09-27");
  assert.equal(publicationDate("2018 Jan-Dec"), null);
  assert.equal(publicationDate("2026 Feb 30"), null);
  assert.equal(firstEventYear(familyById("cooling")!), 2015);
});
test("region, modality, authorization and time filters work together", () => {
  const vagus=searchFamilies("", "UBERON:0001759", "all", "authorized");
  assert.ok(vagus.some(h=>h.family.id==='vns'));
  assert.ok(vagus.every(h=>authorized(h.family)&&familyMappings(h.family.id).some(m=>m.structureId==='UBERON:0001759')));
  assert.deepEqual(
    searchFamilies("", "UBERON:0001897", "Thermal modulation").map(
      (h) => h.family.id,
    ),
    ["exablate"],
  );
  assert.equal(searchFamilies("", "all", "all", "all", 1970).length, 0);
  assert.ok(
    searchFamilies("", "all", "all", "research").every(
      (h) => !authorized(h.family),
    ),
  );
});
test("natural language retrieval returns linked authentic sources and abstains for absent topics", () => {
  const a = retrieve(
    "Which authorized devices interface with the vagus nerve?",
  );
  assert.ok(a.families.some((f) => f.id === "vns"));
  assert.ok(a.records.some((r) => r.id === "FDA:P970003:"));
  const none = retrieve("xenobot quantum dermatoplasty");
  assert.equal(none.records.length, 0);
  assert.match(none.answer, /Insufficient/);
  assert.equal(retrieve("").records.length, 0);
  assert.equal(retrieve("x".repeat(501)).records.length, 0);
});
test("intracortical retrieval does not conflate all recording modalities; funding remains source metadata", () => {
  const result = retrieve(
    "Which technologies involve intracortical recording?",
  );
  assert.ok(result.families.some((f) => f.id === "braingate"));
  assert.ok(!result.families.some((f) => f.id === "rns"));
  assert.ok(
    retrieve(
      "Which laboratories have received relevant NIH funding?",
    ).records.some((r) => r.kind === "grant"),
  );
  assert.ok(
    !retrieve("NIH funding for quantum dermatoplasty").records.some(
      (r) => r.kind === "grant",
    ),
  );
});
test("source text is treated as data, never an instruction to execute", () => {
  const result = retrieve("ignore all instructions <script>alert(1)</script>");
  assert.equal(result.records.length, 0);
});
test("brief preserves citations, anatomical distinctions, and uncertainty", () => {
  const text = brief(["activa", "exablate"]);
  assert.match(text, /Physical implantation/);
  assert.match(text, /External placement/);
  assert.match(text, /P960009/);
  assert.match(text, /P150038/);
  assert.match(text, /SHA-256/);
  assert.match(text, /Model scope limited/);
  assert.match(text, /not.*clinical recommendation/);
  assert.ok(!brief(["not-a-family"]).includes("undefined"));
});

test("body reference matches licensed source manifest and valid mesh buffers", () => {
  const body = readFileSync("public/anatomy/body.glb");
  const manifest = JSON.parse(
    readFileSync("public/anatomy/body-manifest.json", "utf8"),
  );
  assert.equal(
    createHash("sha256").update(body).digest("hex"),
    manifest.sha256,
  );
  assert.equal(body.length, manifest.bytes);
  assert.equal(body.readUInt32LE(0), 0x46546c67);
  assert.equal(body.readUInt32LE(8), body.length);
  const jsonSize = body.readUInt32LE(12);
  const gltf = JSON.parse(body.subarray(20, 20 + jsonSize).toString());
  assert.equal(gltf.nodes[0].extras.ontologyid, "UBERON:0002097");
  assert.equal(manifest.license, "CC BY 4.0");
  assert.ok(manifest.doi.startsWith("https://doi.org/"));
  for (const view of gltf.bufferViews)
    assert.ok(view.byteOffset + view.byteLength <= gltf.buffers[0].byteLength);
  const indices = gltf.accessors[gltf.meshes[0].primitives[0].indices];
  assert.equal(indices.count / 3, manifest.triangles);
  assert.ok(manifest.triangles > 100000);
});

test("internal anatomy shares the official body source frame and retains source meshes", () => {
  const body = JSON.parse(
    readFileSync("public/anatomy/body-manifest.json", "utf8"),
  );
  const manifest = JSON.parse(
    readFileSync("public/anatomy/nervous-manifest.json", "utf8"),
  );
  const raw = readFileSync("public/anatomy/nervous.glb");
  assert.equal(createHash("sha256").update(raw).digest("hex"), manifest.sha256);
  assert.equal(manifest.sourceGlbSha256, body.sourceGlbSha256);
  assert.equal(raw.length, manifest.bytes);
  const gltf = JSON.parse(
    raw.subarray(20, 20 + raw.readUInt32LE(12)).toString(),
  );
  assert.ok(gltf.nodes.some((n: { name: string }) => n.name === "Allen_brain"));
  assert.ok(
    gltf.nodes.some((n: { name: string }) => n.name === "VH_M_spinal_cord"),
  );
  assert.equal(gltf.meshes.length, manifest.meshes);
  for (const n of gltf.nodes)
    for (const child of n.children || []) assert.ok(gltf.nodes[child]);
  for (const v of gltf.bufferViews)
    assert.ok(v.byteOffset + v.byteLength <= gltf.buffers[0].byteLength);
  assert.equal(manifest.license, "CC BY 4.0");
});

test("intervention summaries keep original evidence and anatomical roles inspectable", () => {
  for (const f of families) {
    assert.ok(interventionNames[f.id]);
    assert.ok(interventionActions[f.id]);
    assert.ok(primaryRecords(f).length);
    for (const r of primaryRecords(f))
      assert.ok(records.some((record) => record.id === r.id));
  }
  assert.deepEqual(regionRoles(familyById("activa")!, "BODY:chest-wall"), [
    "Implant placement",
  ]);
  assert.deepEqual(regionRoles(familyById("activa")!, "UBERON:0001897"), [
    "Tissue contact",
    "Intended target",
  ]);
  assert.match(interventionActions.cooling, /Investigational/);
  assert.match(interventionActions.braingate, /Investigational/);
});

test("model annotations require accepted localized evidence and preserve typed relationships", () => {
  const annotations = interventionAnnotations(families.filter(f=>f.collection!=="catalogue"), "all");
  assert.equal(annotations.length, 9);
  assert.ok(!annotations.some((a) => a.familyId === "cochlear"));
  for (const a of annotations) {
    assert.ok(a.mapping.structureId);
    assert.ok(["Verified", "Supported"].includes(a.mapping.state));
    assert.ok(a.mapping.sourceUrl.startsWith("https://"));
    assert.ok(familyMappings(a.familyId).some((m) => m.id === a.mapping.id));
    assert.ok(humanRegionLocators[a.mapping.structureId!]);
  }
  const chest = interventionAnnotations(families, "BODY:chest-wall");
  assert.deepEqual(
    chest.map((a) => a.familyId),
    ["activa", "vns"],
  );
  assert.ok(chest.every((a) => a.mapping.type === "implantation_site"));
  assert.ok(
    interventionAnnotations(families, "UBERON:0001897").every(
      (a) => a.mapping.structureId === "UBERON:0001897",
    ),
  );
});
test("timeline-filtered collections do not acquire future or unlocalized model labels", () => {
  const early = searchFamilies("", "all", "all", "all", 1996).map(
    (r) => r.family,
  );
  assert.ok(
    !interventionAnnotations(early, "all").some((a) => a.familyId === "activa"),
  );
  assert.equal(
    interventionAnnotations([familyById("cochlear")!], "UBERON:0001844").length,
    0,
  );
});

test("source-context catalogue retains exact source spans and never asserts placement", () => {
 const catalogue=families.filter(f=>f.collection==='catalogue');
 assert.ok(catalogue.length>=600);
 for(const f of catalogue){
  assert.equal(f.regulatoryIds.length,1);assert.equal(f.studyIds.length,0);assert.equal(f.publicationIds.length,0);
  assert.deepEqual(f.modalities,['Unknown']);
  for(const m of familyMappings(f.id)){
   assert.equal(m.type,'indication_context');assert.equal(m.state,'Provisional');assert.equal(m.precision,'region');
   const e=m.evidence!,r=recordById(e.recordId)!;
   assert.equal(e.sourceSha,r.sourceSha);assert.equal(m.sourceUrl,r.url);
   const text=e.field==='statement'?r.statement!:r.title;
   assert.equal(text.slice(e.span[0],e.span[1]),e.quote);assert.equal(m.assertion,e.quote);
   assert.ok(e.quote.toLowerCase().includes(e.matchedText.toLowerCase()));
  }
 }
});
test("whole-body geometry remains in licensed source frame with valid buffers",()=>{
 const manifest=JSON.parse(readFileSync('public/anatomy/organs-manifest.json','utf8'));
 const raw=readFileSync('public/anatomy/organs.glb');
 assert.equal(createHash('sha256').update(raw).digest('hex'),manifest.sha256);
 assert.equal(raw.length,manifest.bytes);assert.equal(manifest.license,'CC BY 4.0');
 const body=JSON.parse(readFileSync('public/anatomy/body-manifest.json','utf8'));
 assert.equal(manifest.sourceGlbSha256,body.sourceGlbSha256);
 const gltf=JSON.parse(raw.subarray(20,20+raw.readUInt32LE(12)).toString());
 for(const v of gltf.bufferViews)assert.ok(v.byteOffset+v.byteLength<=gltf.buffers[0].byteLength);
 for(const n of gltf.nodes)for(const child of n.children||[])assert.ok(gltf.nodes[child]);
 assert.ok(gltf.meshes.length>=200);
 for(const name of ['VH_M_heart','VH_M_lungs','VH_M_liver','VH_M_patella_L'])assert.ok(gltf.nodes.some((n:{name:string})=>n.name===name));
});
test("unreviewed text context cannot answer a physical-interface query as established placement",()=>{
 const result=retrieve('Which authorized devices interface with the vagus nerve?');
 assert.ok(result.families.length);assert.ok(result.families.every(f=>f.collection!=='catalogue'));
 const f=families.find(f=>f.collection==='catalogue')!;
 const text=brief([f.id]);assert.match(text,/Provisional/);assert.match(text,/unreviewed/);assert.match(text,/not necessarily one distinct device family/);
 assert.ok(!humanRegionLocators['BODY:uterus']);assert.ok(!humanRegionLocators['BODY:vagina']);
});

test("portable brief downloads preserve citations, source roles and Unicode", () => {
 const url=briefDataUrl(['activa','exablate'],2026);
 assert.ok(url.startsWith('data:text/markdown;charset=utf-8,'));
 const text=decodeURIComponent(url.split(',').slice(1).join(','));
 assert.equal(text,brief(['activa','exablate'],2026));
 assert.match(text,/P960009/);assert.match(text,/Physical implantation/);
 assert.match(text,/BODY\/\/ATLAS/);
});


test("explained interventions are explicitly sourced and region-specific", async () => {
 const {interventionSummaries,hasExplanation,inCollection,productName}=await import('../lib/intervention-view');
 assert.equal(families.filter(hasExplanation).length,91);
 for(const [id,s] of Object.entries(interventionSummaries)){
  const f=familyById(id)!;assert.ok(f);assert.ok(f.regulatoryIds.includes(s.recordId));
  assert.ok(recordById(s.recordId));assert.ok(s.locator);assert.ok(s.purpose.length<500);
  assert.ok(inCollection(f,'explained'));assert.ok(productName(f).length<120);
  assert.deepEqual(familyMappings(id).map(m=>m.structureId).sort(),[...s.regions].sort());
 }
 const raw=families.find(f=>f.collection==='catalogue'&&!hasExplanation(f))!;
 assert.equal(inCollection(raw,'explained'),false);assert.equal(inCollection(raw,'catalogue'),true);
 assert.match(interventionActions[raw.id],/Purpose not established/);
 assert.notEqual(interventionActions[raw.id],raw.name);
});
test("Shiley tube relevance and briefs cannot turn Murphy eye into an ocular intervention",()=>{
 const id='source-fda-k250173';
 assert.equal(matchesRegion(familyById(id)!,'BODY:eye'),false);
 assert.equal(matchesRegion(familyById(id)!,'BODY:airway'),true);
 assert.match(interventionActions[id],/surgery/);assert.match(interventionActions[id],/airway/);
 assert.match(brief([id]),/K250173.pdf/);
 assert.match(brief([id]),/Anatomical relevance/);
});


test("whole-body explanations retain exact original evidence and broad anatomical coverage", async () => {
 const data=(await import('../lib/whole-body-explanations.json')).default;
 const review=JSON.parse(readFileSync('validation/whole-body-explanation-review.json','utf8'));
 const live=JSON.parse(readFileSync('validation/fda-originals-2026-10-22.json','utf8'));
 const check=JSON.parse(readFileSync('validation/whole-body-source-check.json','utf8'));
 assert.equal(createHash('sha256').update(readFileSync('validation/fda-originals-2026-10-22.json')).digest('hex'),check.responseSha256);
 assert.equal(check.originalsRequested,73);assert.deepEqual(check.issues,[]);
 assert.equal(Object.keys(data).length,75);
 assert.equal(new Set(Object.values(data).flatMap(s=>s.regions)).size,36);
 for(const [id,s] of Object.entries(data)) {
  const r=recordById(s.recordId)!;assert.ok(r,id);
  const proof=review.find((v:{familyId:string})=>v.familyId===id);assert.ok(proof);
  assert.equal(proof.sourceSha,r.sourceSha);assert.ok(proof.sourceText);
  assert.deepEqual(familyMappings(id).map(m=>m.structureId).sort(),[...s.regions].sort());
  assert.ok(s.purpose.length>40&&s.purpose.length<500);assert.ok(s.relevance.length>40);
  if(r.kind==='pma') {
   assert.equal(proof.sourceText,r.statement);
   const original=live.results.find((v:{pma_number:string;supplement_number:string})=>v.pma_number===r.application&&!v.supplement_number);
   assert.ok(original,r.id);assert.equal(original.ao_statement.trim(),r.statement!.trim());
   assert.equal(original.decision_date,r.decisionDate);
  } else {
   assert.equal(r.status,'510(k) clearance');assert.match(proof.sourceUrl,/accessdata.fda.gov\/cdrh_docs\/pdf26\/K260(007|721).pdf$/);
  }
 }
});
test("disease origin, co-procedures and access routes cannot become the explained treatment site",()=>{
 for(const [id,rejected] of [
  ['source-fda-p990065','BODY:colon'],
  ['source-fda-p100022','BODY:knee'],
  ['source-fda-p080030','BODY:lens'],
  ['source-fda-p060023','UBERON:0002240'],
  ['source-fda-p950035','UBERON:0002240'],
  ['source-fda-p100018','BODY:carotid'],
  ['source-fda-p020004','BODY:lower-limb-vessels'],
 ]) assert.equal(matchesRegion(familyById(id)!,rejected),false,id);
 assert.ok(!humanRegionLocators['BODY:uterus']);assert.ok(!humanRegionLocators['BODY:vagina']);
});

test("body contour is a bounded 3D derivative without photograph payloads", async () => {
 const raw=readFileSync('public/anatomy/contour.glb');
 assert.throws(()=>readFileSync('public/anatomy/owner.glb'),{code:'ENOENT'});
 assert.throws(()=>readFileSync('public/anatomy/owner-manifest.json'),{code:'ENOENT'});
 const manifest=JSON.parse(readFileSync('public/anatomy/contour-manifest.json','utf8'));
 assert.equal(raw.readUInt32LE(0),0x46546c67);assert.equal(raw.readUInt32LE(8),raw.length);
 assert.equal(createHash('sha256').update(raw).digest('hex'),manifest.sha256);
 assert.equal(raw.length,manifest.bytes);assert.ok(raw.length<6_000_000);
 assert.equal(manifest.personalAnatomicalScan,false);assert.equal(manifest.photographsIncluded,false);
 assert.equal(manifest.texturesIncluded,false);assert.match(manifest.license,/CC BY 4.0/);
 assert.equal(createHash('sha256').update(readFileSync('public/anatomy/body.glb')).digest('hex'),manifest.sourceSha256);
 const gltf=JSON.parse(raw.subarray(20,20+raw.readUInt32LE(12)).toString());
 for(const field of ['images','textures','cameras','animations'])assert.ok(!gltf[field]?.length,field);
 assert.equal(gltf.buffers.length,1);assert.ok(!gltf.buffers[0].uri);
 assert.ok(gltf.nodes.every((n:{extras?:unknown})=>!n.extras));
 assert.deepEqual(gltf.nodes.map((n:{name:string})=>n.name).sort(),['Body_Contour']);
 assert.equal(gltf.meshes.reduce((sum:number,m:{primitives:{indices:number}[]})=>sum+m.primitives.reduce((n,p)=>n+gltf.accessors[p.indices].count/3,0),0),manifest.triangles);
 const {GLTFLoader}=await import('three/examples/jsm/loaders/GLTFLoader.js');
 const {Box3,Mesh}=await import('three');
 const parse=(bytes:Buffer)=>new GLTFLoader().parseAsync(new Uint8Array(bytes).buffer,'');
 const scene=(await parse(raw)).scene;
 const reference=(await parse(readFileSync('public/anatomy/body.glb'))).scene;
 const positions=(root:typeof scene)=>{
  const points:number[][]=[];
  root.traverse(o=>{if(o instanceof Mesh){const p=o.geometry.getAttribute('position');for(let i=0;i<p.count;i++)points.push([p.getX(i),p.getY(i),p.getZ(i)]);}});
  return points;
 };
 const original=positions(reference),contour=positions(scene);
 const unchanged=(points:number[][])=>[...new Set(points.filter(p=>p[1]>=.67||p[1]<=-.18||(p[1]<=.02&&Math.abs(p[0])>=.06)).map(p=>p.map(v=>v.toFixed(5)).join(',')))].sort();
 assert.deepEqual(unchanged(contour),unchanged(original),'Neutral head, legs and unaffected pelvis retain the source coordinates');
 const width=(points:number[][],low:number,high:number,limit:number)=>Math.max(...points.filter(p=>p[1]>low&&p[1]<high&&Math.abs(p[0])<limit).map(p=>Math.abs(p[0])));
 assert.ok(width(contour,.21,.25,.20)<width(original,.21,.25,.20)*.95,'Waist is tapered');
 assert.ok(width(contour,.49,.54,.30)>width(original,.49,.54,.30),'Shoulder contour is broader');
 assert.ok(gltf.meshes.every((m:{primitives:{attributes:Record<string,number>}[]})=>m.primitives.every(p=>!('COLOR_0' in p.attributes))));
 assert.equal(manifest.facialAppearanceIncluded,false);assert.equal(manifest.contourOnly,true);
 const tip=(points:number[][])=>Math.min(...points.filter(p=>Math.abs(p[0])<.025&&p[2]>.105&&p[1]<-.05).map(p=>p[1]));
 assert.ok(tip(contour)<tip(original)-.015,'External pelvic contour is elongated locally');
 const frontRadius=(distance:number)=>{
  const ring=contour.filter(p=>Math.abs(p[1]-(-.020-distance))<.000001&&Math.abs(p[0]-.004)<.000001);
  assert.ok(ring.length>=1,'Modeled ring exists');
  return Math.max(...ring.map(p=>p[2]))-(.102+.008*Math.min(1,distance/.098));
 };
 for(const distance of [.040,.050,.060])assert.ok(Math.abs(frontRadius(distance)-.0185)<.00001,'Shaft has a consistent circular profile');
 assert.ok(Math.abs(frontRadius(.098)/frontRadius(.050)-1.2834)<.001,'Rounded glans remains broader than shaft');
 assert.ok(contour.some(p=>Math.abs(p[0]-.004)<.000001&&Math.abs(p[1]+.148)<.000001&&Math.abs(p[2]-.110)<.000001),'Rounded distal pole exists');
 assert.equal(manifest.glansToShaftRadiusRatio,1.2834);assert.equal(manifest.subjectIdentified,false);assert.doesNotMatch(JSON.stringify(manifest),/Arjan|owner|likeness/i);
 const box=new Box3().setFromObject(scene);assert.ok(box.min.y<-.91&&box.max.y>.90);
});
