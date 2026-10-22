"use client";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import type {
  InterventionAnnotation,
  LabelProjection,
} from "@/lib/annotations";

export default function InterventionLabels({
  entries,
  projection,
  selected,
  onSelect,
  reserveCard = false,
}: {
  entries: InterventionAnnotation[];
  projection: LabelProjection;
  selected: string | null;
  onSelect: (id: string) => void;
  reserveCard?: boolean;
}) {
  const size = { width: projection.width, height: projection.height };
  const [page, setPage] = useState(0);
  const regions = projection.regions.join(",");
  const available = useMemo(
    () =>
      entries.filter(
        (e) =>
          e.mapping.structureId &&
          projection.regions.includes(e.mapping.structureId),
      ),
    [entries, regions],
  );
  const points = projection.points;
  const top = 60,
    bottom = reserveCard ? 190 : 35,
    gap = 49;
  const rows = Math.max(1, Math.floor((size.height - top - bottom) / gap));
  const capacity = Math.min(available.length, rows * 2) || 1;
  const pages = Math.ceil(available.length / capacity);
  const pageIndex = Math.min(page, Math.max(0, pages - 1));
  const shown = useMemo(
    () => available.slice(pageIndex * capacity, (pageIndex + 1) * capacity),
    [available, pageIndex, capacity],
  );
  const signature = available.map((e) => e.familyId).join(",");
  useEffect(() => setPage(0), [signature]);
  useEffect(() => {
    const i = available.findIndex((e) => e.familyId === selected);
    if (i >= 0) setPage(Math.floor(i / capacity));
  }, [selected, available, capacity]);
  if (!available.length) return null;
  const width = Math.min(205, Math.max(133, size.width * 0.28));
  return (
    <div
      className="intervention-annotations"
      role="group"
      aria-label="Interventions on anatomy"
      style={{ width: size.width, height: size.height }}
    >
      <svg
        className="intervention-leaders"
        width={size.width}
        height={size.height}
        aria-hidden="true"
      >
        {shown.map((e, i) => {
          const point = points[e.mapping.structureId!];
          if (!point) return null;
          const right = i % 2 === 1,
            y = top + Math.floor(i / 2) * gap + 18,
            x = right ? size.width - width - 9 : width + 9;
          return (
            <g
              key={e.familyId}
              className={selected === e.familyId ? "leader-selected" : ""}
            >
              <path
                d={`M ${point[0]} ${point[1]} L ${(point[0] + x) / 2} ${y} L ${x} ${y}`}
              />
              <circle cx={point[0]} cy={point[1]} r="2.5" />
            </g>
          );
        })}
      </svg>
      {shown.map((entry, i) => (
        <div
          key={entry.familyId}
          className={`intervention-annotation ${selected === entry.familyId ? "annotation-selected" : ""}`}
          style={{
            top: top + Math.floor(i / 2) * gap,
            left: i % 2 === 0 ? 9 : size.width - width - 9,
            width,
          }}
          data-family={entry.familyId}
        >
          <button
            aria-label={`Select ${entry.name} on anatomy`}
            aria-pressed={selected === entry.familyId}
            title={`${entry.name} — ${entry.role}: ${entry.regionName}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onSelect(entry.familyId)}
          >
            <strong>{entry.title}</strong>
            <span>
              {entry.role} · {entry.regionName}
            </span>
          </button>
          <a
            href={entry.mapping.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Original source for ${entry.name}`}
            title="Original source"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <ArrowUpRight size={13} />
          </a>
        </div>
      ))}
      {pages > 1 && (
        <div className="annotation-pages">
          <button
            aria-label="Previous intervention labels"
            disabled={pageIndex === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft size={13} />
          </button>
          <span>
            {pageIndex * capacity + 1}–
            {Math.min(available.length, (pageIndex + 1) * capacity)} /{" "}
            {available.length}
          </span>
          <button
            aria-label="Next intervention labels"
            disabled={pageIndex === pages - 1}
            onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
