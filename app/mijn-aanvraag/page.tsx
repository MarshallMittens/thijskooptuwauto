import type { Metadata } from "next";
import Image from "next/image";
import { z } from "zod";

import { signOut } from "@/app/auth/actions";
import { ApplicationUpdateForm } from "@/components/seller/application-update-form";
import { SellerAccessForm } from "@/components/seller/access-form";
import { SellerPhaseFourControls, type SellerPhaseFourState } from "@/components/seller/phase-four-controls";
import { SellerTestPaymentControls } from "@/components/seller/test-payment-controls";
import { ComplaintPanel } from "@/components/complaints/complaint-panel";
import { Button } from "@/components/ui/button";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sellerPaymentStateSchema, type SellerPaymentState } from "@/lib/payments/schemas";
import { complaintsSchema } from "@/lib/operations/schemas";
import { formatAmsterdamDateTime } from "@/lib/time/format";

export const metadata: Metadata = {
  title: "Mijn autoaanvraag | Thijskooptuauto",
  robots: { index: false, follow: false, noarchive: true },
};

const dossierSchema = z.array(z.object({
  id: z.string().uuid(),
  reference: z.string(),
  status: z.string(),
  submittedAt: z.string().nullable(),
  verifiedAt: z.string(),
  desiredSaleDate: z.string().nullable(),
  vehicle: z.object({
    registration: z.string(), make: z.string().nullable(), model: z.string().nullable(),
    variant: z.string().nullable(), year: z.number().nullable(), fuelType: z.string().nullable(), color: z.string().nullable(),
  }),
  condition: z.object({
    mileageKm: z.number().nullable(), damageDescription: z.string().nullable(), technicalIssues: z.string().nullable(),
    maintenanceDescription: z.string().nullable(), keyCount: z.number().nullable(), remarks: z.string().nullable(),
  }),
  photos: z.array(z.object({ id: z.string().uuid(), storagePath: z.string(), reviewStatus: z.string(), sortOrder: z.number() })),
}));

const statusLabels: Record<string, string> = {
  submitted: "Ontvangen",
  in_review: "In controle",
  needs_information: "Aanvulling nodig",
  ready: "Klaar voor publicatie",
  withdrawn: "Ingetrokken",
  closed: "Afgesloten",
};

const phaseFourSchema = z.object({
  reservation: z.object({ id: z.string().uuid(), amountCents: z.number(), reservedAt: z.string(), companyName: z.string() }).nullable(),
  appointment: z.object({
    id: z.string().uuid(), status: z.string(), selectedSlot: z.string().nullable(), sellerNote: z.string().nullable(), responseDueAt: z.string().nullable(),
    proposal: z.object({ id: z.string().uuid(), slots: z.array(z.string()), createdAt: z.string() }).nullable(),
  }).nullable(),
  inspection: z.object({
    id: z.string().uuid(), status: z.string(), mileageKm: z.number().nullable(), findings: z.string().nullable(),
    deviationDescription: z.string().nullable(), inspectedAt: z.string(),
    photos: z.array(z.object({ id: z.string().uuid(), storagePath: z.string() })),
  }).nullable(),
  priceAdjustment: z.object({ id: z.string().uuid(), originalBidCents: z.number(), proposedPriceCents: z.number(), reason: z.string(), status: z.string() }).nullable(),
  agreement: z.object({
    id: z.string().uuid(), originalBidCents: z.number(), agreedPriceCents: z.number(), termsVersion: z.string(), termsStatus: z.string(),
    status: z.string(), dealerConfirmedAt: z.string().nullable(), sellerConfirmedAt: z.string().nullable(),
  }).nullable(),
});

const emptyPhaseFourState: SellerPhaseFourState = {
  reservation: null, appointment: null, inspection: null, priceAdjustment: null, agreement: null,
};

const emptyPaymentState: SellerPaymentState = {
  simulatorEnabled: false, agreementStatus: null, onboarding: null, payment: null,
};

