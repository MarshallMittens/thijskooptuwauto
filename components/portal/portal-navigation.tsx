"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/app/auth/actions";

type NavigationItem = { href: string; label: string; exact?: boolean; activePrefix?: string };

const adminItems: NavigationItem[] = [
  { href: "/beheer", label: "Bedrijven", exact: true },
  { href: "/beheer/aanvragen", label: "Autoaanvragen" },
  { href: "/beheer/veilingen", label: "Lopende veilingen" },
  { href: "/beheer/kosten", label: "Kosten & facturen" },
  { href: "/beheer/operatie", label: "Meldingen & controles" },
];

const dealerItems: NavigationItem[] = [
  { href: "/dealer", label: "Aanbod", exact: true, activePrefix: "/dealer/aanbod/" },
  { href: "/dealer/biedingen", label: "Mijn biedingen" },
  { href: "/dealer/gewonnen", label: "Gewonnen dossiers" },
  { href: "/dealer/klachten", label: "Klachten" },
];

const base = "inline-flex min-h-11 items-center justify-center rounded-xl border px-4 py-2 text-center text-sm font-bold leading-5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a64b00]";
const outline = "border-[#c45b00] bg-white text-[#a64b00] hover:bg-orange-50 active:bg-orange-100";

export function PortalNavigation({ area, canSwitchPortal }: { area: "beheer" | "dealer"; canSwitchPortal: boolean }) {
  const pathname = usePathname();
  const items = area === "beheer" ? adminItems : dealerItems;

  return <nav aria-label={area === "beheer" ? "Beheernavigatie" : "Dealernavigatie"} className="grid w-full grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center lg:w-auto lg:flex-1 lg:justify-end">
    {canSwitchPortal && <Link href={area === "beheer" ? "/dealer" : "/beheer"} className={`${base} ${outline}`}>
      {area === "beheer" ? "Naar dealerportaal" : "Naar beheer"}
    </Link>}
    {items.map((item) => {
      const active = pathname === item.href || (!item.exact && pathname.startsWith(`${item.href}/`)) || Boolean(item.activePrefix && pathname.startsWith(item.activePrefix));
      return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`${base} ${active ? "border-[#a64b00] bg-[#a64b00] text-white hover:bg-[#8b3f00] active:bg-[#703200]" : outline}`}>
        {item.label}
      </Link>;
    })}
    <form action={signOut} className="flex"><button type="submit" className={`${base} w-full border-slate-300 bg-slate-100 font-medium text-slate-900 hover:bg-slate-200 active:bg-slate-300`}>Uitloggen</button></form>
  </nav>;
}
