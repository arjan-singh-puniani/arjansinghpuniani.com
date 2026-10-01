import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";

const url = `${siteUrl}/work/motorsport-neurotrauma-toolkit`;

export const metadata: Metadata = {
  openGraph: {
    type: "article",
    url,
    title: "Motorsport Neurotrauma Toolkit | Arjan Singh Puniani",
    description:
      "A Version 0.2 pilot intake card and disposition algorithm drafted by Arjan Singh Puniani for motorsport medical handoff. Not clinically validated.",
    images: [{ url: "/og.png", alt: "Motorsport Neurotrauma Toolkit — Arjan Singh Puniani" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Motorsport Neurotrauma Toolkit | Arjan Singh Puniani",
    description:
      "A Version 0.2 pilot intake card and disposition algorithm drafted by Arjan Singh Puniani for motorsport medical handoff. Not clinically validated.",
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
        "A Version 0.2 pilot intake card and disposition algorithm drafted by Arjan Singh Puniani for motorsport medical handoff. Not clinically validated.",
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
