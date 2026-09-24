"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireDealer, requireUser } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { inspectAndNormalizePhoto } from "@/lib/uploads/image";

export type ComplaintActionResult = { ok: boolean; message: string };

const openSchema = z.object({
  targetId: z.string().uuid(),
  category: z.enum(["appointment", "inspection", "price", "payment", "handover", "conduct", "other"]),
  summary: z.string().trim().min(20).max(4000),
  idempotencyKey: z.string().uuid(),
});

function refreshComplaintPaths() {
  revalidatePath("/mijn-aanvraag");
  revalidatePath("/dealer/klachten");
  revalidatePath("/beheer/operatie");
  revalidatePath("/beheer/aanvragen/[id]", "page");
}

export async function sellerOpenComplaintAction(input: unknown): Promise<ComplaintActionResult> {
  await requireUser("/mijn-aanvraag");
  const parsed = openSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Kies een onderwerp en geef minimaal twintig tekens toelichting." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("seller_open_complaint", {
    p_application_id: parsed.data.targetId,
    p_category: parsed.data.category,
    p_summary: parsed.data.summary,
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) return { ok: false, message: "De klacht kon niet veilig aan dit dossier worden gekoppeld." };
  const reference = z.object({ reference: z.string() }).safeParse(data);
  refreshComplaintPaths();
  return { ok: true, message: `Klacht ontvangen${reference.success ? ` onder nummer ${reference.data.reference}` : ""}. Thijs behandelt het dossier; dit is geen belofte over een reactietermijn.` };
}

export async function dealerOpenComplaintAction(input: unknown): Promise<ComplaintActionResult> {
  await requireDealer();
  const parsed = openSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Kies een onderwerp en geef minimaal twintig tekens toelichting." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("dealer_open_complaint_for_reservation", {
    p_winner_reservation_id: parsed.data.targetId,
    p_category: parsed.data.category,
    p_summary: parsed.data.summary,
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) return { ok: false, message: "De klacht kon niet veilig aan deze aankoop worden gekoppeld." };
  const reference = z.object({ reference: z.string() }).safeParse(data);
  refreshComplaintPaths();
  return { ok: true, message: `Klacht ontvangen${reference.success ? ` onder nummer ${reference.data.reference}` : ""}.` };
}

export async function addComplaintMessageAction(input: unknown): Promise<ComplaintActionResult> {
  await requireUser("/");
  const parsed = z.object({ complaintId: z.string().uuid(), body: z.string().trim().min(2).max(4000) }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Schrijf een geldig bericht van maximaal 4.000 tekens." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_complaint_message", {
    p_complaint_id: parsed.data.complaintId,
    p_body: parsed.data.body,
  });
  if (error) return { ok: false, message: "Dit bericht kon niet aan het klachtendossier worden toegevoegd." };
  refreshComplaintPaths();
  return { ok: true, message: "Bericht toegevoegd aan de tijdlijn." };
}

export async function uploadComplaintEvidenceAction(formData: FormData): Promise<ComplaintActionResult> {
  const actor = await requireUser("/");
  const complaintId = String(formData.get("complaintId") ?? "");
  const files = formData.getAll("evidence").filter((value): value is File => value instanceof File && value.size > 0);
  if (!z.string().uuid().safeParse(complaintId).success || files.length < 1 || files.length > 4) {
    return { ok: false, message: "Kies één tot vier geldige afbeeldingen." };
  }
  const supabase = await createClient();
  const { data: mayUpload, error: accessError } = await supabase.rpc("can_upload_complaint_evidence", {
    p_complaint_id: complaintId,
  });
  if (accessError || mayUpload !== true) {
    return { ok: false, message: "Geen toegang tot een actief klachtendossier voor deze upload." };
  }
  const admin = createAdminClient();
  let uploaded = 0;
  for (const file of files) {
    let path: string | null = null;
    try {
      const normalized = await inspectAndNormalizePhoto(await file.arrayBuffer(), file.type);
      path = `complaints/${complaintId}/${randomUUID()}-${normalized.sha256}.jpg`;
      const { error: uploadError } = await admin.storage.from("complaint-evidence").upload(path, normalized.data, {
        contentType: normalized.mediaType,
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) throw uploadError;
      const { error: registerError } = await admin.rpc("register_complaint_evidence", {
        p_complaint_id: complaintId,
        p_actor_id: actor.userId,
        p_storage_path: path,
        p_size_bytes: normalized.sizeBytes,
        p_sha256: normalized.sha256,
      });
      if (registerError) throw registerError;
      uploaded += 1;
    } catch {
      if (path) await admin.storage.from("complaint-evidence").remove([path]);
      return { ok: false, message: uploaded ? `${uploaded} afbeelding(en) opgeslagen; een volgende afbeelding is geweigerd.` : "Het bewijs kon niet veilig worden verwerkt." };
    }
  }
  refreshComplaintPaths();
  return { ok: true, message: `${uploaded} afbeelding(en) privé en zonder metadata opgeslagen.` };
}
