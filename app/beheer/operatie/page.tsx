import Link from "next/link";
import type { Metadata } from "next";

import { OperationsControls } from "@/components/admin/operations-controls";
import { PortalHeader } from "@/components/portal/portal-header";
import { requireAdmin } from "@/lib/auth/dal";
import { operationsDashboardSchema } from "@/lib/operations/schemas";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Meldingen en controles | Beheer", robots: { index: false, follow: false } };

export default async function OperationsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_admin_operations_dashboard");
  const parsed = operationsDashboardSchema.safeParse(data);
  return <main className="portal-page"><section className="portal-panel max-w-6xl">
    <PortalHeader area="beheer" />
    <p className="eyebrow">Beheeromgeving</p>
    <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Meldingen en controles</h1>
    <p className="mt-3 max-w-3xl leading-7 text-slate-600">Hier zie je of e-mails worden verzonden, hoeveel klachten aandacht nodig hebben en welke problemen nog openstaan. Gebruik deze pagina om de werking van het platform te controleren en problemen op te volgen.</p>
    <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-5 text-sm leading-6 text-slate-700">
      <h2 className="font-black text-slate-950">Wanneer gebruik je dit overzicht?</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5"><li>Een klant of garage ontvangt geen e-mail: controleer de wachtrij en mislukte berichten.</li><li>Er is een klacht of probleem: bekijk de aantallen en leg vast wat er aan de hand is.</li><li>Je wilt een oplossing volgen: werk de status van het probleem bij tot het is opgelost.</li></ul>
      <p className="mt-3">Auto’s en biedingen beheer je via <Link href="/beheer/aanvragen" className="font-bold text-[#a64b00] underline">Autoaanvragen</Link>. Tarieven en facturen vind je onder <Link href="/beheer/kosten" className="font-bold text-[#a64b00] underline">Kosten &amp; facturen</Link>.</p>
    </div>
    {error || !parsed.success ? <p className="mt-8 rounded-xl bg-red-50 p-4 font-semibold text-red-900">Het operationele overzicht kon niet veilig worden geladen.</p> : <OperationsControls state={parsed.data} />}
  </section></main>;
}
