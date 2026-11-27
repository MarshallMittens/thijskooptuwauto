"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

const publishSchema = z.object({
  applicationId: z.string().uuid(),
});

const restartSchema = z.object({
  applicationId: z.string().uuid(),
  reason: z.string().trim().min(10).max(500),
  idempotencyKey: z.string().uuid(),
});

export type MarketActionResult = { ok: boolean; message: string };

export async function publishApplicationAction(input: z.input<typeof publishSchema>): Promise<MarketActionResult> {
  await requireAdmin();
  const parsed = publishSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Ongeldige aanvraag." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_publish_application", {
    p_application_id: parsed.data.applicationId,
  });
  if (error) {
    const known = [
      ["application_not_ready", "Zet de aanvraag eerst op ‘Gereed’."],
      ["approved_photo_required", "Keur minimaal één foto goed voordat je publiceert."],
      ["seller_verification_required", "De verkoper moet eerst het e-mailadres verifiëren."],
      ["listing_already_published", "Deze aanvraag is al gepubliceerd."],
      ["auction_policy_missing", "Er is nog geen veilingbeleid ingericht."],
    ] as const;
    const match = known.find(([key]) => error.message.includes(key));
    return { ok: false, message: match?.[1] ?? "Publiceren is veilig geweigerd." };
  }

  revalidatePath(`/beheer/aanvragen/${parsed.data.applicationId}`);
  revalidatePath("/dealer");
  return { ok: true, message: "De voertuigversie is vastgelegd. De biedronde is nu geopend en sluit exact 24 uur later." };
}

export async function closeBidRoundAction(input: { applicationId: string; roundId: string }): Promise<MarketActionResult> {
  await requireAdmin();
  const parsed = z.object({ applicationId: z.string().uuid(), roundId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Ongeldige biedronde." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_close_bid_round", { p_bid_round_id: parsed.data.roundId });
  if (error) {
    const message = error.message.includes("bid_round_still_active")
      ? "De biedronde duurt exact 24 uur en kan nog niet worden afgerond."
      : "De biedronde kon niet veilig worden afgerond.";
    return { ok: false, message };
  }

  revalidatePath(`/beheer/aanvragen/${parsed.data.applicationId}`);
  revalidatePath("/dealer");
  return { ok: true, message: "De uitslag is vastgelegd. De hoogste bieder is gereserveerd; dit is nog geen koop." };
}

export async function restartBidRoundAction(input: z.input<typeof restartSchema>): Promise<MarketActionResult> {
  await requireAdmin();
  const parsed = restartSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Vul een duidelijke reden van minimaal 10 tekens in." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_reopen_auction_24h", {
    p_application_id: parsed.data.applicationId,
    p_reason: parsed.data.reason,
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) {
    const known = [
      ["application_archived", "Deze auto is gearchiveerd en kan niet opnieuw worden aangeboden."],
      ["bid_round_still_active", "De huidige ronde is nog niet afgelopen. Je kunt pas na de eindtijd opnieuw starten."],
      ["bid_round_not_finalized", "Deze veiling kan in de huidige status niet opnieuw worden gestart."],
      ["auction_followup_started", "Herstarten kan niet meer omdat de afspraak- of afhandelingsroute al is begonnen."],
      ["bid_round_disputed", "Deze biedronde heeft een geschilstatus en kan niet opnieuw worden gestart."],
      ["winner_reservation_disputed", "De winnaarreservering heeft een geschilstatus en kan niet worden ingetrokken."],
      ["published_listing_required", "Alleen een nog gepubliceerde auto kan opnieuw worden aangeboden."],
    ] as const;
    const match = known.find(([key]) => error.message.includes(key));
    return { ok: false, message: match?.[1] ?? "De nieuwe biedronde kon niet veilig worden gestart." };
  }

  revalidatePath(`/beheer/aanvragen/${parsed.data.applicationId}`);
  revalidatePath("/dealer");
  revalidatePath("/beheer/veilingen");
  revalidatePath("/beheer/aanvragen");
  revalidatePath("/dealer/biedingen");
  if (parsed.data.applicationId) revalidatePath("/dealer/aanbod", "layout");
  revalidatePath("/dealer/gewonnen");
  return { ok: true, message: "De vorige biedingen blijven bewaard. Er loopt nu een nieuwe, lege biedronde van exact 24 uur." };
}
