import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/dal";
import { redirect } from "next/navigation";

export default async function DealerBlockedPage() {
  const context = await requireUser("/dealer/geblokkeerd");
  if (!context.companyId) redirect("/dealer/registreren");
  if (context.companyStatus === "approved") redirect("/dealer");
  if (context.companyStatus === "pending") redirect("/dealer/wachten");
  return (
    <main className="auth-page">
      <section className="auth-card text-center">
        <p className="eyebrow">Toegang geblokkeerd</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em]">Dit bedrijf heeft geen toegang</h1>
        <p className="mt-4 leading-7 text-slate-600">Neem rechtstreeks contact op met Thijskooptuauto als je denkt dat dit niet klopt.</p>
        <form action={signOut} className="mt-7"><Button variant="outline">Uitloggen</Button></form>
      </section>
    </main>
  );
}
