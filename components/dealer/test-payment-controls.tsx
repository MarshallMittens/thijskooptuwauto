"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";

import { createTestPaymentAction, dealerConfirmTestHandoverAction, simulateCheckoutOutcomeAction, type DealerPaymentResult } from "@/app/dealer/betalingen/actions";
import { Button } from "@/components/ui/button";

export function TestPaymentControls({ agreementId, onboardingStatus, payment }: {
  agreementId: string;
  onboardingStatus: string;
  payment: { id: string; status: string; handover: { dealerConfirmedAt: string | null } } | null;
}) {
  const [result, setResult] = useState<DealerPaymentResult | null>(null);
  const [pending, startTransition] = useTransition();
  const run = (work: () => Promise<DealerPaymentResult>) => startTransition(async () => setResult(await work()));

  return <div className="mt-5">
    {!payment && onboardingStatus === "verified" && <Button type="button" disabled={pending} onClick={() => run(() => createTestPaymentAction({ agreementId, idempotencyKey: crypto.randomUUID() }))}>{pending && <LoaderCircle className="animate-spin" />}Testcheckout aanmaken</Button>}
    {!payment && onboardingStatus !== "verified" && <p className="rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-950">De verkoper moet de lokale test-onboarding eerst afronden.</p>}
    {payment?.status === "checkout_pending" && <div className="flex flex-wrap gap-3"><Button type="button" disabled={pending} onClick={() => run(() => simulateCheckoutOutcomeAction({ paymentOrderId: payment.id, outcome: "received" }))}>Simuleer volledig ontvangen</Button><Button type="button" variant="outline" disabled={pending} onClick={() => run(() => simulateCheckoutOutcomeAction({ paymentOrderId: payment.id, outcome: "partial" }))}>Gedeeltelijk</Button><Button type="button" variant="destructive" disabled={pending} onClick={() => run(() => simulateCheckoutOutcomeAction({ paymentOrderId: payment.id, outcome: "failed" }))}>Mislukt</Button><Button type="button" variant="outline" disabled={pending} onClick={() => run(() => simulateCheckoutOutcomeAction({ paymentOrderId: payment.id, outcome: "expired" }))}>Verlopen</Button></div>}
    {payment?.status === "partially_paid" && <Button type="button" disabled={pending} onClick={() => run(() => simulateCheckoutOutcomeAction({ paymentOrderId: payment.id, outcome: "received" }))}>Simuleer volledig bedrag ontvangen</Button>}
    {payment?.status === "received_held" && !payment.handover.dealerConfirmedAt && <Button type="button" disabled={pending} onClick={() => run(() => dealerConfirmTestHandoverAction({ paymentOrderId: payment.id }))}>Ontvangst auto testmatig bevestigen</Button>}
    {result && <p role="status" className={`mt-4 rounded-lg p-3 text-sm font-semibold ${result.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`}>{result.message}</p>}
  </div>;
}
