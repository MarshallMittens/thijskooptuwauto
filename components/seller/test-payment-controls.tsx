"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";

import { completeTestOnboardingAction, sellerConfirmTestHandoverAction, startTestOnboardingAction, type SellerPaymentResult } from "@/app/mijn-aanvraag/payment-actions";
import { Button } from "@/components/ui/button";
import { formatEuroCents } from "@/lib/bids/amount";
import type { SellerPaymentState } from "@/lib/payments/schemas";

export function SellerTestPaymentControls({ applicationId, state }: { applicationId: string; state: SellerPaymentState }) {
  const [result, setResult] = useState<SellerPaymentResult | null>(null);
  const [pending, startTransition] = useTransition();
  if (state.agreementStatus !== "agreed") return null;
  const run = (work: () => Promise<SellerPaymentResult>) => startTransition(async () => setResult(await work()));
  return <section className="mt-8 rounded-2xl border border-red-300 bg-red-50/40 p-6">
    <p className="text-xs font-black uppercase tracking-[0.16em] text-red-900">Uitsluitend lokale testsimulator</p>
    <h3 className="mt-2 text-2xl font-black">Testbetaling en overdracht</h3>
    <p className="mt-2 text-sm leading-6 text-slate-700">Er wordt geen echt geld verwerkt. Er zijn geen bankgegevens nodig en de fictieve verificatie is geen echte identiteits- of IBAN-controle.</p>
    {!state.simulatorEnabled && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm font-semibold">Beheer moet de simulator eerst lokaal activeren.</p>}
    {state.simulatorEnabled && !state.onboarding && <Button className="mt-4" disabled={pending} onClick={() => run(() => startTestOnboardingAction({ applicationId, idempotencyKey: crypto.randomUUID() }))}>{pending && <LoaderCircle className="animate-spin" />}Fictieve onboarding starten</Button>}
    {state.onboarding?.status === "pending" && <Button className="mt-4" disabled={pending} onClick={() => run(() => completeTestOnboardingAction({ applicationId }))}>{pending && <LoaderCircle className="animate-spin" />}Fictieve verificatie afronden</Button>}
    {state.onboarding?.status === "verified" && !state.payment && <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">Fictieve ontvanger gereed. De garage kan nu een testcheckout maken.</p>}
    {state.payment && <div className="mt-5 rounded-xl bg-white p-4"><dl className="grid gap-3 sm:grid-cols-3"><Data label="Status" value={state.payment.status} /><Data label="Voertuigbedrag" value={formatEuroCents(state.payment.vehicleAmountCents)} /><Data label="Testvergoeding" value={`${formatEuroCents(state.payment.platformFeeCents)} (${state.payment.feeConfigurationStatus})`} /><Data label="Ontvangen" value={formatEuroCents(state.payment.receivedCents)} /><Data label="Uitbetaling" value={formatEuroCents(state.payment.sellerPayoutCents)} /><Data label="Terugbetaald" value={formatEuroCents(state.payment.refundedCents)} /></dl>{state.payment.status === "received_held" && !state.payment.handover.sellerConfirmedAt && <Button className="mt-4" disabled={pending} onClick={() => run(() => sellerConfirmTestHandoverAction({ paymentOrderId: state.payment!.id }))}>Overdracht testmatig bevestigen</Button>}<p className="mt-4 text-xs text-slate-600">Een terugkeerpagina of schermmelding is nooit betaalbewijs; alleen de gecontroleerde providerstatus hierboven telt.</p></div>}
    {result && <p role="status" className={`mt-4 rounded-lg p-3 text-sm font-semibold ${result.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-100 text-red-900"}`}>{result.message}</p>}
  </section>;
}

function Data({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1">{value}</dd></div>; }
