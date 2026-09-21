import type { Metadata } from "next";

import { PublicPage } from "@/components/public/public-page";

export const metadata: Metadata = { title: "Over Thijskooptuauto", description: "Lees over de werkwijze en uitgangspunten van Thijskooptuauto." };

export default function AboutPage() {
  return <PublicPage eyebrow="Over ons" title="Persoonlijke begeleiding bij het aanbieden van je auto." intro="Thijskooptuauto bouwt aan een zorgvuldig proces waarin particuliere autoaanmeldingen gecontroleerd worden behandeld."><div className="grid gap-6 md:grid-cols-2"><article className="rounded-2xl bg-white p-7"><h2 className="text-2xl font-bold">Onze werkwijze</h2><p className="mt-4 leading-7 text-slate-600">We verzamelen alleen gegevens die nodig zijn om een voertuig te beoordelen en een mogelijke transactie te begeleiden. Verkopersgegevens worden niet standaard met autobedrijven gedeeld.</p></article><article className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-7"><h2 className="text-2xl font-bold">Nog te controleren</h2><p className="mt-4 leading-7 text-slate-700">De definitieve bedrijfsgegevens, juridische rol en commerciële voorwaarden zijn nog niet vastgesteld. Deze ontwikkelversie doet daarom geen toezegging over prijs, verkoop of doorlooptijd.</p></article></div></PublicPage>;
}
