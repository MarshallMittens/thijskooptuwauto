import Image from "next/image";
import Link from "next/link";

import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { getAccessContext } from "@/lib/auth/dal";

export async function DealerHeader() {
  const context = await getAccessContext();
  const showAdminLink = Boolean(context?.isStaff && context.canUseDealerPortal);

  return <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5"><Link href="/dealer" className="inline-flex items-center gap-3"><span className="rounded-xl bg-[#090909] px-2 py-1"><Image src="/tkua-logo.png" alt="" width={220} height={222} className="h-14 w-auto" /></span><span className="font-black">Dealerportaal</span></Link><nav className="flex flex-wrap items-center gap-4 text-sm font-bold" aria-label="Dealernavigatie"><Link href="/dealer" className="text-[#a64b00] underline">Aanbod</Link><Link href="/dealer/biedingen" className="text-[#a64b00] underline">Mijn biedingen</Link><Link href="/dealer/gewonnen" className="text-[#a64b00] underline">Gewonnen dossiers</Link><Link href="/dealer/klachten" className="text-[#a64b00] underline">Klachten</Link>{showAdminLink ? <Link href="/beheer" className="rounded-md border border-[#a64b00] px-3 py-2 text-[#a64b00]">Naar beheer</Link> : null}<form action={signOut}><Button size="sm" variant="outline">Uitloggen</Button></form></nav></header>;
}
