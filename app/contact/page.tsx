import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, ExternalLink, Mail, MapPin, Phone } from "lucide-react";

import { ContactForm } from "@/components/public/contact-form";
import { PublicPage } from "@/components/public/public-page";

export const metadata: Metadata = {
  title: "Contact Thijskooptuauto | Doetinchem",
  description: "Neem contact op met Thijskooptuauto in Doetinchem. Bel, mail, bekijk het adres of plan een afspraak om jouw autoaanmelding te bespreken.",
};

export default function ContactPage() {
  return (
    <PublicPage
      eyebrow="Contact in Doetinchem"
      title="Neem contact op met Thijskooptuauto."
      intro="Heb je een vraag over het aanmelden of verkopen van je auto? Bel, mail of laat een bericht achter. Bezoek is mogelijk op afspraak."
    >
      <div className="grid gap-6 lg:grid-cols-[1.08fr_.92fr]">
        <ContactForm />
        <aside className="rounded-[1.5rem] bg-[#111111] p-6 text-white shadow-sm sm:p-8" aria-label="Contactgegevens">
          <p className="eyebrow !text-[#f7941e]">Direct contact</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">Thijs koopt uw auto</h2>
          <div className="mt-8 space-y-7">
            <section className="flex gap-4">
              <MapPin className="mt-1 size-5 shrink-0 text-[#f7941e]" aria-hidden="true" />
              <div>
                <h3 className="font-bold">Adres</h3>
                <address className="mt-2 not-italic leading-7 text-white/75">Houtmolenstraat 41<br />7081 AP Doetinchem</address>
                <a href="https://www.google.com/maps/search/?api=1&query=Houtmolenstraat%2041%2C%207081%20AP%20Doetinchem" target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 font-bold text-[#f7941e] hover:underline">Bekijk route in Google Maps <ExternalLink className="size-4" aria-hidden="true" /></a>
              </div>
            </section>
            <section className="flex gap-4">
              <Phone className="mt-1 size-5 shrink-0 text-[#f7941e]" aria-hidden="true" />
              <div><h3 className="font-bold">Telefoon</h3><a href="tel:+31314642419" className="mt-2 block text-white/75 hover:text-white hover:underline">0314-642419</a></div>
            </section>
            <section className="flex gap-4">
              <Mail className="mt-1 size-5 shrink-0 text-[#f7941e]" aria-hidden="true" />
              <div><h3 className="font-bold">E-mail</h3><a href="mailto:info@thijskooptuwauto.nl" className="mt-2 block break-all text-white/75 hover:text-white hover:underline">info@thijskooptuwauto.nl</a></div>
            </section>
            <section className="flex gap-4">
              <Clock3 className="mt-1 size-5 shrink-0 text-[#f7941e]" aria-hidden="true" />
              <div><h3 className="font-bold">Openingstijden</h3><p className="mt-2 text-white/75">Bezoek uitsluitend op afspraak.</p></div>
            </section>
          </div>
          <div className="mt-8 rounded-2xl border border-white/15 bg-white/5 p-5 text-sm leading-6 text-white/65">
            <p>Wil je een auto aanmelden? Gebruik dan het aanmeldformulier. Zo kunnen we direct de benodigde voertuiggegevens en foto’s controleren.</p>
            <Link href="/auto-aanmelden" className="mt-3 inline-flex font-bold text-[#f7941e] hover:underline">Ga naar auto aanmelden</Link>
          </div>
        </aside>
      </div>
    </PublicPage>
  );
}
