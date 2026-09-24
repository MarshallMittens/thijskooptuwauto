import type { Metadata } from "next";

import { DealerHeader } from "@/components/dealer/dealer-header";
import { TestPaymentControls } from "@/components/dealer/test-payment-controls";
import { requireDealer } from "@/lib/auth/dal";
import { formatEuroCents } from "@/lib/bids/amount";
import { dealerPaymentCasesSchema } from "@/lib/payments/schemas";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Testbetalingen | Dealerportaal", robots: { index: false, follow: false } };

export default async function DealerPaymentsPage() {
  await requireDealer();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_dealer_test_payment_cases");
  const parsed = dealerPaymentCasesSchema.safeParse(data);
  const cases = parsed.success ? parsed.data : [];
  return <main className="portal-page"><section className="portal-panel max-w-6xl">
    <DealerHeader />
    <div className="mt-8 rounded-2xl border border-red-300 bg-red-50 p-5"><p className="text-sm font-black uppercase tracking-wide text-red-900">Uitsluitend lokale testsimulator</p><p className="mt-2 text-sm leading-6 text-red-900">Hier wordt geen echt geld verwerkt en er is geen betaalprovider aangesloten. Testkosten zijn €0 omdat hoogte en betalende partij nog niet zijn vastgesteld.</p></div>
    <h1 className="mt-8 text-4xl font-black tracking-[-0.05em]">Testbetalingen</h1>
    {error || !parsed.success ? <p className="mt-6 rounded-xl bg-red-50 p-4">De testbetalingen konden niet veilig worden geladen.</p> : null}
    {!cases.length ? <p className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-600">Er zijn nog geen door beide partijen bevestigde koopconcepten.</p> : null}
    <div className="mt-6 space-y-6">{cases.map((item) => <article key={item.agreementId} className="rounded-2xl border border-slate-200 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono font-bold text-[#a64b00]">{item.vehicle.registration}</p><h2 className="mt-2 text-2xl font-black">{item.vehicle.make} {item.vehicle.model}</h2></div><p className="rounded-xl bg-slate-100 px-4 py-3 font-black">{formatEuroCents(item.agreedPriceCents)}</p></div>
      <dl className="mt-5 grid gap-4 sm:grid-cols-3"><Data label="Ontvanger-onboarding" value={item.onboardingStatus} /><Data label="Betaalstatus" value={item.payment?.status ?? "niet gestart"} /><Data label="Omgeving" value="simulated / test" /></dl>
      {item.payment && <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm"><p>Voertuigbedrag: <strong>{formatEuroCents(item.payment.vehicleAmountCents)}</strong></p><p className="mt-1">Testvergoeding: <strong>{formatEuroCents(item.payment.platformFeeCents)}</strong> ({item.payment.feeConfigurationStatus})</p><p className="mt-1">Ontvangen: <strong>{formatEuroCents(item.payment.receivedCents)}</strong> · terugbetaald: <strong>{formatEuroCents(item.payment.refundedCents)}</strong></p></div>}
      <TestPaymentControls agreementId={item.agreementId} onboardingStatus={item.onboardingStatus} payment={item.payment ? { id: item.payment.id, status: item.payment.status, handover: item.payment.handover } : null} />
    </article>)}</div>
  </section></main>;
}

function Data({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1">{value}</dd></div>; }
