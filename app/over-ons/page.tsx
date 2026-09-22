import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Camera, CarFront, ClipboardCheck, MessagesSquare, ShieldCheck, UserRound } from "lucide-react";

import { PublicPage } from "@/components/public/public-page";

export const metadata: Metadata = {
  title: "Over Thijskooptuauto | Persoonlijk je auto aanbieden",
  description: "Maak kennis met Thijs en lees hoe Thijskooptuauto jouw autoaanmelding controleert, autobedrijven besloten laat bieden en de uitkomst persoonlijk met je bespreekt.",
};

const processSteps = [
  ["01", "Meld je auto online aan", "Je start met het kenteken en vult de voertuiggegevens en staat van je auto aan.", CarFront],
  ["02", "Voeg duidelijke foto’s toe", "Je laat de auto van meerdere kanten zien en brengt eventuele schade duidelijk in beeld.", Camera],
  ["03", "Wij controleren je aanvraag", "We controleren de informatie en nemen contact op wanneer er iets ontbreekt.", ClipboardCheck],
  ["04", "Autobedrijven bieden besloten", "Na goedkeuring kunnen geselecteerde autobedrijven bieden. We vergelijken en bespreken de uitkomst met jou.", Building2],
] as const;

export default function AboutPage() {
  return (
    <PublicPage
      eyebrow="Over Thijskooptuauto"
      title="Persoonlijk contact tijdens iedere stap van je autoaanmelding."
      intro="Achter Thijskooptuauto staat Thijs. Hij is jouw vaste aanspreekpunt bij de controle van je aanvraag, mogelijke biedingen en de vervolgstappen."
    >
      <section className="grid overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white lg:grid-cols-[.78fr_1.22fr]">
        <div className="flex min-h-72 flex-col justify-between bg-[#111111] p-8 text-white sm:p-10">
          <div className="grid size-20 place-items-center rounded-full bg-[#f7941e] text-[#111111]"><UserRound className="size-10" aria-hidden="true" /></div>
          <p className="mt-12 max-w-sm text-2xl font-black leading-tight">Duidelijke uitleg bij iedere volgende stap.</p>
        </div>
        <div className="p-8 sm:p-10">
          <p className="eyebrow">Hoi, ik ben Thijs</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Eén vast aanspreekpunt voor jouw aanvraag.</h2>
          <div className="mt-6 space-y-4 leading-7 text-slate-600">
            <p>Thijskooptuauto is opgezet om particuliere autobezitters op een overzichtelijke manier in contact te brengen met geselecteerde autobedrijven. Je meldt je auto online aan; daarna controleren we eerst of de informatie compleet en bruikbaar is.</p>
            <p>Thijs begeleidt het proces persoonlijk. Hij bespreekt ontbrekende informatie met je, vergelijkt de ontvangen biedingen en legt de mogelijke vervolgstappen uit. De hoogste bieder wordt niet automatisch koper en jij zit door een aanmelding nergens aan vast.</p>
            <p>We doen geen belofte over een gegarandeerd bod, verkoopprijs of vaste doorlooptijd. We kiezen voor een controleerbaar proces met heldere communicatie.</p>
          </div>
          <div className="mt-7 flex flex-wrap gap-4">
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-full bg-[#f7941e] px-6 py-3 font-bold text-[#111111]">Neem contact op <ArrowRight className="size-4" aria-hidden="true" /></Link>
            <a href="tel:+31314642419" className="inline-flex items-center rounded-full border border-slate-300 px-6 py-3 font-bold hover:border-[#a64b00]">Bel 0314-642419</a>
          </div>
        </div>
      </section>

      <section className="mt-12" aria-labelledby="uitgangspunten">
        <p className="eyebrow">Onze uitgangspunten</p>
        <h2 id="uitgangspunten" className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Zorgvuldig, persoonlijk en afgeschermd.</h2>
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-6"><MessagesSquare className="size-7 text-[#a64b00]" aria-hidden="true" /><h3 className="mt-7 text-xl font-black">Persoonlijk contact</h3><p className="mt-3 leading-7 text-slate-600">We leggen de uitkomst uit en bespreken samen welke vervolgstap passend is.</p></article>
          <article className="rounded-2xl border border-slate-200 bg-white p-6"><Building2 className="size-7 text-[#a64b00]" aria-hidden="true" /><h3 className="mt-7 text-xl font-black">Gecontroleerde autobedrijven</h3><p className="mt-3 leading-7 text-slate-600">Alleen goedgekeurde, niet-geblokkeerde autobedrijven krijgen toegang tot gepubliceerd aanbod.</p></article>
          <article className="rounded-2xl border border-slate-200 bg-white p-6"><ShieldCheck className="size-7 text-[#a64b00]" aria-hidden="true" /><h3 className="mt-7 text-xl font-black">Verkopersgegevens beschermd</h3><p className="mt-3 leading-7 text-slate-600">Dealers zien standaard geen naam, telefoonnummer, e-mailadres of exact adres van de verkoper.</p></article>
        </div>
      </section>

      <section className="mt-12 rounded-[1.5rem] bg-white p-7 sm:p-9" aria-labelledby="werkwijze">
        <p className="eyebrow">De werkwijze</p>
        <h2 id="werkwijze" className="mt-3 max-w-3xl text-3xl font-black tracking-[-0.04em] sm:text-4xl">Hetzelfde duidelijke stappenplan, van kenteken tot besproken uitkomst.</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-2">
          {processSteps.map(([number, title, text, Icon]) => (
            <li key={number} className="rounded-2xl bg-[#f8f6f2] p-6">
              <div className="flex items-center justify-between"><span className="font-mono font-black text-[#a64b00]">{number}</span><Icon className="size-5 text-[#a64b00]" aria-hidden="true" /></div>
              <h3 className="mt-6 text-xl font-black">{title}</h3>
              <p className="mt-2 leading-7 text-slate-600">{text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap gap-5">
          <Link href="/auto-aanmelden" className="inline-flex items-center gap-2 rounded-full bg-[#111111] px-6 py-3 font-bold text-white">Start je autoaanmelding <ArrowRight className="size-4" aria-hidden="true" /></Link>
          <Link href="/hoe-werkt-het" className="inline-flex items-center font-bold text-[#a64b00] hover:underline">Bekijk het volledige proces</Link>
        </div>
      </section>
    </PublicPage>
  );
}
