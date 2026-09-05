import type { Metadata } from "next";
import { ProjectFilter } from "@/components/ProjectFilter";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Engineering & Research Projects",
  description:
    "Selected projects by Arjan Singh Puniani across neural engineering, brain-computer interfaces, neurotechnology, clinical research, medical education, motorsport safety, and software.",
  alternates: { canonical: "/work" },
  openGraph: {
    type: "website",
    url: `${siteUrl}/work`,
    title: "Engineering & Research Projects | Arjan Singh Puniani",
    description:
      "Neural engineering, brain-computer interfaces, neurotechnology, clinical research, medical education, motorsport safety, and software.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Engineering & Research Projects | Arjan Singh Puniani",
    description:
      "Neural engineering, brain-computer interfaces, neurotechnology, clinical research, medical education, motorsport safety, and software.",
    images: ["/og.png"],
  },
};

export default function Work() {
  return <>
    <header className="page-hero"><div className="shell"><p className="eyebrow">Project index</p><h1>Work</h1><p>Filter by field. Open any project for its evidence, limitations, and current status.</p></div></header>
    <section className="section"><div className="shell"><ProjectFilter/></div></section>
  </>;
}
