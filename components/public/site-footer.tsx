import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-[#090909] px-5 py-10 text-sm text-white/70 sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-[1240px] gap-6 sm:grid-cols-2 sm:items-end">
        <div><Image src="/tkua-logo.png" alt="Thijs koopt uw auto" width={220} height={222} className="h-24 w-auto" /><p className="mt-4 max-w-lg leading-6">Een autoaanmelding is vrijblijvend en garandeert geen bod of verkoop. Bedrijfs- en juridische gegevens worden vóór livegang definitief gecontroleerd.</p></div>
        <nav className="flex flex-wrap gap-4 sm:justify-end" aria-label="Voettekst"><Link href="/privacy-en-voorwaarden" className="hover:text-[#f7941e]">Privacy en voorwaarden</Link><Link href="/mijn-aanvraag" className="hover:text-[#f7941e]">Mijn aanvraag</Link><Link href="/inloggen" className="hover:text-[#f7941e]">Dealerinlog</Link></nav>
        <p className="sm:col-span-2">© {new Date().getFullYear()} Thijs koopt uw auto · Lokale ontwikkelversie, niet gepubliceerd</p>
        <p className="sm:col-span-2 text-xs">Kentekenlettertype: <a href="https://lefly.vepar.nl/" className="underline hover:text-[#f7941e]">LeFly Fonts</a> · <a href="https://creativecommons.org/licenses/by-sa/3.0/" className="underline hover:text-[#f7941e]">CC BY-SA 3.0</a>. Dit is een interpretatie, geen officieel RDW-lettertype.</p>
      </div>
    </footer>
  );
}
