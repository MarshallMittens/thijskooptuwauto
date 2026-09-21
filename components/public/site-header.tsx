import Link from "next/link";
import { CarFront } from "lucide-react";

const links = [
  ["Hoe werkt het?", "/hoe-werkt-het"],
  ["Over ons", "/over-ons"],
  ["Veelgestelde vragen", "/veelgestelde-vragen"],
  ["Contact", "/contact"],
] as const;

export function SiteHeader({ inverse = false }: { inverse?: boolean }) {
  return (
    <header className={inverse ? "border-b border-white/10 text-white" : "border-b border-slate-200 bg-white text-[#071327]"}>
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
        <Link href="/" className="inline-flex items-center gap-3" aria-label="Thijs koopt uw auto — startpagina">
          <span className="grid size-10 place-items-center rounded-full bg-[#ffd400] text-[#071327]"><CarFront className="size-5" aria-hidden="true" /></span>
          <span className="font-extrabold tracking-[-0.03em]">thijs<span className="text-[#1554d1]">kooptuwauto</span></span>
        </Link>
        <nav aria-label="Hoofdnavigatie" className="order-3 flex w-full flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold md:order-2 md:w-auto">
          {links.map(([label, href]) => <Link key={href} href={href} className="hover:underline">{label}</Link>)}
        </nav>
        <Link href="/auto-aanmelden" className="order-2 rounded-full bg-[#1554d1] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0f42aa] md:order-3">Meld je auto aan</Link>
      </div>
    </header>
  );
}
