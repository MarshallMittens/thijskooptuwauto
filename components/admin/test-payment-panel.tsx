"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";

import { activateTestPaymentSimulatorAction, adminPaymentCommandAction, runTestReconciliationAction, type AdminPaymentResult } from "@/app/beheer/aanvragen/payment-actions";
import { createTestInvoiceRecordAction } from "@/app/beheer/operatie/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatEuroCents } from "@/lib/bids/amount";
import type { AdminPaymentState } from "@/lib/payments/schemas";
import { formatAmsterdamDateTime } from "@/lib/time/format";

export function TestPaymentPanel({ applicationId, state }: { applicationId: string; state: AdminPaymentState }) {
  const [result, setResult] = useState<AdminPaymentResult | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [pending, startTransition] = useTransition();
  const run = (work: () => Promise<AdminPaymentResult>) => startTransition(async () => setResult(await work()));
  const command = (value: "verify_handover" | "request_release" | "simulate_release" | "simulate_payout" | "simulate_dispute" | "request_refund" | "simulate_refund") => {
    if (!state.payment) return;
    run(() => adminPaymentCommandAction({ applicationId, paymentOrderId: state.payment!.id, command: value, reason: refundReason }));
  };
  return <section className="mt-8 rounded-2xl border border-red-300 bg-red-50/30 p-6">
    <p className="text-xs font-black uppercase tracking-[0.16em] text-red-900">Fase 5 · lokale testsimulator</p>
    <h2 className="mt-2 text-2xl font-black">Betaling, overdracht en uitbetaling</h2>
    <p className="mt-2 text-sm leading-6 text-slate-700">Dit scherm verplaatst geen geld en gebruikt geen externe provider. De simulator is in productie hard geblokkeerd. Testkosten zijn €0 zolang bedrag en betaler niet zijn vastgesteld.</p>
    {!state.simulatorEnabled && <Button className="mt-5" variant="destructive" disabled={pending} onClick={() => run(() => activateTestPaymentSimulatorAction({ applicationId }))}>{pending && <LoaderCircle className="animate-spin" />}Lokale simulator activeren</Button>}
    {state.simulatorEnabled && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-950">Simulator actief voor deze lokale database. Niet gebruiken als betaalbewijs.</p>}
    {state.onboarding && <p className="mt-4 text-sm"><strong>Fictieve ontvanger-onboarding:</strong> {state.onboarding.status}</p>}
    {state.payment && <div className="mt-5 rounded-xl bg-white p-5">
      <dl className="grid gap-4 sm:grid-cols-3"><Data label="Status" value={state.payment.status} /><Data label="Voertuigbedrag" value={formatEuroCents(state.payment.vehicle_amount_cents)} /><Data label="Testvergoeding" value={`${formatEuroCents(state.payment.platform_fee_cents)} (${state.payment.fee_configuration_status})`} /><Data label="Ontvangen" value={formatEuroCents(state.payment.received_cents)} /><Data label="Uitbetaling" value={formatEuroCents(state.payment.seller_payout_cents)} /><Data label="Terugbetaald" value={formatEuroCents(state.payment.refunded_cents)} /></dl>
      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3"><Data label="Verkoper overdracht" value={state.handover?.seller_confirmed_at ? formatAmsterdamDateTime(state.handover.seller_confirmed_at) : "nee"} /><Data label="Dealer ontvangst" value={state.handover?.dealer_confirmed_at ? formatAmsterdamDateTime(state.handover.dealer_confirmed_at) : "nee"} /><Data label="Vrijwaring testmatig gecontroleerd" value={state.handover?.vrijwaring_verified_at ? formatAmsterdamDateTime(state.handover.vrijwaring_verified_at) : "nee"} /></div>
      <div className="mt-5 flex flex-wrap gap-3">
        {state.payment.status === "received_held" && !state.handover?.vrijwaring_verified_at && <Button type="button" disabled={pending} onClick={() => command("verify_handover")}>Testvrijwaring verifiëren</Button>}
        {state.payment.status === "received_held" && state.handover?.vrijwaring_verified_at && <Button type="button" disabled={pending} onClick={() => command("request_release")}>Testvrijgave aanvragen</Button>}
        {state.payment.status === "release_pending" && <Button type="button" disabled={pending} onClick={() => command("simulate_release")}>Provideracceptatie simuleren</Button>}
        {state.payment.status === "payout_pending" && <Button type="button" disabled={pending} onClick={() => command("simulate_payout")}>Uitbetaling simuleren</Button>}
        {["received_held", "release_pending", "payout_pending", "paid_out"].includes(state.payment.status) && <Button type="button" variant="destructive" disabled={pending} onClick={() => command("simulate_dispute")}>Geschil simuleren</Button>}
      </div>
      {["received_held", "disputed", "paid_out"].includes(state.payment.status) && <div className="mt-5"><Textarea value={refundReason} onChange={(event) => setRefundReason(event.target.value)} placeholder="Reden voor volledige testrefund (minimaal 10 tekens)" maxLength={1000} /><Button className="mt-3" variant="destructive" disabled={pending} onClick={() => command("request_refund")}>Volledige testrefund aanvragen</Button></div>}
      {state.payment.status === "refund_pending" && <Button className="mt-5" type="button" disabled={pending} onClick={() => command("simulate_refund")}>Providerrefund simuleren</Button>}
      <div className="mt-5 border-t border-slate-200 pt-5"><p className="text-sm font-bold">Platformdocumentatie</p><p className="mt-1 text-xs text-slate-600">Maakt uitsluitend een geblokkeerd testrecord van €0. Er wordt geen fiscale factuur gegenereerd zolang kostenbetaler en btw-behandeling niet zijn goedgekeurd.</p><Button className="mt-3" type="button" variant="outline" disabled={pending} onClick={() => run(() => createTestInvoiceRecordAction({ paymentOrderId: state.payment!.id, documentType: "invoice", correctedInvoiceId: null, reason: "Testrecord; kostenbetaler en fiscale behandeling zijn nog niet vastgesteld." }))}>Geblokkeerd testfactuurrecord maken</Button></div>
    </div>}
    {state.simulatorEnabled && <Button className="mt-5" variant="outline" disabled={pending} onClick={() => run(() => runTestReconciliationAction({ applicationId }))}>Testreconciliatie uitvoeren</Button>}
    {state.lastReconciliation && <p className={`mt-4 rounded-lg p-3 text-sm font-semibold ${state.lastReconciliation.mismatchCount ? "bg-red-100 text-red-900" : "bg-emerald-50 text-emerald-900"}`}>Laatste reconciliatie: {state.lastReconciliation.checkedCount} gecontroleerd, {state.lastReconciliation.mismatchCount} verschil(len).</p>}
    {state.events.length > 0 && <div className="mt-5"><h3 className="font-black">Provider-events</h3><ul className="mt-2 space-y-2 text-sm">{state.events.map((event) => <li key={event.id}>{formatAmsterdamDateTime(event.occurredAt)} · {event.eventType}{event.amountCents === null ? "" : ` · ${formatEuroCents(event.amountCents)}`}</li>)}</ul></div>}
    {state.refunds.length > 0 && <div className="mt-5"><h3 className="font-black">Refunds</h3><ul className="mt-2 space-y-2 text-sm">{state.refunds.map((refund) => <li key={refund.id}>{formatEuroCents(refund.amountCents)} · {refund.status} · {refund.reason}</li>)}</ul></div>}
    {result && <p role="status" className={`mt-4 rounded-lg p-3 text-sm font-semibold ${result.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-100 text-red-900"}`}>{result.message}</p>}
  </section>;
}

function Data({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1">{value}</dd></div>; }
