import type { Metadata } from "next";

import { PublicPage } from "@/components/public/public-page";

export const metadata: Metadata = { title: "Contact | Thijs koopt uw auto", description: "Contactinformatie van Thijskooptuauto." };

export default function ContactPage() {
  return <PublicPage eyebrow="Contact" title="Neem contact op met Thijskooptuauto." intro="De definitieve contactgegevens worden vóór publicatie toegevoegd."><div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-7"><h2 className="text-xl font-bold">Conceptinhoud</h2><p className="mt-3 leading-7">Bedrijfsnaam, KvK-nummer, vestigingsadres, e-mailadres en telefoonnummer moeten nog door de ondernemer worden gecontroleerd. Deze pagina bevat bewust geen verzonnen gegevens.</p></div></PublicPage>;
}
