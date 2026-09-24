import Image from "next/image";
import { z } from "zod";

import { DealerHeader } from "@/components/dealer/dealer-header";
import { WonCaseControls } from "@/components/dealer/won-case-controls";
import { requireDealer } from "@/lib/auth/dal";
import { formatEuroCents } from "@/lib/bids/amount";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formatAmsterdamDateTime } from "@/lib/time/format";

export const metadata = { robots: { index: false, follow: false } };

const caseSchema = z.object({
  reservationId: z.string().uuid(), applicationId: z.string().uuid(), listingId: z.string().uuid(), amountCents: z.number(), reservedAt: z.string(),
  vehicle: z.object({ registration: z.string(), make: z.string().nullable(), model: z.string().nullable(), variant: z.string().nullable(), year: z.number().nullable() }).passthrough(),
  appointment: z.object({ id: z.string().uuid(), status: z.string(), selectedSlot: z.string().nullable(), sellerNote: z.string().nullable(), responseDueAt: z.string().nullable(), proposal: z.object({ id: z.string().uuid(), slots: z.array(z.string()), createdAt: z.string() }).nullable() }).nullable(),
  sellerContact: z.object({ fullName: z.string(), email: z.string(), phone: z.string(), postalCode: z.string() }).nullable(),
  inspection: z.object({ id: z.string().uuid(), status: z.string(), mileageKm: z.number().nullable(), findings: z.string().nullable(), deviationDescription: z.string().nullable(), inspectedAt: z.string(), photos: z.array(z.object({ id: z.string().uuid(), storagePath: z.string() })) }).nullable(),
  priceAdjustment: z.object({ id: z.string().uuid(), originalBidCents: z.number(), proposedPriceCents: z.number(), reason: z.string(), status: z.string() }).nullable(),
  agreement: z.object({ id: z.string().uuid(), originalBidCents: z.number(), agreedPriceCents: z.number(), termsVersion: z.string(), termsStatus: z.string(), status: z.string(), dealerConfirmedAt: z.string().nullable(), sellerConfirmedAt: z.string().nullable() }).nullable(),
});

