"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type SellerPaymentResult = { ok: boolean; message: string };

export async function startTestOnboardingAction(input: unknown): Promise<SellerPaymentResult> {
  const parsed = z.object({ applicationId: z.string().uuid(), idempotencyKey: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Ongeldig test-onboardingverzoek." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("seller_start_test_payment_onboarding", { p_application_id: parsed.data.applicationId, p_idempotency_key: parsed.data.idempotencyKey });
  if (error) return { ok: false, message: error.message.includes("test_payment_simulator_disabled") ? "De lokale betaalsimulator is nog niet door beheer geactiveerd." : "De test-onboarding kon niet veilig worden gestart." };
  revalidatePath("/mijn-aanvraag"); revalidatePath("/dealer/betalingen");
  return { ok: true, message: "Lokale test-onboarding gestart. Er zijn geen bankgegevens gevraagd of opgeslagen." };
}

export async function completeTestOnboardingAction(input: unknown): Promise<SellerPaymentResult> {
  const parsed = z.object({ applicationId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Ongeldig test-onboardingverzoek." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("seller_complete_test_payment_onboarding", { p_application_id: parsed.data.applicationId });
  if (error) return { ok: false, message: "De fictieve testontvanger kon niet worden geverifieerd." };
  revalidatePath("/mijn-aanvraag"); revalidatePath("/dealer/betalingen");
  return { ok: true, message: "Fictieve testontvanger geverifieerd. Dit is geen echte identiteit- of IBAN-controle." };
}

export async function sellerConfirmTestHandoverAction(input: unknown): Promise<SellerPaymentResult> {
  const parsed = z.object({ paymentOrderId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Ongeldig overdrachtsdossier." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("seller_confirm_test_handover", { p_payment_order_id: parsed.data.paymentOrderId });
  if (error) return { ok: false, message: "De testoverdracht kon niet veilig worden bevestigd." };
  revalidatePath("/mijn-aanvraag"); revalidatePath("/dealer/betalingen");
  return { ok: true, message: "Jouw testbevestiging van overdracht is opgeslagen. Dit geeft nog geen geld vrij." };
}
