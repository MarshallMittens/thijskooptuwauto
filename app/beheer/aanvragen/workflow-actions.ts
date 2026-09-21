"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/dal";
import { contactInputSchema, dealInputSchema, materialChangeInputSchema } from "@/lib/deals/workflow";
import { createClient } from "@/lib/supabase/server";

export type WorkflowActionResult = { ok: boolean; message: string };

export async function addContactAction(input: unknown): Promise<WorkflowActionResult> {
  await requireAdmin();
  const parsed = contactInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Controleer het kanaal, tijdstip en de samenvatting." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_add_contact_event", {
    p_application_id: parsed.data.applicationId,
    p_channel: parsed.data.channel,
    p_summary: parsed.data.summary,
    p_occurred_at: parsed.data.occurredAt,
  });
  if (error) return { ok: false, message: "Het contactmoment kon niet veilig worden opgeslagen." };

  revalidatePath(`/beheer/aanvragen/${parsed.data.applicationId}`);
  return { ok: true, message: "Contactmoment opgeslagen en in de auditlog geregistreerd." };
}

export async function updateDealAction(input: unknown): Promise<WorkflowActionResult> {
  await requireAdmin();
  const parsed = dealInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Controleer de afhandelingsstatus en het gekozen bod." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_deal_case", {
    p_application_id: parsed.data.applicationId,
    p_status: parsed.data.status,
    p_selected_bid_id: parsed.data.selectedBidId,
  });
  if (error) {
    const known = [
      ["invalid_deal_transition", "Deze statusstap is niet toegestaan."],
      ["selected_bid_required", "Kies eerst bewust een bod voor deze akkoordstatus."],
      ["selected_bid_not_for_application", "Het gekozen bod hoort niet bij deze aanvraag."],
      ["selected_bid_locked", "Het gekozen bod kan na akkoord niet meer worden vervangen."],
      ["deal_case_terminal", "Deze afgeronde afhandeling kan niet opnieuw worden gewijzigd."],
    ] as const;
    const match = known.find(([key]) => error.message.includes(key));
    return { ok: false, message: match?.[1] ?? "De afhandeling kon niet veilig worden gewijzigd." };
  }

  revalidatePath(`/beheer/aanvragen/${parsed.data.applicationId}`);
  return { ok: true, message: "Afhandelingsstatus opgeslagen en in de auditlog geregistreerd." };
}

export async function recordMaterialChangeAction(input: unknown): Promise<WorkflowActionResult> {
  await requireAdmin();
  const parsed = materialChangeInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Controleer de voertuiggegevens en geef een reden van minimaal tien tekens." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_record_material_change", {
    p_application_id: parsed.data.applicationId,
    p_expected_revision_id: parsed.data.expectedRevisionId,
    p_mileage_km: parsed.data.mileageKm,
    p_damage_description: parsed.data.damageDescription,
    p_technical_issues: parsed.data.technicalIssues,
    p_maintenance_description: parsed.data.maintenanceDescription,
    p_key_count: parsed.data.keyCount,
    p_remarks: parsed.data.remarks,
    p_reason: parsed.data.reason,
  });
  if (error) {
    const known = [
      ["stale_vehicle_revision", "De publicatie is ondertussen gewijzigd. Vernieuw de pagina en controleer opnieuw."],
      ["material_change_no_changes", "Er zijn geen gewijzigde voertuiggegevens gevonden."],
      ["invalid_change_reason", "Beschrijf duidelijk waarom deze wijziging nodig is."],
    ] as const;
    const match = known.find(([key]) => error.message.includes(key));
    return { ok: false, message: match?.[1] ?? "De materiële wijziging kon niet veilig worden opgeslagen." };
  }

  revalidatePath(`/beheer/aanvragen/${parsed.data.applicationId}`);
  revalidatePath("/dealer");
  const requiresRepublication = typeof data === "object" && data !== null && "requires_republication" in data && data.requires_republication === true;
  return {
    ok: true,
    message: requiresRepublication
      ? "Wijziging opgeslagen. De oude publicatie en biedronde zijn ingetrokken; controleer de gegevens en publiceer een nieuwe ronde."
      : "Wijziging opgeslagen en in de auditlog geregistreerd.",
  };
}
