import snapshot from "@/data/atlas.json";
import { families, recordById } from "@/lib/atlas";
import { dossiers } from "@/lib/dossiers";
import type { AtlasRecord } from "@/lib/types";
import type { BriefCase } from "../BriefBuilder";

export const dynamic = "force-static";

export function GET() {
  const dossierPaths = new Map<string, string>();
  for (const family of families) {
    const path = dossiers[family.id]?.path;
    if (!path || family.regulatoryIds.length !== 1) continue;
    const record = recordById(family.regulatoryIds[0]);
    if (record?.application?.startsWith("P") && !record.supplement && !dossierPaths.has(record.application)) {
      dossierPaths.set(record.application, path);
    }
  }
  const cases = Object.fromEntries((snapshot.records as AtlasRecord[]).flatMap(record => {
    if (!record.application || record.supplement ||
        !record.decisionDate || !record.status ||
        !["PMA approval", "510(k) clearance", "De Novo authorization"].includes(record.status)) return [];
    const briefCase: BriefCase = {
      application: record.application,
      name: record.title,
      decisionDate: record.decisionDate,
      retrievedAt: record.retrievedAt.slice(0, 10),
      sourceSha: record.sourceSha,
      status: record.status,
      url: record.url,
      statement: record.statement?.trim() || "",
      dossierPath: dossierPaths.get(record.application),
      limits: "The worksheet uses the original indexed decision. Verify the applicable scope, later changes, and anatomy in the original sources.",
      relationships: [],
    };
    return [[record.application, briefCase]];
  }));
  return Response.json(cases);
}
