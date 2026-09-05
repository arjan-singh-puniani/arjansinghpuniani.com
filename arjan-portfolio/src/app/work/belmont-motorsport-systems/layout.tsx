import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";

const url = `${siteUrl}/work/belmont-motorsport-systems`;

export const metadata: Metadata = {
  openGraph: {
    type: "article",
    url,
    title: "Belmont Motorsport Systems | Arjan Singh Puniani",
    description:
      "An academic systems study of motorsport risk, mitigation, emergency operations, medical coordination, and recovery under race-day constraints.",
    images: [{ url: "/og.png", alt: "Belmont Motorsport Systems — Arjan Singh Puniani" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Belmont Motorsport Systems | Arjan Singh Puniani",
    description:
      "An academic systems study of motorsport risk, mitigation, emergency operations, medical coordination, and recovery under race-day constraints.",
    images: ["/og.png"],
  },
};

export default function BelmontMotorsportLayout({ children }: { children: React.ReactNode }) {
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "@id": `${url}#work`,
      name: "Belmont Motorsport Systems",
      description:
        "An academic systems study of motorsport risk, mitigation, emergency operations, medical coordination, and recovery under race-day constraints.",
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
        { "@type": "ListItem", position: 3, name: "Belmont Motorsport Systems", item: url },
      ],
    },
  ];
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />{children}</>;
}
