"use client";

import { FormEvent, useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";

import { createIncidentAction, updateIncidentAction, type OperationActionResult } from "@/app/beheer/operatie/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { OperationsDashboard } from "@/lib/operations/schemas";
import { formatAmsterdamDateTime } from "@/lib/time/format";

export function OperationsControls({ state }: { state: OperationsDashboard }) {
  const [result, setResult] = useState<OperationActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    startTransition(async () => { const response = await createIncidentAction({ severity: String(data.get("severity")), summary: String(data.get("summary")), impact: String(data.get("impact")) }); setResult(response); if (response.ok) form.reset(); });
  }
  function update(event: FormEvent<HTMLFormElement>, incidentId: string) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    startTransition(async () => setResult(await updateIncidentAction({ incidentId, status: String(data.get("status")), resolution: String(data.get("resolution")) })));
  }
  return <>
    <section className="mt-8 grid gap-4 md:grid-cols-4">
      <Metric label="Outbox wachtend" value={state.outbox.pending} warning={state.outbox.pending > 0} />
      <Metric label="Outbox mislukt" value={state.outbox.failed} warning={state.outbox.failed > 0} />
      <Metric label="Open klachten" value={state.complaints.open} warning={state.complaints.open > 0} />
      <Metric label="Tweede beoordeling" value={state.complaints.independentReviewRequired} warning={state.complaints.independentReviewRequired > 0} />
    </section>
    <section className="mt-8 rounded-2xl border border-slate-200 p-6"><h2 className="text-2xl font-black">Operationele controles</h2><dl className="mt-4 grid gap-4 md:grid-cols-3"><Data label="Laatste betaalreconciliatie" value={state.lastReconciliation ? `${state.lastReconciliation.mismatchCount} verschil(len) · ${state.lastReconciliation.completedAt ? formatAmsterdamDateTime(state.lastReconciliation.completedAt) : state.lastReconciliation.status}` : "Nog niet uitgevoerd"} /><Data label="Laatste outbox-run" value={state.lastOutboxRun ? `${state.lastOutboxRun.status} · ${state.lastOutboxRun.processedCount} verwerkt` : "Nog niet uitgevoerd"} /><Data label="Laatste herstelproef" value={state.lastRecoveryTest ? `${state.lastRecoveryTest.status} · DB ${state.lastRecoveryTest.databaseRestored ? "ja" : "nee"} · Storage ${state.lastRecoveryTest.storageRestored ? "ja" : "nee"}` : "Nog niet uitgevoerd"} /></dl>{state.outbox.deadLetter ? <p className="mt-4 rounded-lg bg-red-50 p-3 font-semibold text-red-900">{state.outbox.deadLetter} bericht(en) hebben acht pogingen bereikt en vereisen handmatige beoordeling.</p> : null}</section>
    <section className="mt-8 rounded-2xl border border-slate-200 p-6"><h2 className="text-2xl font-black">Incident registreren</h2><form onSubmit={create} className="mt-4 grid gap-4"><div><Label htmlFor="incident-severity">Ernst</Label><select id="incident-severity" name="severity" className="mt-2 h-10 rounded-md border border-slate-300 bg-white px-3"><option value="low">Laag</option><option value="medium">Middel</option><option value="high">Hoog</option><option value="critical">Kritiek</option></select></div><div><Label htmlFor="incident-summary">Samenvatting</Label><Input id="incident-summary" name="summary" required minLength={10} maxLength={300} className="mt-2" /></div><div><Label htmlFor="incident-impact">Impact</Label><Textarea id="incident-impact" name="impact" required minLength={10} maxLength={4000} className="mt-2" /></div><Button className="w-fit" disabled={pending}>{pending && <LoaderCircle className="animate-spin" />}Incident opslaan</Button></form></section>
    <section className="mt-8 rounded-2xl border border-slate-200 p-6"><h2 className="text-2xl font-black">Open incidenten</h2><div className="mt-4 space-y-4">{state.incidents.map((incident) => <article key={incident.id} className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-red-800">{incident.severity} · {incident.status}</p><h3 className="mt-1 font-black">{incident.summary}</h3><p className="mt-2 text-sm">{incident.impact}</p><form className="mt-4 grid gap-3 md:grid-cols-[180px_1fr_auto]" onSubmit={(event) => update(event, incident.id)}><select name="status" className="h-10 rounded-md border border-slate-300 bg-white px-3"><option value="investigating">In onderzoek</option><option value="monitoring">Monitoren</option><option value="resolved">Opgelost</option></select><Input name="resolution" placeholder="Oplossing (verplicht bij opgelost)" maxLength={4000} /><Button disabled={pending}>Bijwerken</Button></form></article>)}{!state.incidents.length ? <p className="text-sm text-slate-600">Geen open incidenten.</p> : null}</div></section>
    <section className="mt-8 rounded-2xl border border-red-200 bg-red-50/40 p-6"><h2 className="text-2xl font-black">Geblokkeerde testdocumenten</h2><p className="mt-2 text-sm text-slate-700">Dit zijn geen fiscale facturen. Bedrag, betaler en btw-behandeling zijn nog niet vastgesteld.</p><ul className="mt-4 space-y-2 text-sm">{state.testInvoices.map((invoice) => <li key={invoice.id}>{invoice.documentNumber} · {invoice.documentType} · {invoice.status}</li>)}</ul></section>
    {result && <p role="status" className={`mt-6 rounded-lg p-3 text-sm font-semibold ${result.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`}>{result.message}</p>}
  </>;
}

function Metric({ label, value, warning }: { label: string; value: number; warning: boolean }) { return <div className={`rounded-2xl border p-5 ${warning ? "border-orange-300 bg-orange-50" : "border-emerald-200 bg-emerald-50"}`}><p className="text-xs font-bold uppercase tracking-wide text-slate-600">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>; }
function Data({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-sm">{value}</dd></div>; }
