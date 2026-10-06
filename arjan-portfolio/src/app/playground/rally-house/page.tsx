import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import RallyHouseExperience from "./RallyHouseExperience";

export const metadata: Metadata = {
  title: "Rally House — A Living Club, Playable Arcade Tennis",
  description: "Explore Arjan Singh Puniani’s miniature tennis club, challenge its members, and play arcade tennis on the same continuous court.",
  alternates: { canonical: "/playground/rally-house" },
  openGraph: {
    type: "website", url: `${siteUrl}/playground/rally-house`,
    title: "Rally House | Arjan Singh Puniani",
    description: "A living miniature club that becomes a playable tennis game.",
    images: [{ url: "/rally-house/media/club.webp", width: 1440, height: 1000, alt: "Actual Rally House gameplay in a living miniature tennis club" }],
  },
  twitter: { card: "summary_large_image", title: "Rally House | Arjan Singh Puniani", description: "A living miniature club that becomes a playable tennis game.", images: ["/rally-house/media/club.webp"] },
};
export default function RallyHousePage() { return <RallyHouseExperience />; }
