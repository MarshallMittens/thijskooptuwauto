import { NextResponse } from "next/server";
import { z } from "zod";

import { getAppUrl } from "@/lib/config/app-url";
import { createRateLimitActorKey } from "@/lib/security/public-request";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  reference: z.string().trim().regex(/^[0-9a-f]{24}$/),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
});

const genericMessage = "Als de gegevens kloppen, ontvang je binnen enkele minuten een beveiligde e-mail.";

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Controleer de aanvraagreferentie en het e-mailadres." }, { status: 400 });
  }

  try {
    const actorKey = createRateLimitActorKey(request);
    const admin = createAdminClient();
    const { data: allowed, error: prepareError } = await admin.rpc("prepare_seller_access", {
      p_reference: parsed.data.reference,
      p_email: parsed.data.email,
      p_actor_key: actorKey,
    });
    if (prepareError?.message.includes("rate_limit_exceeded")) {
      return NextResponse.json({ error: "Er zijn te veel pogingen gedaan. Probeer het over een uur opnieuw." }, { status: 429 });
    }

    if (allowed === true) {
      const callback = new URL("/auth/callback", getAppUrl());
      callback.searchParams.set(
        "next",
        `/mijn-aanvraag/activeren?referentie=${parsed.data.reference}`,
      );
      const supabase = await createClient();
      await supabase.auth.signInWithOtp({
        email: parsed.data.email,
        options: { emailRedirectTo: callback.toString(), shouldCreateUser: true },
      });
    }

    return NextResponse.json({ message: genericMessage });
  } catch {
    return NextResponse.json({ error: "De beveiligde e-mail kon tijdelijk niet worden voorbereid." }, { status: 503 });
  }
}
