import type { Metadata } from "next";
import { ECGWorkspace } from "@/components/ECGWorkspace";

export const metadata: Metadata = {
  title: "ReasonOS ECG workspace",
  description: "Inspect real ECG recordings, annotate source evidence and review your reasoning. Local PDF, image and digital waveform imports stay in your browser.",
  alternates: { canonical: "/work/vector-ekg-reasonos/workspace" },
};
export default function WorkspacePage() {
  return <ECGWorkspace fullScreen />;
}
