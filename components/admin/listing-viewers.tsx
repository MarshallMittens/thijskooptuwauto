import { createClient } from "@/lib/supabase/server";
import { formatAmsterdamDateTime } from "@/lib/time/format";
import { z } from "zod";

export async function ListingViewers({ applicationId }: { applicationId: string }) {
  const client = await createClient();
  const { data, error } = await client.rpc("get_admin_listing_views", { p_application_id: applicationId });
  const parsed = z.array(z.object({ companyName: z.string(), firstViewedAt: z.string(), lastViewedAt: z.string() })).safeParse(data);
  return <section className="mt-8 rounded-2xl border border-slate-200 p-6"><h2 className="text-xl font-black">Welke dealers hebben gekeken?</h2><p className="mt-2 text-sm text-slate-600">Dit registreert het openen van de voertuigpagina, niet het lezen van een specifieke bieding.</p>{error || !parsed.success ? <p className="mt-4">Kijkregistratie is nog niet beschikbaar.</p> : parsed.data.length ? <ul className="mt-4 space-y-3">{parsed.data.map((view, index) => <li key={index} className="rounded-xl bg-slate-50 p-4"><strong>{view.companyName}</strong><p className="mt-1 text-sm">Eerste keer: {formatAmsterdamDateTime(view.firstViewedAt)} · Laatste keer: {formatAmsterdamDateTime(view.lastViewedAt)}</p></li>)}</ul> : <p className="mt-4 text-slate-600">Nog geen geregistreerde weergaven.</p>}</section>;
}
