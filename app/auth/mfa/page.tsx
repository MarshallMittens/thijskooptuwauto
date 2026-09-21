import { MfaSetup } from "@/components/auth/mfa-setup";
import { requireUser } from "@/lib/auth/dal";

export default async function MfaPage() {
  const context = await requireUser("/auth/mfa");

  if (!context.isStaff) {
    return (
      <main className="auth-page"><section className="auth-card"><h1 className="text-3xl font-black">Geen beheeraccount</h1><p className="mt-3 text-slate-600">Tweestapsverificatie op deze pagina is uitsluitend voor beheerders.</p></section></main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Extra beveiliging</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em]">Tweestapsverificatie vereist</h1>
        <p className="mt-3 leading-7 text-slate-600">Beheerhandelingen worden pas beschikbaar nadat je een code uit je authenticator-app hebt gecontroleerd.</p>
        <MfaSetup />
      </section>
    </main>
  );
}
