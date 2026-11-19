import { ImageResponse } from "next/og";

export const alt = "From impact to informed care. Independent motorsport neurotrauma research and information design by Arjan Singh Puniani.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: "54px 66px", background: "#101f2a", color: "#f1f5f5", fontFamily: "sans-serif" }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 19, color: "#ffb394" }}><span>MECHANISM-TO-MEDICAL CENTER</span><span>INDEPENDENT PROJECT</span></div>
    <div style={{ display: "flex", flexDirection: "column", fontSize: 94, letterSpacing: -5, lineHeight: 1.02, marginTop: 48 }}><span>From impact</span><span style={{ color: "#a4dfd6" }}>to informed care.</span></div>
    <div style={{ display: "flex", alignItems: "center", gap: 25, borderTop: "1px solid #405663", marginTop: 44, paddingTop: 24, fontSize: 22, color: "#b8cbd5" }}><span>Incident</span><span style={{ color: "#ffb394" }}> / </span><span>Information</span><span style={{ color: "#ffb394" }}> / </span><span>Handoff</span></div>
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto", fontSize: 18 }}><span>Arjan Singh Puniani</span><span style={{ color: "#a4dfd6" }}>Motorsport × Neural engineering</span></div>
  </div>, size);
}
