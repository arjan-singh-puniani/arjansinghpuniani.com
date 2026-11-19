import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";

const url = `${siteUrl}/work/motorsport-neurotrauma-toolkit`;

export const metadata: Metadata = {
  openGraph: {
    type: "article",
    url,
    title: "From Impact to Informed Care | Arjan Singh Puniani",
    description:
      "An independent, F1-focused educational overview of crash information, protection systems and neurological handoff. Designed and built by Arjan Singh Puniani. Not clinically validated.",
    images: [{ url: "/work/motorsport-neurotrauma-toolkit/opengraph-image", alt: "From impact to informed care — Arjan Singh Puniani" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "From Impact to Informed Care | Arjan Singh Puniani",
    description:
      "An independent, F1-focused educational overview of crash information, protection systems and neurological handoff. Designed and built by Arjan Singh Puniani. Not clinically validated.",
    images: ["/work/motorsport-neurotrauma-toolkit/opengraph-image"],
  },
};

export default function MotorsportNeurotraumaLayout({ children }: { children: React.ReactNode }) {
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "@id": `${url}#work`,
      name: "Motorsport Neurotrauma Toolkit",
      description:
        "An independent, F1-focused educational overview of crash information, protection systems and neurological handoff. Designed and built by Arjan Singh Puniani. Not clinically validated.",
      url,
      author: { "@type": "Person", "@id": `${siteUrl}/#arjan-singh-puniani`, name: "Arjan Singh Puniani" },
      isAccessibleForFree: true,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumbs`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Work", item: `${siteUrl}/work` },
        { "@type": "ListItem", position: 3, name: "Motorsport Neurotrauma Toolkit", item: url },
      ],
    },
  ];
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />{children}</>;
}
