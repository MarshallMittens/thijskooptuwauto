"use client";

import { useActionState } from "react";

import {
  registerCompany,
  type CompanyActionState,
} from "@/app/dealer/registreren/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: CompanyActionState = {};

const fields = [
  ["legalName", "Statutaire bedrijfsnaam", "text", "Autobedrijf Voorbeeld B.V."],
  ["tradeName", "Handelsnaam (optioneel)", "text", "Voorbeeld Auto"],
  ["kvkNumber", "KvK-nummer", "text", "12345678"],
  ["street", "Straat", "text", "Voorbeeldstraat"],
  ["houseNumber", "Huisnummer", "text", "10A"],
  ["postalCode", "Postcode", "text", "1234AB"],
  ["city", "Plaats", "text", "Utrecht"],
  ["contactName", "Contactpersoon", "text", "Jan Voorbeeld"],
  ["email", "Zakelijk e-mailadres", "email", "inkoop@voorbeeld.nl"],
  ["phone", "Telefoonnummer", "tel", "030-1234567"],
] as const;

export function CompanyRegistrationForm() {
  const [state, action, pending] = useActionState(registerCompany, initialState);

  return (
    <form action={action} className="mt-8 grid gap-5 sm:grid-cols-2">
      {fields.map(([name, label, type, placeholder]) => (
        <div className={`space-y-2 ${name === "legalName" || name === "tradeName" ? "sm:col-span-2" : ""}`} key={name}>
          <Label htmlFor={name}>{label}</Label>
          <Input id={name} name={name} type={type} placeholder={placeholder} required={name !== "tradeName"} className="h-12" />
        </div>
      ))}
      {state.error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 sm:col-span-2" role="alert">{state.error}</p>
      ) : null}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending} className="h-12 bg-[#1554d1] px-6 text-base font-bold hover:bg-[#0f42aa]">
          {pending ? "Registratie opslaan…" : "Bedrijf ter goedkeuring aanmelden"}
        </Button>
      </div>
    </form>
  );
}
