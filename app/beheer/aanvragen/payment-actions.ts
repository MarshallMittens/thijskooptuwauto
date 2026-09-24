"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/dal";
import { adminPaymentStateSchema } from "@/lib/payments/schemas";
import { emitLocalSimulatedEvent, ensureTestPaymentSimulatorEnabled } from "@/lib/payments/simulator";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AdminPaymentResult = { ok: boolean; message: string };

async function refreshPaymentState(applicationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_admin_test_payment_state", { p_application_id: applicationId });
  const parsed = adminPaymentStateSchema.safeParse(data);
  return error || !parsed.success ? null : parsed.data;
}

function revalidatePaymentPaths(applicationId: string) {
  revalidatePath(`/beheer/aanvragen/${applicationId}`);
  revalidatePath("/dealer/betalingen");
  revalidatePath("/mijn-aanvraag");
}

export async function activateTestPaymentSimulatorAction(input: unknown): Promise<AdminPaymentResult> {
  const actor = await requireAdmin();
  const parsed = z.object({ applicationId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Ongeldige aanvraag." };
  try { await ensureTestPaymentSimulatorEnabled(actor.userId); } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "De lokale simulator kon niet worden geactiveerd." };
  }
  revalidatePaymentPaths(parsed.data.applicationId);
  return { ok: true, message: "Lokale testsimulator geactiveerd. Productie en echte geldstromen blijven uitgeschakeld." };
}

export async function adminPaymentCommandAction(input: unknown): Promise<AdminPaymentResult> {
  await requireAdmin();
  const parsed = z.object({
    applicationId: z.string().uuid(), paymentOrderId: z.string().uuid(),
    command: z.enum(["verify_handover", "request_release", "simulate_release", "simulate_payout", "simulate_dispute", "request_refund", "simulate_refund"]),
    reason: z.string().trim().max(1000).optional(),
  }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Ongeldige testbetaalactie." };
  let state = await refreshPaymentState(parsed.data.applicationId);
  if (!state?.payment || state.payment.id !== parsed.data.paymentOrderId) return { ok: false, message: "Testbetaling niet gevonden." };
  const supabase = await createClient();
  try {
    if (parsed.data.command === "verify_handover") {
      const { error } = await supabase.rpc("admin_verify_test_handover", { p_payment_order_id: parsed.data.paymentOrderId });
      if (error) throw error;
    } else if (parsed.data.command === "request_release") {
      const { error } = await supabase.rpc("admin_request_test_release", { p_payment_order_id: parsed.data.paymentOrderId });
      if (error) throw error;
    } else if (parsed.data.command === "request_refund") {
      if (!parsed.data.reason || parsed.data.reason.length < 10) return { ok: false, message: "Geef voor een testrefund een reden van minimaal tien tekens." };
      const refundable = state.payment.received_cents - state.payment.refunded_cents;
      const { error } = await supabase.rpc("admin_request_test_refund", {
        p_payment_order_id: parsed.data.paymentOrderId, p_amount_cents: refundable,
        p_reason: parsed.data.reason, p_idempotency_key: crypto.randomUUID(),
      });
      if (error) throw error;
    } else {
      state = await refreshPaymentState(parsed.data.applicationId);
      if (!state?.payment) throw new Error("payment_missing");
      const type = parsed.data.command === "simulate_release" ? "payment.release_accepted"
        : parsed.data.command === "simulate_payout" ? "payment.paid_out"
          : parsed.data.command === "simulate_dispute" ? "payment.disputed" : "payment.refunded";
      const amountCents = type === "payment.refunded" ? state.payment.received_cents - state.payment.refunded_cents
        : type === "payment.disputed" ? state.payment.received_cents : state.payment.seller_payout_cents;
      const event = await emitLocalSimulatedEvent({
        paymentReference: state.payment.provider_payment_reference, type, amountCents,
        currency: "EUR", recipientReference: state.payment.recipient_reference,
      });
      if (!event.ok) throw new Error(event.message);
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : "";
    const message = detail.includes("verified_handover_required") || detail.includes("dual_handover_confirmation_required")
      ? "Vrijgave blijft geblokkeerd totdat beide partijen en beheer de overdracht hebben bevestigd."
      : detail.includes("test_payment_simulator_disabled") ? "Activeer eerst de lokale testsimulator."
        : "De testbetaalactie is veilig geweigerd.";
    return { ok: false, message };
  }
  revalidatePaymentPaths(parsed.data.applicationId);
  return { ok: true, message: "Testactie opgeslagen. Er is geen echt geld verwerkt." };
}

export async function runTestReconciliationAction(input: unknown): Promise<AdminPaymentResult> {
  await requireAdmin();
  const parsed = z.object({ applicationId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Ongeldige aanvraag." };
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("run_test_payment_reconciliation");
    if (error) throw error;
    const result = z.object({ checked_count: z.number(), mismatch_count: z.number() }).safeParse(data);
    const checked = result.success ? result.data.checked_count : 0;
    const mismatches = result.success ? result.data.mismatch_count : 0;
    revalidatePaymentPaths(parsed.data.applicationId);
    return { ok: mismatches === 0, message: `Testreconciliatie controleerde ${checked} betaling(en) en vond ${mismatches} verschil(len).` };
  } catch {
    return { ok: false, message: "De testreconciliatie kon niet worden uitgevoerd." };
  }
}
