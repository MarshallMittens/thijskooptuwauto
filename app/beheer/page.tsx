import { changeCompanyStatus } from "@/app/beheer/actions";
import { signOut } from "@/app/auth/actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminPage() {
  const context = await requireAdmin();
  const supabase = await createClient();
  const { data: companies, error } = await supabase
    .from("companies")
    .select("id, legal_name, trade_name, kvk_number, status, email, phone, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="portal-page">
      <section className="portal-panel max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Beheeromgeving</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Autobedrijven</h1>
            <p className="mt-3 leading-7 text-slate-600">Alleen beheerders met tweestapsverificatie kunnen bedrijven goedkeuren of blokkeren.</p>
          </div>
          <div className="flex gap-3"><Link href="/beheer/aanvragen" className="inline-flex items-center rounded-md bg-[#a64b00] px-4 py-2 text-sm font-bold text-white">Autoaanvragen</Link><form action={signOut}><Button variant="outline">Uitloggen</Button></form></div>
        </div>

        <div className="mt-6 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-800">
          MFA actief · rol {context.staffRole}
        </div>

        {error ? (
          <p className="mt-8 rounded-xl bg-red-50 p-4 text-red-800">Bedrijven konden niet veilig worden geladen.</p>
        ) : companies?.length ? (
          <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr><th className="p-4">Bedrijf</th><th className="p-4">KvK</th><th className="p-4">Contact</th><th className="p-4">Status</th><th className="p-4">Actie</th></tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr className="border-t border-slate-200" key={company.id}>
                    <td className="p-4"><strong>{company.trade_name || company.legal_name}</strong><span className="mt-1 block text-slate-500">{company.legal_name}</span></td>
                    <td className="p-4 font-mono">{company.kvk_number}</td>
                    <td className="p-4">{company.email}<span className="mt-1 block text-slate-500">{company.phone}</span></td>
                    <td className="p-4 font-bold">{company.status}</td>
                    <td className="p-4">
                      <form action={changeCompanyStatus} className="flex gap-2">
                        <input type="hidden" name="companyId" value={company.id} />
                        {context.staffRole === "admin" && company.status !== "approved" ? <Button size="sm" name="status" value="approved">Goedkeuren</Button> : null}
                        {context.staffRole === "admin" && company.status !== "blocked" ? <Button size="sm" variant="destructive" name="status" value="blocked">Blokkeren</Button> : null}
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-600">Nog geen bedrijfsregistraties.</div>
        )}
      </section>
    </main>
  );
}
