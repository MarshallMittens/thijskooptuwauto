import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { addInternalNote, reviewPhoto, updateApplicationStatus } from "@/app/beheer/aanvragen/actions";
import { MarketControls } from "@/components/admin/market-controls";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { requireAdmin } from "@/lib/auth/dal";
import { formatEuroCents } from "@/lib/bids/amount";
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
  bids: z.array(z.object({ id: z.string().uuid(), companyId: z.string().uuid(), companyName: z.string(), amountCents: z.number(), createdAt: z.string() })),
});

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const supabase = await createClient();
  const [{ data, error }, { data: marketData, error: marketError }] = await Promise.all([
    supabase.rpc("get_admin_application", { p_application_id: id }),
    supabase.rpc("get_admin_market_state", { p_application_id: id }),
  ]);
  const parsed = detailSchema.safeParse(data);
  const parsedMarket = marketSchema.safeParse(marketData);
  if (error || marketError || !parsed.success || !parsedMarket.success) notFound();
  const application = parsed.data;
  const market = parsedMarket.data;

  const photos = await Promise.all(application.photos.map(async (photo) => {
    const { data: signed } = await supabase.storage.from("vehicle-photos").createSignedUrl(photo.storagePath, 300);
    return { ...photo, signedUrl: signed?.signedUrl ?? null };
  }));

  return <main className="portal-page"><section className="portal-panel max-w-6xl">
    <Link href="/beheer/aanvragen" className="font-bold text-[#1554d1] underline">← Alle aanvragen</Link>
    <div className="mt-6 flex flex-wrap justify-between gap-4"><div><p className="font-mono text-sm text-slate-500">{application.reference}</p><h1 className="mt-2 text-4xl font-black">{application.vehicle.registration}</h1><p className="mt-2 text-slate-600">{application.vehicle.make} {application.vehicle.model} {application.vehicle.variant}</p></div><div className="rounded-xl bg-slate-100 px-4 py-3 font-bold">Status: {application.status}</div></div>
    <div className="mt-8 grid gap-6 lg:grid-cols-2"><Panel title="Verkoper"><Data label="Naam" value={application.seller.fullName} /><Data label="E-mail" value={application.seller.email} /><Data label="Telefoon" value={application.seller.phone} /><Data label="Postcode" value={application.seller.postalCode} /><Data label="Gewenste datum" value={application.seller.desiredSaleDate} /></Panel><Panel title="Voertuig en staat"><Data label="Bouwjaar" value={application.vehicle.year} /><Data label="Brandstof" value={application.vehicle.fuelType} /><Data label="Kleur" value={application.vehicle.color} /><Data label="Kilometerstand" value={application.condition.mileageKm === null ? null : `${application.condition.mileageKm} km`} /><Data label="Sleutels" value={application.condition.keyCount} /><Data label="Schade" value={application.condition.damageDescription} /><Data label="Techniek" value={application.condition.technicalIssues} /><Data label="Onderhoud" value={application.condition.maintenanceDescription} /><Data label="Opmerkingen" value={application.condition.remarks} /></Panel></div>
    <section className="mt-8"><h2 className="text-2xl font-black">Foto’s controleren</h2><p className="mt-2 text-sm text-slate-600">Controleer expliciet op gezichten, documenten, kentekenbewijzen, adressen en andere persoonsgegevens voordat een foto wordt goedgekeurd.</p><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{photos.map((photo) => <article key={photo.id} className="overflow-hidden rounded-xl border border-slate-200">{photo.signedUrl ? <Image src={photo.signedUrl} alt="Voertuigfoto ter controle" width={800} height={600} unoptimized className="aspect-[4/3] w-full object-cover" /> : <div className="grid aspect-[4/3] place-items-center bg-slate-100 text-sm text-slate-500">Foto niet beschikbaar</div>}<div className="p-4"><p className="font-bold">{photo.reviewStatus}</p><form action={reviewPhoto} className="mt-3 flex gap-2"><input type="hidden" name="applicationId" value={application.id} /><input type="hidden" name="photoId" value={photo.id} /><Button size="sm" name="status" value="approved">Goedkeuren</Button><Button size="sm" variant="destructive" name="status" value="rejected">Afwijzen</Button></form></div></article>)}</div></section>
    <div className="mt-8 grid gap-6 lg:grid-cols-2"><Panel title="Status wijzigen"><form action={updateApplicationStatus} className="flex flex-wrap gap-2"><input type="hidden" name="applicationId" value={application.id} />{[["in_review","In controle"],["needs_information","Informatie nodig"],["ready","Gereed"],["withdrawn","Ingetrokken"],["closed","Gesloten"]].map(([value,label]) => <Button key={value} size="sm" variant="outline" name="status" value={value}>{label}</Button>)}</form></Panel><Panel title="Interne notitie"><form action={addInternalNote}><input type="hidden" name="applicationId" value={application.id} /><Textarea name="body" required maxLength={2000} aria-label="Interne notitie" /><Button className="mt-3" size="sm">Notitie opslaan</Button></form><div className="mt-5 space-y-3">{application.notes.map((note) => <article key={note.id} className="rounded-lg bg-slate-50 p-3"><p className="whitespace-pre-wrap text-sm">{note.body}</p><p className="mt-2 text-xs text-slate-500">{note.author} · {formatAmsterdamDateTime(note.createdAt)}</p></article>)}</div></Panel></div>
    <div className="mt-8"><MarketControls applicationId={application.id} applicationStatus={application.status} market={market} /></div>
    {market.listingId && <section className="mt-8 rounded-2xl border border-slate-200 p-6"><h2 className="text-xl font-black">Alle biedingen</h2><p className="mt-2 text-sm text-slate-600">De hoogste bieder wordt niet automatisch als koper aangewezen.</p>{market.bids.length ? <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="py-2">Bedrijf</th><th className="py-2">Bedrag</th><th className="py-2">Tijdstip</th></tr></thead><tbody>{market.bids.map((bid) => <tr key={bid.id} className="border-t border-slate-200"><td className="py-3">{bid.companyName}</td><td className="py-3 font-bold">{formatEuroCents(bid.amountCents)}</td><td className="py-3">{formatAmsterdamDateTime(bid.createdAt)}</td></tr>)}</tbody></table></div> : <p className="mt-4 text-slate-500">Er zijn nog geen biedingen.</p>}</section>}
  </section></main>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-slate-200 p-6"><h2 className="text-xl font-black">{title}</h2><div className="mt-4 space-y-3">{children}</div></section>; }
function Data({ label, value }: { label: string; value: string | number | null }) { return <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap">{value ?? "—"}</dd></div>; }
