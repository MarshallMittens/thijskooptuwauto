"use client";

import { FormEvent, useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";

import { closeBidRoundAction, publishApplicationAction, type MarketActionResult } from "@/app/beheer/aanvragen/market-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MarketState = {
  listingId: string | null;
  roundId: string | null;
  roundStatus: string | null;
  startsAt: string | null;
  endsAt: string | null;
};

export function MarketControls({ applicationId, applicationStatus, market }: { applicationId: string; applicationStatus: string; market: MarketState }) {
  const [result, setResult] = useState<MarketActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const startsLocal = String(formData.get("startsAt") ?? "");
    const endsLocal = String(formData.get("endsAt") ?? "");
    const starts = new Date(startsLocal);
    const ends = new Date(endsLocal);
    if (!startsLocal || !endsLocal || Number.isNaN(starts.getTime()) || Number.isNaN(ends.getTime())) {
      setResult({ ok: false, message: "Vul een geldige begin- en eindtijd in." });
      return;
    }
    startTransition(async () => setResult(await publishApplicationAction({ applicationId, startsAt: starts.toISOString(), endsAt: ends.toISOString() })));
  }

  function close() {
    if (!market.roundId) return;
    if (!window.confirm("Weet je zeker dat je deze biedronde wilt sluiten? Er worden daarna geen nieuwe biedingen geaccepteerd.")) return;
    startTransition(async () => setResult(await closeBidRoundAction({ applicationId, roundId: market.roundId! })));
  }

  return (
    <section className="rounded-2xl border border-slate-200 p-6">
      <h2 className="text-xl font-black">Publicatie en biedronde</h2>
      {market.listingId ? (
        <div className="mt-4 space-y-3">
          <p><strong>Status:</strong> {market.roundStatus}</p>
          <p className="text-sm text-slate-600">De getoonde tijden worden elders altijd als Europe/Amsterdam weergegeven.</p>
          {market.roundStatus !== "closed" && market.roundStatus !== "cancelled" && <Button type="button" variant="destructive" onClick={close} disabled={pending}>{pending && <LoaderCircle className="animate-spin" />}Biedronde sluiten</Button>}
        </div>
      ) : (
        <form onSubmit={publish} className="mt-4 space-y-4">
          <p className="text-sm leading-6 text-slate-600">Publiceren legt een onveranderlijke voertuigversie vast. Minimaal één foto moet zijn goedgekeurd en de aanvraag moet de status ‘Gereed’ hebben.</p>
          <div><Label htmlFor="startsAt">Begintijd volgens dit apparaat</Label><Input id="startsAt" name="startsAt" type="datetime-local" required className="mt-2" /></div>
          <div><Label htmlFor="endsAt">Eindtijd volgens dit apparaat</Label><Input id="endsAt" name="endsAt" type="datetime-local" required className="mt-2" /></div>
          <Button disabled={pending || applicationStatus !== "ready"}>{pending && <LoaderCircle className="animate-spin" />}Publiceren en biedronde openen</Button>
        </form>
      )}
      {result && <p className={`mt-4 rounded-lg p-3 text-sm font-semibold ${result.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`} role="status">{result.message}</p>}
    </section>
  );
}
