import Image from "next/image";
import Link from "next/link";

function FacebookIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true"><path d="M18.77 7.46h-4.27V5.32c0-.93.62-1.15 1.06-1.15h2.94V.02L14.44 0C10.4 0 9.5 3.03 9.5 4.97v2.49H6v4.79h3.5V24h5V12.25h3.85l.42-4.79Z" /></svg>;
}

function InstagramIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="20" height="20" x="2" y="2" rx="5" /><path d="M16 11.37a4 4 0 1 1-7.78 1.26A4 4 0 0 1 16 11.37Z" /><path d="M17.5 6.5h.01" /></svg>;
}

export function SiteFooter() {
  return (
    <footer className="bg-[#090909] px-5 py-10 text-sm text-white/70 sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-[1240px] gap-6 sm:grid-cols-2 sm:items-end">
        <div>
          <Image src="/tkua-logo.png" alt="Thijs koopt uw auto" width={220} height={222} className="h-24 w-auto" />
          <p className="mt-4 max-w-lg leading-6">Een autoaanmelding is vrijblijvend en garandeert geen bod of verkoop. Bedrijfs- en juridische gegevens worden vóór livegang definitief gecontroleerd.</p>
          <div className="mt-6">
            <p className="font-bold text-white">Volg Thijskooptuauto</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <a href="https://www.facebook.com/thijskooptuwauto.nl" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 py-2 font-semibold text-white transition hover:border-[#f7941e] hover:bg-[#f7941e] hover:text-[#111111] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7941e]" aria-label="Volg Thijskooptuauto op Facebook">
                <FacebookIcon className="size-5" /> Facebook
              </a>
              <span className="inline-flex min-h-11 cursor-not-allowed items-center gap-2 rounded-xl border border-white/10 px-4 py-2 font-semibold text-white/45" aria-label="Instagram-link nog instellen" title="Instagram-link nog instellen">
                <InstagramIcon className="size-5" /> Instagram <span className="text-xs font-normal">(link volgt)</span>
              </span>
            </div>
          </div>
        </div>
        <nav className="flex flex-wrap gap-4 sm:justify-end" aria-label="Voettekst"><Link href="/privacy-en-voorwaarden" className="hover:text-[#f7941e]">Privacy en voorwaarden</Link><Link href="/mijn-aanvraag" className="hover:text-[#f7941e]">Mijn aanvraag</Link><Link href="/inloggen" className="hover:text-[#f7941e]">Dealerinlog</Link></nav>
        <p className="sm:col-span-2">© {new Date().getFullYear()} Thijs koopt uw auto · Lokale ontwikkelversie, niet gepubliceerd</p>
        <p className="sm:col-span-2 text-xs">Kentekenlettertype: <a href="https://lefly.vepar.nl/" className="underline hover:text-[#f7941e]">LeFly Kenteken</a> · <a href="https://creativecommons.org/licenses/by-sa/3.0/" className="underline hover:text-[#f7941e]">CC BY-SA 3.0</a>. <a href="https://www.rdw.nl/over-rdw/over-deze-site" className="underline hover:text-[#f7941e]">RDW.nl gebruikt dit font</a> voor digitale kentekenweergave; het blijft een interpretatie en geen officieel letterbestand voor fysieke kentekenplaten.</p>
      </div>
    </footer>
  );
}
