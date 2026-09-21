import { NextResponse } from "next/server";
import { z } from "zod";

import { applicationPayloadSchema, MAX_PHOTOS } from "@/lib/applications/schema";
import { trySendApplicationConfirmation } from "@/lib/email/application-confirmation";
import { lookupRdwVehicle } from "@/lib/rdw/client";
import { createRateLimitActorKey, hashDraftToken } from "@/lib/security/public-request";
import { createAdminClient } from "@/lib/supabase/admin";
import { inspectAndNormalizePhoto } from "@/lib/uploads/image";

export const runtime = "nodejs";

const requestSchema = z.object({
  idempotencyKey: z.string().uuid(),
  draftId: z.string().uuid(),
  draftToken: z.string().regex(/^[0-9a-f]{64}$/),
  photoPaths: z.array(z.string().max(120)).min(1).max(MAX_PHOTOS),
  payload: applicationPayloadSchema,
  website: z.string().max(0).optional().default(""),
});

const resultSchema = z.object({
  application_id: z.string().uuid(),
  reference: z.string().min(12).max(64),
  created: z.boolean(),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Controleer de ingevulde gegevens." }, { status: 400 });
  }

  const actorKey = createRateLimitActorKey(request);

  const expectedPaths = parsed.data.photoPaths.map((_, index) => `temporary/${parsed.data.draftId}/${index}.jpg`);
  if (parsed.data.photoPaths.some((path, index) => path !== expectedPaths[index])) {
    return NextResponse.json({ error: "Ongeldige fotolijst." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data: draft, error: draftError } = await admin
      .from("application_drafts")
      .select("id, actor_key, token_hash, photo_count, expires_at, finalized_application_id")
      .eq("id", parsed.data.draftId)
      .eq("token_hash", hashDraftToken(parsed.data.draftToken))
      .single();
    if (draftError || !draft || new Date(draft.expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: "De uploadsessie is ongeldig of verlopen." }, { status: 403 });
    }

    if (draft.finalized_application_id) {
      const { data: application } = await admin
        .from("applications")
        .select("public_reference")
        .eq("id", draft.finalized_application_id)
        .single();
      return NextResponse.json({ reference: application?.public_reference, duplicate: true });
    }

    if (draft.photo_count !== parsed.data.photoPaths.length) {
      return NextResponse.json({ error: "Niet alle geselecteerde foto’s zijn ontvangen." }, { status: 400 });
    }

    const photoMetadata = [];
    for (let index = 0; index < parsed.data.photoPaths.length; index += 1) {
      const path = parsed.data.photoPaths[index];
      const { data: stored, error: downloadError } = await admin.storage
        .from("vehicle-photos")
        .download(path);
      if (downloadError) throw new Error("photo_download_failed");

      const normalized = await inspectAndNormalizePhoto(await stored.arrayBuffer(), "image/jpeg");
      const permanentPath = `applications/${parsed.data.draftId}/${index}-${normalized.sha256}.jpg`;
      const { error: uploadError } = await admin.storage
        .from("vehicle-photos")
        .upload(permanentPath, normalized.data, {
          contentType: normalized.mediaType,
          cacheControl: "3600",
          upsert: true,
        });
      if (uploadError) throw new Error("photo_normalization_failed");

      photoMetadata.push({
        storage_path: permanentPath,
        media_type: normalized.mediaType,
        size_bytes: normalized.sizeBytes,
        sha256: normalized.sha256,
        sort_order: index,
      });
    }

    let rdwVehicle = null;
    try {
      rdwVehicle = await lookupRdwVehicle(parsed.data.payload.vehicle.registration);
    } catch {
      // Handmatige invoer blijft geldig als RDW tijdelijk niet beschikbaar is.
    }

    const payload = {
      ...parsed.data.payload,
      vehicle: rdwVehicle
        ? {
            ...parsed.data.payload.vehicle,
            registration: rdwVehicle.registration,
            make: rdwVehicle.make || parsed.data.payload.vehicle.make,
            model: rdwVehicle.model || parsed.data.payload.vehicle.model,
            year: rdwVehicle.year ?? parsed.data.payload.vehicle.year,
            color: rdwVehicle.color || parsed.data.payload.vehicle.color,
            vehicleType: rdwVehicle.vehicleType || parsed.data.payload.vehicle.vehicleType,
            rdwSourceData: rdwVehicle.sourceData,
            rdwFetchedAt: rdwVehicle.fetchedAt,
          }
        : { ...parsed.data.payload.vehicle, rdwSourceData: null, rdwFetchedAt: null },
    };

    const { data, error } = await admin.rpc("finalize_public_application", {
      p_draft_id: parsed.data.draftId,
      p_actor_key: actorKey,
      p_token_hash: hashDraftToken(parsed.data.draftToken),
      p_payload: payload,
      p_photos: photoMetadata,
    });
    if (error) throw error;
    const result = resultSchema.parse(data);

    await admin.storage.from("vehicle-photos").remove(parsed.data.photoPaths);
    await trySendApplicationConfirmation(admin, result.application_id);
    return NextResponse.json({ reference: result.reference, duplicate: !result.created });
  } catch (error) {
    const invalidPhoto = error instanceof Error && [
      "unsupported_photo_type",
      "invalid_photo_size",
      "photo_content_mismatch",
      "normalized_photo_too_large",
    ].includes(error.message);
    return NextResponse.json(
      { error: invalidPhoto ? "Een foto heeft een ongeldig formaat of een onveilige inhoud." : "De aanvraag kon niet worden opgeslagen. Je gegevens blijven in het formulier staan." },
      { status: invalidPhoto ? 422 : 503 },
    );
  }
}
