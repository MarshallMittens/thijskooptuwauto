import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-[#071327] px-5 py-10 text-sm text-white/70 sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-[1240px] gap-6 sm:grid-cols-2 sm:items-end">
        <div><p className="font-bold text-white">Thijs koopt uw auto</p><p className="mt-2 max-w-lg leading-6">Een autoaanmelding is vrijblijvend en garandeert geen bod of verkoop. Bedrijfs- en juridische gegevens worden vóór livegang definitief gecontroleerd.</p></div>
        <nav className="flex flex-wrap gap-4 sm:justify-end" aria-label="Voettekst"><Link href="/privacy-en-voorwaarden" className="hover:text-white">Privacy en voorwaarden</Link><Link href="/inloggen" className="hover:text-white">Dealerinlog</Link></nav>
        <p className="sm:col-span-2">© {new Date().getFullYear()} Thijs koopt uw auto · Lokale ontwikkelversie, niet gepubliceerd</p>
      </div>
    </footer>
  );
}
