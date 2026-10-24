import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { formatEuroCents } from "@/lib/bids/amount";
import { getEmailSender } from "@/lib/email/sender";

export async function trySendBidConfirmation(admin: SupabaseClient, bidId: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "not_configured" } as const;
  const from = getEmailSender();

  const { data: notification, error } = await admin
    .from("notification_outbox")
    .select("id, recipient, payload, attempt_count")
    .eq("entity_id", bidId)
    .eq("event_type", "bid.placed")
    .maybeSingle();
  if (error || !notification) return { sent: false, reason: "outbox_unavailable" } as const;

  const payload = notification.payload as { amount_cents?: number; round_ends_at?: string };
  const amount = typeof payload.amount_cents === "number" ? formatEuroCents(payload.amount_cents) : "onbekend";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `bid.placed:${bidId}` },
      body: JSON.stringify({
        from,
        to: [notification.recipient],
        subject: `Je besloten bod van ${amount} is opgeslagen`,
        html: `<p>Je besloten bod van <strong>${amount}</strong> is opgeslagen.</p><p>Dit wijst je bedrijf niet automatisch als koper aan. Je kunt het bod vóór sluiting alleen verhogen.</p>`,
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`resend_status_${response.status}`);
    await admin.from("notification_outbox").update({ status: "sent", sent_at: new Date().toISOString(), attempt_count: notification.attempt_count + 1, last_error: null }).eq("id", notification.id);
    return { sent: true } as const;
  } catch (sendError) {
    const message = sendError instanceof Error ? sendError.message.slice(0, 200) : "unknown_error";
    await admin.from("notification_outbox").update({ status: "failed", attempt_count: notification.attempt_count + 1, last_error: message, next_attempt_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() }).eq("id", notification.id);
    return { sent: false, reason: "send_failed" } as const;
  }
}
