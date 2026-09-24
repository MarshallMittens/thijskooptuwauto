import Link from "next/link";
import type { Metadata } from "next";

import { OperationsControls } from "@/components/admin/operations-controls";
import { requireAdmin } from "@/lib/auth/dal";
import { operationsDashboardSchema } from "@/lib/operations/schemas";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Operatie | Beheer", robots: { index: false, follow: false } };

export default async function OperationsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_admin_operations_dashboard");
  const parsed = operationsDashboardSchema.safeParse(data);
  return <main className="portal-page"><section className="portal-panel max-w-6xl">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Beheeromgeving · fase 6</p><h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Operatie en bewaking</h1><p className="mt-3 max-w-3xl leading-7 text-slate-600">Eén overzicht voor klachten, notificaties, incidenten, betaalreconciliatie en herstelbewijs. Dit vervangt geen externe uptimebewaking of onafhankelijke controle.</p></div><Link href="/beheer" className="font-bold text-[#a64b00] underline">Naar bedrijven</Link></div>
    {error || !parsed.success ? <p className="mt-8 rounded-xl bg-red-50 p-4 font-semibold text-red-900">Het operationele overzicht kon niet veilig worden geladen.</p> : <OperationsControls state={parsed.data} />}
  </section></main>;
}
