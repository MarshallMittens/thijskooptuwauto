import type { Metadata } from "next";
import Link from "next/link";

import { PublicPage } from "@/components/public/public-page";

export const metadata: Metadata = { title: "Aanvraag ontvangen | Thijs koopt uw auto", robots: { index: false, follow: false } };

export default async function ThanksPage({ searchParams }: { searchParams: Promise<{ referentie?: string }> }) {
  const { referentie } = await searchParams;
  const safeReference = referentie && /^[a-f0-9]{24}$/.test(referentie) ? referentie : "niet beschikbaar";
  return <PublicPage eyebrow="Aanvraag ontvangen" title="Bedankt, je auto is aangemeld." intro="De aanvraag is opgeslagen. Een eventuele e-mailstoring heeft geen invloed op de opgeslagen aanvraag."><div className="rounded-2xl border border-slate-200 bg-white p-7"><p className="text-sm text-slate-500">Aanvraagreferentie</p><p className="mt-2 break-all font-mono text-xl font-black">{safeReference}</p><p className="mt-5 leading-7 text-slate-600">Bewaar deze referentie. We controleren de gegevens en nemen contact op wanneer er informatie ontbreekt of wanneer er een vervolgstap mogelijk is.</p><Link href="/" className="mt-6 inline-flex font-bold text-[#a64b00] underline">Terug naar de startpagina</Link></div></PublicPage>;
}
