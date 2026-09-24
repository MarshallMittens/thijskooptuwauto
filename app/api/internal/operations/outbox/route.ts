import { getOperationsConfig } from "@/lib/env";
import { verifyJobSecret } from "@/lib/operations/job-secret";
import { runOutboxBatch } from "@/lib/operations/outbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const config = getOperationsConfig();
    const authorization = request.headers.get("authorization");
    const provided = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
    if (!verifyJobSecret(provided, config.jobSecret)) return Response.json({ error: "unauthorized" }, { status: 401 });
    const result = await runOutboxBatch(25);
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "operation_unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
