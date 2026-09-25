import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Star } from "lucide-react";

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
          <Link href="/auto-aanmelden" className="order-2 rounded-full bg-[#f7941e] px-5 py-2.5 text-sm font-black text-[#090909] transition-colors hover:bg-[#ffad45] md:order-3">Meld je auto aan</Link>
        </div>
      </header>
    </>
  );
}

function TrustItem({ children }: { children: React.ReactNode }) {
  return <span className="flex items-center gap-2 border-l border-white/15 px-5 first:border-l-0 first:pl-0 lg:justify-center lg:first:pl-5"><CheckCircle2 className="size-4 text-[#f7941e]" aria-hidden="true" />{children}</span>;
}