export default async function SellerPortalPage({ searchParams }: { searchParams: Promise<{ referentie?: string; geverifieerd?: string; fout?: string }> }) {
  const params = await searchParams;
  const initialReference = params.referentie && /^[0-9a-f]{24}$/.test(params.referentie) ? params.referentie : "";
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  let authenticatedUserId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : null;

  // Een lokale PKCE/magic-link-sessie kan direct na de callback al geldig zijn,
  // terwijl getClaims nog geen claims teruggeeft. getUser verifieert de sessie
  // bij Supabase Auth en is daarom een veilige fallback, geen vertrouwen op cookies.
  if (!authenticatedUserId) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    authenticatedUserId = userError ? null : (userData.user?.id ?? null);
  }

  if (!authenticatedUserId) {
    return <AccessPage initialReference={initialReference} error={params.fout} />;
  }

  const { data, error } = await supabase.rpc("list_my_seller_applications");
  const parsed = dossierSchema.safeParse(data);
  const dossiers = !error && parsed.success ? parsed.data : [];
  const admin = createAdminClient();
  const withPhotos = await Promise.all(dossiers.map(async (dossier) => {
    const [{ data: phaseFourData, error: phaseFourError }, { data: paymentData, error: paymentError }, { data: complaintData, error: complaintError }, photos] = await Promise.all([
      supabase.rpc("get_seller_phase4_state", { p_application_id: dossier.id }),
      supabase.rpc("get_seller_test_payment_state", { p_application_id: dossier.id }),
      supabase.rpc("get_seller_complaint_state", { p_application_id: dossier.id }),
      Promise.all(dossier.photos.map(async (photo) => {
        const { data: signed } = await admin.storage.from("vehicle-photos").createSignedUrl(photo.storagePath, 300);
        return { ...photo, signedUrl: signed?.signedUrl ?? null };
      })),
    ]);
    const parsedPhaseFour = !phaseFourError ? phaseFourSchema.safeParse(phaseFourData) : null;
    const phaseFour = parsedPhaseFour?.success ? parsedPhaseFour.data : emptyPhaseFourState;
    const parsedPayment = !paymentError ? sellerPaymentStateSchema.safeParse(paymentData) : null;
    const payment = parsedPayment?.success ? parsedPayment.data : emptyPaymentState;
    const parsedComplaints = !complaintError ? complaintsSchema.safeParse(complaintData) : null;
    const complaints = await Promise.all((parsedComplaints?.success ? parsedComplaints.data : []).map(async (complaint) => ({
      ...complaint,
      evidence: await Promise.all(complaint.evidence.map(async (evidence) => {
        const { data: signed } = await admin.storage.from("complaint-evidence").createSignedUrl(evidence.storagePath, 300);
        return { ...evidence, signedUrl: signed?.signedUrl ?? null };
      })),
    })));
    const inspection = phaseFour.inspection ? {
      ...phaseFour.inspection,
      photos: await Promise.all(phaseFour.inspection.photos.map(async (photo) => {
        const { data: signed } = await admin.storage.from("vehicle-photos").createSignedUrl(photo.storagePath, 300);
        return { ...photo, signedUrl: signed?.signedUrl ?? null };
      })),
    } : null;
    return { ...dossier, photos, payment, complaints, phaseFour: { ...phaseFour, inspection } satisfies SellerPhaseFourState };
  }));

  return (
    <main className="portal-page">
      <section className="portal-panel max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="eyebrow">Beveiligd dossier</p><h1 className="mt-3 text-4xl font-black tracking-[-0.04em]">Mijn autoaanvraag</h1><p className="mt-3 text-slate-600">Alleen aanvragen die via jouw geverifieerde e-mailadres zijn gekoppeld staan hier.</p></div>
          <form action={signOut}><Button variant="outline">Uitloggen</Button></form>
        </div>
        {params.geverifieerd === "1" ? <p className="mt-6 rounded-xl bg-emerald-50 p-4 font-semibold text-emerald-900" role="status">Je e-mailadres is geverifieerd en het dossier is gekoppeld.</p> : null}
        {params.fout ? <p className="mt-6 rounded-xl bg-red-50 p-4 font-semibold text-red-900" role="alert">De beveiligde link kon niet aan deze aanvraag worden gekoppeld.</p> : null}
        {!withPhotos.length ? <div className="mt-8 rounded-2xl border border-slate-200 p-6"><h2 className="text-xl font-black">Geen gekoppelde aanvraag</h2><p className="mt-2 text-slate-600">Dit account heeft geen verkopersdossier. Log uit en vraag opnieuw een link aan met het e-mailadres uit de aanvraag.</p></div> : null}
        <div className="mt-8 space-y-8">
          {withPhotos.map((dossier) => <article key={dossier.id} className="rounded-2xl border border-slate-200 p-6">
            <div className="flex flex-wrap justify-between gap-4"><div><p className="font-mono text-sm text-slate-500">{dossier.reference}</p><h2 className="mt-2 text-3xl font-black">{dossier.vehicle.registration}</h2><p className="mt-2 text-slate-600">{[dossier.vehicle.make, dossier.vehicle.model, dossier.vehicle.variant].filter(Boolean).join(" ")}</p></div><div className="h-fit rounded-xl bg-orange-50 px-4 py-3 font-bold text-orange-950">{statusLabels[dossier.status] ?? dossier.status}</div></div>
            <dl className="mt-6 grid gap-4 sm:grid-cols-3"><Data label="Ingediend" value={dossier.submittedAt ? formatAmsterdamDateTime(dossier.submittedAt) : null} /><Data label="E-mail geverifieerd" value={formatAmsterdamDateTime(dossier.verifiedAt)} /><Data label="Kilometerstand" value={dossier.condition.mileageKm === null ? null : `${dossier.condition.mileageKm} km`} /></dl>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{dossier.photos.map((photo) => <div key={photo.id} className="overflow-hidden rounded-xl border border-slate-200">{photo.signedUrl ? <Image src={photo.signedUrl} alt="Eigen voertuigfoto" width={640} height={480} unoptimized className="aspect-[4/3] w-full object-cover" /> : <div className="grid aspect-[4/3] place-items-center bg-slate-100 text-sm text-slate-500">Foto niet beschikbaar</div>}<p className="p-3 text-xs font-semibold text-slate-600">Controle: {photo.reviewStatus}</p></div>)}</div>
            {dossier.status === "needs_information" ? <><h3 className="mt-8 text-xl font-black">Vul de gevraagde informatie aan</h3><p className="mt-2 text-sm text-slate-600">Na opslaan gaat de aanvraag automatisch terug naar ‘In controle’.</p><ApplicationUpdateForm applicationId={dossier.id} condition={dossier.condition} desiredSaleDate={dossier.desiredSaleDate} /></> : null}
            <SellerPhaseFourControls applicationId={dossier.id} state={dossier.phaseFour} />
            <SellerTestPaymentControls applicationId={dossier.id} state={dossier.payment} />
            <ComplaintPanel mode="seller" targetId={dossier.id} complaints={dossier.complaints} />
          </article>)}
        </div>
      </section>
    </main>
  );
}

function AccessPage({ initialReference, error }: { initialReference: string; error?: string }) {
  return <main className="auth-page"><section className="auth-card"><p className="eyebrow">Voor particuliere verkopers</p><h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Open je aanvraag veilig</h1><p className="mt-3 leading-7 text-slate-600">Vul je aanvraagreferentie en hetzelfde e-mailadres als in de aanmelding in. Je ontvangt een eenmalige link; we maken geen wachtwoordaccount voor je aan.</p>{error ? <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-900">De link is ongeldig of verlopen. Vraag hieronder een nieuwe aan.</p> : null}<SellerAccessForm initialReference={initialReference} /></section></main>;
}

function Data({ label, value }: { label: string; value: string | null }) {
  return <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1">{value ?? "—"}</dd></div>;
}
