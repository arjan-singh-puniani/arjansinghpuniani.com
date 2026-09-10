import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { profile } from "@/content/profile";
import { links } from "@/content/links";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Arjan Singh Puniani about research, clinical translation, teaching, neurotechnology, motorsport medicine, or media.",
  alternates: { canonical: "/contact" },
  openGraph: {
    type: "website",
    url: `${siteUrl}/contact`,
    title: "Contact Arjan Singh Puniani",
    description:
      "Contact Arjan Singh Puniani about research, clinical translation, teaching, neurotechnology, motorsport medicine, or media.",
    images: [{ url: "/og.png", alt: "Arjan Singh Puniani" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Arjan Singh Puniani",
    description:
      "Contact Arjan Singh Puniani about research, clinical translation, teaching, neurotechnology, motorsport medicine, or media.",
    images: ["/og.png"],
  },
};

export default function Contact() {
  return <>
    <header className="page-hero"><div className="shell"><p className="eyebrow">Contact</p><h1>Start with the problem.</h1><p>Share what you are building, what is hard about it, and where you think I could contribute.</p></div></header>
    <section className="section"><div className="shell contact-grid"><aside className="contact-fit"><p className="eyebrow">Best fit</p><h2>Science-heavy work that needs both technical depth and judgment.</h2><ul className="contact-fit-list"><li>Neural engineering and brain-computer interfaces</li><li>Research software and scientific visualization</li><li>Translational neurotechnology</li><li>Human-centered research systems</li></ul><div className="contact-direct-links"><a className="text-link" href={`mailto:${profile.email}`}>Email directly ↗</a><a className="text-link" href={links.resume} download>Download CV ↗</a><a className="text-link" href={links.github} target="_blank" rel="noreferrer">GitHub ↗</a></div></aside><ContactForm/></div></section>
  </>;
}
