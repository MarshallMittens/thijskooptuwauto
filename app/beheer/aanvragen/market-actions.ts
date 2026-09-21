"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

const publishSchema = z.object({
  applicationId: z.string().uuid(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

export type MarketActionResult = { ok: boolean; message: string };

export async function publishApplicationAction(input: z.input<typeof publishSchema>): Promise<MarketActionResult> {
  await requireAdmin();
  const parsed = publishSchema.safeParse(input);
  if (!parsed.success || new Date(parsed.data.endsAt) <= new Date(parsed.data.startsAt)) {
    return { ok: false, message: "Controleer de begin- en eindtijd." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_publish_application", {
    p_application_id: parsed.data.applicationId,
    p_starts_at: parsed.data.startsAt,
    p_ends_at: parsed.data.endsAt,
  });
  if (error) {
    const known = [
      ["application_not_ready", "Zet de aanvraag eerst op ‘Gereed’."],
      ["approved_photo_required", "Keur minimaal één foto goed voordat je publiceert."],
      ["listing_already_published", "Deze aanvraag is al gepubliceerd."],
      ["invalid_bid_window", "De eindtijd moet na de begintijd en in de toekomst liggen."],
    ] as const;
    const match = known.find(([key]) => error.message.includes(key));
    return { ok: false, message: match?.[1] ?? "Publiceren is veilig geweigerd." };
  }

  revalidatePath(`/beheer/aanvragen/${parsed.data.applicationId}`);
  revalidatePath("/dealer");
  return { ok: true, message: "De voertuigversie is vastgelegd en de biedronde is aangemaakt." };
}

export async function closeBidRoundAction(input: { applicationId: string; roundId: string }): Promise<MarketActionResult> {
  await requireAdmin();
  const parsed = z.object({ applicationId: z.string().uuid(), roundId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Ongeldige biedronde." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_close_bid_round", { p_bid_round_id: parsed.data.roundId });
  if (error) return { ok: false, message: "De biedronde kon niet veilig worden gesloten." };

  revalidatePath(`/beheer/aanvragen/${parsed.data.applicationId}`);
  revalidatePath("/dealer");
  return { ok: true, message: "De biedronde is gesloten. Er is niet automatisch een koper gekozen." };
}
