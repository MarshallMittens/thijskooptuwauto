import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getAppUrl } from "@/lib/config/app-url";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

export async function trySendApplicationConfirmation(
  admin: SupabaseClient,
  applicationId: string,
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return { sent: false, reason: "not_configured" } as const;

  const { data: notification, error } = await admin
    .from("notification_outbox")
    .select("id, recipient, payload, attempt_count")
    .eq("entity_id", applicationId)
    .eq("event_type", "application.received")
    .maybeSingle();
  if (error || !notification) return { sent: false, reason: "outbox_unavailable" } as const;

  const payload = notification.payload as { reference?: string; full_name?: string };
  const reference = payload.reference ?? "onbekend";
  const fullName = payload.full_name ?? "autoverkoper";
  const dossierUrl = new URL("/mijn-aanvraag", getAppUrl());
  if (/^[0-9a-f]{24}$/.test(reference)) dossierUrl.searchParams.set("referentie", reference);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `application.received:${applicationId}`,
      },
      body: JSON.stringify({
        from,
        to: [notification.recipient],
        subject: `We hebben je autoaanmelding ontvangen (${reference})`,
        html: `<p>Beste ${escapeHtml(fullName)},</p><p>We hebben je autoaanmelding ontvangen onder referentie <strong>${escapeHtml(reference)}</strong>.</p><p><a href="${escapeHtml(dossierUrl.toString())}">Verifieer je e-mailadres en open je beveiligde dossier</a>.</p><p>We controleren de gegevens voordat de auto eventueel aan goedgekeurde autobedrijven wordt getoond. Een aanmelding garandeert geen bod of verkoop.</p>`,
      }),
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) throw new Error(`resend_status_${response.status}`);
    await admin.from("notification_outbox").update({
      status: "sent",
      sent_at: new Date().toISOString(),
      attempt_count: notification.attempt_count + 1,
      last_error: null,
    }).eq("id", notification.id);
    return { sent: true } as const;
  } catch (sendError) {
    const message = sendError instanceof Error ? sendError.message.slice(0, 200) : "unknown_error";
    await admin.from("notification_outbox").update({
      status: "failed",
      attempt_count: notification.attempt_count + 1,
      last_error: message,
      next_attempt_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    }).eq("id", notification.id);
    return { sent: false, reason: "send_failed" } as const;
  }
}
