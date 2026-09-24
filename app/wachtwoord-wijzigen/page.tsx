import type { Metadata } from "next";

import { PasswordRecoveryForm } from "@/components/auth/password-recovery-form";
import { requireUser } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Nieuw wachtwoord instellen | Thijskooptuauto",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function UpdatePasswordPage() {
  await requireUser("/wachtwoord-wijzigen");

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Accountbeveiliging</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Stel een nieuw wachtwoord in</h1>
        <p className="mt-3 leading-7 text-slate-600">Kies een nieuw wachtwoord. Na de wijziging moet je op alle apparaten opnieuw inloggen.</p>
        <PasswordRecoveryForm mode="update" />
      </section>
    </main>
  );
}
