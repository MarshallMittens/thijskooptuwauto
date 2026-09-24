import type { Metadata } from "next";
import Link from "next/link";

import { PasswordRecoveryForm } from "@/components/auth/password-recovery-form";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Wachtwoord herstellen | Thijskooptuauto",
  robots: { index: false, follow: false, noarchive: true },
};

export default function ForgotPasswordPage() {
  const configured = isSupabaseConfigured();

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link href="/inloggen" className="text-sm font-bold text-[#a64b00]">← Terug naar inloggen</Link>
        <p className="eyebrow mt-8">Account herstellen</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Wachtwoord vergeten?</h1>
        <p className="mt-3 leading-7 text-slate-600">Vraag een eenmalige beveiligde link aan. We melden niet of een adres wel of niet bij ons bekend is.</p>
        {configured ? <PasswordRecoveryForm mode="request" /> : <p className="mt-7 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm">Start eerst de lokale Supabase-omgeving.</p>}
      </section>
    </main>
  );
}
