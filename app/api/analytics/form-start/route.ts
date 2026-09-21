import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { consumePublicRateLimit } from "@/lib/security/rate-limit";

const requestSchema = z.object({
  eventKey: z.string().uuid(),
  website: z.string().max(0).optional().default(""),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new NextResponse(null, { status: 204 });

  try {
    if (!(await consumePublicRateLimit(request, "form_start", 30))) return new NextResponse(null, { status: 204 });
    const admin = createAdminClient();
    await admin.rpc("record_public_form_start", { p_event_key: parsed.data.eventKey });
  } catch {
    // Meting mag het formulier nooit blokkeren.
  }
  return new NextResponse(null, { status: 204 });
}
