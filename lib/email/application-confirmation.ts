import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { loadApplicationConfirmationEmail } from "@/lib/email/application-confirmation-content";
import { getEmailSender } from "@/lib/email/sender";


export async function trySendApplicationConfirmation(
  admin: SupabaseClient,
  applicationId: string,
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "not_configured" } as const;
  const from = getEmailSender();

  const { data: notification, error } = await admin
    .from("notification_outbox")
    .select("id, recipient, payload, attempt_count, status")
    .eq("entity_id", applicationId)
    .eq("event_type", "application.received")
    .maybeSingle();
  if (error || !notification) return { sent: false, reason: "outbox_unavailable" } as const;

  if (notification.status === "sent") return { sent: true } as const;

  try {
    const content = await loadApplicationConfirmationEmail(admin, applicationId, notification.payload);
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
        ...content,
        reply_to: "info@thijskooptuwauto.nl",
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
