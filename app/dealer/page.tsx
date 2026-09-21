import Image from "next/image";
import Link from "next/link";
import { z } from "zod";

import { DealerHeader } from "@/components/dealer/dealer-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireDealer } from "@/lib/auth/dal";
import { formatEuroCents } from "@/lib/bids/amount";
import { createClient } from "@/lib/supabase/server";
import { formatAmsterdamDateTime } from "@/lib/time/format";

export const metadata = { robots: { index: false, follow: false } };

const listingSchema = z.object({
  id: z.string().uuid(),
  vehicle: z.object({ registration: z.string(), make: z.string().nullable(), model: z.string().nullable(), variant: z.string().nullable(), year: z.number().nullable(), fuelType: z.string().nullable(), color: z.string().nullable(), vehicleType: z.string().nullable() }),
  condition: z.object({ mileageKm: z.number().nullable() }),
  publishedAt: z.string().nullable(),
  round: z.object({ id: z.string().uuid(), startsAt: z.string(), endsAt: z.string(), status: z.enum(["scheduled", "active", "closed", "cancelled"]) }),
  ownHighestBidCents: z.number().nullable(),
  photoPath: z.string().nullable(),
});

const labels = { scheduled: "Binnenkort", active: "Bieden mogelijk", closed: "Gesloten", cancelled: "Geannuleerd" } as const;

export default async function DealerPage({ searchParams }: { searchParams: Promise<{ q?: string; merk?: string; status?: string }> }) {
  await requireDealer();
  const query = await searchParams;
  const q = (query.q ?? "").slice(0, 80);
  const make = (query.merk ?? "").slice(0, 80);
  const status = ["active", "scheduled", "closed"].includes(query.status ?? "") ? query.status! : "";
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_dealer_listings", { p_query: q || null, p_make: make || null, p_round_status: status || null });
  const parsed = z.array(listingSchema).safeParse(data);

  const listings = parsed.success ? await Promise.all(parsed.data.map(async (listing) => {
    if (!listing.photoPath) return { ...listing, photoUrl: null };
    const { data: signed } = await supabase.storage.from("vehicle-photos").createSignedUrl(listing.photoPath, 300);
    return { ...listing, photoUrl: signed?.signedUrl ?? null };
  })) : [];

  return (
    <main className="portal-page">
      <section className="portal-panel max-w-7xl">
        <DealerHeader />
        <div className="mt-8"><p className="eyebrow">Besloten aanbod</p><h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Beschikbare auto’s</h1><p className="mt-3 text-slate-600">Je ziet geen naam, contactgegevens of exact adres van de verkoper. Biedingen van andere bedrijven blijven verborgen.</p></div>
        <form className="mt-7 grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-[1fr_220px_180px_auto]" method="get"><Input name="q" defaultValue={q} placeholder="Zoek kenteken, merk of model" aria-label="Zoeken" /><Input name="merk" defaultValue={make} placeholder="Merk" aria-label="Merkfilter" /><select name="status" defaultValue={status} aria-label="Biedstatus" className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"><option value="">Alle statussen</option><option value="active">Actief</option><option value="scheduled">Binnenkort</option><option value="closed">Gesloten</option></select><Button type="submit">Filteren</Button></form>
        {error || !parsed.success ? <p className="mt-8 rounded-xl bg-red-50 p-4 text-red-800">Het aanbod kon niet veilig worden geladen.</p> : listings.length ? <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{listings.map((listing) => <article key={listing.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">{listing.photoUrl ? <Image src={listing.photoUrl} alt={`${listing.vehicle.make ?? "Auto"} ${listing.vehicle.model ?? ""}`} width={900} height={600} unoptimized className="aspect-[3/2] w-full object-cover" /> : <div className="grid aspect-[3/2] place-items-center bg-slate-100 text-sm text-slate-500">Geen goedgekeurde foto</div>}<div className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-sm font-bold text-[#1554d1]">{listing.vehicle.registration}</p><h2 className="mt-1 text-xl font-black">{listing.vehicle.make} {listing.vehicle.model}</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{labels[listing.round.status]}</span></div><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-500">Bouwjaar</dt><dd className="font-bold">{listing.vehicle.year ?? "—"}</dd></div><div><dt className="text-slate-500">Kilometerstand</dt><dd className="font-bold">{listing.condition.mileageKm?.toLocaleString("nl-NL") ?? "—"} km</dd></div><div className="col-span-2"><dt className="text-slate-500">Einde biedronde</dt><dd className="font-bold">{formatAmsterdamDateTime(listing.round.endsAt)}</dd></div>{listing.ownHighestBidCents !== null && <div className="col-span-2"><dt className="text-slate-500">Hoogste bod van jouw bedrijf</dt><dd className="font-bold text-[#1554d1]">{formatEuroCents(listing.ownHighestBidCents)}</dd></div>}</dl><Link href={`/dealer/aanbod/${listing.id}`} className="mt-5 inline-flex font-bold text-[#1554d1] underline">Bekijk voertuig en bieding</Link></div></article>)}</div> : <p className="mt-8 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-600">Geen voertuigen gevonden met deze filters.</p>}
      </section>
    </main>
  );
}
