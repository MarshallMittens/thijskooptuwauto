import "server-only";

import { randomUUID } from "node:crypto";
import { z } from "zod";

import { getAppUrl } from "@/lib/config/app-url";
import { getOperationsConfig } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

const itemSchema = z.object({
  id: z.string().uuid(),
  event_type: z.string(),
  entity_type: z.string(),
  entity_id: z.string().uuid(),
  recipient: z.string().email(),
  payload: z.unknown(),
  attempt_count: z.number(),
  idempotency_key: z.string(),
});

const batchSchema = z.array(itemSchema);

const subjects: Record<string, string> = {
  "application.received": "We hebben je autoaanmelding ontvangen",
  "complaint.received": "Je klachtendossier is ontvangen",
  "complaint.updated": "Je klachtendossier is bijgewerkt",
  "payment.status_changed": "De betaalstatus van je dossier is bijgewerkt",
  "bid.placed": "Je bod is opgeslagen",
  "bid.outbid": "Je bent overboden",
  "listing.published": "Er staat een nieuwe auto klaar",
  "auction.outcome": "De biedronde is afgerond",
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character] ?? character);
}

async function deliver(item: z.infer<typeof itemSchema>, apiKey: string, from: string) {
  const subject = subjects[item.event_type] ?? "Er is een update in je dossier";
  const payload = item.payload && typeof item.payload === "object" && !Array.isArray(item.payload)
    ? item.payload as Record<string, unknown>
    : {};
  const listingId = typeof payload.listing_id === "string" && /^[0-9a-f-]{36}$/i.test(payload.listing_id)
    ? payload.listing_id
    : null;
  const portalPath = item.event_type.startsWith("complaint")
    ? "/mijn-aanvraag"
    : listingId
      ? `/dealer/aanbod/${listingId}`
      : "/dealer";
  const portalUrl = new URL(portalPath, getAppUrl()).toString();
  const html = item.event_type === "bid.outbid"
    ? `<h1>Je bent overboden</h1><p>Een andere garage heeft een hoger bod geplaatst op een auto waarop jouw bedrijf heeft geboden.</p><p>Wil je nog meebieden? Bekijk het actuele hoogste bod en de resterende tijd in het dealerportaal.</p><p><a href="${escapeHtml(portalUrl)}">Bekijk de auto en bied opnieuw</a></p><p>Deze melding is geen toewijzing of koopovereenkomst.</p>`
    : `<p>${escapeHtml(subject)}.</p><p><a href="${escapeHtml(portalUrl)}">Open het beveiligde dossier</a> voor de actuele status.</p><p>Reageer niet met wachtwoorden, bankgegevens of identiteitsdocumenten.</p>`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": item.idempotency_key,
    },
    body: JSON.stringify({
      from,
      to: [item.recipient],
      subject,
      html,
    }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`resend_status_${response.status}`);
}

export async function runOutboxBatch(limit = 25) {
  const config = getOperationsConfig();
  if (!config.deliveryEnabled) throw new Error("Outboxbezorging staat uit.");
  const admin = createAdminClient();
  const workerId = randomUUID();
  const { data: runId, error: runError } = await admin.rpc("start_operation_run", { p_operation_type: "outbox_delivery", p_worker_id: workerId });
  if (runError || !runId) throw new Error("Operationele run kon niet worden gestart.");
  let processed = 0;
  let failed = 0;
  try {
    const { data, error } = await admin.rpc("claim_notification_batch", { p_worker_id: workerId, p_limit: Math.min(50, Math.max(1, limit)) });
    if (error) throw error;
    const parsed = batchSchema.safeParse(data);
    if (!parsed.success) throw new Error("Ongeldige outboxbatch ontvangen.");
    for (const item of parsed.data) {
      let sent = false;
      let deliveryError: string | null = null;
      try {
        await deliver(item, config.resendApiKey, config.resendFromEmail);
        sent = true;
      } catch (error) {
        failed += 1;
        deliveryError = error instanceof Error ? error.message.slice(0, 200) : "delivery_failed";
      }
      const { error: completionError } = await admin.rpc("complete_notification_delivery", {
        p_notification_id: item.id,
        p_worker_id: workerId,
        p_sent: sent,
        p_error: deliveryError,
      });
      if (completionError) throw completionError;
      processed += 1;
    }
    const { error: finishError } = await admin.rpc("finish_operation_run", {
      p_run_id: runId,
      p_status: failed ? "completed_with_errors" : "completed",
      p_processed: processed,
      p_failed: failed,
      p_details: { delivery: "resend", batchLimit: limit },
    });
    if (finishError) throw finishError;
    return { processed, failed };
  } catch (error) {
    await admin.rpc("finish_operation_run", {
      p_run_id: runId,
      p_status: "failed",
      p_processed: processed,
      p_failed: failed,
      p_details: { error: error instanceof Error ? error.message.slice(0, 200) : "unknown" },
    });
    throw error;
  }
}
