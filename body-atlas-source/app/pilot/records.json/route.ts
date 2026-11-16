import snapshot from "@/data/atlas.json";
import type { AtlasRecord } from "@/lib/types";
import type { BriefCase } from "../BriefBuilder";

export const dynamic = "force-static";

export function GET() {
  const cases = Object.fromEntries((snapshot.records as AtlasRecord[]).flatMap(record => {
    if (!record.application || record.supplement ||
        !record.decisionDate || !record.status ||
        !["PMA approval", "510(k) clearance", "De Novo authorization"].includes(record.status)) return [];
    const briefCase: BriefCase = {
      application: record.application,
      name: record.title,
      decisionDate: record.decisionDate,
      retrievedAt: record.retrievedAt.slice(0, 10),
      status: record.status,
      url: record.url,
      statement: record.statement?.trim() || "",
      limits: "The worksheet uses the original indexed decision. Scope, later changes, and anatomy have not been reviewed for this entry.",
      relationships: [],
    };
    return [[record.application, briefCase]];
  }));
  return Response.json(cases);
}
