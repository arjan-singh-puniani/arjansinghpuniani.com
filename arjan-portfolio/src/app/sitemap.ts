import type { MetadataRoute } from "next";
import { projects } from "@/content/projects";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/about",
    "/cv",
    "/work",
    "/research",
    "/notes",
    "/contact",
    "/playground",
    "/playground/vector-tennis",
  ];

  return [
    ...routes.map((path) => ({
      url: `${siteUrl}${path}`,
    })),
    ...projects.map((project) => ({
      url: `${siteUrl}/work/${project.slug}`,
    })),
  ];
}
