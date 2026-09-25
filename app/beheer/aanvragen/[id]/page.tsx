import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { addInternalNote, reviewPhoto } from "@/app/beheer/aanvragen/actions";
import { ApplicationStatusControls } from "@/components/admin/application-status-controls";
import { MarketControls } from "@/components/admin/market-controls";
import { PhaseFourControls } from "@/components/admin/phase-four-controls";
import { TestPaymentPanel } from "@/components/admin/test-payment-panel";
import { ComplaintAdminPanel } from "@/components/admin/complaint-admin-panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { requireAdmin } from "@/lib/auth/dal";
import { formatEuroCents } from "@/lib/bids/amount";
import { adminPaymentStateSchema } from "@/lib/payments/schemas";
import { complaintsSchema } from "@/lib/operations/schemas";
import { createClient } from "@/lib/supabase/server";
import { formatAmsterdamDateTime } from "@/lib/time/format";

const detailSchema = z.object({
  id: z.string().uuid(), reference: z.string(), status: z.string(), submittedAt: z.string().nullable(),
  seller: z.object({ fullName: z.string(), email: z.string(), phone: z.string(), postalCode: z.string(), desiredSaleDate: z.string().nullable() }),
  vehicle: z.object({ registration: z.string(), make: z.string().nullable(), model: z.string().nullable(), variant: z.string().nullable(), year: z.number().nullable(), fuelType: z.string().nullable(), color: z.string().nullable(), rdwFetchedAt: z.string().nullable() }),
  condition: z.object({ mileageKm: z.number().nullable(), damageDescription: z.string().nullable(), technicalIssues: z.string().nullable(), maintenanceDescription: z.string().nullable(), keyCount: z.number().nullable(), remarks: z.string().nullable() }),
  photos: z.array(z.object({ id: z.string().uuid(), storagePath: z.string(), reviewStatus: z.string(), sortOrder: z.number(), sizeBytes: z.number() })),
  notes: z.array(z.object({ id: z.string().uuid(), body: z.string(), createdAt: z.string(), author: z.string() })),
});

const marketSchema = z.object({
  listingId: z.string().uuid().nullable(), listingStatus: z.string().nullable(), roundId: z.string().uuid().nullable(), roundStatus: z.string().nullable(), startsAt: z.string().nullable(), endsAt: z.string().nullable(),
  outcomeStatus: z.string().nullable(), needsFinalization: z.boolean(), highestBidId: z.string().uuid().nullable(), winnerReservationId: z.string().uuid().nullable(), policyStatus: z.string().nullable(), minimumIncrementCents: z.number().nullable(), feeConfigurationConfirmed: z.boolean(),
  bids: z.array(z.object({ id: z.string().uuid(), companyId: z.string().uuid(), companyName: z.string(), amountCents: z.number(), createdAt: z.string(), isHighest: z.boolean().nullable().transform((value) => value ?? false) })),
});

const caseSchema = z.object({
  deal: z.object({
    id: z.string().uuid().nullable(),
    status: z.enum(["not_started", "discussing", "agreement_pending", "agreed", "completed", "not_sold", "withdrawn"]),
    selectedBidId: z.string().uuid().nullable(),
    agreedAt: z.string().nullable(),
    completedAt: z.string().nullable(),
  }),
  contacts: z.array(z.object({ id: z.string().uuid(), channel: z.string(), summary: z.string(), occurredAt: z.string(), createdAt: z.string(), actor: z.string() })),
  revisions: z.array(z.object({ id: z.string().uuid(), revisionNumber: z.number(), createdAt: z.string() })),
  currentPublishedRevisionId: z.string().uuid().nullable(),
  history: z.array(z.object({ id: z.number(), action: z.string(), createdAt: z.string() })),
});

const verificationSchema = z.object({ verified: z.boolean(), verifiedAt: z.string().nullable() });

