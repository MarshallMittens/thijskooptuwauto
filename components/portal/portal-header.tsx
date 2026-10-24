import Image from "next/image";
import Link from "next/link";

import { PortalNavigation } from "@/components/portal/portal-navigation";
import { getAccessContext } from "@/lib/auth/dal";

export async function PortalHeader({ area }: { area: "beheer" | "dealer" }) {
  const context = await getAccessContext();
  const canSwitchPortal = Boolean(context?.isStaff && context.canUseDealerPortal);

  return <header className="mb-8 flex flex-wrap items-center justify-between gap-5 border-b border-slate-200 pb-5">
    <Link href={area === "beheer" ? "/beheer" : "/dealer"} className="inline-flex shrink-0 items-center gap-3" aria-label={area === "beheer" ? "Beheeromgeving — bedrijven" : "Dealerportaal — aanbod"}>
      <span className="rounded-xl bg-[#090909] px-2 py-1"><Image src="/tkua-logo.png" alt="" width={220} height={222} className="h-14 w-auto" /></span>
      <span className="font-black">{area === "beheer" ? "Beheeromgeving" : "Dealerportaal"}</span>
    </Link>
    <PortalNavigation area={area} canSwitchPortal={canSwitchPortal} />
  </header>;
}
