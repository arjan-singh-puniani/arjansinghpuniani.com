import type { Metadata } from "next";
import Link from "next/link";
import { CuratedProjectFilter } from "@/components/CuratedProjectFilter";
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
    <header className="page-hero"><div className="shell"><p className="eyebrow">Project index</p><h1>Work</h1><p>Experimental BCI interfaces, educational software, theoretical reviews, and proposed medical devices. The cards list my role, each project’s status, and its output.</p><p><Link className="text-link" href="/notes">For shorter notes on design choices and lessons, read Notes →</Link></p></div></header>
    <section className="section"><div className="shell"><CuratedProjectFilter/></div></section>
  </>;
}
