import Link from "next/link";
import Image from "next/image";
import { ArchiveApplicationButton } from "@/components/admin/archive-application-button";
import { PortalHeader } from "@/components/portal/portal-header";
import { LicensePlate } from "@/components/public/license-plate";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

const itemSchema = z.object({
  id: z.string().uuid(), reference: z.string(), status: z.string(), submittedAt: z.string().nullable(),
  createdAt: z.string(), sellerName: z.string().nullable(), registration: z.string(), make: z.string().nullable(), model: z.string().nullable(), photoCount: z.number(),
  archivedAt: z.string().nullable(), photoPath: z.string().nullable(),
});

const labels: Record<string, string> = { submitted: "Nieuw", in_review: "In controle", needs_information: "Informatie nodig", ready: "Gereed", withdrawn: "Ingetrokken", closed: "Gesloten" };

export default async function ApplicationsAdminPage({ searchParams }: { searchParams: Promise<{ archief?: string }> }) {
  const context = await requireAdmin();
  const archived = (await searchParams).archief === "1";
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_admin_applications");
  const parsed = z.array(itemSchema).safeParse(data);
  const items = parsed.success ? await Promise.all(parsed.data.filter(item => Boolean(item.archivedAt) === archived).map(async item => {
    const { data: signed } = item.photoPath ? await supabase.storage.from("vehicle-photos").createSignedUrl(item.photoPath, 300) : { data: null };
    return { ...item, photoUrl: signed?.signedUrl ?? null };
  })) : [];

  return <main className="portal-page"><section className="portal-panel max-w-6xl"><PortalHeader area="beheer" /><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Beheeromgeving</p><h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">{archived ? "Archief autoaanvragen" : "Autoaanvragen"}</h1><p className="mt-3 text-slate-600">Verkopersgegevens en interne notities zijn uitsluitend hier zichtbaar.</p><Link href={archived ? "/beheer/aanvragen" : "/beheer/aanvragen?archief=1"} className="mt-3 inline-block font-bold text-[#a64b00] underline">{archived ? "Terug naar overzicht" : "Bekijk archief"}</Link></div></div>{error || !parsed.success ? <p className="mt-8 rounded-xl bg-red-50 p-4 text-red-800">Aanvragen konden niet veilig worden geladen.</p> : items.length ? <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-4">Foto</th><th className="p-4">Kenteken</th><th className="p-4">Auto</th><th className="p-4">Verkoper</th><th className="p-4">Status</th><th className="p-4">Foto’s</th><th className="p-4">Ontvangen</th><th className="p-4">Archiveren</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-t border-slate-200"><td className="p-4"><div className="relative w-36 overflow-hidden rounded-xl bg-slate-100">{item.photoUrl ? <Image src={item.photoUrl} alt={`${item.make ?? "Auto"} ${item.model ?? ""}`} width={240} height={160} unoptimized className="aspect-[3/2] w-full object-cover" /> : <div className="grid aspect-[3/2] place-items-center text-xs text-slate-500">Geen foto</div>}{!archived && context.staffRole === "admin" && <ArchiveApplicationButton applicationId={item.id} registration={item.registration} className="absolute right-1 top-1" />}</div></td><td className="p-4"><Link href={`/beheer/aanvragen/${item.id}`} className="inline-block rounded-lg focus-visible:outline-2 focus-visible:outline-orange-500"><LicensePlate registration={item.registration} /></Link></td><td className="p-4"><strong>{item.make} {item.model}</strong></td><td className="p-4">{item.sellerName}</td><td className="p-4">{archived ? "Gearchiveerd" : labels[item.status] ?? item.status}</td><td className="p-4">{item.photoCount}</td><td className="p-4">{new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Amsterdam" }).format(new Date(item.submittedAt ?? item.createdAt))}</td><td className="p-4">{!archived && context.staffRole === "admin" && <ArchiveApplicationButton applicationId={item.id} registration={item.registration} />}</td></tr>)}</tbody></table></div> : <p className="mt-8 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-600">{archived ? "Het archief is leeg." : "Er zijn geen autoaanvragen in dit overzicht."}</p>}</section></main>;
}
