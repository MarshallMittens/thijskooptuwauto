"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

const publishSchema = z.object({
  applicationId: z.string().uuid(),
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
