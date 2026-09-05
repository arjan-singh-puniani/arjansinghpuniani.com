import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";

const url = `${siteUrl}/work/motorsport-neurotrauma-toolkit`;

export const metadata: Metadata = {
  openGraph: {
    type: "article",
    url,
    title: "Motorsport Neurotrauma Toolkit | Arjan Singh Puniani",
    description:
      "An exploratory documentation and escalation framework connecting crash mechanics with acute neurologic assessment and structured medical handoff.",
    images: [{ url: "/og.png", alt: "Motorsport Neurotrauma Toolkit — Arjan Singh Puniani" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Motorsport Neurotrauma Toolkit | Arjan Singh Puniani",
    description:
      "An exploratory documentation and escalation framework connecting crash mechanics with acute neurologic assessment and structured medical handoff.",
    images: ["/og.png"],
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
        "An exploratory documentation and escalation framework connecting crash mechanics with acute neurologic assessment and structured medical handoff.",
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
