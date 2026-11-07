import type { Metadata } from "next";
import { ECGSignalOrigin } from "@/components/ECGSignalOrigin";

export const metadata: Metadata = {
  title: "How an ECG forms · Vector EKG",
  description: "Explore membrane currents, cardiac source vectors, body potentials and differential ECG measurements in a linked, explicitly idealized forward model.",
  alternates: { canonical: "/work/vector-ekg-reasonos/signal" },
};
export default function SignalPage() {
  return <div className="shell" style={{ paddingTop: 32, paddingBottom: 60 }}><ECGSignalOrigin standalone /></div>;
}