const phaseFourSchema = z.object({
  appointment: z.object({
    id: z.string().uuid(), status: z.string(), selected_slot: z.string().nullable(), response_due_at: z.string().nullable(),
  }).passthrough().nullable(),
  inspection: z.object({
    id: z.string().uuid(), status: z.string(), mileage_km: z.number().nullable(), inspected_at: z.string(), deviation_description: z.string().nullable(),
  }).passthrough().nullable(),
  priceAdjustment: z.object({
    id: z.string().uuid(), original_bid_cents: z.number(), proposed_price_cents: z.number(), status: z.string(), reason: z.string(),
  }).passthrough().nullable(),
  agreement: z.object({
    id: z.string().uuid(), original_bid_cents: z.number(), agreed_price_cents: z.number(), terms_version: z.string(), terms_status: z.string(),
    status: z.string(), dealer_confirmed_at: z.string().nullable(), seller_confirmed_at: z.string().nullable(),
  }).passthrough().nullable(),
  tasks: z.array(z.object({ id: z.string().uuid(), taskType: z.string(), status: z.string(), dueAt: z.string().nullable(), createdAt: z.string() })),
});

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const supabase = await createClient();
  const [{ data, error }, { data: marketData, error: marketError }, { data: caseData, error: caseError }, { data: verificationData, error: verificationError }, { data: phaseFourData, error: phaseFourError }, { data: paymentData, error: paymentError }, { data: complaintData, error: complaintError }] = await Promise.all([
    supabase.rpc("get_admin_application", { p_application_id: id }),
    supabase.rpc("get_admin_market_state", { p_application_id: id }),
    supabase.rpc("get_admin_case_state", { p_application_id: id }),
    supabase.rpc("get_admin_seller_verification", { p_application_id: id }),
    supabase.rpc("get_admin_phase4_state", { p_application_id: id }),
    supabase.rpc("get_admin_test_payment_state", { p_application_id: id }),
    supabase.rpc("get_admin_complaint_state", { p_application_id: id }),
  ]);
  const parsed = detailSchema.safeParse(data);
  const parsedMarket = marketSchema.safeParse(marketData);
  const parsedCase = caseSchema.safeParse(caseData);
  const parsedVerification = verificationSchema.safeParse(verificationData);
  const parsedPhaseFour = phaseFourSchema.safeParse(phaseFourData);
  const parsedPayment = adminPaymentStateSchema.safeParse(paymentData);
  const parsedComplaints = complaintsSchema.safeParse(complaintData);
  if (error || marketError || caseError || verificationError || phaseFourError || paymentError || complaintError || !parsed.success || !parsedMarket.success || !parsedCase.success || !parsedVerification.success || !parsedPhaseFour.success || !parsedPayment.success || !parsedComplaints.success) notFound();
  const application = parsed.data;
  const market = parsedMarket.data;
  const caseState = parsedCase.data;

  const photos = await Promise.all(application.photos.map(async (photo) => {
    const { data: signed } = await supabase.storage.from("vehicle-photos").createSignedUrl(photo.storagePath, 300);
    return { ...photo, signedUrl: signed?.signedUrl ?? null };
  }));
  const complaints = await Promise.all(parsedComplaints.data.map(async (complaint) => ({
    ...complaint,
    evidence: await Promise.all(complaint.evidence.map(async (evidence) => {
      const { data: signed } = await supabase.storage.from("complaint-evidence").createSignedUrl(evidence.storagePath, 300);
      return { ...evidence, signedUrl: signed?.signedUrl ?? null };
    })),
  })));

  return <main className="portal-page"><section className="portal-panel max-w-6xl">
    <Link href="/beheer/aanvragen" className="font-bold text-[#a64b00] underline">← Alle aanvragen</Link>
    <div className="mt-6 flex flex-wrap justify-between gap-4"><div><p className="font-mono text-sm text-slate-500">{application.reference}</p><h1 className="mt-2 text-4xl font-black">{application.vehicle.registration}</h1><p className="mt-2 text-slate-600">{application.vehicle.make} {application.vehicle.model} {application.vehicle.variant}</p></div><div className="rounded-xl bg-slate-100 px-4 py-3 font-bold">Status: {application.status}</div></div>
    <div className="mt-8 grid gap-6 lg:grid-cols-2"><Panel title="Verkoper"><Data label="Naam" value={application.seller.fullName} /><Data label="E-mail" value={application.seller.email} /><Data label="Telefoon" value={application.seller.phone} /><Data label="Postcode" value={application.seller.postalCode} /><Data label="Gewenste datum" value={application.seller.desiredSaleDate} /></Panel><Panel title="Voertuig en staat"><Data label="Bouwjaar" value={application.vehicle.year} /><Data label="Brandstof" value={application.vehicle.fuelType} /><Data label="Kleur" value={application.vehicle.color} /><Data label="Kilometerstand" value={application.condition.mileageKm === null ? null : `${application.condition.mileageKm} km`} /><Data label="Sleutels" value={application.condition.keyCount} /><Data label="Schade" value={application.condition.damageDescription} /><Data label="Techniek" value={application.condition.technicalIssues} /><Data label="Onderhoud" value={application.condition.maintenanceDescription} /><Data label="Opmerkingen" value={application.condition.remarks} /></Panel></div>
    <section className="mt-8"><h2 className="text-2xl font-black">Foto’s controleren</h2><p className="mt-2 text-sm text-slate-600">Controleer expliciet op gezichten, documenten, kentekenbewijzen, adressen en andere persoonsgegevens voordat een foto wordt goedgekeurd.</p><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{photos.map((photo) => <article key={photo.id} className="overflow-hidden rounded-xl border border-slate-200">{photo.signedUrl ? <Image src={photo.signedUrl} alt="Voertuigfoto ter controle" width={800} height={600} unoptimized className="aspect-[4/3] w-full object-cover" /> : <div className="grid aspect-[4/3] place-items-center bg-slate-100 text-sm text-slate-500">Foto niet beschikbaar</div>}<div className="p-4"><p className="font-bold">{photo.reviewStatus}</p><form action={reviewPhoto} className="mt-3 flex gap-2"><input type="hidden" name="applicationId" value={application.id} /><input type="hidden" name="photoId" value={photo.id} /><Button size="sm" name="status" value="approved">Goedkeuren</Button><Button size="sm" variant="destructive" name="status" value="rejected">Afwijzen</Button></form></div></article>)}</div></section>
    <div className="mt-8 grid gap-6 lg:grid-cols-2"><Panel title="Status wijzigen"><ApplicationStatusControls applicationId={application.id} status={application.status} /></Panel><Panel title="Interne notitie"><form action={addInternalNote}><input type="hidden" name="applicationId" value={application.id} /><Textarea name="body" required maxLength={2000} aria-label="Interne notitie" /><Button className="mt-3" size="sm">Notitie opslaan</Button></form><div className="mt-5 space-y-3">{application.notes.map((note) => <article key={note.id} className="rounded-lg bg-slate-50 p-3"><p className="whitespace-pre-wrap text-sm">{note.body}</p><p className="mt-2 text-xs text-slate-500">{note.author} · {formatAmsterdamDateTime(note.createdAt)}</p></article>)}</div></Panel></div>
    <div className="mt-8"><MarketControls applicationId={application.id} applicationStatus={application.status} sellerVerified={parsedVerification.data.verified} market={market} /></div>
    <PhaseFourSummary state={parsedPhaseFour.data} />
    <TestPaymentPanel applicationId={application.id} state={parsedPayment.data} />
    <ComplaintAdminPanel complaints={complaints} />
    <PhaseFourControls applicationId={application.id} caseState={caseState} condition={application.condition} />
    {market.listingId && <section className="mt-8 rounded-2xl border border-slate-200 p-6"><h2 className="text-xl font-black">Alle biedingen</h2><p className="mt-2 text-sm text-slate-600">Na 24 uur wordt maximaal één hoogste bieder gereserveerd. Dat opent de vervolgroute, maar is nog geen koop.</p>{market.bids.length ? <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="py-2">Bedrijf</th><th className="py-2">Bedrag</th><th className="py-2">Tijdstip</th></tr></thead><tbody>{market.bids.map((bid) => <tr key={bid.id} className="border-t border-slate-200"><td className="py-3">{bid.companyName}</td><td className="py-3 font-bold">{formatEuroCents(bid.amountCents)}{bid.isHighest && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-900">hoogste</span>}</td><td className="py-3">{formatAmsterdamDateTime(bid.createdAt)}</td></tr>)}</tbody></table></div> : <p className="mt-4 text-slate-500">Er zijn nog geen biedingen.</p>}</section>}
  </section></main>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-slate-200 p-6"><h2 className="text-xl font-black">{title}</h2><div className="mt-4 space-y-3">{children}</div></section>; }
function Data({ label, value }: { label: string; value: string | number | null }) { return <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap">{value ?? "—"}</dd></div>; }

function PhaseFourSummary({ state }: { state: z.infer<typeof phaseFourSchema> }) {
  if (!state.appointment && !state.inspection && !state.priceAdjustment && !state.agreement && !state.tasks.length) return null;
  return <section className="mt-8 rounded-2xl border border-orange-200 bg-orange-50/20 p-6">
    <p className="eyebrow">Fase 4</p>
    <h2 className="mt-2 text-2xl font-black">Afspraak, inspectie en bevestiging</h2>
    <p className="mt-2 text-sm leading-6 text-slate-700">Het hoogste bod is nog geen verkoop. Een eventuele prijswijziging staat los van het oorspronkelijke bod en beide partijen bevestigen hetzelfde koopconcept afzonderlijk.</p>
    <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Data label="Afspraak" value={state.appointment?.status ?? null} />
      <Data label="Gekozen moment" value={state.appointment?.selected_slot ? formatAmsterdamDateTime(state.appointment.selected_slot) : null} />
      <Data label="Inspectie" value={state.inspection?.status ?? null} />
      <Data label="Koopconcept" value={state.agreement?.status ?? null} />
    </dl>
    {state.priceAdjustment && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm"><p className="font-black">Apart prijsvoorstel: {formatEuroCents(state.priceAdjustment.original_bid_cents)} → {formatEuroCents(state.priceAdjustment.proposed_price_cents)}</p><p className="mt-2 whitespace-pre-wrap">{state.priceAdjustment.reason}</p><p className="mt-2 font-semibold">Status: {state.priceAdjustment.status}</p></div>}
    {state.agreement && <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-sm"><p className="font-black">Exact bedrag: {formatEuroCents(state.agreement.agreed_price_cents)}</p><p className="mt-2">Voorwaarden: {state.agreement.terms_version} ({state.agreement.terms_status})</p><p className="mt-2">Dealer bevestigd: {state.agreement.dealer_confirmed_at ? formatAmsterdamDateTime(state.agreement.dealer_confirmed_at) : "nee"} · Verkoper bevestigd: {state.agreement.seller_confirmed_at ? formatAmsterdamDateTime(state.agreement.seller_confirmed_at) : "nee"}</p>{state.agreement.terms_status !== "approved" && <p className="mt-3 font-semibold text-red-800">Conceptvoorwaarden: livegang en betaling blijven geblokkeerd tot juridische goedkeuring.</p>}</div>}
    {state.tasks.length > 0 && <div className="mt-5"><h3 className="font-black">Openstaande signalen</h3><ul className="mt-2 space-y-2 text-sm">{state.tasks.map((task) => <li key={task.id}>{task.taskType} · {task.status}{task.dueAt ? ` · uiterlijk ${formatAmsterdamDateTime(task.dueAt)}` : ""}</li>)}</ul></div>}
  </section>;
}
