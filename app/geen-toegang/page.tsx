import Link from "next/link";

export default function NoAccessPage() {
  return (
    <main className="auth-page">
      <section className="auth-card text-center">
        <p className="eyebrow">Toegang geweigerd</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em]">Je hebt geen toegang tot deze omgeving</h1>
        <p className="mt-3 leading-7 text-slate-600">Je account is wel ingelogd, maar mist de vereiste rol of bedrijfsstatus.</p>
        <Link href="/" className="mt-7 inline-flex font-bold text-[#1554d1]">Naar de startpagina</Link>
      </section>
    </main>
  );
}
