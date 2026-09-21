import type { Metadata } from "next";

import { PublicPage } from "@/components/public/public-page";

export const metadata: Metadata = { title: "Veelgestelde vragen | Thijs koopt uw auto", description: "Antwoorden over auto aanmelden, voertuiggegevens, foto’s en biedingen." };

const questions = [
  ["Moet ik een account maken?", "Nee. Voor een particuliere autoaanmelding is in deze versie geen account nodig."],
  ["Wordt mijn auto gegarandeerd verkocht?", "Nee. Een aanmelding, publicatie of ontvangen bod garandeert geen verkoop."],
  ["Welke gegevens haalt RDW op?", "Alleen beschikbare openbare voertuiggegevens, zoals merk, handelsbenaming, eerste toelating en kleur. Geen eigenaar-, schade-, onderhouds- of marktwaardegegevens."],
  ["Zien autobedrijven mijn contactgegevens?", "Nee, niet standaard. Naam, e-mail, telefoonnummer en postcode worden apart opgeslagen en zijn alleen toegankelijk voor bevoegd beheer."],
  ["Waarom zijn foto’s nodig?", "Foto’s helpen om de staat van de auto te beoordelen. Verwijder of bedek documenten, gezichten, huisnummers en andere persoonsgegevens voordat je uploadt."],
  ["Is het hoogste bod automatisch bindend?", "Nee. De hoogste bieder wordt niet automatisch koper en een biedronde is niet automatisch een verkoop."],
];

export default function FaqPage() {
  return <PublicPage eyebrow="Vragen en antwoorden" title="Goed om te weten vóór je begint." intro="Hier vind je de belangrijkste uitleg over de huidige werkwijze."><div className="grid gap-4">{questions.map(([question, answer]) => <details key={question} className="group rounded-2xl border border-slate-200 bg-white p-6"><summary className="cursor-pointer font-bold">{question}</summary><p className="mt-4 leading-7 text-slate-600">{answer}</p></details>)}</div></PublicPage>;
}
