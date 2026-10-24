import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { formatEuroCents, parseEuroAmountToCents } from "@/lib/bids/amount";
import { Button } from "@/components/ui/button";

async function save(form: FormData) {
  "use server";
  await requireAdmin();
  const amount = (key: string) => { const text = String(form.get(key) ?? "").trim(); return /^0(?:[.,]00)?$/.test(text) ? 0 : parseEuroAmountToCents(text); };
  const seller = amount("seller"); const buyer = amount("buyer");
  const vatText = String(form.get("vat") ?? "").trim().replace(",", ".");
  const vat = vatText ? Number(vatText) : Number.NaN;
  if (seller === null || buyer === null || !Number.isFinite(vat) || vat < 0 || vat > 100 || seller > 100000000 || buyer > 100000000) redirect("/beheer/kosten?status=invalid");
  const client = await createClient();
  const { error } = await client.rpc("admin_handling_fees", { p_seller_cents: seller, p_buyer_cents: buyer, p_vat_percent: vat });
  redirect(`/beheer/kosten?status=${error ? "error" : "saved"}`);
}

const schema = z.object({ settings: z.object({ seller_cents: z.number(), buyer_cents: z.number(), vat_percent: z.number() }).nullable(), invoices: z.array(z.object({ id: z.string(), payer: z.string(), total_cents: z.number(), status: z.string() })) });
export default async function FeesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const client = await createClient();
  const { data, error } = await client.rpc("admin_handling_fees", {});
  const parsed = schema.safeParse(data);
  const { status } = await searchParams;
  const settings = parsed.success ? parsed.data.settings : null;
  return <main className="portal-page"><section className="portal-panel max-w-4xl"><Link href="/beheer" className="underline">← Beheer</Link><h1 className="mt-5 text-3xl font-black">Afhandelingskosten en losse facturen</h1><p className="mt-3 leading-7">Stel afzonderlijke bedragen inclusief btw in voor particulier en garage. De instelling wordt vastgelegd bij nieuwe verkoopdossiers. Wijzigingen gelden niet met terugwerkende kracht.</p><p className="mt-3 rounded-xl bg-orange-50 p-4">Pas na status ‘Voltooid’ wordt per betalende partij een losse conceptfactuur aangemaakt. De koopprijs blijft hiervan gescheiden. Uitgifte en verzending vereisen definitieve bedrijfs- en factuurgegevens en vooraf overeengekomen kosten.</p>{status && <p role="status" className="mt-4 font-bold">{status === "saved" ? "Kosten opgeslagen voor nieuwe dossiers." : "Opslaan niet gelukt. Controleer de bedragen en btw."}</p>}{error || !parsed.success ? <p className="mt-5">Kostenbeheer is nog niet beschikbaar; de databasemigratie moet worden toegepast.</p> : <><form action={save} className="mt-6 grid gap-5 sm:grid-cols-2">{[{ key: "seller", label: "Particulier · inclusief btw (€)", value: settings?.seller_cents }, { key: "buyer", label: "Garage · inclusief btw (€)", value: settings?.buyer_cents }].map(({ key, label, value }) => <label key={key} className="font-bold">{label}<input name={key} type="number" min="0" max="1000000" step="0.01" required defaultValue={value === undefined ? "" : (value / 100).toFixed(2)} className="mt-2 block w-full rounded-lg border p-3" /></label>)}<label className="font-bold">Btw-percentage<input name="vat" type="number" min="0" max="100" step="0.01" required defaultValue={settings?.vat_percent ?? ""} className="mt-2 block w-full rounded-lg border p-3" /></label><Button className="self-end" type="submit">Kosten opslaan</Button></form><h2 className="mt-8 text-xl font-bold">Afzonderlijke conceptfacturen na verkoop</h2>{parsed.data.invoices.length ? <ul className="mt-4 space-y-3">{parsed.data.invoices.map((invoice) => <li key={invoice.id} className="rounded-xl bg-slate-50 p-4">{invoice.payer === "seller" ? "Particulier" : "Garage"} · {formatEuroCents(invoice.total_cents)} · Concept, nog niet uitgegeven</li>)}</ul> : <p className="mt-3">Nog geen conceptfacturen.</p>}</>}</section></main>;
}
