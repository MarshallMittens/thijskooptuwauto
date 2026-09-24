"use client";

import { useActionState } from "react";

import { updateSellerApplication, type SellerUpdateState } from "@/app/mijn-aanvraag/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Condition = {
  mileageKm: number | null;
  damageDescription: string | null;
  technicalIssues: string | null;
  maintenanceDescription: string | null;
  keyCount: number | null;
  remarks: string | null;
};

const initialState: SellerUpdateState = {};

export function ApplicationUpdateForm({
  applicationId,
  condition,
  desiredSaleDate,
}: {
  applicationId: string;
  condition: Condition;
  desiredSaleDate: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateSellerApplication, initialState);
  return (
    <form action={formAction} className="mt-6 grid gap-5 rounded-2xl border border-orange-200 bg-orange-50 p-5 sm:grid-cols-2">
      <input type="hidden" name="applicationId" value={applicationId} />
      <Field label="Kilometerstand" name="mileageKm" type="number" defaultValue={condition.mileageKm ?? ""} required />
      <Field label="Aantal sleutels" name="keyCount" type="number" defaultValue={condition.keyCount ?? ""} required />
      <TextField label="Schade" name="damageDescription" defaultValue={condition.damageDescription ?? ""} />
      <TextField label="Technische gebreken" name="technicalIssues" defaultValue={condition.technicalIssues ?? ""} />
      <TextField label="Onderhoud" name="maintenanceDescription" defaultValue={condition.maintenanceDescription ?? ""} />
      <TextField label="Opmerkingen" name="remarks" defaultValue={condition.remarks ?? ""} />
      <Field label="Gewenste verkoopdatum" name="desiredSaleDate" type="date" defaultValue={desiredSaleDate ?? ""} />
      <div className="sm:col-span-2">
        <Button disabled={pending}>{pending ? "Opslaan…" : "Aanvulling versturen"}</Button>
        {state.message ? <p className={`mt-3 rounded-lg p-3 text-sm font-semibold ${state.ok ? "bg-emerald-100 text-emerald-900" : "bg-red-100 text-red-900"}`} role={state.ok ? "status" : "alert"}>{state.message}</p> : null}
      </div>
    </form>
  );
}

function Field({ label, name, type = "text", defaultValue, required }: { label: string; name: string; type?: string; defaultValue: string | number; required?: boolean }) {
  return <div><Label htmlFor={name}>{label}{required ? " *" : ""}</Label><Input id={name} name={name} type={type} defaultValue={defaultValue} required={required} min={type === "number" ? 0 : undefined} className="mt-2 h-12 bg-white" /></div>;
}

function TextField({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return <div><Label htmlFor={name}>{label}</Label><Textarea id={name} name={name} defaultValue={defaultValue} maxLength={2000} className="mt-2 min-h-28 bg-white" /></div>;
}
