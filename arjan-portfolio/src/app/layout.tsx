import type { Metadata } from "next";
import "./globals.css";
import "./reasonos.css";
import "./systems.css";
import "./seizefreeze.css";
import "./rigetti.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SiteAnalytics } from "@/components/SiteAnalytics";
import { siteUrl } from "@/lib/site";
import { links } from "@/content/links";

const personId = `${siteUrl}/#arjan-singh-puniani`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Arjan Singh Puniani",
  title: {
    default: "Arjan Singh Puniani | Neural Engineer Pursuing Medicine",
    template: "%s | Arjan Singh Puniani",
  },
  description:
    "Official portfolio of Arjan Singh Puniani (Arjan Puniani), a neural engineer pursuing medicine, with work in neurotechnology, clinical reasoning, rehabilitation, and motorsport safety.",
  authors: [{ name: "Arjan Singh Puniani", url: siteUrl }],
  creator: "Arjan Singh Puniani",
  publisher: "Arjan Singh Puniani",
  category: "Neural engineering",
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Arjan Singh Puniani | Neural Engineer Pursuing Medicine",
    description:
      "Official portfolio of Arjan Singh Puniani across neural engineering, neurotechnology, rehabilitation, clinical reasoning, and motorsport safety.",
    siteName: "Arjan Singh Puniani",
    images: [
      {
        url: "/images/hero/arj_kuzneski-hero.png",
        width: 1200,
        height: 1500,
        alt: "Arjan Singh Puniani holding the Kuzneski Innovation Cup",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Arjan Singh Puniani | Neural Engineer Pursuing Medicine",
    description:
      "Official portfolio of Arjan Singh Puniani across neural engineering, neurotechnology, rehabilitation, clinical reasoning, and motorsport safety.",
    images: ["/images/hero/arj_kuzneski-hero.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  manifest: "/manifest.webmanifest",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: {
      "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ?? "",
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": personId,
      name: "Arjan Singh Puniani",
      givenName: "Arjan",
      additionalName: "Singh",
      familyName: "Puniani",
      alternateName: ["Arjan Puniani", "Arjan Singh Puniani"],
      url: siteUrl,
      image: `${siteUrl}/images/hero/arj_kuzneski-hero.png`,
      jobTitle: "Neural engineer",
      description:
        "Arjan Singh Puniani is a neural engineer pursuing medicine and working across rehabilitation, clinical reasoning, neurotechnology, and motorsport safety.",
      sameAs: [links.github, links.physicsWorldAuthor],
      alumniOf: [
        { "@type": "CollegeOrUniversity", name: "University of Pittsburgh" },
        { "@type": "CollegeOrUniversity", name: "University of California, Berkeley" },
      ],
      knowsAbout: [
        "Neural engineering",
        "Brain-computer interfaces",
        "Clinical research",
        "Medical education",
        "Neurotechnology",
        "Motorsport safety",
        "Active inference",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "Arjan Singh Puniani",
      alternateName: "Arjan Puniani",
      url: siteUrl,
      inLanguage: "en-US",
      author: { "@id": personId },
      publisher: { "@id": personId },
    },
  ];

  return (
    <html lang="en">
      <body>
        <a href="#main" className="sr-only focus:not-sr-only">
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <SiteAnalytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      </body>
    </html>
  );
}
