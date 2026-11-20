import { setPlatformAffiliationAction } from "@/app/beheer/operatie/actions";
import { PortalHeader } from "@/components/portal/portal-header";
import { CompanyStatusControls } from "@/components/admin/company-status-controls";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminPage() {
  const context = await requireAdmin();
  const supabase = await createClient();
  const { data: companies, error } = await supabase
    .from("companies")
    .select("id, legal_name, trade_name, kvk_number, status, email, phone, is_platform_affiliated, created_at")
    .order("created_at", { ascending: false });
  const pendingCount = companies?.filter((company) => company.status === "pending").length ?? 0;
  const approvedCount = companies?.filter((company) => company.status === "approved").length ?? 0;

  return (
    <main className="portal-page">
      <section className="portal-panel max-w-6xl">
        <PortalHeader area="beheer" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Beheeromgeving</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Autobedrijven</h1>
            <p className="mt-3 leading-7 text-slate-600">Alle aanmeldingen staan in deze lijst. Er geldt geen maximum voor het aantal garages. Alleen gebruikers met de beheerdersrol kunnen toegang goedkeuren of blokkeren.</p>
          </div>
        </div>

        <div className="mt-6 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-800">
          Ingelogd · rol {context.staffRole}
        </div>

        {!error ? <div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Wacht op controle</p><p className="mt-1 text-2xl font-black">{pendingCount}</p></div><div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Goedgekeurd</p><p className="mt-1 text-2xl font-black">{approvedCount}</p></div><div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Totaal aangemeld</p><p className="mt-1 text-2xl font-black">{companies?.length ?? 0}</p></div></div> : null}

        {error ? (
          <p className="mt-8 rounded-xl bg-red-50 p-4 text-red-800">Bedrijven konden niet veilig worden geladen.</p>
        ) : companies?.length ? (
          <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr><th className="p-4">Bedrijf</th><th className="p-4">KvK</th><th className="p-4">Contact</th><th className="p-4">Toegang</th><th className="p-4">Relatie met Thijskooptuauto</th><th className="p-4">Toegangsactie</th></tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr className="border-t border-slate-200" key={company.id}>
                    <td className="p-4"><strong>{company.trade_name || company.legal_name}</strong><span className="mt-1 block text-slate-500">{company.legal_name}</span></td>
                    <td className="p-4 font-mono">{company.kvk_number}</td>
                    <td className="p-4">{company.email}<span className="mt-1 block text-slate-500">{company.phone}</span></td>
                    <td className="p-4 font-bold">{company.status === "approved" ? "Goedgekeurd" : company.status === "blocked" ? "Geblokkeerd" : "Wacht op controle"}</td>
                    <td className="p-4"><p className="mb-2 text-xs leading-5 text-slate-500">Deze markering gaat alleen over belangenverstrengeling en verandert de toegang niet.</p><form action={async () => { "use server"; await setPlatformAffiliationAction({ companyId: company.id, affiliated: !company.is_platform_affiliated }); }}><Button size="sm" variant="outline" disabled={context.staffRole !== "admin"}>{company.is_platform_affiliated ? "Platformrelatie verwijderen" : "Markeer als platformkoper"}</Button></form></td>
                    <td className="border-l border-slate-200 p-4">
                      {context.staffRole === "admin" ? <CompanyStatusControls companyId={company.id} companyName={company.trade_name || company.legal_name} status={company.status} /> : null}
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
