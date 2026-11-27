"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

function refreshApplication(id: string) {
  for (const path of [`/beheer/aanvragen/${id}`, "/beheer/aanvragen", "/beheer/veilingen", "/dealer", "/mijn-aanvraag"]) revalidatePath(path);
  revalidatePath("/dealer/aanbod", "layout");
}

export async function approveAndPublishApplicationAction(input: unknown) {
  await requireAdmin();
  const parsed = z.object({ applicationId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Ongeldige aanvraag." };
  const client = await createClient();
  const { error } = await client.rpc("admin_approve_and_publish_application", { p_application_id: parsed.data.applicationId });
  if (error) {
    const known = [
      ["application_incomplete", "Vul eerst de kilometerstand, het merk, het model en de contactgegevens aan."],
      ["approved_photo_required", "Er is minimaal één bruikbare foto nodig. Afgewezen en verwijderde foto's tellen niet mee."],
      ["application_archived", "Deze aanvraag is gearchiveerd en kan niet worden aangeboden."],
      ["application_not_reviewable", "Deze aanvraag kan in de huidige status niet worden goedgekeurd."],
    ] as const;
    return { ok: false, message: known.find(([key]) => error.message.includes(key))?.[1] ?? "Goedkeuren en aanbieden is niet gelukt. De aanvraag is niet gedeeltelijk gewijzigd." };
  }
  refreshApplication(parsed.data.applicationId);
  return { ok: true, message: "De auto is goedgekeurd en staat nu bij de dealers. De biedronde duurt 24 uur." };
}

export async function removeApplicationPhotoAction(input: unknown) {
  await requireAdmin();
  const parsed = z.object({ applicationId: z.string().uuid(), photoId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Ongeldige foto." };
  const client = await createClient();
  const { error } = await client.rpc("admin_remove_application_photo", { p_application_id: parsed.data.applicationId, p_photo_id: parsed.data.photoId });
  if (error) return { ok: false, message: error.message.includes("last_published_photo_required")
    ? "Dit is de laatste goedgekeurde foto van een aangeboden auto. Haal de auto eerst uit het aanbod of keur een andere foto goed."
    : "De foto kon niet worden verwijderd." };
  refreshApplication(parsed.data.applicationId);
  return { ok: true, message: "De foto is uit de aanvraag verwijderd." };
}
