import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { profile } from "@/content/profile";
import { links } from "@/content/links";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Arjan Singh Puniani about neural engineering, BCI research, research software, or clinical research.",
  alternates: { canonical: "/contact" },
  openGraph: {
    type: "website",
    url: `${siteUrl}/contact`,
    title: "Contact Arjan Singh Puniani",
    description: "Neural engineering, BCI research, research software, and clinical research.",
    images: [{ url: "/og.png", alt: "Arjan Singh Puniani" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Arjan Singh Puniani",
    description: "Neural engineering, BCI research, research software, and clinical research.",
    images: ["/og.png"],
  },
};

export default function Contact() {
  return <>
    <header className="page-hero"><div className="shell"><p className="eyebrow">Contact</p><h1>Contact.</h1><p>Email is the easiest way to reach me.</p></div></header>
    <section className="section"><div className="shell contact-grid"><aside className="contact-fit"><p className="eyebrow">Work</p><h2>Research and engineering.</h2><ul className="contact-fit-list"><li>Neural engineering and BCI experiments</li><li>Research software and scientific visualization</li><li>Clinical research</li><li>Early-stage neurotechnology</li></ul><div className="contact-direct-links"><a className="text-link" href={`mailto:${profile.email}`}>Email directly ↗</a><a className="text-link" href={links.resume} download>Download CV ↗</a><a className="text-link" href={links.github} target="_blank" rel="noreferrer">GitHub ↗</a></div></aside><ContactForm/></div></section>
  </>;
}
