import Link from "next/link";

import { CredentialsForm } from "@/components/auth/credentials-form";
import { isSupabaseConfigured } from "@/lib/env";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; wachtwoord?: string }>;
}) {
  const { returnTo, wachtwoord } = await searchParams;
  const configured = isSupabaseConfigured();

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link href="/" className="text-sm font-bold text-[#a64b00]">← Terug naar de website</Link>
        <p className="eyebrow mt-8">Besloten omgeving</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-[#111111]">Inloggen voor autobedrijven</h1>
        <p className="mt-3 leading-7 text-slate-600">Log in met het zakelijke account van je garage. Goedgekeurde garages kunnen het aanbod bekijken en bieden; beheerders gaan na dezelfde veilige login naar de beheeromgeving.</p>
        {wachtwoord === "gewijzigd" ? <p className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900" role="status">Je wachtwoord is gewijzigd. Log opnieuw in.</p> : null}
        {!configured ? (
          <div className="mt-7 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            <strong>Lokale inrichting ontbreekt.</strong> Start eerst Supabase en vul <code>.env.local</code>. Er wordt geen gesimuleerde login gebruikt.
          </div>
        ) : (
          <div className="mt-8"><CredentialsForm mode="sign-in" returnTo={returnTo} /></div>
        )}
        <p className="mt-5 text-sm"><Link href="/wachtwoord-vergeten" className="font-bold text-[#a64b00] underline-offset-4 hover:underline">Wachtwoord vergeten?</Link></p>
        <p className="mt-8 text-sm text-slate-600">
          Nog geen dealeraccount? <Link href="/registreren" className="font-bold text-[#a64b00] underline-offset-4 hover:underline">Registreer je bedrijf</Link>
        </p>
      </section>
    </main>
  );
}
