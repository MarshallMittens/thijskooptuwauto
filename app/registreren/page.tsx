import Link from "next/link";

import { CredentialsForm } from "@/components/auth/credentials-form";
import { isSupabaseConfigured } from "@/lib/env";

export default function RegisterPage() {
  const configured = isSupabaseConfigured();

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link href="/" className="text-sm font-bold text-[#a64b00]">← Terug naar de website</Link>
        <p className="eyebrow mt-8">Dealerregistratie</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-[#111111]">Maak eerst je persoonlijke login</h1>
        <p className="mt-3 leading-7 text-slate-600">Na e-mailverificatie vul je de bedrijfsgegevens in. Het bedrijf blijft geblokkeerd voor aanbod totdat Thijskooptuauto het handmatig goedkeurt.</p>
        {!configured ? (
          <div className="mt-7 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            Registratie werkt zodra de lokale Supabase-omgeving is gestart. Er worden nu geen gegevens verzonden.
          </div>
        ) : (
          <div className="mt-8"><CredentialsForm mode="sign-up" /></div>
        )}
      </section>
    </main>
  );
}
