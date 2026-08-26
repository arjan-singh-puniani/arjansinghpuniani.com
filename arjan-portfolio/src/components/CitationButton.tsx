"use client";
import { useState } from "react";
export function CitationButton({ citation }: { citation: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() { await navigator.clipboard.writeText(citation); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
  return <button className="copy-button" type="button" onClick={copy}>{copied ? "Copied" : "Copy citation"}</button>;
}
