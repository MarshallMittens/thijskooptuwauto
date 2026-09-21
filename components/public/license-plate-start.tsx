"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeRegistration } from "@/lib/applications/schema";

export function LicensePlateStart() {
  const router = useRouter();
  const [registration, setRegistration] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeRegistration(registration);
    if (!/^[A-Z0-9]{6,8}$/.test(normalized)) { setError("Vul een volledig Nederlands kenteken in."); return; }
    router.push(`/auto-aanmelden?kenteken=${encodeURIComponent(normalized)}`);
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="license-plate" className="mb-2.5 block px-1 text-sm font-bold">Vul je kenteken in</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex min-h-14 flex-1 items-stretch overflow-hidden rounded-xl border-2 border-[#111111] bg-[#ffd400] focus-within:ring-4 focus-within:ring-orange-500/30">
          <span className="grid w-10 shrink-0 place-items-center bg-[#1554a1] text-[10px] font-black text-white" aria-hidden="true">NL</span>
          <Input id="license-plate" value={registration} onChange={(event) => { setRegistration(normalizeRegistration(event.target.value)); setError(""); }} placeholder="12AB34" autoComplete="off" aria-describedby="plate-message" aria-invalid={Boolean(error)} className="h-14 rounded-none border-0 bg-transparent px-4 text-center font-mono text-2xl font-black uppercase tracking-[.13em] text-[#111111] shadow-none focus-visible:ring-0" />
        </div>
        <Button type="submit" size="lg" className="h-14 rounded-xl px-6 text-base font-bold">Start je aanvraag <ArrowRight className="size-4" aria-hidden="true" /></Button>
      </div>
      <p id="plate-message" className={`mt-2.5 px-1 text-sm ${error ? "font-semibold text-red-700" : "text-slate-500"}`} role={error ? "alert" : undefined}>{error || "Je zit nergens aan vast. We gebruiken het kenteken om beschikbare voertuiggegevens op te halen."}</p>
    </form>
  );
}
