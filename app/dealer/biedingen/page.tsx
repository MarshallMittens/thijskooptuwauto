import Link from "next/link";
import { z } from "zod";

import { DealerHeader } from "@/components/dealer/dealer-header";
import { requireDealer } from "@/lib/auth/dal";
import { formatEuroCents } from "@/lib/bids/amount";
import { createClient } from "@/lib/supabase/server";
import { formatAmsterdamDateTime } from "@/lib/time/format";

export const metadata = { robots: { index: false, follow: false } };
const bidSchema = z.object({ id: z.string().uuid(), listingId: z.string().uuid(), registration: z.string(), make: z.string().nullable(), model: z.string().nullable(), amountCents: z.number(), createdAt: z.string(), roundEndsAt: z.string(), roundStatus: z.string() });

export default async function DealerBidsPage() {
  await requireDealer();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_my_bids");
  const parsed = z.array(bidSchema).safeParse(data);
  return <main className="portal-page"><section className="portal-panel max-w-6xl"><DealerHeader /><div className="mt-8"><p className="eyebrow">Besloten biedingen</p><h1 className="mt-3 text-4xl font-black">Mijn biedingen</h1><p className="mt-3 text-slate-600">Alleen de biedhistorie van jouw eigen bedrijf wordt hier getoond.</p></div>{error || !parsed.success ? <p className="mt-8 rounded-xl bg-red-50 p-4 text-red-800">De biedingen konden niet veilig worden geladen.</p> : parsed.data.length ? <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-4">Auto</th><th className="p-4">Bod</th><th className="p-4">Geplaatst</th><th className="p-4">Ronde</th></tr></thead><tbody>{parsed.data.map((bid) => <tr key={bid.id} className="border-t border-slate-200"><td className="p-4"><Link href={`/dealer/aanbod/${bid.listingId}`} className="font-bold text-[#a64b00] underline">{bid.registration}</Link><span className="block text-slate-500">{bid.make} {bid.model}</span></td><td className="p-4 font-bold">{formatEuroCents(bid.amountCents)}</td><td className="p-4">{formatAmsterdamDateTime(bid.createdAt)}</td><td className="p-4">{bid.roundStatus}<span className="block text-slate-500">tot {formatAmsterdamDateTime(bid.roundEndsAt)}</span></td></tr>)}</tbody></table></div> : <p className="mt-8 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-600">Jouw bedrijf heeft nog geen biedingen geplaatst.</p>}</section></main>;
}
