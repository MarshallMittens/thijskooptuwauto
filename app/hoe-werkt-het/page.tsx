import type { Metadata } from "next";
import Link from "next/link";

import { PublicPage } from "@/components/public/public-page";

export const metadata: Metadata = {
  title: "Auto verkopen: zo werkt het | Thijskooptuauto",
  description: "Lees hoe je jouw auto online aanmeldt, hoe wij de gegevens controleren, hoe geselecteerde garages 24 uur bieden en hoe we het hoogste bod met je bespreken.",
};

const steps = [
  ["1", "Meld je auto online aan", "Je vult het kenteken, de voertuiggegevens, kilometerstand, staat van de auto en je contactgegevens in. Met duidelijke foto’s laat je ook eventuele schade zien. Je hebt hiervoor geen account nodig."],
  ["2", "Wij controleren je autoaanmelding", "We controleren of de gegevens en foto’s compleet en bruikbaar zijn. We nemen contact met je op als er informatie ontbreekt. Ook controleren we foto’s op zichtbare persoonsgegevens voordat dealers ze kunnen bekijken."],
  ["3", "Wij publiceren je auto gecontroleerd", "Is je aanvraag geschikt voor een biedronde, dan publiceren we een gecontroleerde versie voor goedgekeurde autobedrijven. Dealers zien geen naam, telefoonnummer, e-mailadres of exact adres van jou."],
  ["4", "Garages bieden 24 uur", "Goedgekeurde garages kunnen precies 24 uur bieden. Zij zien dezelfde biedbedragen, zonder elkaars bedrijfsnaam, en kunnen het hoogste bod met minimaal de ingestelde biedstap verhogen."],
  ["5", "We bespreken het hoogste bod met jou", "Na sluiting reserveren we maximaal één hoogste bieder en starten we de afspraakroute. We nemen persoonlijk contact met je op. Een hoogste bod of winnaarreservering betekent niet automatisch dat je auto is verkocht."],
  ["6", "We leggen afspraken en afhandeling vast", "Ga je akkoord met een vervolgstap, dan registreren we de afspraken en contactmomenten zorgvuldig. De precieze verkoop-, betaal- en overdrachtsafspraken worden vóór een definitieve transactie duidelijk met de betrokken partijen vastgelegd."],
];

export default function HowItWorksPage() {
  return <PublicPage eyebrow="Auto verkopen in duidelijke stappen" title="Zo werkt jouw auto aanmelden bij Thijskooptuauto." intro="Je meldt je auto online aan. Wij controleren de informatie, laten goedgekeurde garages 24 uur bieden en bespreken het hoogste bod persoonlijk met jou."><ol className="grid gap-4">{steps.map(([number, title, text]) => <li key={number} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:grid-cols-[3rem_1fr]"><span className="grid size-10 place-items-center rounded-full bg-[#a64b00] font-black text-white">{number}</span><div><h2 className="text-xl font-bold">{title}</h2><p className="mt-2 leading-7 text-slate-600">{text}</p></div></li>)}</ol><div className="mt-10 rounded-2xl bg-[#111111] p-7 text-white"><h2 className="text-2xl font-black">Klaar om je auto aan te melden?</h2><p className="mt-3 max-w-2xl leading-7 text-white/75">Start met je kenteken en controleer de beschikbare RDW-gegevens. Je kunt ontbrekende informatie altijd zelf aanvullen.</p><Link href="/auto-aanmelden" className="mt-6 inline-flex rounded-full bg-[#f7941e] px-6 py-3 font-bold text-[#111111]">Start je autoaanmelding</Link></div></PublicPage>;
}
