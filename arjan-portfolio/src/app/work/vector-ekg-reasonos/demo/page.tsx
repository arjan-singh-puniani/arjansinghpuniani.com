import type { Metadata } from "next";
import { ECGWorkspace } from "@/components/ECGWorkspace";

export const metadata: Metadata = {
  title: "ReasonOS | Evidence change review",
  description: "Revise an ECG endpoint and inspect the measurement, observation, and source lineage in a browser-based engineering demo.",
  alternates: { canonical: "/work/vector-ekg-reasonos/demo" },
};

export default function EvidenceDemoPage() {
  return <ECGWorkspace fullScreen engineeringDemo />;
}
