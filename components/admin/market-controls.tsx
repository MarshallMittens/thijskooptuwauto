"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";

import { closeBidRoundAction, type MarketActionResult } from "@/app/beheer/aanvragen/market-actions";
import { Button } from "@/components/ui/button";
import { RestartAuctionButton } from "@/components/admin/restart-auction-button";
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

export function MarketControls({ applicationId, market }: { applicationId: string; market: MarketState }) {
  const [result, setResult] = useState<MarketActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  function close() {
    if (!market.roundId) return;
    if (!window.confirm("De 24 uur zijn verstreken. Wil je de hoogste bieding nu als winnaarreservering vastleggen? Dit is nog geen koop.")) return;
    startTransition(async () => setResult(await closeBidRoundAction({ applicationId, roundId: market.roundId! })));
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
          {market.roundStatus === "closed" && (market.needsFinalization || market.outcomeStatus !== "pending") && market.outcomeStatus !== "disputed" && <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-4">
            <h3 className="font-black">Opnieuw aanbieden</h3>
            <p className="mb-3 mt-1 text-sm leading-6 text-slate-700">Niet tevreden met de biedingen? Open direct een nieuwe ronde van 24 uur. De vorige biedingen blijven bewaard. De afgelopen ronde wordt zo nodig automatisch afgerond.</p>
            <RestartAuctionButton applicationId={applicationId} />
          </div>}
        </div>
      ) : (
        <div className="mt-4 space-y-4"><p className="text-sm leading-6 text-slate-600">Controleer de aanvraag en gebruik ‘Auto goedkeuren en aanbieden’ boven de foto’s om de auto direct 24 uur bij dealers aan te bieden.</p>
        </div>
      )}
      {result && <p className={`mt-4 rounded-lg p-3 text-sm font-semibold ${result.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`} role="status">{result.message}</p>}
    </section>
  );
}
