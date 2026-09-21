import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { requireDealer } from "@/lib/auth/dal";

export const metadata = { robots: { index: false, follow: false } };

export default async function DealerPage() {
  const context = await requireDealer();
  return (
    <main className="portal-page">
      <section className="portal-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Dealerportaal</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Toegang goedgekeurd</h1>
            <p className="mt-3 leading-7 text-slate-600">De toegangscontrole werkt. Het voertuigaanbod en bieden worden in fase 3 toegevoegd.</p>
          </div>
          <form action={signOut}><Button variant="outline">Uitloggen</Button></form>
        </div>
        <dl className="mt-8 grid gap-4 rounded-2xl bg-slate-50 p-6 sm:grid-cols-2">
          <div><dt className="text-sm text-slate-500">Bedrijfsstatus</dt><dd className="mt-1 font-bold">Goedgekeurd</dd></div>
          <div><dt className="text-sm text-slate-500">Bedrijfs-ID</dt><dd className="mt-1 font-mono text-sm">{context.companyId}</dd></div>
        </dl>
      </section>
    </main>
  );
}
