"use client";
import { useState } from "react";
import { Layers3 } from "lucide-react";
import {
  families,
  familyMappings,
  matchesRegion,
  records,
  timeline,
} from "@/lib/atlas";
const regions = [
  ["UBERON:0000956", "Cerebral cortex"],
  ["UBERON:0001897", "Thalamus"],
  ["UBERON:0001906", "Subthalamic nucleus"],
  ["UBERON:0001759", "Vagus nerve"],
  ["UBERON:0002240", "Spinal cord"],
];
export function regionalMetric(
  region: string,
  layer: string,
  year: number,
): string {
  const fs = families.filter((f) => f.collection !== "catalogue" && matchesRegion(f, region));
  const rs = new Set(fs.flatMap((f) => f.regulatoryIds));
  if (layer === "regulatory") return String(rs.size);
  if (layer === "families") return String(fs.length);
  if (layer === "studies")
    return String(new Set(fs.flatMap((f) => f.studyIds)).size);
  if (layer === "publications")
    return String(new Set(fs.flatMap((f) => f.publicationIds)).size);
  if (layer === "funding") return "Unmapped";
  if (layer === "activity")
    return String(
      timeline(fs.map((f) => f.id)).filter(
        (e) => e.date.slice(0, 4) === String(year),
      ).length,
    );
  const ms = fs
    .flatMap((f) => familyMappings(f.id))
    .filter((m) => m.structureId === region);
  return `${ms.filter((m) => m.state === "Verified").length} V / ${ms.filter((m) => m.state === "Supported").length} S`;
}
export default function Topography({
  year,
  selectRegion,
}: {
  year: number;
  selectRegion: (id: string) => void;
}) {
  const [layer, setLayer] = useState("families");
  const labels: Record<string, string> = {
    regulatory: "Regulatory application records",
    families: "Distinct curated entries",
    studies: "Linked study registrations",
    publications: "Related publication metadata",
    funding: "Research funding",
    activity: `Documented events in ${year}`,
    confidence: "Assertion evidence states",
  };
  return (
    <section className="topography" aria-label="Anatomical topography">
      <div className="topography-header">
        <span className="eyebrow">
          <Layers3 size={12} />
          REGIONAL TOPOGRAPHY
        </span>
        <select
          aria-label="Topography layer"
          value={layer}
          onChange={(e) => setLayer(e.target.value)}
        >
          {Object.entries(labels).map(([id, label]) => (
            <option value={id} key={id}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="topography-regions">
        {regions.map(([id, label]) => (
          <button key={id} onClick={() => selectRegion(id)}>
            <span>{label}</span>
            <strong>{regionalMetric(id, layer, year)}</strong>
          </button>
        ))}
      </div>
      <p className="microcopy">
        {layer === "funding"
          ? `${records.filter((r) => r.kind === "grant").length} grants are indexed by query topic; no regional grant relationship is asserted.`
          : layer === "confidence"
            ? "V = verified assertion; S = supported assertion. These are evidence categories, not measured anatomical accuracy."
            : layer === "publications"
              ? "Counts of curated topical links; they do not count studies proving a regional effect."
              : layer === "regulatory"
                ? "Counts of linked application records, not implanted devices or patients."
                : "Coarse curated associations only. Categories can overlap; coverage is incomplete."}
      </p>
    </section>
  );
}
