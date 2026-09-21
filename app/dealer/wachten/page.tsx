import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/dal";
import { redirect } from "next/navigation";

export default async function DealerPendingPage() {
  const context = await requireUser("/dealer/wachten");
  if (!context.companyId) redirect("/dealer/registreren");
  if (context.companyStatus === "approved") redirect("/dealer");
  if (context.companyStatus === "blocked") redirect("/dealer/geblokkeerd");

  return (
    <main className="auth-page">
      <section className="auth-card text-center">
        <p className="eyebrow">Status: in afwachting</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em]">Je bedrijfsregistratie wordt gecontroleerd</h1>
        <p className="mt-4 leading-7 text-slate-600">Je krijgt pas toegang tot het aanbod nadat een beheerder het bedrijf heeft goedgekeurd. Je kunt deze status niet zelf wijzigen.</p>
        <p className="mt-4 text-sm text-slate-500">Account: {context.userId.slice(0, 8)}…</p>
        <form action={signOut} className="mt-7"><Button variant="outline">Uitloggen</Button></form>
      </section>
    </main>
  );
}
