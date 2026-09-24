import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";

import { getPaymentSimulatorConfig } from "@/lib/env";
import { signSimulatedWebhook, verifySimulatedWebhook } from "@/lib/payments/webhook-signature";
import { createAdminClient } from "@/lib/supabase/admin";

const eventSchema = z.object({
  id: z.string().min(8).max(200),
  paymentReference: z.string().min(8).max(200),
  type: z.enum([
    "payment.received",
    "payment.failed",
    "payment.expired",
    "payment.disputed",
    "payment.release_accepted",
    "payment.paid_out",
    "payment.refunded",
  ]),
  amountCents: z.number().int().min(0),
  currency: z.literal("EUR"),
  recipientReference: z.string().min(8).max(200),
  occurredAt: z.string().datetime(),
});

export type SimulatedPaymentEvent = z.infer<typeof eventSchema>;

export type TestProviderEventInput = Omit<SimulatedPaymentEvent, "id" | "occurredAt">;

export interface PaymentProviderAdapter {
  readonly provider: string;
  readonly environment: "test" | "production";
  emitTestEvent(input: TestProviderEventInput): Promise<Awaited<ReturnType<typeof processSignedSimulatedWebhook>>>;
}

export async function ensureTestPaymentSimulatorEnabled(actorId: string) {
  getPaymentSimulatorConfig();
  const admin = createAdminClient();
  const { error } = await admin.rpc("set_test_payment_simulator_enabled", { p_enabled: true, p_actor_id: actorId });
  if (error) throw new Error("De lokale betaalsimulator kon niet veilig worden geactiveerd.");
}

export async function processSignedSimulatedWebhook(rawBody: string, timestampHeader: string | null, signatureHeader: string | null) {
  const { webhookSecret } = getPaymentSimulatorConfig();
  if (!verifySimulatedWebhook(rawBody, timestampHeader, signatureHeader, webhookSecret)) {
    return { ok: false as const, status: 401, message: "Ongeldige testwebhookhandtekening." };
  }
  let raw: unknown;
  try { raw = JSON.parse(rawBody); } catch { return { ok: false as const, status: 400, message: "Ongeldige testwebhookinhoud." }; }
  const parsed = eventSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, status: 400, message: "Ongeldige testwebhookinhoud." };
  const payloadSha256 = createHash("sha256").update(rawBody).digest("hex");
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("process_simulated_payment_event", {
    p_provider_event_id: parsed.data.id,
    p_provider_payment_reference: parsed.data.paymentReference,
    p_event_type: parsed.data.type,
    p_amount_cents: parsed.data.amountCents,
    p_currency: parsed.data.currency,
    p_recipient_reference: parsed.data.recipientReference,
    p_provider_occurred_at: parsed.data.occurredAt,
    p_payload_sha256: payloadSha256,
  });
  if (error) return { ok: false as const, status: 409, message: error.message };
  return { ok: true as const, status: 200, data };
}

export async function emitLocalSimulatedEvent(input: TestProviderEventInput) {
  const { webhookSecret } = getPaymentSimulatorConfig();
  const event: SimulatedPaymentEvent = { ...input, id: `test_evt_${randomUUID()}`, occurredAt: new Date().toISOString() };
  const rawBody = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);
  return processSignedSimulatedWebhook(rawBody, String(timestamp), signSimulatedWebhook(rawBody, timestamp, webhookSecret));
}

export const simulatedPaymentAdapter: PaymentProviderAdapter = {
  provider: "simulated",
  environment: "test",
  emitTestEvent: emitLocalSimulatedEvent,
};
