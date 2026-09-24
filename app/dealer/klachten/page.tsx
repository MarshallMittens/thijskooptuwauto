import type { Metadata } from "next";
import { z } from "zod";

import { ComplaintPanel } from "@/components/complaints/complaint-panel";
import { DealerHeader } from "@/components/dealer/dealer-header";
import { requireDealer } from "@/lib/auth/dal";
import { complaintsSchema } from "@/lib/operations/schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Klachten | Dealerportaal", robots: { index: false, follow: false } };

const wonCasesSchema = z.array(z.object({
  reservationId: z.string().uuid(),
  applicationId: z.string().uuid(),
  vehicle: z.object({ registration: z.string(), make: z.string().nullable(), model: z.string().nullable() }),
}));

export default async function DealerComplaintsPage() {
  await requireDealer();
  const supabase = await createClient();
  const [{ data: complaintData, error: complaintError }, { data: wonData, error: wonError }] = await Promise.all([
    supabase.rpc("get_dealer_complaint_state"),
    supabase.rpc("get_dealer_won_cases"),
  ]);
  const parsedComplaints = complaintsSchema.safeParse(complaintData);
  const parsedWon = wonCasesSchema.safeParse(wonData);
  const admin = createAdminClient();
  const complaints = await Promise.all((parsedComplaints.success ? parsedComplaints.data : []).map(async (complaint) => ({
    ...complaint,
    evidence: await Promise.all(complaint.evidence.map(async (evidence) => {
      const { data: signed } = await admin.storage.from("complaint-evidence").createSignedUrl(evidence.storagePath, 300);
      return { ...evidence, signedUrl: signed?.signedUrl ?? null };
    })),
  })));
  const wonCases = parsedWon.success ? parsedWon.data : [];

  return <main className="portal-page"><section className="portal-panel max-w-6xl">
    <DealerHeader />
    <p className="eyebrow mt-8">Dossierafhandeling</p>
    <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Klachten en problemen</h1>
    <p className="mt-3 max-w-3xl leading-7 text-slate-600">Meld een probleem alleen bij de bijbehorende gewonnen aankoop. Open biedingen en dossiers van andere bedrijven zijn hier niet zichtbaar.</p>
    {complaintError || wonError || !parsedComplaints.success || !parsedWon.success ? <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-900">De klachtendossiers konden niet veilig worden geladen.</p> : null}
    {wonCases.length ? <div className="mt-8 space-y-8">{wonCases.map((item) => <article key={item.reservationId} className="rounded-2xl border border-slate-200 p-6">
      <h2 className="text-2xl font-black">{item.vehicle.registration} · {item.vehicle.make} {item.vehicle.model}</h2>
      <ComplaintPanel mode="dealer" targetId={item.reservationId} complaints={complaints.filter((complaint) => complaint.applicationId === item.applicationId)} />
    </article>)}</div> : <p className="mt-8 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-600">Er is nog geen gewonnen dossier voor jouw bedrijf.</p>}
  </section></main>;
}
