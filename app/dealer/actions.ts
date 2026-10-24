"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { parseEuroAmountToCents } from "@/lib/bids/amount";
import { trySendBidConfirmation } from "@/lib/email/bid-confirmation";
import { requireDealer } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const bidSchema = z.object({
  listingId: z.string().uuid(),
  roundId: z.string().uuid(),
  amount: z.string().max(20),
  idempotencyKey: z.string().uuid(),
});

export type BidActionResult = { ok: boolean; message: string; amountCents?: number };

export async function setProxyBidAction(input: z.input<typeof bidSchema>): Promise<BidActionResult> {
  await requireDealer();
  const parsed = bidSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Controleer je maximumbod." };
  const maximum = parseEuroAmountToCents(parsed.data.amount);
  if (maximum === null) return { ok: false, message: "Vul een geldig maximumbedrag in." };
  const client = await createClient();
  const { error } = await client.rpc("set_proxy_bid", { p_bid_round_id: parsed.data.roundId, p_maximum_cents: maximum });
  if (error) return { ok: false, message: error.message.includes("bid_round_closed") ? "Deze biedronde is gesloten." : "Het maximum kon niet worden ingesteld. Kies minstens het minimale nieuwe bod; een bestaand maximum kan alleen worden verhoogd." };
  revalidatePath(`/dealer/aanbod/${parsed.data.listingId}`);
  revalidatePath("/dealer/biedingen");
  revalidatePath("/dealer");
  return { ok: true, message: `Automatisch bieden ingesteld tot ${new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(maximum / 100)}. Je maximum blijft afgeschermd.` };
}

export async function placeBidAction(input: z.input<typeof bidSchema>): Promise<BidActionResult> {
  await requireDealer();
  const parsed = bidSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Controleer het bod en probeer opnieuw." };

  const amountCents = parseEuroAmountToCents(parsed.data.amount);
  if (amountCents === null) return { ok: false, message: "Vul een geldig bedrag groter dan nul in, met maximaal twee decimalen." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("place_bid", {
    p_bid_round_id: parsed.data.roundId,
    p_amount_cents: amountCents,
    p_idempotency_key: parsed.data.idempotencyKey,
  });

  if (error) {
    const messages: Record<string, string> = {
      approved_company_required: "Je bedrijf is niet goedgekeurd of is geblokkeerd.",
      bid_round_not_started: "Deze biedronde is nog niet begonnen.",
      bid_round_closed: "Deze biedronde is gesloten; het bod is niet opgeslagen.",
      bid_round_not_active: "Op deze auto kan niet meer worden geboden.",
      listing_not_published: "Deze auto is niet meer beschikbaar.",
      bid_below_minimum_increment: "Je bod is te laag. Gebruik minimaal het bedrag dat boven het formulier staat.",
      idempotency_conflict: "Deze biedpoging is al met andere gegevens gebruikt. Vernieuw de pagina.",
    };
    const key = Object.keys(messages).find((candidate) => error.message.includes(candidate));
    return { ok: false, message: key ? messages[key] : "Het bod kon niet veilig worden opgeslagen." };
  }

  const bidResult = z.object({ bid_id: z.string().uuid(), created: z.boolean() }).safeParse(data);
  if (bidResult.success && bidResult.data.created) {
    try {
      await trySendBidConfirmation(createAdminClient(), bidResult.data.bid_id);
    } catch {
      // Het opgeslagen bod blijft geldig als e-mail of serverconfiguratie faalt.
    }
  }

  revalidatePath(`/dealer/aanbod/${parsed.data.listingId}`);
  revalidatePath("/dealer/biedingen");
  revalidatePath("/dealer");
  return { ok: true, message: "Je bod is opgeslagen en het bedrag is anoniem zichtbaar voor andere goedgekeurde garages.", amountCents };
}
