import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { profile } from "@/content/profile";
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
    <header className="page-hero"><div className="shell"><p className="eyebrow">Contact</p><h1>Start with the problem.</h1><p>Share the question, the people affected, and the decision you need to make.</p></div></header>
    <section className="section"><div className="shell contact-grid"><aside><h2>Direct contact</h2><p><a className="text-link" href={`mailto:${profile.email}`}>{profile.email}</a></p><p>The form uses a honeypot field and server-side validation. It stores nothing in this repository.</p><p className="notice">When email delivery is not configured, use the direct email link. No analytics or tracking is required.</p></aside><ContactForm/></div></section>
  </>;
}
