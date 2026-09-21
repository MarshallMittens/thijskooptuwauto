import { NextResponse } from "next/server";
import { z } from "zod";

import { MAX_PHOTOS } from "@/lib/applications/schema";
import { createDraftToken, createRateLimitActorKey, hashDraftToken } from "@/lib/security/public-request";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const requestSchema = z.object({
  idempotencyKey: z.string().uuid(),
  photoCount: z.number().int().min(1).max(MAX_PHOTOS),
  website: z.string().max(0).optional().default(""),
});

const draftResultSchema = z.object({
  draft_id: z.string().uuid(),
  expires_at: z.string(),
  finalized_application_id: z.string().uuid().nullable(),
  created: z.boolean(),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "De upload kon niet worden voorbereid." }, { status: 400 });
  }

  try {
    const actorKey = createRateLimitActorKey(request);
    const draftToken = createDraftToken(parsed.data.idempotencyKey);
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("create_public_application_draft", {
      p_actor_key: actorKey,
      p_idempotency_key: parsed.data.idempotencyKey,
      p_token_hash: hashDraftToken(draftToken),
      p_photo_count: parsed.data.photoCount,
    });

    if (error) {
      const limited = error.message.includes("rate_limit_exceeded");
      return NextResponse.json(
        { error: limited ? "Er zijn te veel pogingen gedaan. Probeer het over een uur opnieuw." : "De upload kon niet worden voorbereid." },
        { status: limited ? 429 : 503 },
      );
    }

    const draft = draftResultSchema.parse(data);
    if (draft.finalized_application_id) {
      const { data: application } = await admin
        .from("applications")
        .select("public_reference")
        .eq("id", draft.finalized_application_id)
        .single();
      return NextResponse.json({ completed: true, reference: application?.public_reference });
    }

    const uploads = [];
    for (let index = 0; index < parsed.data.photoCount; index += 1) {
      const path = `temporary/${draft.draft_id}/${index}.jpg`;
      const { data: signed, error: signedError } = await admin.storage
        .from("vehicle-photos")
        .createSignedUploadUrl(path, { upsert: true });
      if (signedError) throw signedError;
      uploads.push({ path, token: signed.token });
    }

    return NextResponse.json({
      completed: false,
      draftId: draft.draft_id,
      draftToken,
      expiresAt: draft.expires_at,
      uploads,
    });
  } catch {
    return NextResponse.json(
      { error: "De aanvraagopslag is lokaal nog niet ingericht of tijdelijk niet bereikbaar." },
      { status: 503 },
    );
  }
}
