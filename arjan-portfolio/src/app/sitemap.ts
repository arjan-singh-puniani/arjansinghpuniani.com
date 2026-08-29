import type { MetadataRoute } from "next";
import { projects } from "@/content/projects";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/work", "/motorsport", "/research", "/about", "/cv", "/contact"];
  return [
    ...routes.map((route) => ({
      url: `${siteUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: route === "" ? 1 : route === "/motorsport" ? 0.85 : 0.7,
    })),
    ...projects.map((project) => ({
      url: `${siteUrl}/work/${project.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: project.category.includes("Motorsport Medicine") ? 0.75 : 0.6,
    })),
  ];
}
