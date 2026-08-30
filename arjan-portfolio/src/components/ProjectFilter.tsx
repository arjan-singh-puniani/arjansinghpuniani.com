"use client";
import { useState } from "react";
import { categories, projects } from "@/content/projects";
import { ProjectCard } from "./ProjectCard";
const projectOrder = ["vector-ekg-reasonos", "seizefreeze", "bci-calibration"];
export function ProjectFilter() {
  const [active, setActive] = useState<(typeof categories)[number]>("All");
  const filtered = active === "All" ? projects : projects.filter((p) => p.category.includes(active));
  const visible = [...filtered].sort((a, b) => {
    const aIndex = projectOrder.indexOf(a.slug);
    const bIndex = projectOrder.indexOf(b.slug);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
  return <><div className="filters" role="group" aria-label="Filter projects">{categories.map((category) => <button key={category} type="button" aria-pressed={active === category} onClick={() => setActive(category)}>{category}</button>)}</div><p className="results-count" aria-live="polite">{visible.length} project{visible.length === 1 ? "" : "s"}</p><div className="project-grid">{visible.map((project) => <ProjectCard key={project.slug} project={project} />)}</div></>;
}
