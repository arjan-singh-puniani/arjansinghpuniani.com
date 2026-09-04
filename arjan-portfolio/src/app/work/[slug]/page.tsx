import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SeizeFreezeCaseStudy } from "@/components/SeizeFreezeCaseStudy";
import { projects, getProject } from "@/content/projects";
import { statusLabels } from "@/content/statuses";

export function generateStaticParams() { return projects.map((project) => ({ slug: project.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.shortDescription,
    alternates: { canonical: `/work/${project.slug}` },
    ...(project.slug === "seizefreeze" ? { openGraph: { title: "SeizeFreeze | Closed-loop cortical-cooling concept", description: project.shortDescription, images: [{ url: "/images/neurotechnology/seizefreeze-homepage-hero-v2.webp", width: 1536, height: 1024, alt: "SeizeFreeze engineering concept" }] } } : {}),
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  if (project.slug === "seizefreeze") return <SeizeFreezeCaseStudy />;
  const related = projects.filter((item) => item.slug !== project.slug && item.category.some((category) => project.category.includes(category))).slice(0, 2);

  return <><header className="page-hero"><div className="shell"><p className="eyebrow">{project.category.join(" · ")}</p><h1>{project.title}</h1><p>{project.shortDescription}</p></div></header><section className="section"><div className="shell case-grid"><div className="case-main">
    {project.media?.[0] && <figure className="case-hero"><Image src={project.media[0].src} alt={project.media[0].alt} width={1400} height={900} priority /><figcaption>{project.media[0].caption}</figcaption></figure>}
    <section><h2>Problem</h2><p>{project.problem}</p></section>
    <section><h2>Approach</h2><ul>{project.approach.map((item) => <li key={item}>{item}</li>)}</ul></section>
    <section><h2>Results</h2><ul>{project.results.map((item) => <li key={item}>{item}</li>)}</ul></section>
    {project.limitations && <section><h2>Limitations</h2><div className="notice"><ul>{project.limitations.map((item) => <li key={item}>{item}</li>)}</ul></div></section>}
    <section><h2>Evidence</h2>{project.evidence.map((evidence) => <p key={evidence.label}><strong>{evidence.label}:</strong> {evidence.sourceFile ?? "Source confirmation pending"} · {evidence.verified ? "verified for this wording" : "not yet verified for expanded public claims"}</p>)}</section>
    {project.media && project.media.length > 1 && <section><h2>Gallery</h2><div className="media-grid">{project.media.slice(1).map((media) => <figure key={media.src}><Image src={media.src} alt={media.alt} width={1000} height={700} /><figcaption>{media.caption}</figcaption></figure>)}</div></section>}
    {related.length > 0 && <section><h2>Related work</h2>{related.map((item) => <p key={item.slug}><Link className="text-link" href={`/work/${item.slug}`}>{item.title} ↗</Link></p>)}</section>}
  </div><aside className="case-aside"><span className="status">{statusLabels[project.status]}</span><dl><dt>Role</dt><dd>{project.role}</dd><dt>Dates</dt><dd>{project.yearStart}{project.yearEnd && `–${project.yearEnd}`}</dd><dt>Categories</dt><dd>{project.category.join(", ")}</dd></dl>{project.links?.map((link) => <p key={link.href}><a className="text-link" href={link.href}>{link.label} ↗</a></p>)}</aside></div></section></>;
}
