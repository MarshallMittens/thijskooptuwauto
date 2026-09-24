"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SellerAccessForm({ initialReference = "" }: { initialReference?: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/seller/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: String(form.get("reference") ?? "").trim().toLowerCase(),
          email: String(form.get("email") ?? "").trim(),
        }),
      });
      const result = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? "De e-mail kon niet worden aangevraagd.");
      setMessage(result.message ?? "Controleer je mailbox.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "De e-mail kon niet worden aangevraagd.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-7 space-y-5">
      <div className="space-y-2">
        <Label htmlFor="seller-reference">Aanvraagreferentie</Label>
        <Input id="seller-reference" name="reference" defaultValue={initialReference} minLength={24} maxLength={24} required autoComplete="off" className="h-12 font-mono" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="seller-email">E-mailadres uit de aanvraag</Label>
        <Input id="seller-email" name="email" type="email" required autoComplete="email" className="h-12" />
      </div>
      <Button disabled={busy} className="h-12 w-full bg-[#f7941e] font-bold text-[#090909] hover:bg-[#ffad45]">
        {busy && <LoaderCircle className="animate-spin" />}Beveiligde link aanvragen
      </Button>
      {message ? <p className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-900" role="status">{message}</p> : null}
      {error ? <p className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-900" role="alert">{error}</p> : null}
    </form>
  );
}
