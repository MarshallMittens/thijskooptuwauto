import Image from "next/image";
import Link from "next/link";
import { z } from "zod";

import { ArchiveApplicationButton } from "@/components/admin/archive-application-button";
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
  round: z.object({ id: z.string().uuid(), startsAt: z.string(), endsAt: z.string(), status: z.enum(["scheduled", "active", "closed", "cancelled"]), outcomeStatus: z.string(), minimumIncrementCents: z.number() }),
  highestBidCents: z.number().nullable(),
  ownHighestBidCents: z.number().nullable(),
  bidCount: z.number(),
  photoPath: z.string().nullable(),
});

const labels = { scheduled: "Binnenkort", active: "Bieden mogelijk", closed: "Gesloten", cancelled: "Geannuleerd" } as const;

export default async function DealerPage({ searchParams }: { searchParams: Promise<{ q?: string; merk?: string; status?: string }> }) {
  const context = await requireDealer();
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

  const adminCanArchive = context.isStaff && context.staffRole === "admin";
  const applicationIds = new Map<string, string>();
  if (adminCanArchive && listings.length) {
    const { data: links } = await supabase.from("listings").select("id, application_id").in("id", listings.map(item => item.id));
    for (const link of links ?? []) applicationIds.set(link.id, link.application_id);
  }
  return (
    <main className="portal-page">
      <section className="portal-panel max-w-7xl">
        <DealerHeader />
        <div className="mt-8"><p className="eyebrow">Aanbod voor garages</p><h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Beschikbare auto’s</h1><p className="mt-3 text-slate-600">Alle goedgekeurde garages zien dezelfde biedbedragen, maar niet welke garage erachter zit. Naam, contactgegevens en adres van de verkoper blijven afgeschermd.</p></div>
        <aside className="mt-6 rounded-2xl border border-orange-200 bg-orange-50/70 p-5 text-sm leading-6 text-slate-700" aria-labelledby="dealer-voorwaarden"><h2 id="dealer-voorwaarden" className="text-lg font-black text-slate-950">Je garage is goedgekeurd · zo werkt deelnemen</h2><ul className="mt-3 list-disc space-y-2 pl-5"><li>Bied namens je eigen goedgekeurde bedrijf en met een serieuze aankoopintentie.</li><li>Een biedronde duurt 24 uur. Biedbedragen zijn zichtbaar; de identiteit van andere bieders blijft verborgen.</li><li>Het hoogste bod start de afspraakroute. Er ontstaat nog geen automatische koop.</li><li>Als koper verzorg je inspectie en afgesproken ophalen. Bespreek afwijkingen en eventuele prijswijzigingen vooraf met de verkoper.</li><li>Gebruik vrijgegeven contactgegevens uitsluitend voor de afhandeling van deze auto. Regel de overschrijving en het vrijwaringsbewijs samen met de verkoper.</li><li>Transport- en servicekosten worden vooraf expliciet afgesproken. Definitieve tarieven en betaalvoorwaarden zijn nog niet vastgesteld.</li><li>Houd je account beveiligd. Meld vragen of klachten bij Thijs.</li></ul><p className="mt-4">Dit is een samenvatting van de <Link href="/privacy-en-voorwaarden" className="font-bold text-[#a64b00] underline">volledige conceptvoorwaarden en privacy-informatie</Link>, geen afzonderlijk akkoord of koopcontract.</p></aside>
        <form className="mt-7 grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-[1fr_220px_180px_auto]" method="get"><Input name="q" defaultValue={q} placeholder="Zoek kenteken, merk of model" aria-label="Zoeken" /><Input name="merk" defaultValue={make} placeholder="Merk" aria-label="Merkfilter" /><select name="status" defaultValue={status} aria-label="Biedstatus" className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"><option value="">Alle statussen</option><option value="active">Actief</option><option value="scheduled">Binnenkort</option><option value="closed">Gesloten</option></select><Button type="submit">Filteren</Button></form>
        {error || !parsed.success ? <p className="mt-8 rounded-xl bg-red-50 p-4 text-red-800">Het aanbod kon niet veilig worden geladen.</p> : listings.length ? <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{listings.map((listing) => <article key={listing.id} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">{adminCanArchive && applicationIds.get(listing.id) && <ArchiveApplicationButton applicationId={applicationIds.get(listing.id)!} registration={listing.vehicle.registration} className="absolute right-3 top-3 z-10" />}{listing.photoUrl ? <Image src={listing.photoUrl} alt={`${listing.vehicle.make ?? "Auto"} ${listing.vehicle.model ?? ""}`} width={900} height={600} unoptimized className="aspect-[3/2] w-full object-cover" /> : <div className="grid aspect-[3/2] place-items-center bg-slate-100 text-sm text-slate-500">Geen goedgekeurde foto</div>}<div className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-sm font-bold text-[#a64b00]">{listing.vehicle.registration}</p><h2 className="mt-1 text-xl font-black">{listing.vehicle.make} {listing.vehicle.model}</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{labels[listing.round.status]}</span></div><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-500">Bouwjaar</dt><dd className="font-bold">{listing.vehicle.year ?? "—"}</dd></div><div><dt className="text-slate-500">Kilometerstand</dt><dd className="font-bold">{listing.condition.mileageKm?.toLocaleString("nl-NL") ?? "—"} km</dd></div><div className="col-span-2"><dt className="text-slate-500">Einde biedronde</dt><dd className="font-bold">{formatAmsterdamDateTime(listing.round.endsAt)}</dd></div><div><dt className="text-slate-500">Hoogste bod</dt><dd className="font-bold text-[#a64b00]">{listing.highestBidCents === null ? "Nog geen bod" : formatEuroCents(listing.highestBidCents)}</dd></div><div><dt className="text-slate-500">Aantal biedingen</dt><dd className="font-bold">{listing.bidCount}</dd></div>{listing.ownHighestBidCents !== null && <div className="col-span-2"><dt className="text-slate-500">Hoogste bod van jouw bedrijf</dt><dd className="font-bold">{formatEuroCents(listing.ownHighestBidCents)}</dd></div>}</dl><Link href={`/dealer/aanbod/${listing.id}`} className="mt-5 inline-flex font-bold text-[#a64b00] underline">Bekijk voertuig en bied mee</Link></div></article>)}</div> : <p className="mt-8 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-600">Geen voertuigen gevonden met deze filters.</p>}
      </section>
    </main>
  );
}