export default async function WonCasesPage({ searchParams }: { searchParams: Promise<{ bericht?: string }> }) {
  await requireDealer();
  const params = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_dealer_won_cases");
  const parsed = z.array(caseSchema).safeParse(data);
  const cases = parsed.success ? parsed.data : [];
  const admin = createAdminClient();
  const withPhotos = await Promise.all(cases.map(async (item) => ({
    ...item,
    inspection: item.inspection ? {
      ...item.inspection,
      photos: await Promise.all(item.inspection.photos.map(async (photo) => {
        const { data: signed } = await admin.storage.from("vehicle-photos").createSignedUrl(photo.storagePath, 300);
        return { ...photo, url: signed?.signedUrl ?? null };
      })),
    } : null,
  })));

  return <main className="portal-page"><section className="portal-panel max-w-6xl">
    <DealerHeader />
    <div className="mt-8"><p className="eyebrow">Na de biedronde</p><h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Gewonnen dossiers</h1><p className="mt-3 max-w-3xl text-slate-600">Een winnaarreservering is nog geen koop. Plan eerst samen een afspraak, registreer de inspectie en laat beide partijen exact hetzelfde koopconcept bevestigen.</p></div>
    {params.bericht && <p className="mt-6 rounded-xl bg-emerald-50 p-4 font-semibold text-emerald-900">{params.bericht}</p>}
    {error || !parsed.success ? <p className="mt-8 rounded-xl bg-red-50 p-4 text-red-900">De gewonnen dossiers konden niet veilig worden geladen.</p> : null}
    {!error && parsed.success && !withPhotos.length ? <p className="mt-8 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-600">Er zijn nog geen gewonnen biedrondes voor jouw bedrijf.</p> : null}
    <div className="mt-8 space-y-8">{withPhotos.map((item) => <article key={item.reservationId} className="rounded-2xl border border-slate-200 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono font-bold text-[#a64b00]">{item.vehicle.registration}</p><h2 className="mt-2 text-2xl font-black">{item.vehicle.make} {item.vehicle.model}</h2><p className="mt-2 text-slate-600">{[item.vehicle.variant, item.vehicle.year].filter(Boolean).join(" · ")}</p></div><div className="rounded-xl bg-emerald-50 px-4 py-3"><p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Bevroren winnend bod</p><p className="mt-1 text-xl font-black text-emerald-950">{formatEuroCents(item.amountCents)}</p></div></div>
      <div className="mt-6 grid gap-4 md:grid-cols-3"><Data label="Gereserveerd" value={formatAmsterdamDateTime(item.reservedAt)} /><Data label="Afspraak" value={item.appointment?.status ?? "Nog niet voorgesteld"} /><Data label="Koopconcept" value={item.agreement?.status ?? "Nog niet aangemaakt"} /></div>
      {item.appointment?.proposal && <section className="mt-6 rounded-xl bg-slate-50 p-4"><h3 className="font-black">Voorgestelde momenten</h3><ul className="mt-2 space-y-1 text-sm">{item.appointment.proposal.slots.map((slot) => <li key={slot}>{formatAmsterdamDateTime(slot)}</li>)}</ul>{item.appointment.sellerNote && <p className="mt-3 text-sm"><strong>Reactie verkoper:</strong> {item.appointment.sellerNote}</p>}</section>}
      {item.sellerContact && <section className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><h3 className="font-black">Contact na bevestigde afspraak</h3><p className="mt-2 text-sm">{item.sellerContact.fullName} · <a className="underline" href={`tel:${item.sellerContact.phone}`}>{item.sellerContact.phone}</a> · <a className="underline" href={`mailto:${item.sellerContact.email}`}>{item.sellerContact.email}</a> · {item.sellerContact.postalCode}</p></section>}
      {item.inspection && <section className="mt-6 rounded-xl bg-slate-50 p-4"><h3 className="font-black">Inspectie</h3><dl className="mt-3 grid gap-3 md:grid-cols-3"><Data label="Status" value={item.inspection.status} /><Data label="Kilometerstand" value={item.inspection.mileageKm === null ? null : `${item.inspection.mileageKm.toLocaleString("nl-NL")} km`} /><Data label="Tijdstip" value={formatAmsterdamDateTime(item.inspection.inspectedAt)} /></dl><p className="mt-3 whitespace-pre-wrap text-sm">{item.inspection.findings}</p>{item.inspection.deviationDescription && <p className="mt-3 whitespace-pre-wrap text-sm"><strong>Afwijking:</strong> {item.inspection.deviationDescription}</p>}<div className="mt-4 grid gap-3 sm:grid-cols-3">{item.inspection.photos.map((photo) => photo.url ? <Image key={photo.id} src={photo.url} alt="Inspectiefoto" width={640} height={480} unoptimized className="aspect-[4/3] w-full rounded-lg object-cover" /> : null)}</div></section>}
      {item.priceAdjustment && <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4"><h3 className="font-black">Afzonderlijk prijsvoorstel</h3><p className="mt-2 text-sm">Oorspronkelijk bod: <strong>{formatEuroCents(item.priceAdjustment.originalBidCents)}</strong> · Voorstel: <strong>{formatEuroCents(item.priceAdjustment.proposedPriceCents)}</strong> · Status: {item.priceAdjustment.status}</p><p className="mt-2 text-sm">{item.priceAdjustment.reason}</p></section>}
      {item.agreement && <section className="mt-6 rounded-xl border border-slate-200 p-4"><h3 className="font-black">Koopconcept</h3><dl className="mt-3 grid gap-3 md:grid-cols-3"><Data label="Exact bedrag" value={formatEuroCents(item.agreement.agreedPriceCents)} /><Data label="Voorwaarden" value={`${item.agreement.termsVersion} (${item.agreement.termsStatus})`} /><Data label="Status" value={item.agreement.status} /></dl><p className="mt-3 text-sm text-red-800">De voorwaardenstatus is test zolang deze niet juridisch is goedgekeurd. Er wordt in fase 4 geen betaling gestart.</p></section>}
      <WonCaseControls reservationId={item.reservationId} amountCents={item.amountCents} appointment={item.appointment ? { id: item.appointment.id, status: item.appointment.status } : null} inspection={item.inspection ? { id: item.inspection.id, status: item.inspection.status, photoCount: item.inspection.photos.length } : null} agreement={item.agreement ? { id: item.agreement.id, status: item.agreement.status, dealerConfirmedAt: item.agreement.dealerConfirmedAt } : null} />
    </article>)}</div>
  </section></main>;
}

function Data({ label, value }: { label: string; value: string | null }) {
  return <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1">{value ?? "—"}</dd></div>;
}
