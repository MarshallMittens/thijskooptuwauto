"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireDealer } from "@/lib/auth/dal";
import { dealerPaymentCasesSchema } from "@/lib/payments/schemas";
import { emitLocalSimulatedEvent } from "@/lib/payments/simulator";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type DealerPaymentResult = { ok: boolean; message: string };

async function getOwnPayment(paymentOrderId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_dealer_test_payment_cases");
  const parsed = dealerPaymentCasesSchema.safeParse(data);
  if (error || !parsed.success) return null;
  const payment = parsed.data.find((item) => item.payment?.id === paymentOrderId)?.payment ?? null;
  if (!payment) return null;
  const admin = createAdminClient();
  const { data: context, error: contextError } = await admin.from("payment_orders").select("recipient_reference").eq("id", paymentOrderId).maybeSingle();
  if (contextError || !context?.recipient_reference) return null;
  return { ...payment, recipientReference: context.recipient_reference };
}

export async function createTestPaymentAction(input: unknown): Promise<DealerPaymentResult> {
  await requireDealer();
  const parsed = z.object({ agreementId: z.string().uuid(), idempotencyKey: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Ongeldig testbetaalverzoek." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("dealer_create_test_payment", {
    p_agreement_id: parsed.data.agreementId,
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) {
    const message = error.message.includes("test_payment_simulator_disabled")
      ? "De lokale betaalsimulator moet eerst door beheer worden geactiveerd."
      : error.message.includes("verified_recipient_required")
        ? "De verkoper moet de lokale test-onboarding eerst afronden."
        : "Het testbetaalverzoek kon niet veilig worden gemaakt.";
    return { ok: false, message };
  }
  revalidatePath("/dealer/betalingen");
  revalidatePath("/mijn-aanvraag");
  return { ok: true, message: "Testcheckout aangemaakt. Er is geen echt geld of externe provider gebruikt." };
}

export async function simulateCheckoutOutcomeAction(input: unknown): Promise<DealerPaymentResult> {
  await requireDealer();
  const parsed = z.object({ paymentOrderId: z.string().uuid(), outcome: z.enum(["received", "partial", "failed", "expired"]) }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Ongeldige testuitkomst." };
  const payment = await getOwnPayment(parsed.data.paymentOrderId);
  if (!payment) return { ok: false, message: "Testbetaling niet gevonden." };
  const type = parsed.data.outcome === "received" || parsed.data.outcome === "partial" ? "payment.received" : parsed.data.outcome === "failed" ? "payment.failed" : "payment.expired";
  const amountCents = parsed.data.outcome === "received" ? payment.buyerChargeCents : parsed.data.outcome === "partial" ? Math.max(1, Math.floor(payment.buyerChargeCents / 2)) : 0;
  let result: Awaited<ReturnType<typeof emitLocalSimulatedEvent>>;
  try {
    result = await emitLocalSimulatedEvent({
      paymentReference: payment.providerPaymentReference,
      type,
      amountCents,
      currency: "EUR",
      recipientReference: payment.recipientReference,
    });
  } catch {
    return { ok: false, message: "De lokale betaalsimulator is niet volledig ingesteld." };
  }
  if (!result.ok && result.message.includes("payment_recipient_mismatch")) {
    return { ok: false, message: "De testprovider heeft een ontvangerafwijking gedetecteerd; beheer moet dit onderzoeken." };
  }
  if (!result.ok) return { ok: false, message: "De testprovideruitkomst kon niet worden verwerkt." };
  revalidatePath("/dealer/betalingen"); revalidatePath("/mijn-aanvraag");
  return { ok: true, message: `Testproviderstatus verwerkt: ${parsed.data.outcome}. Geen echt geld verwerkt.` };
}

export async function dealerConfirmTestHandoverAction(input: unknown): Promise<DealerPaymentResult> {
  await requireDealer();
  const parsed = z.object({ paymentOrderId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Ongeldig overdrachtsdossier." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("dealer_confirm_test_handover", { p_payment_order_id: parsed.data.paymentOrderId });
  if (error) return { ok: false, message: "De testoverdracht kon niet veilig worden bevestigd." };
  revalidatePath("/dealer/betalingen"); revalidatePath("/mijn-aanvraag");
  return { ok: true, message: "Jouw testbevestiging van ontvangst is opgeslagen. Beheer moet de vrijwaring nog apart controleren." };
}
