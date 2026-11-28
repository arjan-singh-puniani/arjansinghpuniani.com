import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import RallyHouseExperience from "./RallyHouseExperience";

export const metadata: Metadata = {
  title: "Rally House — The Sims meets Mario Tennis",
  description: "Build your club, challenge a member, play Championship tennis and analyze your recorded in-game swing.",
  alternates: { canonical: "/playground/rally-house" },
  openGraph: {
    type: "website", url: `${siteUrl}/playground/rally-house`,
    title: "Rally House | Arjan Singh Puniani",
    description: "The Sims meets Mario Tennis. Play a point, then replay your character’s swing.",
    images: [{ url: "/rally-house/media/guide-club-living.webp", width: 1440, height: 960, alt: "Actual Rally House gameplay in a living miniature tennis club" }],
  },
  twitter: { card: "summary_large_image", title: "Rally House | Arjan Singh Puniani", description: "The Sims meets Mario Tennis. Play a point, then replay your character’s swing.", images: ["/rally-house/media/guide-club-living.webp"] },
};
export default function RallyHousePage() { return <RallyHouseExperience />; }
