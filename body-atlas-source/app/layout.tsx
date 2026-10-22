import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "BODY//ATLAS — The Human Intervention Observatory",
  description:
    "Anatomy, intervention technology, and inspectable source evidence. A whole-body FDA source index with curated neurotechnology evidence.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
