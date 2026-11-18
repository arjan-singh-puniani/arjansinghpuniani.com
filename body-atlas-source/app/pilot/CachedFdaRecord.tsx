"use client";

import { useEffect, useRef, useState } from "react";
import { atlasBasePath, atlasPath } from "@/lib/deployment";

type FdaDecision = {
  pma_number?: string;
  supplement_number?: string;
  k_number?: string;
  decision_date: string;
  decision_code?: string;
  decision_description?: string;
  supplement_reason?: string;
  ao_statement?: string;
};

export type ArchiveVerification = FdaDecision | "failed";

export function archiveKey(application: string, date: string, sha: string, supplement = "") {
  return [application, supplement, date, sha].join("/");
}

export default function CachedFdaRecord({ application, supplement, date, sourceSha, retrievedAt, sourcePath, verification, onVerify }: {
  application: string;
  supplement?: string;
  date: string;
  sourceSha: string;
  retrievedAt?: string;
  sourcePath?: string;
  verification?: ArchiveVerification;
  onVerify: (key: string, outcome: ArchiveVerification) => void;
}) {
  const record = verification === "failed" ? undefined : verification;
  const [loading, setLoading] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const archiveLink = useRef<HTMLAnchorElement>(null);
  const moveFocus = useRef(false);
  useEffect(() => {
    if (record && moveFocus.current) archiveLink.current?.focus();
  }, [record]);
  const archivePath = sourcePath ?? (atlasBasePath ? atlasPath(`/sources/${sourceSha}.json`) : `/api/source/${sourceSha}`);
  if (!/^[a-f0-9]{64}$/.test(sourceSha)) return null;

  async function verify() {
    if (loading) return;
    const key = archiveKey(application, date, sourceSha, supplement);
    setLoading(true);
    try {
      const response = await fetch(archivePath);
      if (!response.ok) throw new Error("Cached FDA response unavailable");
      const bytes = await response.arrayBuffer();
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      const checksum = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
      if (checksum !== sourceSha) throw new Error("FDA response checksum mismatch");
      const payload = JSON.parse(new TextDecoder().decode(bytes)) as { results?: FdaDecision[] };
      const match = payload.results?.find(item => {
        if (String(item.decision_date).replaceAll("-", "") !== date.replaceAll("-", "")) return false;
        return application.startsWith("P")
          ? item.pma_number === application && item.supplement_number === (supplement ?? "")
          : item.k_number === application;
      });
      if (!match) throw new Error("Exact decision missing in FDA response");
      moveFocus.current = document.activeElement === button.current;
      onVerify(key, match);
    } catch {
      onVerify(key, "failed");
    } finally {
      setLoading(false);
    }
  }

  if (record) return (
    <div className="pilot-cached-source" role="status">
      <p><strong>Archived FDA record {supplement ? `${application}/${supplement}` : application}</strong> · {date}</p>
      {supplement && <p>{record.supplement_reason || "FDA change reason unavailable."}</p>}
      <p>{record.ao_statement || record.decision_description || "FDA decision statement unavailable."}</p>
      {!supplement && record.decision_code && <p>FDA decision code {record.decision_code}.</p>}
      <p>Retrieved {retrievedAt?.slice(0, 10) || "date unavailable"}. Archive checksum verified.</p>
      <a ref={archiveLink} href={archivePath} target="_blank" rel="noopener noreferrer">Open the cached FDA response</a>
    </div>
  );

  const verifyLabel = supplement ? "Verify in cached FDA record" : "Verify original in cached FDA record";
  const retryLabel = supplement ? "Retry cached FDA record" : "Retry cached original";
  return (
    <>
      <button ref={button} type="button" className="pilot-source-button" onClick={verify} aria-disabled={loading}>
        {verification === "failed" ? retryLabel : verifyLabel}
      </button>
      {loading && <p role="status">Verifying the archived FDA response…</p>}
      {!loading && verification === "failed" && <p role="alert">Could not verify the archived FDA response. Use the original link if available.</p>}
    </>
  );
}
