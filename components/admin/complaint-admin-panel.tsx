"use client";

import Image from "next/image";
import { FormEvent, useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";

import { adminComplaintAction, type OperationActionResult } from "@/app/beheer/operatie/actions";
import { addComplaintMessageAction } from "@/app/klachten/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ComplaintState } from "@/lib/operations/schemas";
import { formatAmsterdamDateTime } from "@/lib/time/format";

export function ComplaintAdminPanel({ complaints }: { complaints: ComplaintState[] }) {
  const [result, setResult] = useState<OperationActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const run = (work: () => Promise<OperationActionResult>) => startTransition(async () => setResult(await work()));
  function submit(event: FormEvent<HTMLFormElement>, complaintId: string, command: "review" | "in_review" | "waiting_external" | "resolved" | "rejected") {
    event.preventDefault();
    const form = event.currentTarget;
    const text = String(new FormData(form).get("text") ?? "");
    run(async () => {
      const response = command === "in_review"
        ? await addComplaintMessageAction({ complaintId, body: text })
        : await adminComplaintAction({ complaintId, command, text });
      if (response.ok) form.reset();
      return response;
    });
  }
  return <section className="mt-8 rounded-2xl border border-orange-200 bg-orange-50/30 p-6">
    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a64b00]">Fase 6 · klachtbeheer</p>
    <h2 className="mt-2 text-2xl font-black">Klachtendossiers</h2>
    {!complaints.length ? <p className="mt-4 text-sm text-slate-600">Geen klachten voor deze aanvraag.</p> : null}
    <div className="mt-5 space-y-5">{complaints.map((complaint) => <article key={complaint.id} className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap justify-between gap-3"><div><p className="font-mono text-xs text-slate-500">{complaint.reference}</p><h3 className="mt-1 text-lg font-black">{complaint.category} · {complaint.complainantKind}</h3></div><span className="h-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{complaint.status}</span></div>
      {complaint.requiresIndependentReview ? <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-900">Platformverbonden koper: tweede medewerker moet beoordelen en een andere medewerker rondt af. {complaint.independentReviewedAt ? `Beoordeling vastgelegd op ${formatAmsterdamDateTime(complaint.independentReviewedAt)}.` : "Nog niet beoordeeld."}</p> : null}
      <ol className="mt-4 space-y-2">{complaint.messages.map((message) => <li key={message.id} className="rounded-lg bg-slate-50 p-3 text-sm"><p>{message.body}</p><p className="mt-2 text-xs text-slate-500">{message.authorKind} · {formatAmsterdamDateTime(message.createdAt)}</p></li>)}</ol>
      {complaint.evidence.length ? <div className="mt-4 grid gap-3 sm:grid-cols-3">{complaint.evidence.map((evidence) => evidence.signedUrl ? <Image key={evidence.id} src={evidence.signedUrl} alt="Privé klachtbewijs" width={480} height={360} unoptimized className="aspect-[4/3] rounded-lg object-cover" /> : null)}</div> : null}
      {!['resolved', 'rejected', 'withdrawn'].includes(complaint.status) ? <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <form onSubmit={(event) => submit(event, complaint.id, "in_review")}><Label htmlFor={`admin-message-${complaint.id}`}>Tijdlijnbericht</Label><Textarea id={`admin-message-${complaint.id}`} name="text" required minLength={2} maxLength={4000} className="mt-2" /><Button size="sm" className="mt-2" disabled={pending}>Bericht toevoegen</Button></form>
        <form onSubmit={(event) => submit(event, complaint.id, complaint.requiresIndependentReview && !complaint.independentReviewedAt ? "review" : "resolved")}><Label htmlFor={`admin-resolution-${complaint.id}`}>{complaint.requiresIndependentReview && !complaint.independentReviewedAt ? "Tweede beoordeling" : "Uitkomst"}</Label><Textarea id={`admin-resolution-${complaint.id}`} name="text" required minLength={10} maxLength={4000} className="mt-2" /><div className="mt-2 flex flex-wrap gap-2"><Button size="sm" disabled={pending}>{pending && <LoaderCircle className="animate-spin" />}{complaint.requiresIndependentReview && !complaint.independentReviewedAt ? "Beoordeling vastleggen" : "Opgelost"}</Button>{complaint.independentReviewedAt || !complaint.requiresIndependentReview ? <Button size="sm" variant="destructive" type="button" disabled={pending} onClick={() => { const form = document.getElementById(`admin-resolution-${complaint.id}`) as HTMLTextAreaElement | null; run(() => adminComplaintAction({ complaintId: complaint.id, command: "rejected", text: form?.value ?? "" })); }}>Afwijzen</Button> : null}</div></form>
      </div> : <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm"><strong>Uitkomst:</strong> {complaint.resolution}</p>}
    </article>)}</div>
    {result && <p role="status" className={`mt-4 rounded-lg p-3 text-sm font-semibold ${result.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`}>{result.message}</p>}
  </section>;
}
