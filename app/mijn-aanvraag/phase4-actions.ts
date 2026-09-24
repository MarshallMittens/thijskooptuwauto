"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type SellerPhaseFourResult = { ok: boolean; message: string };

export async function respondAppointmentAction(input: unknown): Promise<SellerPhaseFourResult> {
  const parsed = z.object({
    applicationId: z.string().uuid(),
    appointmentId: z.string().uuid(),
    action: z.enum(["confirm", "alternative", "decline"]),
    selectedSlot: z.string().datetime({ offset: true }).nullable(),
    note: z.string().trim().max(1000),
  }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Controleer je keuze en toelichting." };
  if (parsed.data.action === "alternative" && parsed.data.note.length < 3) return { ok: false, message: "Beschrijf kort welk alternatief past." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("seller_respond_appointment", {
    p_application_id: parsed.data.applicationId,
    p_appointment_id: parsed.data.appointmentId,
    p_action: parsed.data.action,
    p_selected_slot: parsed.data.selectedSlot,
    p_note: parsed.data.note || null,
  });
  if (error) {
    const message = error.message.includes("invalid_selected_slot")
      ? "Kies één van de voorgestelde momenten."
      : error.message.includes("appointment_response_not_allowed")
        ? "Op dit afspraakvoorstel is al gereageerd. Vernieuw de pagina."
        : "Je reactie kon niet veilig worden opgeslagen.";
    return { ok: false, message };
  }
  revalidatePath("/mijn-aanvraag");
  revalidatePath("/dealer/gewonnen");
  return { ok: true, message: parsed.data.action === "confirm" ? "De afspraak is bevestigd." : parsed.data.action === "alternative" ? "Je verzoek om een alternatief is opgeslagen." : "Je afwijzing is opgeslagen; Thijs neemt zo nodig contact op." };
}

export async function respondPriceAdjustmentAction(input: unknown): Promise<SellerPhaseFourResult> {
  const parsed = z.object({ applicationId: z.string().uuid(), proposalId: z.string().uuid(), accept: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Ongeldig prijsvoorstel." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("seller_respond_price_adjustment", {
    p_application_id: parsed.data.applicationId,
    p_proposal_id: parsed.data.proposalId,
    p_accept: parsed.data.accept,
  });
  if (error) return { ok: false, message: "Je reactie op het prijsvoorstel kon niet veilig worden opgeslagen." };
  revalidatePath("/mijn-aanvraag");
  revalidatePath("/dealer/gewonnen");
  return { ok: true, message: parsed.data.accept ? "Het aangepaste bedrag is geaccepteerd. Je moet het aparte koopconcept hierna nog expliciet bevestigen." : "Het prijsvoorstel is afgewezen; het oorspronkelijke veilingbod blijft ongewijzigd in de historie." };
}

export async function respondSaleAgreementAction(input: unknown): Promise<SellerPhaseFourResult> {
  const parsed = z.object({ applicationId: z.string().uuid(), agreementId: z.string().uuid(), accept: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Ongeldig koopconcept." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("seller_respond_sale_agreement", {
    p_application_id: parsed.data.applicationId,
    p_agreement_id: parsed.data.agreementId,
    p_accept: parsed.data.accept,
  });
  if (error) return { ok: false, message: "Je bevestiging kon niet veilig worden opgeslagen." };
  revalidatePath("/mijn-aanvraag");
  revalidatePath("/dealer/gewonnen");
  return { ok: true, message: parsed.data.accept ? "Jouw bevestiging is opgeslagen. Er is pas akkoord wanneer ook de garage exact hetzelfde concept bevestigt." : "Je afwijzing is opgeslagen en Thijs krijgt een opvolgpunt." };
}
