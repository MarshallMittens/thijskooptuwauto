import Image from "next/image";
import Link from "next/link";
import { Building2, Check, CheckCircle2, ChevronDown, Languages, Star } from "lucide-react";

const links = [
  ["Hoe werkt het?", "/hoe-werkt-het"],
  ["Over ons", "/over-ons"],
  ["Veelgestelde vragen", "/veelgestelde-vragen"],
  ["Contact", "/contact"],
] as const;

export function SiteHeader({ inverse = false }: { inverse?: boolean }) {
  return (
    <>
      <aside className="overflow-x-auto border-b border-white/10 bg-[#12322d] text-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Waarom Thijskooptuauto">
        <div className="mx-auto flex min-w-max max-w-[1440px] items-center px-5 py-2.5 text-xs font-bold sm:px-8 lg:grid lg:min-w-0 lg:grid-cols-4 lg:px-10 lg:text-sm">
          <TrustItem>Veilig en vrijblijvend aanmelden</TrustItem>
          <TrustItem>Persoonlijk begeleid door Thijs</TrustItem>
          <TrustItem>Alleen gecontroleerde garages</TrustItem>
          <Link href="/over-ons#klantervaringen" className="flex items-center gap-2 border-l border-white/15 px-5 transition-colors hover:text-[#ffb45a] lg:justify-center" aria-label="Bekijk echte klantervaringen">
            <Star className="size-4 fill-[#f7941e] text-[#f7941e]" aria-hidden="true" />
            <span className="text-white/70">Klantervaring:</span>
            <span>“Top service!”</span>
          </Link>
        </div>
      </aside>
      <header className={inverse ? "border-b border-white/10 bg-black/35 text-white backdrop-blur-sm" : "border-b border-white/10 bg-[#090909] text-white"}>
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:px-10">
          <Link href="/" className="inline-flex shrink-0 items-center" aria-label="Thijs koopt uw auto — startpagina">
            <Image src="/tkua-logo.png" alt="" width={220} height={222} priority className="h-[4.5rem] w-auto sm:h-20" />
          </Link>
          <nav aria-label="Hoofdnavigatie" className="order-3 flex w-full flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-white/85 md:order-2 md:w-auto">
            {links.map(([label, href]) => <Link key={href} href={href} className="transition-colors hover:text-[#f7941e]">{label}</Link>)}
          </nav>
          <div className="order-2 flex items-center gap-2 md:order-3">
            <Link href="/inloggen?returnTo=%2Fdealer" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-3 py-2.5 text-sm font-bold text-white transition-colors hover:border-[#f7941e] hover:text-[#ffb45a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f7941e]" aria-label="Voor bedrijven: inloggen">
              <Building2 className="size-4" aria-hidden="true" />
              <span className="hidden xl:inline">Voor bedrijven</span>
            </Link>
            <LanguageSwitch />
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
      <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-white/25 px-3 py-2.5 text-sm font-bold text-white transition-colors hover:border-[#f7941e] hover:text-[#ffb45a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f7941e] [&::-webkit-details-marker]:hidden" aria-label="Taal: Nederlands">
        <Languages className="size-4" aria-hidden="true" />
        <span>NL</span>
        <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 text-[#111111] shadow-2xl" aria-label="Kies een taal">
        <div className="flex items-center gap-3 rounded-xl bg-orange-50 px-3 py-3 text-sm"><span className="grid size-8 place-items-center rounded-lg bg-[#f7941e] font-black">NL</span><span className="flex-1 font-bold">Nederlands</span><Check className="size-4 text-[#a64b00]" aria-label="Actieve taal" /></div>
        <UnavailableLanguage code="FR" name="Français" />
        <UnavailableLanguage code="DE" name="Deutsch" />
        <UnavailableLanguage code="EN" name="English" />
        <p className="px-3 pb-2 pt-3 text-xs leading-5 text-slate-500">De volledige vertalingen worden voorbereid.</p>
      </div>
    </details>
  );
}

function UnavailableLanguage({ code, name }: { code: string; name: string }) {
  return <button type="button" disabled className="mt-1 flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-400"><span className="grid size-8 place-items-center rounded-lg bg-slate-100 font-black">{code}</span><span className="flex-1 font-semibold">{name}</span><span className="text-[.65rem] font-bold uppercase tracking-wide">Binnenkort</span></button>;
}
