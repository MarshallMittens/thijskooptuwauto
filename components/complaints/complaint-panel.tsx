"use client";

import Image from "next/image";
import { FormEvent, useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";

import {
  addComplaintMessageAction,
  dealerOpenComplaintAction,
  sellerOpenComplaintAction,
  uploadComplaintEvidenceAction,
  type ComplaintActionResult,
} from "@/app/klachten/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ComplaintState } from "@/lib/operations/schemas";
import { formatAmsterdamDateTime } from "@/lib/time/format";

type Props = {
  mode: "seller" | "dealer";
  targetId: string | null;
  complaints: ComplaintState[];
};

const categories = [
  ["appointment", "Afspraak"], ["inspection", "Inspectie"], ["price", "Prijs"],
  ["payment", "Betaling"], ["handover", "Overdracht"], ["conduct", "Gedrag"], ["other", "Anders"],
] as const;

export function ComplaintPanel({ mode, targetId, complaints }: Props) {
  const [result, setResult] = useState<ComplaintActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  function openComplaint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!targetId) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const input = {
      targetId,
      category: String(data.get("category") ?? ""),
      summary: String(data.get("summary") ?? ""),
      idempotencyKey: crypto.randomUUID(),
    };
    startTransition(async () => {
      const response = mode === "seller" ? await sellerOpenComplaintAction(input) : await dealerOpenComplaintAction(input);
      setResult(response);
      if (response.ok) form.reset();
    });
  }

  function addMessage(event: FormEvent<HTMLFormElement>, complaintId: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = String(new FormData(form).get("body") ?? "");
    startTransition(async () => {
      const response = await addComplaintMessageAction({ complaintId, body });
      setResult(response);
      if (response.ok) form.reset();
    });
  }

  function uploadEvidence(event: FormEvent<HTMLFormElement>, complaintId: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("complaintId", complaintId);
    startTransition(async () => {
      const response = await uploadComplaintEvidenceAction(data);
      setResult(response);
      if (response.ok) form.reset();
    });
  }

  return <section className="mt-8 rounded-2xl border border-slate-200 p-6">
    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a64b00]">Fase 6 · klachten</p>
    <h3 className="mt-2 text-2xl font-black">Klacht of probleem melden</h3>
    <p className="mt-2 text-sm leading-6 text-slate-600">Iedere melding krijgt een eigen nummer en tijdlijn. Voeg geen identiteitsbewijs, kentekenbewijs of bankgegevens toe. Bij een platformverbonden koper is een aantoonbare tweede beoordeling verplicht.</p>
    {targetId ? <form className="mt-5 grid gap-4" onSubmit={openComplaint}>
      <div><Label htmlFor={`complaint-category-${targetId}`}>Onderwerp</Label><select id={`complaint-category-${targetId}`} name="category" className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3">{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      <div><Label htmlFor={`complaint-summary-${targetId}`}>Wat is er gebeurd?</Label><Textarea id={`complaint-summary-${targetId}`} name="summary" required minLength={20} maxLength={4000} className="mt-2" /></div>
      <Button className="w-fit" disabled={pending}>{pending && <LoaderCircle className="animate-spin" />}Klachtendossier openen</Button>
    </form> : <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-950">Een dealerklacht kan worden geopend zodra er een gewonnen dossier is.</p>}

    {result && <p role="status" className={`mt-4 rounded-lg p-3 text-sm font-semibold ${result.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`}>{result.message}</p>}

    <div className="mt-6 space-y-5">{complaints.map((complaint) => <article key={complaint.id} className="rounded-xl bg-slate-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-xs text-slate-500">{complaint.reference}</p><h4 className="mt-1 font-black">{complaint.category}</h4></div><span className="rounded-full bg-white px-3 py-1 text-xs font-bold">{complaint.status}</span></div>
      <p className="mt-3 text-sm text-slate-700">{complaint.summary}</p>
      {complaint.requiresIndependentReview ? <p className="mt-3 rounded-lg bg-orange-50 p-3 text-xs font-semibold text-orange-950">Tweede beoordeling verplicht voor afronding.</p> : null}
      <ol className="mt-4 space-y-2">{complaint.messages.map((message) => <li key={message.id} className="rounded-lg bg-white p-3 text-sm"><p>{message.body}</p><p className="mt-2 text-xs text-slate-500">{message.authorKind} · {formatAmsterdamDateTime(message.createdAt)}</p></li>)}</ol>
      {complaint.evidence.length ? <div className="mt-4 grid gap-3 sm:grid-cols-3">{complaint.evidence.map((evidence) => evidence.signedUrl ? <Image key={evidence.id} src={evidence.signedUrl} alt="Privé bewijs bij klacht" width={480} height={360} unoptimized className="aspect-[4/3] w-full rounded-lg object-cover" /> : null)}</div> : null}
      {complaint.resolution ? <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm"><strong>Uitkomst:</strong> {complaint.resolution}</p> : null}
      {!['resolved', 'rejected', 'withdrawn'].includes(complaint.status) ? <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <form onSubmit={(event) => addMessage(event, complaint.id)}><Label htmlFor={`message-${complaint.id}`}>Aanvulling</Label><Textarea id={`message-${complaint.id}`} name="body" required minLength={2} maxLength={4000} className="mt-2 bg-white" /><Button className="mt-2" size="sm" disabled={pending}>Bericht toevoegen</Button></form>
        <form onSubmit={(event) => uploadEvidence(event, complaint.id)}><Label htmlFor={`evidence-${complaint.id}`}>Afbeeldingen als bewijs (maximaal 4 tegelijk)</Label><input id={`evidence-${complaint.id}`} name="evidence" type="file" accept="image/jpeg,image/png,image/webp" multiple required className="mt-2 block w-full text-sm" /><Button className="mt-2" size="sm" variant="outline" disabled={pending}>Privé uploaden</Button></form>
      </div> : null}
    </article>)}</div>
  </section>;
}
