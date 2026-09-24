"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireDealer } from "@/lib/auth/dal";
import { parseEuroAmountToCents } from "@/lib/bids/amount";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { inspectAndNormalizePhoto } from "@/lib/uploads/image";

export type PhaseFourActionResult = { ok: boolean; message: string };

const appointmentSchema = z.object({
  reservationId: z.string().uuid(),
  slots: z.array(z.string().datetime()).min(1).max(3),
  idempotencyKey: z.string().uuid(),
});

const inspectionSchema = z.object({
  appointmentId: z.string().uuid(),
  status: z.enum(["completed", "no_show"]),
  mileageKm: z.number().int().min(0).max(5_000_000).nullable(),
  findings: z.string().trim().max(4000),
  deviationDescription: z.string().trim().max(4000),
  proposedPrice: z.string().trim().max(20),
  adjustmentReason: z.string().trim().max(2000),
  inspectedAt: z.string().datetime(),
  idempotencyKey: z.string().uuid(),
});

export async function proposeAppointmentAction(input: unknown): Promise<PhaseFourActionResult> {
  await requireDealer();
  const parsed = appointmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Kies één tot drie geldige toekomstige momenten." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("dealer_propose_appointment", {
    p_winner_reservation_id: parsed.data.reservationId,
    p_slots: parsed.data.slots,
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) {
    const message = error.message.includes("invalid_appointment_slots")
      ? "Kies unieke momenten tussen 15 minuten en 30 dagen vanaf nu."
      : error.message.includes("appointment_proposal_not_allowed")
        ? "Voor dit dossier kan nu geen nieuw voorstel worden gedaan."
        : "Het afspraakvoorstel kon niet veilig worden opgeslagen.";
    return { ok: false, message };
  }
  revalidatePath("/dealer/gewonnen");
  revalidatePath("/mijn-aanvraag");
  return { ok: true, message: "De afspraakmogelijkheden zijn opgeslagen. De verkoper kan nu één moment bevestigen of een alternatief vragen." };
}

export async function recordInspectionAction(input: unknown): Promise<PhaseFourActionResult> {
  await requireDealer();
  const parsed = inspectionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Controleer het inspectieverslag en tijdstip." };
  const proposedPriceCents = parsed.data.proposedPrice
    ? parseEuroAmountToCents(parsed.data.proposedPrice)
    : null;
  if (parsed.data.proposedPrice && proposedPriceCents === null) return { ok: false, message: "Vul een geldig nieuw prijsvoorstel in." };
  if (proposedPriceCents !== null && parsed.data.adjustmentReason.length < 10) {
    return { ok: false, message: "Onderbouw een afwijkend prijsvoorstel met minimaal tien tekens." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("dealer_record_inspection", {
    p_appointment_id: parsed.data.appointmentId,
    p_status: parsed.data.status,
    p_mileage_km: parsed.data.status === "completed" ? parsed.data.mileageKm : null,
    p_findings: parsed.data.findings,
    p_deviation_description: parsed.data.deviationDescription,
    p_proposed_price_cents: proposedPriceCents,
    p_adjustment_reason: parsed.data.adjustmentReason,
    p_inspected_at: parsed.data.inspectedAt,
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) {
    const message = error.message.includes("confirmed_appointment_required")
      ? "Alleen een bevestigde afspraak kan worden geïnspecteerd."
      : error.message.includes("adjustment_reason_required")
        ? "Een afwijkend prijsvoorstel moet duidelijk worden onderbouwd."
        : "Het inspectieverslag kon niet veilig worden opgeslagen.";
    return { ok: false, message };
  }
  revalidatePath("/dealer/gewonnen");
  revalidatePath("/mijn-aanvraag");
  return { ok: true, message: parsed.data.status === "no_show" ? "No-show vastgelegd voor opvolging door Thijs." : "Inspectie opgeslagen. Een afwijkende prijs wacht altijd op actief akkoord van de verkoper." };
}

export async function respondToAgreementAction(input: unknown): Promise<PhaseFourActionResult> {
  await requireDealer();
  const parsed = z.object({ agreementId: z.string().uuid(), accept: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Ongeldig koopconcept." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("dealer_respond_sale_agreement", {
    p_agreement_id: parsed.data.agreementId,
    p_accept: parsed.data.accept,
  });
  if (error) return { ok: false, message: "Je bevestiging kon niet veilig worden opgeslagen." };
  revalidatePath("/dealer/gewonnen");
  revalidatePath("/mijn-aanvraag");
  return { ok: true, message: parsed.data.accept ? "Jouw bevestiging is opgeslagen. De koop is pas akkoord nadat ook de verkoper exact dit concept bevestigt." : "Je afwijzing is opgeslagen en Thijs krijgt een opvolgpunt." };
}

export async function uploadInspectionPhotosAction(formData: FormData): Promise<PhaseFourActionResult> {
  const context = await requireDealer();
  const inspectionId = String(formData.get("inspectionId") ?? "");
  const files = formData.getAll("photos").filter((value): value is File => value instanceof File && value.size > 0);
  if (!z.string().uuid().safeParse(inspectionId).success || files.length < 1 || files.length > 8) {
    return { ok: false, message: "Kies één tot acht geldige inspectiefoto’s." };
  }

  const admin = createAdminClient();
  let uploaded = 0;
  try {
    for (const file of files) {
      const normalized = await inspectAndNormalizePhoto(await file.arrayBuffer(), file.type);
      const path = `inspections/${inspectionId}/${randomUUID()}-${normalized.sha256}.jpg`;
      const { error: uploadError } = await admin.storage.from("vehicle-photos").upload(path, normalized.data, {
        contentType: normalized.mediaType,
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) throw new Error("inspection_photo_upload_failed");
      const { error: registerError } = await admin.rpc("register_inspection_photo", {
        p_inspection_id: inspectionId,
        p_actor_id: context.userId,
        p_storage_path: path,
        p_size_bytes: normalized.sizeBytes,
        p_sha256: normalized.sha256,
      });
      if (registerError) {
        await admin.storage.from("vehicle-photos").remove([path]);
        throw registerError;
      }
      uploaded += 1;
    }
  } catch {
    return { ok: false, message: uploaded ? `${uploaded} foto(’s) opgeslagen; een volgende foto is veilig geweigerd.` : "De inspectiefoto’s konden niet veilig worden opgeslagen." };
  }

  revalidatePath("/dealer/gewonnen");
  revalidatePath("/mijn-aanvraag");
  return { ok: true, message: `${uploaded} inspectiefoto(’s) veilig opgeslagen zonder metadata.` };
}
