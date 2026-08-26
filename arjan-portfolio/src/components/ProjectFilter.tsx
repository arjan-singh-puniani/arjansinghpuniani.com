"use client";
import { useState } from "react";
import { categories, projects } from "@/content/projects";
import { ProjectCard } from "./ProjectCard";
export function ProjectFilter() {
  const [active, setActive] = useState<(typeof categories)[number]>("All");
  const visible = active === "All" ? projects : projects.filter((p) => p.category.includes(active));
  return <><div className="filters" role="group" aria-label="Filter projects">{categories.map((category) => <button key={category} type="button" aria-pressed={active === category} onClick={() => setActive(category)}>{category}</button>)}</div><p className="results-count" aria-live="polite">{visible.length} project{visible.length === 1 ? "" : "s"}</p><div className="project-grid">{visible.map((project) => <ProjectCard key={project.slug} project={project} />)}</div></>;
}
