// Portfolio Hiring-Clarity Redesign v2
"use client";

import { useState } from "react";
import { categories, projects } from "@/content/projects";
import { ProjectCard } from "./ProjectCard";

const flagshipSlugs = [
  "vector-ekg-reasonos",
  "seizefreeze",
  "bci-calibration",
  "rigetti-quantum-operations",
] as const;

export function CuratedProjectFilter() {
  const [active, setActive] = useState<(typeof categories)[number]>("All");

  const filtered =
    active === "All"
      ? projects
      : projects.filter((project) => project.category.includes(active));

  const flagship = flagshipSlugs.flatMap((slug) => {
    const project = filtered.find((item) => item.slug === slug);
    return project ? [project] : [];
  });

  const flagshipSet = new Set<string>(flagshipSlugs);
  const additional = filtered.filter((project) => !flagshipSet.has(project.slug));

  return (
    <>
      <div className="filters" role="group" aria-label="Filter projects">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            aria-pressed={active === category}
            onClick={() => setActive(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {active === "All" ? (
        <>
          <section className="work-tier" aria-labelledby="flagship-work-heading">
            <div className="work-tier-head">
              <div>
                <p className="eyebrow">Flagship systems</p>
                <h2 id="flagship-work-heading">Start here.</h2>
              </div>
              <p>
                Four projects that best show research depth, technical ownership,
                scientific communication, and systems thinking.
              </p>
            </div>
            <div className="project-grid">
              {flagship.map((project) => (
                <ProjectCard key={project.slug} project={project} />
              ))}
            </div>
          </section>

          <section
            className="work-tier work-tier-secondary"
            aria-labelledby="additional-work-heading"
          >
            <div className="work-tier-head">
              <div>
                <p className="eyebrow">More work</p>
                <h2 id="additional-work-heading">Other systems and field studies.</h2>
              </div>
              <p>
                Clinical research, motorsport systems, public-health concepts, and
                exploratory work that rounds out the record.
              </p>
            </div>
            <div className="project-grid">
              {additional.map((project) => (
                <ProjectCard key={project.slug} project={project} />
              ))}
            </div>
          </section>
        </>
      ) : (
        <>
          <p className="results-count" aria-live="polite">
            {filtered.length} project{filtered.length === 1 ? "" : "s"}
          </p>
          <div className="project-grid">
            {filtered.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
