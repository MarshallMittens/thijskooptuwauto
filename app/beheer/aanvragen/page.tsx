import Link from "next/link";
import { LicensePlate } from "@/components/public/license-plate";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

const itemSchema = z.object({
  id: z.string().uuid(), reference: z.string(), status: z.string(), submittedAt: z.string().nullable(),
  createdAt: z.string(), sellerName: z.string().nullable(), registration: z.string(), make: z.string().nullable(), model: z.string().nullable(), photoCount: z.number(),
});

const labels: Record<string, string> = { submitted: "Nieuw", in_review: "In controle", needs_information: "Informatie nodig", ready: "Gereed", withdrawn: "Ingetrokken", closed: "Gesloten" };

export default async function ApplicationsAdminPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_admin_applications");
  const parsed = z.array(itemSchema).safeParse(data);

  return <main className="portal-page"><section className="portal-panel max-w-6xl"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Beheeromgeving</p><h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Autoaanvragen</h1><p className="mt-3 text-slate-600">Verkopersgegevens en interne notities zijn uitsluitend hier zichtbaar.</p></div><div className="flex flex-wrap gap-4"><Link href="/beheer/veilingen" className="font-bold text-[#a64b00] underline">Lopende veilingen</Link><Link href="/beheer/operatie" className="font-bold text-[#a64b00] underline">Operatie</Link><Link href="/beheer" className="font-bold text-[#a64b00] underline">Naar bedrijven</Link></div></div>{error || !parsed.success ? <p className="mt-8 rounded-xl bg-red-50 p-4 text-red-800">Aanvragen konden niet veilig worden geladen.</p> : parsed.data.length ? <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-4">Kenteken</th><th className="p-4">Auto</th><th className="p-4">Verkoper</th><th className="p-4">Status</th><th className="p-4">Foto’s</th><th className="p-4">Ontvangen</th></tr></thead><tbody>{parsed.data.map((item) => <tr key={item.id} className="border-t border-slate-200"><td className="p-4"><Link href={`/beheer/aanvragen/${item.id}`} className="inline-block rounded-lg focus-visible:outline-2 focus-visible:outline-orange-500"><LicensePlate registration={item.registration} /></Link></td><td className="p-4"><strong>{item.make} {item.model}</strong></td><td className="p-4">{item.sellerName}</td><td className="p-4">{labels[item.status] ?? item.status}</td><td className="p-4">{item.photoCount}</td><td className="p-4">{new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Amsterdam" }).format(new Date(item.submittedAt ?? item.createdAt))}</td></tr>)}</tbody></table></div> : <p className="mt-8 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-600">Er zijn nog geen autoaanvragen.</p>}</section></main>;
}
