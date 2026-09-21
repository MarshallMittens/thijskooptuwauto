import { NextResponse } from "next/server";
import { z } from "zod";

import { lookupRdwVehicle } from "@/lib/rdw/client";
import { consumePublicRateLimit } from "@/lib/security/rate-limit";

const requestSchema = z.object({ kenteken: z.string().max(16) });

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Vul een geldig kenteken in." }, { status: 400 });
  }

  try {
    if (!(await consumePublicRateLimit(request, "rdw_lookup", 60))) {
      return NextResponse.json({ error: "Er zijn te veel kentekenopvragen gedaan. Probeer het later opnieuw." }, { status: 429 });
    }
    const vehicle = await lookupRdwVehicle(parsed.data.kenteken);
    if (!vehicle) {
      return NextResponse.json({ found: false });
    }
    return NextResponse.json({ found: true, vehicle });
  } catch {
    return NextResponse.json(
      { found: false, unavailable: true, message: "RDW is tijdelijk niet bereikbaar. Je kunt de gegevens handmatig invullen." },
      { status: 503 },
    );
  }
}
