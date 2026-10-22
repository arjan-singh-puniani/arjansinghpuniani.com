import { readFile } from "node:fs/promises";
import path from "node:path";
import { coverage } from "@/lib/atlas";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sha: string }> },
) {
  const { sha } = await params;
  if (
    !/^[a-f0-9]{64}$/.test(sha) ||
    !coverage.sources.some((s) => s.sha === sha)
  )
    return Response.json({ error: "Unknown snapshot" }, { status: 404 });
  try {
    const raw = await readFile(
      path.join(process.cwd(), "data", "sources", sha + ".json"),
      "utf8",
    );
    return new Response(raw, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return Response.json({ error: "Snapshot unavailable" }, { status: 503 });
  }
}
