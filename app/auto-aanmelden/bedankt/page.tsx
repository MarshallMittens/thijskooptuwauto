import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck } from "lucide-react";

import { PublicPage } from "@/components/public/public-page";
import { formatRegistration } from "@/lib/applications/schema";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Aanvraag ontvangen | Thijs koopt uw auto", robots: { index: false, follow: false } };

export default async function ThanksPage({ searchParams }: { searchParams: Promise<{ referentie?: string }> }) {
  const { referentie } = await searchParams;
  const safeReference = referentie && /^[a-f0-9]{24}$/.test(referentie) ? referentie : "niet beschikbaar";
  let registration = "Je auto";
  if (safeReference !== "niet beschikbaar") {
    const admin = createAdminClient();
    const { data: application } = await admin
      .from("applications")
      .select("vehicle_id")
      .eq("public_reference", safeReference)
      .maybeSingle();
    if (application?.vehicle_id) {
      const { data: vehicle } = await admin.from("vehicles").select("registration_normalized").eq("id", application.vehicle_id).maybeSingle();
      if (vehicle?.registration_normalized) registration = formatRegistration(vehicle.registration_normalized);
    }
  }

  return (
    <PublicPage
      eyebrow="Aanvraag ontvangen"
      title="Bedankt, je auto is aangemeld."
      intro="We hebben je aanvraag goed ontvangen. Een eventuele e-mailstoring heeft geen invloed op de opgeslagen aanvraag."
    >
      <div
        role="status"
        aria-live="polite"
        className="mb-6 flex items-start gap-4 rounded-2xl border border-[#f7941e]/40 bg-[#fff4e6] p-5 text-[#4a2600]"
      >
        <CircleCheck aria-hidden="true" className="mt-0.5 size-7 shrink-0 text-[#c55f00]" strokeWidth={2.5} />
        <div>
          <p className="text-lg font-black">Bedankt voor je aanvraag!</p>
          <p className="mt-1 leading-7">
            Je gegevens zijn veilig ontvangen. We sturen een bevestiging naar het e-mailadres dat je hebt ingevuld.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-7">
        <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Kenteken</p>
        <p className="mt-2 text-3xl font-black">{registration}</p>
        <p className="mt-5 leading-7 text-slate-600">
          Je hoeft niets meer te bevestigen. Thijs bekijkt je aanmelding en neemt persoonlijk contact met je op zodra er
          nieuws is over je auto.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link href="/" className="inline-flex rounded-lg bg-[#f7941e] px-5 py-3 font-bold text-[#090909]">
            Terug naar de startpagina
          </Link>
        </div>
      </div>
    </PublicPage>
  );
}
