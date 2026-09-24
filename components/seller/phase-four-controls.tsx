"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";

import {
  respondAppointmentAction,
  respondPriceAdjustmentAction,
  respondSaleAgreementAction,
  type SellerPhaseFourResult,
} from "@/app/mijn-aanvraag/phase4-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatEuroCents } from "@/lib/bids/amount";
import { formatAmsterdamDateTime } from "@/lib/time/format";

export type SellerPhaseFourState = {
  reservation: { id: string; amountCents: number; reservedAt: string; companyName: string } | null;
  appointment: { id: string; status: string; selectedSlot: string | null; sellerNote: string | null; responseDueAt: string | null; proposal: { id: string; slots: string[]; createdAt: string } | null } | null;
  inspection: { id: string; status: string; mileageKm: number | null; findings: string | null; deviationDescription: string | null; inspectedAt: string; photos: Array<{ id: string; storagePath: string; signedUrl: string | null }> } | null;
  priceAdjustment: { id: string; originalBidCents: number; proposedPriceCents: number; reason: string; status: string } | null;
  agreement: { id: string; originalBidCents: number; agreedPriceCents: number; termsVersion: string; termsStatus: string; status: string; dealerConfirmedAt: string | null; sellerConfirmedAt: string | null } | null;
};

export function SellerPhaseFourControls({ applicationId, state }: { applicationId: string; state: SellerPhaseFourState }) {
  const [result, setResult] = useState<SellerPhaseFourResult | null>(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  function appointmentResponse(action: "confirm" | "alternative" | "decline") {
    if (!state.appointment) return;
    if (action === "confirm" && !selectedSlot) {
      setResult({ ok: false, message: "Kies eerst één van de voorgestelde momenten." });
      return;
    }
    startTransition(async () => setResult(await respondAppointmentAction({ applicationId, appointmentId: state.appointment!.id, action, selectedSlot: action === "confirm" ? selectedSlot : null, note })));
  }

  function adjustmentResponse(accept: boolean) {
    if (!state.priceAdjustment) return;
    if (!window.confirm(accept ? "Accepteer je dit aparte prijsvoorstel? Daarna volgt nog een afzonderlijk koopconcept." : "Weet je zeker dat je het aangepaste prijsvoorstel afwijst?")) return;
    startTransition(async () => setResult(await respondPriceAdjustmentAction({ applicationId, proposalId: state.priceAdjustment!.id, accept })));
  }

  function agreementResponse(accept: boolean) {
    if (!state.agreement) return;
    if (!window.confirm(accept ? "Bevestig je exact dit voertuig, dit bedrag en deze conceptvoorwaarden?" : "Weet je zeker dat je dit koopconcept afwijst?")) return;
    startTransition(async () => setResult(await respondSaleAgreementAction({ applicationId, agreementId: state.agreement!.id, accept })));
  }

  if (!state.reservation) return null;
  return <section className="mt-8 rounded-2xl border border-orange-200 bg-orange-50/30 p-6">
    <p className="eyebrow">Uitslag en vervolg</p>
    <h3 className="mt-2 text-2xl font-black">Hoogste bod van {state.reservation.companyName}</h3>
    <p className="mt-2 text-3xl font-black text-[#a64b00]">{formatEuroCents(state.reservation.amountCents)}</p>
    <p className="mt-3 text-sm leading-6 text-slate-700">Dit hoogste bod start de afspraakroute. Het is nog geen automatische verkoop of betaling.</p>

    {state.appointment?.status === "proposed" && state.appointment.proposal && <div className="mt-6 rounded-xl bg-white p-5">
      <h4 className="font-black">Kies een afspraakmoment</h4>
      <div className="mt-3 space-y-2">{state.appointment.proposal.slots.map((slot) => <label key={slot} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"><input type="radio" name={`appointment-${state.appointment!.id}`} value={slot} checked={selectedSlot === slot} onChange={(event) => setSelectedSlot(event.target.value)} /><span>{formatAmsterdamDateTime(slot)}</span></label>)}</div>
      <Textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} className="mt-4" placeholder="Eventuele toelichting of gewenst alternatief" />
      <div className="mt-4 flex flex-wrap gap-3"><Button type="button" onClick={() => appointmentResponse("confirm")} disabled={pending}>{pending && <LoaderCircle className="animate-spin" />}Gekozen moment bevestigen</Button><Button type="button" variant="outline" onClick={() => appointmentResponse("alternative")} disabled={pending}>Alternatief vragen</Button><Button type="button" variant="destructive" onClick={() => appointmentResponse("decline")} disabled={pending}>Afwijzen</Button></div>
    </div>}
    {state.appointment?.status === "confirmed" && <p className="mt-6 rounded-xl bg-emerald-50 p-4 font-semibold text-emerald-900">Afspraak bevestigd voor {state.appointment.selectedSlot ? formatAmsterdamDateTime(state.appointment.selectedSlot) : "het gekozen moment"}.</p>}
    {state.appointment?.status === "alternative_requested" && <p className="mt-6 rounded-xl bg-amber-50 p-4 font-semibold text-amber-900">Je hebt om een alternatief gevraagd. De garage kan nieuwe momenten voorstellen.</p>}
    {state.appointment?.status === "declined" && <p className="mt-6 rounded-xl bg-slate-100 p-4 font-semibold">De afspraakroute is afgewezen. Er wordt niet automatisch naar de tweede bieder doorgeschakeld.</p>}

    {state.inspection && <div className="mt-6 rounded-xl bg-white p-5"><h4 className="font-black">Inspectieverslag</h4><p className="mt-2 text-sm">Status: {state.inspection.status} · {formatAmsterdamDateTime(state.inspection.inspectedAt)}</p>{state.inspection.mileageKm !== null && <p className="mt-2 text-sm">Kilometerstand: {state.inspection.mileageKm.toLocaleString("nl-NL")} km</p>}<p className="mt-3 whitespace-pre-wrap text-sm">{state.inspection.findings}</p>{state.inspection.deviationDescription && <p className="mt-3 whitespace-pre-wrap text-sm"><strong>Afwijking:</strong> {state.inspection.deviationDescription}</p>}<div className="mt-4 grid gap-3 sm:grid-cols-3">{state.inspection.photos.map((photo) => photo.signedUrl ? <Image key={photo.id} src={photo.signedUrl} alt="Inspectiefoto" width={640} height={480} unoptimized className="aspect-[4/3] w-full rounded-lg object-cover" /> : null)}</div></div>}

    {state.priceAdjustment && <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-5"><h4 className="font-black">Apart prijsvoorstel na inspectie</h4><p className="mt-2 text-sm">Oorspronkelijk bod: <strong>{formatEuroCents(state.priceAdjustment.originalBidCents)}</strong></p><p className="mt-1 text-sm">Nieuw voorstel: <strong>{formatEuroCents(state.priceAdjustment.proposedPriceCents)}</strong></p><p className="mt-3 whitespace-pre-wrap text-sm">{state.priceAdjustment.reason}</p>{state.priceAdjustment.status === "pending" ? <div className="mt-4 flex gap-3"><Button type="button" onClick={() => adjustmentResponse(true)} disabled={pending}>Prijsvoorstel accepteren</Button><Button type="button" variant="destructive" onClick={() => adjustmentResponse(false)} disabled={pending}>Afwijzen</Button></div> : <p className="mt-4 font-semibold">Status: {state.priceAdjustment.status}</p>}</div>}

    {state.agreement && <div className="mt-6 rounded-xl border border-slate-300 bg-white p-5"><h4 className="font-black">Koopconcept</h4><dl className="mt-3 grid gap-3 sm:grid-cols-3"><Data label="Exact voertuigbedrag" value={formatEuroCents(state.agreement.agreedPriceCents)} /><Data label="Voorwaarden" value={`${state.agreement.termsVersion} (${state.agreement.termsStatus})`} /><Data label="Status" value={state.agreement.status} /></dl><p className="mt-4 text-sm font-semibold text-red-800">Dit is een testconcept en geen betaalverzoek. Juridische voorwaarden moeten vóór livegang worden goedgekeurd.</p>{state.agreement.status === "awaiting_confirmations" && !state.agreement.sellerConfirmedAt && <div className="mt-4 flex gap-3"><Button type="button" onClick={() => agreementResponse(true)} disabled={pending}>Exact koopconcept bevestigen</Button><Button type="button" variant="destructive" onClick={() => agreementResponse(false)} disabled={pending}>Afwijzen</Button></div>}{state.agreement.status === "agreed" && <p className="mt-4 rounded-lg bg-emerald-50 p-3 font-semibold text-emerald-900">Beide partijen hebben exact dit concept bevestigd. Er is nog geen betaling of overdracht gestart.</p>}</div>}
    {result && <p className={`mt-5 rounded-lg p-3 text-sm font-semibold ${result.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`} role="status">{result.message}</p>}
  </section>;
}

function Data({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1">{value}</dd></div>;
}
