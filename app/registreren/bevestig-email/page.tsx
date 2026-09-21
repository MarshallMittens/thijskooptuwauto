import Link from "next/link";

export default function ConfirmEmailPage() {
  return (
    <main className="auth-page">
      <section className="auth-card text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#edf4ff] text-2xl">✉</span>
        <h1 className="mt-6 text-3xl font-black tracking-[-0.04em]">Controleer je e-mail</h1>
        <p className="mt-3 leading-7 text-slate-600">Open de verificatielink en vul daarna de bedrijfsgegevens in. Goedkeuring gebeurt altijd handmatig.</p>
        <Link href="/inloggen" className="mt-7 inline-flex font-bold text-[#a64b00]">Terug naar inloggen</Link>
      </section>
    </main>
  );
}
