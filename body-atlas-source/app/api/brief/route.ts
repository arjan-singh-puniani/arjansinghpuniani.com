import { NextRequest } from "next/server";
import { brief, familyById } from "@/lib/atlas";
export function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams.get("ids") || "rns";
  if (input.length > 200)
    return Response.json({ error: "Invalid selection" }, { status: 400 });
  const ids = [...new Set(input.split(","))];
  if (ids.length > 10 || ids.some((id) => !familyById(id)))
    return Response.json({ error: "Unknown family" }, { status: 400 });
  const year = Number(request.nextUrl.searchParams.get("year") || 2026);
  if (!Number.isInteger(year) || year < 1970 || year > 2026)
    return Response.json({ error: "Invalid year" }, { status: 400 });
  return new Response(brief(ids, year), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="body-atlas-brief.md"',
      "Cache-Control": "no-store",
    },
  });
}
