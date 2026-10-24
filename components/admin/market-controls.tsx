"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";

import { closeBidRoundAction, publishApplicationAction, restartBidRoundAction, type MarketActionResult } from "@/app/beheer/aanvragen/market-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatEuroCents } from "@/lib/bids/amount";
import { formatAmsterdamDateTime } from "@/lib/time/format";

type MarketState = {
  listingId: string | null;
  listingStatus: string | null;
  roundId: string | null;
  roundStatus: string | null;
  startsAt: string | null;
  endsAt: string | null;
  outcomeStatus: string | null;
  needsFinalization: boolean;
  policyStatus: string | null;
  minimumIncrementCents: number | null;
  feeConfigurationConfirmed: boolean;
};

export function MarketControls({ applicationId, applicationStatus, sellerVerified, market }: { applicationId: string; applicationStatus: string; sellerVerified: boolean; market: MarketState }) {
  const [result, setResult] = useState<MarketActionResult | null>(null);
  const [restartReason, setRestartReason] = useState("");
  const [pending, startTransition] = useTransition();

  function publish() {
    if (!window.confirm("Publiceren opent direct een biedronde van exact 24 uur. Doorgaan?")) return;
    startTransition(async () => setResult(await publishApplicationAction({ applicationId })));
  }

  function close() {
    if (!market.roundId) return;
    if (!window.confirm("De 24 uur zijn verstreken. Wil je de hoogste bieding nu als winnaarreservering vastleggen? Dit is nog geen koop.")) return;
    startTransition(async () => setResult(await closeBidRoundAction({ applicationId, roundId: market.roundId! })));
  }

  function restart() {
    const reason = restartReason.trim();
    if (reason.length < 10) {
      setResult({ ok: false, message: "Vul een duidelijke reden van minimaal 10 tekens in." });
      return;
    }
    if (!window.confirm("Een nieuwe lege biedronde start direct en duurt exact 24 uur. De oude biedingen blijven als historie bewaard en een eventuele winnaarreservering wordt ingetrokken. Doorgaan?")) return;
    const idempotencyKey = crypto.randomUUID();
    startTransition(async () => {
      const actionResult = await restartBidRoundAction({ applicationId, reason, idempotencyKey });
      setResult(actionResult);
      if (actionResult.ok) setRestartReason("");
    });
  }

  return (
    <section className="rounded-2xl border border-slate-200 p-6">
      <h2 className="text-xl font-black">Publicatie en biedronde</h2>
      {market.listingId && market.listingStatus === "published" ? (
        <div className="mt-4 space-y-3">
          <p><strong>Status:</strong> {market.roundStatus}</p>
          {market.startsAt && <p><strong>Gestart:</strong> {formatAmsterdamDateTime(market.startsAt)}</p>}
          {market.endsAt && <p><strong>Sluit:</strong> {formatAmsterdamDateTime(market.endsAt)}</p>}
          {market.minimumIncrementCents !== null && <p><strong>Minimumverhoging:</strong> {formatEuroCents(market.minimumIncrementCents)}</p>}
          {market.policyStatus === "test" && <p className="rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-900">Testbeleid actief. Kosten en contractvoorwaarden zijn nog niet goedgekeurd; productielivegang blijft geblokkeerd.</p>}
          {market.outcomeStatus && market.outcomeStatus !== "pending" && <p className="rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">Uitslag: {market.outcomeStatus}. Een winnaarreservering is geen automatische verkoop.</p>}
          {market.needsFinalization && <Button type="button" onClick={close} disabled={pending}>{pending && <LoaderCircle className="animate-spin" />}Uitslag vastleggen</Button>}
          {market.roundStatus === "closed" && market.outcomeStatus !== "pending" && market.outcomeStatus !== "disputed" && <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-4">
            <h3 className="font-black">Veiling opnieuw starten</h3>
            <p className="mt-1 text-sm leading-6 text-slate-700">Gebruik dit als de biedingen onvoldoende zijn. De vorige ronde en biedingen blijven bewaard; de nieuwe ronde begint zonder biedingen.</p>
            <label htmlFor="restart-reason" className="mt-3 block text-sm font-bold">Reden voor de nieuwe ronde</label>
            <Textarea id="restart-reason" value={restartReason} onChange={(event) => setRestartReason(event.target.value)} maxLength={500} placeholder="Bijvoorbeeld: hoogste bod sluit niet aan bij de verwachte marktwaarde." className="mt-2 bg-white" />
            <Button type="button" onClick={restart} disabled={pending || restartReason.trim().length < 10} className="mt-3">{pending && <LoaderCircle className="animate-spin" />}Veiling opnieuw starten · 24 uur</Button>
          </div>}
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <p className="text-sm leading-6 text-slate-600">Publiceren legt een onveranderlijke voertuigversie vast en opent direct een biedronde van exact 24 uur. De verkoper moet geverifieerd zijn, minimaal één foto moet zijn goedgekeurd en de aanvraag moet de status ‘Gereed’ hebben.</p>
          <p className={`rounded-lg p-3 text-sm font-semibold ${sellerVerified ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`}>E-mail verkoper: {sellerVerified ? "geverifieerd" : "nog niet geverifieerd"}</p>
          <Button type="button" onClick={publish} disabled={pending || applicationStatus !== "ready" || !sellerVerified}>{pending && <LoaderCircle className="animate-spin" />}Publiceren en 24 uur openen</Button>
        </div>
      )}
      {result && <p className={`mt-4 rounded-lg p-3 text-sm font-semibold ${result.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`} role="status">{result.message}</p>}
    </section>
  );
}
