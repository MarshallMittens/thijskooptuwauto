import Image from "next/image";
import Link from "next/link";
import { Check, CheckCircle2, ChevronDown, Star } from "lucide-react";

import { googleReviewSummary } from "@/lib/public/google-reviews";

const links = [
  ["Hoe werkt het?", "/hoe-werkt-het"],
  ["Over ons", "/over-ons"],
  ["Veelgestelde vragen", "/veelgestelde-vragen"],
  ["Contact", "/contact"],
] as const;

export function SiteHeader({ inverse = false }: { inverse?: boolean }) {
  return (
    <>
      <aside className="relative z-40 border-b border-[#f7941e]/25 bg-[#1a1a1a] text-white has-[details[open]]:z-[60]" aria-label="Waarom Thijskooptuauto">
        <div className="overflow-x-auto pr-20 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:pr-24">
          <div className="mx-auto flex min-w-max max-w-[1440px] items-center px-5 py-2.5 text-xs font-bold sm:px-8 lg:grid lg:min-w-0 lg:grid-cols-4 lg:px-10 lg:text-sm">
            <TrustItem>Veilig en vrijblijvend aanmelden</TrustItem>
            <TrustItem>Persoonlijk begeleid door Thijs</TrustItem>
            <TrustItem>Alleen gecontroleerde garages</TrustItem>
            <Link href="/over-ons#klantervaringen" className="flex items-center gap-2 border-l border-white/15 px-5 transition-colors hover:text-[#ffb45a] lg:justify-center" aria-label={`Google-beoordeling: ${googleReviewSummary.rating.toLocaleString("nl-NL")} van 5 uit ${googleReviewSummary.reviewCount} reviews`}>
              <Star className="size-4 fill-[#f7941e] text-[#f7941e]" aria-hidden="true" />
              <span className="text-white/70">Google</span>
              <strong>{googleReviewSummary.rating.toLocaleString("nl-NL")} / 5</strong>
              <span className="text-white/60">({googleReviewSummary.reviewCount} reviews)</span>
            </Link>
          </div>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center bg-gradient-to-l from-[#1a1a1a] via-[#1a1a1a] to-transparent pl-5 pr-3 sm:pr-5"><LanguageSwitch /></div>
      </aside>
      <header className={inverse ? "sticky top-0 z-50 border-b border-white/10 bg-[#090909]/95 text-white backdrop-blur-sm" : "sticky top-0 z-50 border-b border-white/10 bg-[#090909] text-white"}>
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:px-10">
          <Link href="/" className="inline-flex shrink-0 items-center" aria-label="Thijs koopt uw auto — startpagina">
            <Image src="/tkua-logo.png" alt="" width={220} height={222} priority className="h-[4.5rem] w-auto sm:h-20" />
          </Link>
          <nav aria-label="Hoofdnavigatie" className="order-3 flex w-full flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-white/85 md:order-2 md:w-auto">
            {links.map(([label, href]) => <Link key={href} href={href} className="transition-colors hover:text-[#f7941e]">{label}</Link>)}
          </nav>
          <div className="order-2 flex items-center gap-2 md:order-3">
            <Link href="/inloggen?returnTo=%2Fdealer" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-3 py-2.5 text-sm font-bold text-white transition-colors hover:border-[#f7941e] hover:text-[#ffb45a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f7941e]" aria-label="Voor bedrijven: inloggen">
              <span>Inloggen dealer</span>
            </Link>
            <Link href="/auto-aanmelden" className="rounded-full bg-[#f7941e] px-4 py-2.5 text-sm font-black text-[#090909] transition-colors hover:bg-[#ffad45] sm:px-5">Meld je auto aan</Link>
          </div>
        </div>
      </header>
    </>
  );
}

function TrustItem({ children }: { children: React.ReactNode }) {
  return <span className="flex items-center gap-2 border-l border-white/15 px-5 first:border-l-0 first:pl-0 lg:justify-center lg:first:pl-5"><CheckCircle2 className="size-4 text-[#f7941e]" aria-hidden="true" />{children}</span>;
}

function LanguageSwitch() {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-white/20 bg-[#242424] px-2.5 py-1.5 text-xs font-black text-white transition-colors hover:border-[#f7941e] hover:text-[#ffb45a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f7941e] [&::-webkit-details-marker]:hidden" aria-label="Taal: Nederlands">
        <CountryFlag country="nl" label="Vlag van Nederland" className="h-4 w-6" />
        <span>NL</span>
        <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 text-[#111111] shadow-2xl" aria-label="Kies een taal">
        <div className="flex items-center gap-3 rounded-xl bg-orange-50 px-3 py-3 text-sm"><CountryFlag country="nl" label="Vlag van Nederland" /><span className="flex-1"><strong className="block">Nederlands</strong><span className="mt-0.5 block text-xs font-medium text-slate-500">Nederland</span></span><Check className="size-4 text-[#a64b00]" aria-label="Actieve taal" /></div>
        <UnavailableLanguage countryCode="fr" flagLabel="Vlag van Frankrijk" name="Français" countryName="Frankrijk" />
        <UnavailableLanguage countryCode="de" flagLabel="Vlag van Duitsland" name="Deutsch" countryName="Duitsland" />
        <UnavailableLanguage countryCode="gb" flagLabel="Vlag van het Verenigd Koninkrijk" name="English" countryName="Verenigd Koninkrijk" />
        <p className="px-3 pb-2 pt-3 text-xs leading-5 text-slate-500">De volledige vertalingen worden voorbereid.</p>
      </div>
    </details>
  );
}

function UnavailableLanguage({ countryCode, flagLabel, name, countryName }: { countryCode: CountryCode; flagLabel: string; name: string; countryName: string }) {
  return <button type="button" disabled className="mt-1 flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-400"><CountryFlag country={countryCode} label={flagLabel} /><span className="flex-1"><strong className="block font-semibold">{name}</strong><span className="mt-0.5 block text-xs font-medium">{countryName}</span></span><span className="text-[.65rem] font-bold uppercase tracking-wide">Binnenkort</span></button>;
}

type CountryCode = "nl" | "fr" | "de" | "gb";

function CountryFlag({ country, label, className = "h-5 w-8" }: { country: CountryCode; label: string; className?: string }) {
  const sharedClassName = `${className} shrink-0 overflow-hidden rounded-[0.2rem] border border-black/20 shadow-sm`;

  if (country === "nl") return <svg viewBox="0 0 30 20" className={sharedClassName} role="img" aria-label={label}><rect width="30" height="6.67" fill="#ae1c28" /><rect y="6.67" width="30" height="6.66" fill="#fff" /><rect y="13.33" width="30" height="6.67" fill="#21468b" /></svg>;
  if (country === "fr") return <svg viewBox="0 0 30 20" className={sharedClassName} role="img" aria-label={label}><rect width="10" height="20" fill="#0055a4" /><rect x="10" width="10" height="20" fill="#fff" /><rect x="20" width="10" height="20" fill="#ef4135" /></svg>;
  if (country === "de") return <svg viewBox="0 0 30 20" className={sharedClassName} role="img" aria-label={label}><rect width="30" height="6.67" fill="#111" /><rect y="6.67" width="30" height="6.66" fill="#dd0000" /><rect y="13.33" width="30" height="6.67" fill="#ffce00" /></svg>;
  return <svg viewBox="0 0 30 20" className={sharedClassName} role="img" aria-label={label}><rect width="30" height="20" fill="#012169" /><path d="M0 0 30 20M30 0 0 20" stroke="#fff" strokeWidth="5" /><path d="M0 0 30 20M30 0 0 20" stroke="#c8102e" strokeWidth="2" /><path d="M15 0v20M0 10h30" stroke="#fff" strokeWidth="6" /><path d="M15 0v20M0 10h30" stroke="#c8102e" strokeWidth="3.2" /></svg>;
}
