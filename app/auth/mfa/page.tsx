import { redirect } from "next/navigation";

import { MfaSetup } from "@/components/auth/mfa-setup";
import { requireUser } from "@/lib/auth/dal";

export default async function MfaPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const context = await requireUser("/auth/mfa");
  const { next } = await searchParams;
  const isDealer = Boolean(context.companyId);

  if (!context.isStaff && !isDealer) {
    return (
      <main className="auth-page"><section className="auth-card"><h1 className="text-3xl font-black">Geen beveiligde rol</h1><p className="mt-3 text-slate-600">Tweestapsverificatie is hier alleen beschikbaar voor beheerders en geregistreerde autobedrijven.</p></section></main>
    );
  }

  const defaultNext = context.isStaff ? "/beheer" : "/dealer";
  const nextPath = next === defaultNext ? next : defaultNext;
  if (context.assuranceLevel === "aal2") redirect(nextPath);

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Extra beveiliging</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em]">Tweestapsverificatie vereist</h1>
        <p className="mt-3 leading-7 text-slate-600">Beheer- en dealerhandelingen met gevoelige gegevens worden pas beschikbaar nadat je een code uit je authenticator-app hebt gecontroleerd.</p>
        <MfaSetup nextPath={nextPath} />
      </section>
    </main>
  );
}
