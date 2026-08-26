import Link from "next/link";
import type { Project } from "@/types/content";
export function ProjectCard({ project }: { project: Project }) {
  return <article className="project-card"><div className="project-top"><span className="eyebrow">{project.category[0]}</span><span className="status">{project.status}</span></div><h3><Link href={`/work/${project.slug}`}>{project.title}</Link></h3><p>{project.shortDescription}</p><dl><div><dt>Role</dt><dd>{project.role}</dd></div><div><dt>Evidence</dt><dd>{project.results[0]}</dd></div></dl><Link className="text-link" href={`/work/${project.slug}`}>Read case study <span aria-hidden="true">↗</span></Link></article>;
}
