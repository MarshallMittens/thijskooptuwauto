"use client";

import { FormEvent, useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";

import {
  proposeAppointmentAction,
  recordInspectionAction,
  respondToAgreementAction,
  uploadInspectionPhotosAction,
  type PhaseFourActionResult,
} from "@/app/dealer/gewonnen/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  reservationId: string;
  amountCents: number;
  appointment: { id: string; status: string } | null;
  inspection: { id: string; status: string; photoCount: number } | null;
  agreement: { id: string; status: string; dealerConfirmedAt: string | null } | null;
};

function Message({ result }: { result: PhaseFourActionResult | null }) {
  return result ? <p className={`mt-4 rounded-lg p-3 text-sm font-semibold ${result.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`} role="status">{result.message}</p> : null;
}

export function WonCaseControls({ reservationId, amountCents, appointment, inspection, agreement }: Props) {
  const [result, setResult] = useState<PhaseFourActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  function propose(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const slots = ["slot1", "slot2", "slot3"].map((name) => String(data.get(name) ?? "")).filter(Boolean).map((value) => new Date(value));
    if (!slots.length || slots.some((date) => Number.isNaN(date.getTime()))) {
      setResult({ ok: false, message: "Kies minimaal één geldig moment." });
      return;
    }
    startTransition(async () => setResult(await proposeAppointmentAction({ reservationId, slots: slots.map((date) => date.toISOString()), idempotencyKey: crypto.randomUUID() })));
  }

  function inspect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!appointment) return;
    const data = new FormData(event.currentTarget);
    const status = String(data.get("status"));
    const mileage = String(data.get("mileageKm") ?? "");
    const inspected = new Date(String(data.get("inspectedAt") ?? ""));
    if (Number.isNaN(inspected.getTime())) {
      setResult({ ok: false, message: "Vul een geldig inspectietijdstip in." });
      return;
    }
    startTransition(async () => setResult(await recordInspectionAction({
      appointmentId: appointment.id,
      status,
      mileageKm: mileage ? Number(mileage) : null,
      findings: String(data.get("findings") ?? ""),
      deviationDescription: String(data.get("deviationDescription") ?? ""),
      proposedPrice: String(data.get("proposedPrice") ?? ""),
      adjustmentReason: String(data.get("adjustmentReason") ?? ""),
      inspectedAt: inspected.toISOString(),
      idempotencyKey: crypto.randomUUID(),
    })));
  }

  function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!inspection) return;
    const data = new FormData(event.currentTarget);
    data.set("inspectionId", inspection.id);
    startTransition(async () => setResult(await uploadInspectionPhotosAction(data)));
  }

  function respondAgreement(accept: boolean) {
    if (!agreement) return;
    if (!window.confirm(accept ? "Bevestig je exact dit voertuig, dit bedrag en deze conceptvoorwaarden?" : "Weet je zeker dat je dit koopconcept afwijst?")) return;
    startTransition(async () => setResult(await respondToAgreementAction({ agreementId: agreement.id, accept })));
  }

  const mayPropose = !appointment || appointment.status === "alternative_requested";
  return <div className="mt-6 space-y-5">
    {mayPropose && <form onSubmit={propose} className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
      <h3 className="text-lg font-black">Stel afspraakmomenten voor</h3>
      <p className="mt-2 text-sm text-slate-600">Kies één tot drie momenten. De verkoper bevestigt één moment of vraagt om een alternatief.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">{[1, 2, 3].map((number) => <div key={number}><Label htmlFor={`slot-${reservationId}-${number}`}>Moment {number}{number === 1 ? " *" : ""}</Label><Input id={`slot-${reservationId}-${number}`} name={`slot${number}`} type="datetime-local" required={number === 1} className="mt-2 bg-white" /></div>)}</div>
      <Button className="mt-4" disabled={pending}>{pending && <LoaderCircle className="animate-spin" />}Voorstellen versturen</Button>
    </form>}

    {appointment?.status === "confirmed" && !inspection && <form onSubmit={inspect} className="rounded-2xl border border-slate-200 p-5">
      <h3 className="text-lg font-black">Inspectie registreren</h3>
      <p className="mt-2 text-sm text-slate-600">Het veilingbod van € {(amountCents / 100).toLocaleString("nl-NL", { minimumFractionDigits: 2 })} blijft intact. Een ander bedrag is een apart voorstel dat de verkoper actief moet accepteren.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div><Label htmlFor={`inspection-status-${reservationId}`}>Uitkomst afspraak</Label><select id={`inspection-status-${reservationId}`} name="status" className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3"><option value="completed">Inspectie uitgevoerd</option><option value="no_show">No-show</option></select></div>
        <div><Label htmlFor={`inspection-time-${reservationId}`}>Inspectietijdstip</Label><Input id={`inspection-time-${reservationId}`} name="inspectedAt" type="datetime-local" required className="mt-2" /></div>
        <div><Label htmlFor={`inspection-mileage-${reservationId}`}>Kilometerstand</Label><Input id={`inspection-mileage-${reservationId}`} name="mileageKm" type="number" min={0} max={5000000} className="mt-2" /></div>
        <div><Label htmlFor={`inspection-price-${reservationId}`}>Afwijkend prijsvoorstel in euro’s (optioneel)</Label><Input id={`inspection-price-${reservationId}`} name="proposedPrice" inputMode="decimal" placeholder={(amountCents / 100).toFixed(2)} className="mt-2" /></div>
        <div><Label htmlFor={`inspection-findings-${reservationId}`}>Belangrijkste bevindingen</Label><Textarea id={`inspection-findings-${reservationId}`} name="findings" maxLength={4000} className="mt-2" /></div>
        <div><Label htmlFor={`inspection-deviation-${reservationId}`}>Aantoonbare afwijkingen</Label><Textarea id={`inspection-deviation-${reservationId}`} name="deviationDescription" maxLength={4000} className="mt-2" /></div>
        <div className="md:col-span-2"><Label htmlFor={`inspection-reason-${reservationId}`}>Onderbouwing afwijkend prijsvoorstel</Label><Textarea id={`inspection-reason-${reservationId}`} name="adjustmentReason" maxLength={2000} className="mt-2" /></div>
      </div>
      <Button className="mt-4" disabled={pending}>{pending && <LoaderCircle className="animate-spin" />}Inspectie opslaan</Button>
    </form>}

    {inspection?.status === "completed" && inspection.photoCount < 8 && <form onSubmit={upload} className="rounded-2xl border border-slate-200 p-5">
      <h3 className="text-lg font-black">Inspectiefoto’s</h3><p className="mt-2 text-sm text-slate-600">Maximaal acht JPEG-, PNG- of WebP-foto’s. Bestanden worden gecontroleerd en zonder metadata opgeslagen.</p>
      <Input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple required className="mt-4" />
      <Button className="mt-4" variant="outline" disabled={pending}>{pending && <LoaderCircle className="animate-spin" />}Foto’s uploaden</Button>
    </form>}

    {agreement && agreement.status === "awaiting_confirmations" && !agreement.dealerConfirmedAt && <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
      <h3 className="text-lg font-black">Koopconcept bevestigen</h3><p className="mt-2 text-sm leading-6 text-slate-700">Controleer voertuig, prijs en voorwaardenversie op deze pagina. Dit is een testconcept; er start geen betaling. Beide partijen moeten exact hetzelfde concept bevestigen.</p>
      <div className="mt-4 flex gap-3"><Button type="button" onClick={() => respondAgreement(true)} disabled={pending}>Exact concept bevestigen</Button><Button type="button" variant="destructive" onClick={() => respondAgreement(false)} disabled={pending}>Afwijzen</Button></div>
    </section>}
    <Message result={result} />
  </div>;
}
