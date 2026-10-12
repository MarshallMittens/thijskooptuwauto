import Link from "next/link";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/dal";
import { formatEuroCents } from "@/lib/bids/amount";
import { createClient } from "@/lib/supabase/server";
import { formatAmsterdamDateTime } from "@/lib/time/format";

export const metadata = { robots: { index: false, follow: false } };

const auctionSchema = z.array(z.object({
  applicationId: z.string().uuid(),
  listingId: z.string().uuid(),
  roundId: z.string().uuid(),
  registration: z.string(),
  make: z.string().nullable(),
  model: z.string().nullable(),
  startsAt: z.string(),
  endsAt: z.string(),
  bidCount: z.number(),
  highestBidCents: z.number().nullable(),
  bidderCompanies: z.array(z.string()),
}));

export default async function ActiveAuctionsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_admin_active_auctions");
  const parsed = auctionSchema.safeParse(data);

  return <main className="portal-page"><section className="portal-panel max-w-6xl">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Beheeromgeving</p><h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Lopende veilingen</h1><p className="mt-3 max-w-3xl text-slate-600">Alle actieve biedrondes in één overzicht. Alleen beheer ziet welke bedrijven hebben geboden; dealers blijven onderling anoniem.</p></div><div className="flex gap-4"><Link href="/beheer/aanvragen" className="font-bold text-[#a64b00] underline">Autoaanvragen</Link><Link href="/beheer" className="font-bold text-[#a64b00] underline">Bedrijven</Link></div></div>
    {error || !parsed.success ? <p className="mt-8 rounded-xl bg-red-50 p-4 text-red-800">De lopende veilingen konden niet veilig worden geladen.</p> : parsed.data.length ? <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="p-4">Auto</th><th className="p-4">Eindtijd</th><th className="p-4">Hoogste bod</th><th className="p-4">Biedingen</th><th className="p-4">Bedrijven die boden</th><th className="p-4">Dossier</th></tr></thead><tbody>{parsed.data.map((auction) => <tr key={auction.roundId} className="border-t border-slate-200"><td className="p-4"><strong>{auction.registration}</strong><span className="block text-slate-500">{auction.make} {auction.model}</span></td><td className="p-4">{formatAmsterdamDateTime(auction.endsAt)}</td><td className="p-4 font-black text-[#a64b00]">{auction.highestBidCents === null ? "Nog geen bod" : formatEuroCents(auction.highestBidCents)}</td><td className="p-4">{auction.bidCount}</td><td className="p-4">{auction.bidderCompanies.length ? auction.bidderCompanies.join(", ") : "Nog geen bieders"}</td><td className="p-4"><Link href={`/beheer/aanvragen/${auction.applicationId}`} className="font-bold text-[#a64b00] underline">Open aanvraag</Link></td></tr>)}</tbody></table></div> : <p className="mt-8 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-600">Er lopen op dit moment geen veilingen.</p>}
  </section></main>;
}
