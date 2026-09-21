import Image from "next/image";
import Link from "next/link";

const links = [
  ["Hoe werkt het?", "/hoe-werkt-het"],
  ["Over ons", "/over-ons"],
  ["Veelgestelde vragen", "/veelgestelde-vragen"],
  ["Contact", "/contact"],
] as const;

export function SiteHeader({ inverse = false }: { inverse?: boolean }) {
  return (
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
  );
}
