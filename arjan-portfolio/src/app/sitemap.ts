import type { MetadataRoute } from "next";
import { projects } from "@/content/projects";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "", priority: 1 },
    { path: "/about", priority: 0.95 },
    { path: "/cv", priority: 0.9 },
    { path: "/work", priority: 0.9 },
    { path: "/research", priority: 0.85 },
    { path: "/notes", priority: 0.65 },
    { path: "/contact", priority: 0.65 },
    { path: "/playground", priority: 0.5 },
    { path: "/playground/vector-tennis", priority: 0.45 },
    { path: "/privacy", priority: 0.2 },
  ];

  return [
    ...routes.map(({ path, priority }) => ({
      url: `${siteUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: path === "" || path === "/about" ? ("weekly" as const) : ("monthly" as const),
      priority,
    })),
    ...projects.map((project) => ({
      url: `${siteUrl}/work/${project.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: project.slug === "vector-ekg-reasonos" ? 0.85 : 0.7,
    })),
  ];
}
