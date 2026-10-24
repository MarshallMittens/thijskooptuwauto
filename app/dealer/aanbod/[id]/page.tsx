import Image from "next/image";
import Link from "next/link";
import { RecordListingView } from "@/components/applications/record-listing-view";
import { notFound } from "next/navigation";
import { z } from "zod";

import { AuctionRefresh } from "@/components/dealer/auction-refresh";
import { BidForm } from "@/components/dealer/bid-form";
import { DealerHeader } from "@/components/dealer/dealer-header";
import { requireDealer } from "@/lib/auth/dal";
import { formatEuroCents } from "@/lib/bids/amount";
import { createClient } from "@/lib/supabase/server";
import { formatAmsterdamDateTime } from "@/lib/time/format";

export const metadata = { robots: { index: false, follow: false } };

const detailSchema = z.object({
  id: z.string().uuid(),
  vehicle: z.object({ registration: z.string(), make: z.string().nullable(), model: z.string().nullable(), variant: z.string().nullable(), year: z.number().nullable(), fuelType: z.string().nullable(), color: z.string().nullable(), vehicleType: z.string().nullable() }),
  condition: z.object({ mileageKm: z.number().nullable(), damageDescription: z.string().nullable(), technicalIssues: z.string().nullable(), maintenanceDescription: z.string().nullable(), keyCount: z.number().nullable(), remarks: z.string().nullable() }),
  publishedAt: z.string().nullable(),
  photos: z.array(z.object({ id: z.string().uuid(), storagePath: z.string(), sortOrder: z.number() })),
  round: z.object({ id: z.string().uuid(), startsAt: z.string(), endsAt: z.string(), status: z.enum(["scheduled", "active", "closed", "cancelled"]), outcomeStatus: z.string(), minimumIncrementCents: z.number() }),
  highestBidCents: z.number().nullable(),
  nextMinimumBidCents: z.number(),
  bidHistory: z.array(z.object({ id: z.string().uuid(), amountCents: z.number(), createdAt: z.string(), isOwnCompany: z.boolean(), isHighest: z.boolean() })),
});

export default async function DealerListingPage({ params }: { params: Promise<{ id: string }> }) {
  await requireDealer();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_dealer_listing", { p_listing_id: id });
  const parsed = detailSchema.safeParse(data);
  if (error || !parsed.success) notFound();
  const listing = parsed.data;
  const photos = await Promise.all(listing.photos.map(async (photo) => {
    const { data: signed } = await supabase.storage.from("vehicle-photos").createSignedUrl(photo.storagePath, 300);
    return { ...photo, url: signed?.signedUrl ?? null };
  }));

  return <main className="portal-page"><section className="portal-panel max-w-6xl">
    <DealerHeader />
    <RecordListingView listingId={listing.id} />
    <Link href="/dealer" className="mt-7 inline-flex font-bold text-[#a64b00] underline">← Terug naar aanbod</Link>
    <div className="mt-6 flex flex-wrap items-start justify-between gap-5">
      <div><p className="font-mono font-bold text-[#a64b00]">{listing.vehicle.registration}</p><h1 className="mt-2 text-4xl font-black">{listing.vehicle.make} {listing.vehicle.model}</h1><p className="mt-2 text-slate-600">{[listing.vehicle.variant, listing.vehicle.year, listing.vehicle.fuelType].filter(Boolean).join(" · ")}</p></div>
      <div className="rounded-xl bg-slate-100 p-4"><p className="text-sm text-slate-500">Biedronde eindigt</p><p className="mt-1 font-bold">{formatAmsterdamDateTime(listing.round.endsAt)}</p><AuctionRefresh endsAt={listing.round.endsAt} active={listing.round.status === "active"} /></div>
    </div>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{photos.map((photo) => photo.url ? <Image key={photo.id} src={photo.url} alt="Gecontroleerde voertuigfoto" width={900} height={600} unoptimized className="aspect-[3/2] w-full rounded-xl object-cover" /> : null)}</div>
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 p-6"><h2 className="text-xl font-black">Voertuiggegevens</h2><dl className="mt-4 space-y-3"><Data label="Type" value={listing.vehicle.vehicleType} /><Data label="Bouwjaar" value={listing.vehicle.year} /><Data label="Kleur" value={listing.vehicle.color} /><Data label="Kilometerstand" value={listing.condition.mileageKm === null ? null : `${listing.condition.mileageKm.toLocaleString("nl-NL")} km`} /><Data label="Aantal sleutels" value={listing.condition.keyCount} /></dl></section>
      <section className="rounded-2xl border border-slate-200 p-6"><h2 className="text-xl font-black">Staat</h2><dl className="mt-4 space-y-3"><Data label="Schade" value={listing.condition.damageDescription} /><Data label="Technische gebreken" value={listing.condition.technicalIssues} /><Data label="Onderhoud" value={listing.condition.maintenanceDescription} /><Data label="Opmerkingen" value={listing.condition.remarks} /></dl></section>
    </div>
    <div className="mt-8">{listing.round.status === "active" ? <BidForm listingId={listing.id} roundId={listing.round.id} highestBidCents={listing.highestBidCents} nextMinimumBidCents={listing.nextMinimumBidCents} minimumIncrementCents={listing.round.minimumIncrementCents} /> : <p className="rounded-2xl bg-amber-50 p-5 font-semibold text-amber-900">Op dit moment kan niet op deze auto worden geboden. Een gesloten winnaarreservering is nog geen definitieve koop.</p>}</div>
    <section className="mt-8 rounded-2xl border border-slate-200 p-6">
      <h2 className="text-xl font-black">Zichtbare biedhistorie</h2>
      <p className="mt-2 text-sm text-slate-600">Iedere goedgekeurde garage ziet dezelfde bedragen en tijdstippen. Bedrijfsnamen blijven verborgen; je eigen biedingen zijn gemarkeerd.</p>
      {listing.bidHistory.length ? <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="py-2">Bedrag</th><th className="py-2">Geplaatst</th><th className="py-2">Herkomst</th></tr></thead><tbody>{listing.bidHistory.map((bid) => <tr key={bid.id} className="border-t border-slate-200"><td className="py-3 font-bold">{formatEuroCents(bid.amountCents)} {bid.isHighest && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-900">hoogste</span>}</td><td className="py-3">{formatAmsterdamDateTime(bid.createdAt)}</td><td className="py-3">{bid.isOwnCompany ? "Jouw bedrijf" : "Andere garage"}</td></tr>)}</tbody></table></div> : <p className="mt-4 text-slate-500">Er zijn nog geen biedingen.</p>}
    </section>
  </section></main>;
}

function Data({ label, value }: { label: string; value: string | number | null }) {
  return <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap">{value ?? "—"}</dd></div>;
}
