import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";

const url = `${siteUrl}/work/vector-ekg-reasonos`;

export const metadata: Metadata = {
  twitter: {
    card: "summary_large_image",
    title: "Vector EKG and ReasonOS | Arjan Singh Puniani",
    description:
      "An inspectable educational reasoning architecture applied to electrocardiography, with explicit evidence, contradictions, provenance, and revisions.",
    images: ["/og.png"],
  },
};

export default function VectorEkgReasonOSLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumbs`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Work", item: `${siteUrl}/work` },
      { "@type": "ListItem", position: 3, name: "Vector EKG and ReasonOS", item: url },
    ],
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />{children}</>;
}
