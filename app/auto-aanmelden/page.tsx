import type { Metadata } from "next";

import { ApplicationWizard } from "@/components/applications/application-wizard";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { normalizeRegistration } from "@/lib/applications/schema";

export const metadata: Metadata = { title: "Auto aanmelden | Thijs koopt uw auto", description: "Meld je auto stap voor stap aan met voertuiggegevens, staat, foto’s en contactgegevens." };

export default async function ApplicationPage({ searchParams }: { searchParams: Promise<{ kenteken?: string }> }) {
  const query = await searchParams;
  return <div className="min-h-screen bg-[#f4f7fb]"><SiteHeader /><main className="px-5 py-10 sm:px-8 lg:px-10 lg:py-16"><div className="mx-auto max-w-[900px]"><p className="eyebrow">Auto aanmelden</p><h1 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-5xl">Vertel ons over je auto.</h1><p className="mt-4 max-w-2xl leading-7 text-slate-600">Je kunt gegevens per stap controleren. Voertuiggegevens blijven tijdens het formulier tijdelijk in deze browsersessie; contactgegevens niet.</p><div className="mt-8"><ApplicationWizard initialRegistration={normalizeRegistration(query.kenteken ?? "")} /></div></div></main><SiteFooter /></div>;
}
