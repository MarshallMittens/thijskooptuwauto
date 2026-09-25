import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, Camera, CarFront, Check, MailCheck, ShieldCheck, UserRoundPlus } from "lucide-react";

import { LicensePlateStart } from "@/components/public/license-plate-start";
import { CustomerReviews } from "@/components/public/customer-reviews";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";

const steps = [
  ["01", "Meld je auto online aan", "Vul je kenteken in, controleer de voertuiggegevens en vertel ons eerlijk over de staat van je auto.", CarFront],
  ["02", "Voeg duidelijke foto’s toe", "Laat de buitenkant, binnenkant en eventuele schade zien. Zo kunnen wij je auto zorgvuldig beoordelen.", Camera],
  ["03", "Wij controleren je aanvraag", "We controleren je gegevens en foto’s. Ontbreekt er informatie, dan nemen we persoonlijk contact met je op.", BadgeCheck],
  ["04", "Garages bieden 24 uur", "Na goedkeuring bieden geselecteerde garages 24 uur. Zij zien de bedragen en kunnen elkaar overbieden; wij bespreken het hoogste bod persoonlijk met jou.", Building2],
] as const;

const companySteps = [
  ["01", "Maak je persoonlijke login", "Gebruik je zakelijke e-mailadres en bevestig de verificatiemail.", UserRoundPlus],
  ["02", "Vul je bedrijfsgegevens in", "Geef onder meer je bedrijfsnaam, KvK-nummer, adres en contactpersoon door.", Building2],
  ["03", "Wacht op onze controle", "Thijs controleert iedere aanvraag. Pas na goedkeuring krijg je toegang tot het aanbod.", BadgeCheck],
] as const;

export const metadata: Metadata = {
  title: "Auto verkopen? Meld je auto online aan | Thijskooptuauto",
  description: "Wil je jouw auto verkopen? Meld je auto online aan met kenteken, voertuiggegevens en foto’s. Wij controleren de aanvraag en bespreken mogelijke biedingen persoonlijk met je.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <SiteHeader inverse />
      <section className="relative isolate overflow-hidden bg-[#111111] text-white">
        <Image src="/car-inspection-hero.png" alt="Donkergrijze auto klaar voor inspectie" fill priority sizes="100vw" className="-z-20 object-cover object-[64%_center]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(4,13,28,.98)_0%,rgba(4,13,28,.90)_42%,rgba(4,13,28,.25)_100%)]" />
        <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="max-w-[660px]">
            <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-semibold">Persoonlijk en duidelijk</p>
            <h1 className="mt-6 text-[clamp(3rem,7vw,5.8rem)] font-black leading-[.9] tracking-[-0.065em]">Je auto verkopen begint met één kenteken.</h1>
            <p className="mt-7 max-w-[580px] text-lg leading-8 text-white/75">Meld je auto online aan met de belangrijkste voertuiggegevens en duidelijke foto’s. Wij controleren je aanvraag en bespreken persoonlijk welke vervolgstappen mogelijk zijn.</p>
            <div className="mt-10 max-w-[600px] rounded-[1.5rem] bg-white p-4 text-[#111111] shadow-[0_24px_80px_rgba(0,0,0,.32)]"><LicensePlateStart /></div>
            <ul className="mt-7 flex flex-wrap gap-x-7 gap-y-3 text-sm text-white/80">
              <li className="flex items-center gap-2"><Check className="size-4 text-[#f7941e]" /> Geen account nodig</li>
              <li className="flex items-center gap-2"><Check className="size-4 text-[#f7941e]" /> Geen gegarandeerde verkoop</li>
              <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-[#f7941e]" /> Gegevens afgeschermd</li>
            </ul>
          </div>
        </div>
      </section>
      <section className="bg-[#f8f6f2] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-[1240px]">
          <p className="eyebrow">Zo werkt het</p>
          <h2 className="mt-3 max-w-4xl text-[clamp(2.3rem,5vw,4.4rem)] font-black leading-[.98] tracking-[-0.055em]">Zo meld je jouw auto aan en ontvang je mogelijke biedingen.</h2>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">Je doorloopt vier duidelijke stappen. Een aanmelding blijft vrijblijvend: een bod leidt pas tot verdere afhandeling nadat we de uitkomst met jou hebben besproken.</p>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {steps.map(([number, title, text, Icon]) => <article key={number} className="rounded-[1.5rem] border border-slate-200 bg-white p-7"><div className="flex justify-between"><span className="font-mono font-bold text-[#a64b00]">{number}</span><Icon className="size-6 text-[#a64b00]" /></div><h3 className="mt-12 text-xl font-extrabold">{title}</h3><p className="mt-3 leading-7 text-slate-600">{text}</p></article>)}
          </div>
          <div className="mt-10 text-center"><Link href="/hoe-werkt-het" className="font-bold text-[#a64b00] hover:underline">Bekijk hoe je jouw auto aanmeldt en biedingen ontvangt</Link></div>
        </div>
      </section>
      <section id="voor-bedrijven" className="overflow-hidden bg-[#111111] px-5 py-20 text-white sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-[1240px] gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-16">
          <div>
            <p className="eyebrow text-[#f7941e]">Voor autobedrijven</p>
            <h2 className="mt-3 text-[clamp(2.3rem,5vw,4.2rem)] font-black leading-[.98] tracking-[-0.055em]">Wil je meebieden op geselecteerd aanbod?</h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">Vraag een bedrijfsaccount aan en vul na de e-mailbevestiging je bedrijfsgegevens in. We controleren iedere registratie handmatig. Na goedkeuring kun je gepubliceerde auto’s bekijken en daarop bieden.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/registreren" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#f7941e] px-6 py-3 font-extrabold text-[#111111] transition hover:bg-[#ffac48] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7941e]">
                Bedrijfsaccount aanvragen <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link href="/inloggen?returnTo=%2Fdealer" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 px-6 py-3 font-bold text-white transition hover:border-white/60 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                Al een account? Inloggen
              </Link>
            </div>
            <p className="mt-5 flex items-start gap-2 text-sm leading-6 text-white/60"><MailCheck className="mt-0.5 size-4 shrink-0 text-[#f7941e]" aria-hidden="true" />Een registratie geeft niet automatisch toegang. Je ontvangt eerst een verificatiemail en daarna beoordelen we de bedrijfsaanvraag.</p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {companySteps.map(([number, title, text, Icon]) => (
              <li key={number} className="grid gap-5 rounded-[1.4rem] border border-white/15 bg-white/[.07] p-6 sm:block lg:grid lg:grid-cols-[3rem_2.75rem_1fr] lg:items-start">
                <span className="font-mono text-sm font-bold text-[#f7941e]">{number}</span>
                <span className="flex size-11 items-center justify-center rounded-full bg-[#f7941e] text-[#111111]"><Icon className="size-5" aria-hidden="true" /></span>
                <span><strong className="block text-lg font-extrabold">{title}</strong><span className="mt-2 block leading-7 text-white/65">{text}</span></span>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="border-t border-slate-200 bg-white px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-[1240px]"><CustomerReviews /></div>
      </section>
      <SiteFooter />
    </div>
  );
}
