import Link from "next/link";

import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

export function DealerHeader() {
  return <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5"><Link href="/dealer" className="text-xl font-black">Thijskooptuauto · dealer</Link><nav className="flex flex-wrap items-center gap-4 text-sm font-bold" aria-label="Dealernavigatie"><Link href="/dealer" className="text-[#1554d1] underline">Aanbod</Link><Link href="/dealer/biedingen" className="text-[#1554d1] underline">Mijn biedingen</Link><form action={signOut}><Button size="sm" variant="outline">Uitloggen</Button></form></nav></header>;
}
