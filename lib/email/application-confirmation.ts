import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { formatRegistration } from "@/lib/applications/schema";
import { getEmailSender } from "@/lib/email/sender";

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
  if (!apiKey) return { sent: false, reason: "not_configured" } as const;
  const from = getEmailSender();

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
  const { data: application } = await admin
    .from("applications")
    .select("vehicle_id")
    .eq("id", applicationId)
    .maybeSingle();
  const { data: vehicle } = application?.vehicle_id
    ? await admin
        .from("vehicles")
        .select("registration_normalized, make, model, year")
        .eq("id", application.vehicle_id)
        .maybeSingle()
    : { data: null };
  const registration = vehicle?.registration_normalized
    ? formatRegistration(vehicle.registration_normalized)
    : "onbekend kenteken";
  const vehicleDescription = [vehicle?.make, vehicle?.model, vehicle?.year].filter(Boolean).join(" ");

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
        subject: `Bedankt voor je aanvraag – ${registration}`,
        html: `
          <div style="margin:0;background:#f8f6f2;padding:32px 16px;font-family:Arial,sans-serif;color:#111111">
            <div style="max-width:600px;margin:0 auto;overflow:hidden;border:1px solid #e2e8f0;border-radius:18px;background:#ffffff">
              <div style="background:#111111;padding:22px 28px;color:#ffffff">
                <p style="margin:0;color:#f7941e;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Thijs koopt uw auto</p>
                <h1 style="margin:10px 0 0;font-size:28px;line-height:1.15">Bedankt voor je aanvraag!</h1>
              </div>
              <div style="padding:28px">
                <p style="margin:0 0 18px;line-height:1.7">Beste ${escapeHtml(fullName)},</p>
                <p style="margin:0 0 22px;line-height:1.7">We hebben je autoaanmelding goed ontvangen. Je hoeft je e-mailadres niet te bevestigen.</p>
                <div style="border-left:5px solid #f7941e;border-radius:10px;background:#fff4e6;padding:18px 20px">
                  <p style="margin:0 0 6px;color:#64748b;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase">Kenteken</p>
                  <p style="margin:0;font-size:26px;font-weight:800">${escapeHtml(registration)}</p>
                  ${vehicleDescription ? `<p style="margin:8px 0 0;color:#475569">${escapeHtml(vehicleDescription)}</p>` : ""}
                </div>
                <p style="margin:22px 0 0;line-height:1.7">Thijs bekijkt je gegevens en neemt persoonlijk contact met je op zodra er nieuws is. De aanvraag is gratis en vrijblijvend en garandeert geen bod of verkoop.</p>
                <p style="margin:22px 0 0;color:#64748b;font-size:13px;line-height:1.6">Aanvraagnummer: ${escapeHtml(reference)}</p>
              </div>
            </div>
          </div>
        `,
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
