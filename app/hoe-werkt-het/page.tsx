import type { Metadata } from "next";
import Link from "next/link";

import { PublicPage } from "@/components/public/public-page";

export const metadata: Metadata = { title: "Hoe werkt het? | Thijs koopt uw auto", description: "Lees hoe een autoaanmelding wordt gecontroleerd en welke mogelijke vervolgstappen er zijn." };

const steps = [
  ["1", "Auto aanmelden", "Je vult voertuiggegevens, de staat van de auto, foto’s en contactgegevens in. Een account is niet nodig."],
  ["2", "Controle door Thijskooptuauto", "We controleren of de informatie compleet is en nemen zo nodig contact op. Foto’s worden gecontroleerd op zichtbare persoonsgegevens."],
  ["3", "Eventueel publiceren", "Pas na controle kan een voertuig zonder verkopersgegevens beschikbaar worden gemaakt aan goedgekeurde autobedrijven."],
  ["4", "Besloten biedronde", "Goedgekeurde autobedrijven kunnen binnen een afgesproken periode een besloten bod uitbrengen. De hoogste bieder wordt niet automatisch koper."],
  ["5", "Uitkomst bespreken", "Thijskooptuauto bespreekt de uitkomst met jou. Een aanmelding of bod is niet automatisch een afgeronde verkoop."],
];

export default function HowItWorksPage() {
  return <PublicPage eyebrow="Het proces" title="Van aanmelding tot een gecontroleerde uitkomst." intro="Je houdt overzicht over wat er met je aanvraag gebeurt. We publiceren niets voordat de aanvraag is gecontroleerd."><ol className="grid gap-4">{steps.map(([number, title, text]) => <li key={number} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:grid-cols-[3rem_1fr]"><span className="grid size-10 place-items-center rounded-full bg-[#a64b00] font-black text-white">{number}</span><div><h2 className="text-xl font-bold">{title}</h2><p className="mt-2 leading-7 text-slate-600">{text}</p></div></li>)}</ol><div className="mt-10"><Link href="/auto-aanmelden" className="inline-flex rounded-full bg-[#a64b00] px-6 py-3 font-bold text-white">Meld je auto aan</Link></div></PublicPage>;
}
