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
      <Metric label="E-mails in wachtrij" value={state.outbox.pending} warning={state.outbox.pending > 0} description="Berichten die nog op verzending wachten." />
      <Metric label="Mislukte e-mails" value={state.outbox.failed} warning={state.outbox.failed > 0} description="Verzendpogingen die aandacht nodig hebben." />
      <Metric label="Open klachten" value={state.complaints.open} warning={state.complaints.open > 0} description="Bekijk de klacht in het bijbehorende autodossier." />
      <Metric label="Extra beoordeling" value={state.complaints.independentReviewRequired} warning={state.complaints.independentReviewRequired > 0} description="Klachten die een tweede medewerker moet beoordelen." />
    </section>
    <section className="mt-8 rounded-2xl border border-slate-200 p-6">
      <h2 className="text-2xl font-black">Verzending en herstel</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">De laatst geregistreerde controles van e-mailverzending en het terugzetten van opgeslagen gegevens.</p>
      <dl className="mt-4 grid gap-4 md:grid-cols-2">
        <Data label="Laatste e-mailverwerking" value={state.lastOutboxRun ? `${statusLabel(state.lastOutboxRun.status)} · ${state.lastOutboxRun.processedCount} bericht(en) verwerkt` : "Nog geen verwerking geregistreerd"} />
        <Data label="Laatste herstelcontrole" value={state.lastRecoveryTest ? `${statusLabel(state.lastRecoveryTest.status)} · Database ${state.lastRecoveryTest.databaseRestored ? "hersteld" : "niet hersteld"} · Bestanden ${state.lastRecoveryTest.storageRestored ? "hersteld" : "niet hersteld"} · ${formatAmsterdamDateTime(state.lastRecoveryTest.completedAt)}` : "Nog geen controle geregistreerd"} />
      </dl>
      {state.outbox.deadLetter ? <p className="mt-4 rounded-lg bg-red-50 p-3 font-semibold text-red-900">{state.outbox.deadLetter} bericht(en) konden na acht pogingen niet worden verzonden. Controleer de mailinstellingen en laat deze berichten handmatig onderzoeken.</p> : null}
    </section>
    <section className="mt-8 rounded-2xl border border-slate-200 p-6"><h2 className="text-2xl font-black">Probleem vastleggen</h2><p className="mt-2 text-sm leading-6 text-slate-600">Bijvoorbeeld een garage die niet kan inloggen of een foto die niet opent. Beschrijf wat er misgaat en wie er last van heeft, zodat je de oplossing kunt volgen.</p><form onSubmit={create} className="mt-4 grid gap-4"><div><Label htmlFor="incident-severity">Ernst</Label><select id="incident-severity" name="severity" className="mt-2 h-10 rounded-md border border-slate-300 bg-white px-3"><option value="low">Laag</option><option value="medium">Middel</option><option value="high">Hoog</option><option value="critical">Kritiek</option></select></div><div><Label htmlFor="incident-summary">Wat gaat er mis?</Label><Input id="incident-summary" name="summary" required minLength={10} maxLength={300} className="mt-2" /></div><div><Label htmlFor="incident-impact">Gevolgen voor gebruikers</Label><Textarea id="incident-impact" name="impact" required minLength={10} maxLength={4000} className="mt-2" /></div><Button className="w-fit" disabled={pending}>{pending && <LoaderCircle className="animate-spin" />}Probleem opslaan</Button></form></section>
    <section className="mt-8 rounded-2xl border border-slate-200 p-6"><h2 className="text-2xl font-black">Open problemen</h2><div className="mt-4 space-y-4">{state.incidents.map((incident) => <article key={incident.id} className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-red-800">{statusLabel(incident.severity)} · {statusLabel(incident.status)}</p><h3 className="mt-1 font-black">{incident.summary}</h3><p className="mt-2 text-sm">{incident.impact}</p><form className="mt-4 grid gap-3 md:grid-cols-[180px_1fr_auto]" onSubmit={(event) => update(event, incident.id)}><select name="status" defaultValue={incident.status} aria-label={`Status van ${incident.summary}`} className="h-10 rounded-md border border-slate-300 bg-white px-3"><option value="investigating">In onderzoek</option><option value="monitoring">Oplossing volgen</option><option value="resolved">Opgelost</option></select><Input name="resolution" aria-label={`Oplossing voor ${incident.summary}`} placeholder="Oplossing (verplicht bij opgelost)" maxLength={4000} /><Button disabled={pending}>Bijwerken</Button></form></article>)}{!state.incidents.length ? <p className="text-sm text-slate-600">Geen open problemen.</p> : null}</div></section>
    {result && <p role="status" className={`mt-6 rounded-lg p-3 text-sm font-semibold ${result.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`}>{result.message}</p>}
  </>;
}

function statusLabel(value: string) {
  const labels: Record<string, string> = { completed: "Afgerond", completed_with_errors: "Afgerond met fouten", failed: "Mislukt", running: "Bezig", low: "Laag", medium: "Middel", high: "Hoog", critical: "Kritiek", open: "Nieuw", investigating: "In onderzoek", monitoring: "Oplossing volgen", resolved: "Opgelost" };
  return labels[value] ?? value;
}
function Metric({ label, value, warning, description }: { label: string; value: number; warning: boolean; description: string }) { return <div className={`rounded-2xl border p-5 ${warning ? "border-orange-300 bg-orange-50" : "border-slate-200 bg-slate-50"}`}><p className="text-xs font-bold uppercase tracking-wide text-slate-600">{label}</p><p className="mt-2 text-3xl font-black">{value}</p><p className="mt-2 text-xs leading-5 text-slate-600">{description}</p></div>; }
function Data({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-sm">{value}</dd></div>; }
