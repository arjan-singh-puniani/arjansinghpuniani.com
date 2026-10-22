import { NextRequest } from "next/server";
import { retrieve } from "@/lib/atlas";
export function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  if (q.length > 500)
    return Response.json(
      { error: "Maximum query length is 500 characters." },
      { status: 400 },
    );
  return Response.json(retrieve(q));
}
