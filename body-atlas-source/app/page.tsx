import type { Metadata } from "next";
import AtlasExperience from "@/components/AtlasExperience";

const atlasUrl = "https://arjansinghpuniani.com/atlas";
const title = "BODY//ATLAS · Human anatomy and device evidence";
const description = "Rotate a solid anatomical hologram, explore intervention maps, and trace device claims to their original sources.";
const image = {
  url: `${atlasUrl}/atlas-share-v1.jpg`,
  width: 1200,
  height: 630,
  alt: "The solid cyan hologram beside the Atlas map of organs and source-linked interventions.",
};

export const metadata: Metadata = {
  alternates: { canonical: atlasUrl },
  openGraph: { type: "website", url: atlasUrl, siteName: "BODY//ATLAS", title, description, images: [image] },
  twitter: { card: "summary_large_image", title, description, images: [image] },
};

export default function Page() {
  return <AtlasExperience />;
}
