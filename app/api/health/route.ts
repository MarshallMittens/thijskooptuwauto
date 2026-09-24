import { getOperationsConfig } from "@/lib/env";
import { verifyJobSecret } from "@/lib/operations/job-secret";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseHeaders = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("deep") !== "1") {
    return Response.json({ status: "ok" }, { headers: responseHeaders });
  }

  const authorization = request.headers.get("authorization");
  const provided = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  if (!provided) {
    return Response.json({ status: "unauthorized" }, { status: 401, headers: responseHeaders });
  }

  try {
    const { jobSecret } = getOperationsConfig();
    if (!verifyJobSecret(provided, jobSecret)) {
      return Response.json({ status: "unauthorized" }, { status: 401, headers: responseHeaders });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("profiles").select("id").limit(1);
    if (error) throw error;

    return Response.json(
      { status: "ok", database: "reachable" },
      { headers: responseHeaders },
    );
  } catch {
    return Response.json(
      { status: "unavailable" },
      { status: 503, headers: responseHeaders },
    );
  }
}
