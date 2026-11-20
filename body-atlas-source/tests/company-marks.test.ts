import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { companyMark } from "../lib/company-marks";
import marks from "../lib/company-marks.json";
import { families } from "../lib/atlas";
import { primaryRecords } from "../lib/intervention-view";

test("only reviewed company identities receive a mark", () => {
  assert.equal(companyMark("MEDTRONIC INC")?.id, "medtronic");
  assert.equal(companyMark("  Boston Scientific Corp. ")?.id, "boston-scientific");
  assert.equal(companyMark("Medtronic Surgical Associates"), undefined);
  assert.equal(companyMark("Medtronic Minimed, Inc.")?.id, "minimed");
  assert.equal(companyMark("NeuroPace, Inc.")?.id, "neuropace");
  assert.equal(companyMark("Neuronetics")?.id, "neuronetics");
  assert.equal(companyMark("Shenzhen TPH Technology Co., Ltd.")?.id, "tph");
  assert.equal(companyMark("CMT Health PTE., Ltd.")?.id, "cmt-health");
  assert.equal(companyMark("Shenzhen Root Innovation Technology Co., Ltd.")?.id, "momcozy");
  assert.equal(companyMark("Shenzhen Root Innovation Technology Co., Ltd.")?.brand, "Momcozy");
  assert.equal(companyMark("Bard Peripheral Vascular, Inc.")?.id, "bard-peripheral");
  assert.equal(companyMark("Ophtecs Corporation"), undefined);
  assert.equal(companyMark("Nuvectra Corporation")?.id, "nuvectra");
  assert.equal(companyMark("Advanced Bionics")?.id, "advanced-bionics");
  assert.equal(companyMark("Biotronik Nro, Inc.")?.id, "biotronik");
  assert.equal(companyMark("Northwestern University"), undefined);
  assert.equal(companyMark("Ventana Medical Systems, Inc.")?.id, "ventana");
});

test("every intervention has a source identity for its mark or text label", () => {
  for (const family of families) {
    assert.ok(primaryRecords(family).some(record =>
      family.regulatoryIds.length ? record.applicant?.trim() : record.sponsor?.trim(),
    ), family.id);
  }
});

test("the static company marks are sourced vector art without external content", () => {
  const directory = "public/company-marks";
  assert.deepEqual(readdirSync(directory).sort(), marks.map(mark => `${mark.id}.svg`).sort());
  for (const mark of marks) {
    assert.ok(["http:", "https:"].includes(new URL(mark.source).protocol));
    if ("reference" in mark && mark.reference) assert.equal(new URL(mark.reference).protocol, "https:");
    for (const name of mark.names) assert.equal(companyMark(name)?.id, mark.id);
    const svg = readFileSync(`${directory}/${mark.id}.svg`, "utf8");
    assert.match(svg, /<svg\b[^>]+\bviewBox="/);
    assert.match(svg, /<(?:path|circle|polygon|rect)\b/);
    assert.doesNotMatch(svg, /<(?:image|script|foreignObject|style|iframe|text)\b|\s(?:href|on\w+)\s*=|url\((?!#)|<!DOCTYPE/i);
  }
});
