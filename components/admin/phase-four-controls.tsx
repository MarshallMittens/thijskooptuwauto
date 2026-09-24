"use client";

import { FormEvent, useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";

import {
  addContactAction,
  recordMaterialChangeAction,
  type WorkflowActionResult,
} from "@/app/beheer/aanvragen/workflow-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatAmsterdamDateTime } from "@/lib/time/format";

type CaseState = {
  deal: {
    id: string | null;
    status: string;
    selectedBidId: string | null;
    agreedAt: string | null;
    completedAt: string | null;
  };
  contacts: Array<{ id: string; channel: string; summary: string; occurredAt: string; createdAt: string; actor: string }>;
  revisions: Array<{ id: string; revisionNumber: number; createdAt: string }>;
  currentPublishedRevisionId: string | null;
  history: Array<{ id: number; action: string; createdAt: string }>;
};

type Condition = {
  mileageKm: number | null;
  damageDescription: string | null;
  technicalIssues: string | null;
  maintenanceDescription: string | null;
  keyCount: number | null;
  remarks: string | null;
};

const channelLabels: Record<string, string> = {
  phone: "Telefoon",
  email: "E-mail",
  in_person: "Persoonlijk",
  other: "Overig",
};

function numberOrNull(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function ResultMessage({ result }: { result: WorkflowActionResult | null }) {
  if (!result) return null;
  return <p className={`mt-4 rounded-lg p-3 text-sm font-semibold ${result.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`} role="status">{result.message}</p>;
}

export function PhaseFourControls({
  applicationId,
  caseState,
  condition,
}: {
  applicationId: string;
  caseState: CaseState;
  condition: Condition;
}) {
  const [contactResult, setContactResult] = useState<WorkflowActionResult | null>(null);
  const [changeResult, setChangeResult] = useState<WorkflowActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  function addContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const occurredAt = new Date(String(data.get("occurredAt") ?? ""));
    if (Number.isNaN(occurredAt.getTime())) {
      setContactResult({ ok: false, message: "Vul een geldig contacttijdstip in." });
      return;
    }
    startTransition(async () => {
      const result = await addContactAction({
        applicationId,
        channel: data.get("channel"),
        summary: data.get("summary"),
        occurredAt: occurredAt.toISOString(),
      });
      setContactResult(result);
      if (result.ok) form.reset();
    });
  }

  function recordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (caseState.currentPublishedRevisionId && !window.confirm("Deze wijziging trekt het huidige aanbod in en annuleert de biedronde. Bestaande biedingen blijven in de historie. Doorgaan?")) return;
    const data = new FormData(event.currentTarget);
    startTransition(async () => setChangeResult(await recordMaterialChangeAction({
      applicationId,
      expectedRevisionId: caseState.currentPublishedRevisionId,
      mileageKm: numberOrNull(data.get("mileageKm")),
      damageDescription: data.get("damageDescription"),
      technicalIssues: data.get("technicalIssues"),
      maintenanceDescription: data.get("maintenanceDescription"),
      keyCount: numberOrNull(data.get("keyCount")),
      remarks: data.get("remarks"),
      reason: data.get("reason"),
    })));
  }

  return <div className="mt-8 grid gap-6 xl:grid-cols-2">
    <section className="rounded-2xl border border-slate-200 p-6">
      <h2 className="text-xl font-black">Contactmoment vastleggen</h2>
      <form onSubmit={addContact} className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="contact-channel">Kanaal</Label><select id="contact-channel" name="channel" className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"><option value="phone">Telefoon</option><option value="email">E-mail</option><option value="in_person">Persoonlijk</option><option value="other">Overig</option></select></div>
          <div><Label htmlFor="contact-time">Tijdstip volgens dit apparaat</Label><Input id="contact-time" name="occurredAt" type="datetime-local" required className="mt-2" /></div>
        </div>
        <div><Label htmlFor="contact-summary">Zakelijke samenvatting</Label><Textarea id="contact-summary" name="summary" required maxLength={2000} className="mt-2" /></div>
        <Button disabled={pending}>{pending && <LoaderCircle className="animate-spin" />}Contactmoment opslaan</Button>
      </form>
      <ResultMessage result={contactResult} />
      <div className="mt-5 space-y-3">
        {caseState.contacts.length ? caseState.contacts.map((contact) => <article key={contact.id} className="rounded-lg bg-slate-50 p-3"><p className="text-sm whitespace-pre-wrap">{contact.summary}</p><p className="mt-2 text-xs text-slate-500">{channelLabels[contact.channel] ?? contact.channel} · {formatAmsterdamDateTime(contact.occurredAt)} · {contact.actor}</p></article>) : <p className="text-sm text-slate-500">Nog geen contactmomenten vastgelegd.</p>}
      </div>
    </section>

    <section className="rounded-2xl border border-amber-300 bg-amber-50/40 p-6">
      <h2 className="text-xl font-black">Materiële voertuigwijziging</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">Gebruik dit voor gewijzigde kilometerstand, schade, techniek of onderhoud. Bij gepubliceerd aanbod wordt de bestaande publicatie ingetrokken en de biedronde geannuleerd. Biedingen en de oude voertuigversie blijven bewaard.</p>
      <form onSubmit={recordChange} className="mt-5 grid gap-4 lg:grid-cols-2">
        <div><Label htmlFor="change-mileage">Kilometerstand</Label><Input id="change-mileage" name="mileageKm" type="number" min={0} max={5000000} defaultValue={condition.mileageKm ?? ""} className="mt-2" /></div>
        <div><Label htmlFor="change-keys">Aantal sleutels</Label><Input id="change-keys" name="keyCount" type="number" min={0} max={20} defaultValue={condition.keyCount ?? ""} className="mt-2" /></div>
        <div><Label htmlFor="change-damage">Schade</Label><Textarea id="change-damage" name="damageDescription" maxLength={4000} defaultValue={condition.damageDescription ?? ""} className="mt-2" /></div>
        <div><Label htmlFor="change-technical">Technische gebreken</Label><Textarea id="change-technical" name="technicalIssues" maxLength={4000} defaultValue={condition.technicalIssues ?? ""} className="mt-2" /></div>
        <div><Label htmlFor="change-maintenance">Onderhoud</Label><Textarea id="change-maintenance" name="maintenanceDescription" maxLength={4000} defaultValue={condition.maintenanceDescription ?? ""} className="mt-2" /></div>
        <div><Label htmlFor="change-remarks">Opmerkingen</Label><Textarea id="change-remarks" name="remarks" maxLength={4000} defaultValue={condition.remarks ?? ""} className="mt-2" /></div>
        <div className="lg:col-span-2"><Label htmlFor="change-reason">Reden en bron van de wijziging</Label><Textarea id="change-reason" name="reason" required minLength={10} maxLength={1000} className="mt-2" placeholder="Bijvoorbeeld: telefonisch bevestigd door de particulier op …" /></div>
        <div className="lg:col-span-2"><Button variant="destructive" disabled={pending}>{pending && <LoaderCircle className="animate-spin" />}Gecontroleerde wijziging opslaan</Button><ResultMessage result={changeResult} /></div>
      </form>
    </section>

    <section className="rounded-2xl border border-slate-200 p-6 xl:col-span-2">
      <h2 className="text-xl font-black">Versies en auditspoor</h2>
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div><h3 className="font-bold">Voertuigversies</h3><ul className="mt-3 space-y-2 text-sm">{caseState.revisions.length ? caseState.revisions.map((revision) => <li key={revision.id}>Versie {revision.revisionNumber} · {formatAmsterdamDateTime(revision.createdAt)}</li>) : <li className="text-slate-500">Nog niet gepubliceerd.</li>}</ul></div>
        <div><h3 className="font-bold">Recente beheerhandelingen</h3><ul className="mt-3 space-y-2 text-sm">{caseState.history.slice(0, 12).map((item) => <li key={item.id}>{item.action} · {formatAmsterdamDateTime(item.createdAt)}</li>)}</ul></div>
      </div>
    </section>
  </div>;
}
