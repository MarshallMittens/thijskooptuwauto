"use client";

import { FormEvent, useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";

import { placeBidAction, setProxyBidAction, type BidActionResult } from "@/app/dealer/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatEuroCents } from "@/lib/bids/amount";

export function BidForm({ listingId, roundId, highestBidCents, nextMinimumBidCents, minimumIncrementCents }: { listingId: string; roundId: string; highestBidCents: number | null; nextMinimumBidCents: number; minimumIncrementCents: number }) {
  const [amount, setAmount] = useState("");
  const [automatic, setAutomatic] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [result, setResult] = useState<BidActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const next = await (automatic ? setProxyBidAction : placeBidAction)({ listingId, roundId, amount, idempotencyKey });
      setResult(next);
      if (next.ok) {
        setAmount("");
        setIdempotencyKey(crypto.randomUUID());
      }
    });
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
      <h2 className="text-xl font-black">Plaats of verhoog je bod</h2>
      <label className="mt-4 flex cursor-pointer items-center gap-3 font-bold"><input type="checkbox" checked={automatic} onChange={(event) => setAutomatic(event.target.checked)} className="size-5 accent-orange-500" />Automatisch bieden met een geheim maximum</label>
      {automatic && <p className="mt-3 rounded-xl bg-white p-4 text-sm leading-6">Stel je maximum in. Het systeem begint op €100 als er nog geen bod is, anders op het minimale volgende bod. Het verhoogt bij tegenbiedingen met €100 onder €10.000 en €150 vanaf €10.000, zolang je maximum dat toelaat. Je maximum kan alleen omhoog. Bij gelijke maxima heeft de eerder ingestelde limiet voorrang; een bestaand zichtbaar bod wordt nooit verlaagd.</p>}
      <p className="mt-2 text-sm leading-6 text-slate-600">Biedbedragen zijn zichtbaar voor alle goedgekeurde garages; de identiteit achter een bod niet. Een opgeslagen bod kan niet worden verlaagd of verwijderd.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Huidig hoogste bod</p><p className="mt-1 text-xl font-black">{highestBidCents === null ? "Nog geen bod" : formatEuroCents(highestBidCents)}</p></div>
        <div className="rounded-xl bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Jouw minimale nieuwe bod</p><p className="mt-1 text-xl font-black">{formatEuroCents(nextMinimumBidCents)}</p><p className="mt-1 text-xs text-slate-500">Minimumstap {formatEuroCents(minimumIncrementCents)}</p></div>
      </div>
      <div className="mt-4 max-w-sm">
        <Label htmlFor="bid-amount">{automatic ? "Geheim maximumbod in euro’s" : "Bedrag in euro’s"}</Label>
        <div className="mt-2 flex gap-2">
          <span className="grid h-12 place-items-center rounded-l-md border border-r-0 border-slate-300 bg-white px-4 font-bold">€</span>
          <Input id="bid-amount" value={amount} onChange={(event) => setAmount(event.target.value)} type="number" inputMode="decimal" min={(nextMinimumBidCents / 100).toFixed(2)} step="0.01" placeholder={(nextMinimumBidCents / 100).toFixed(2)} required className="h-12 rounded-l-none bg-white" />
          <Button type="submit" disabled={pending} className="h-12">{pending && <LoaderCircle className="animate-spin" />}{automatic ? "Maximum instellen" : "Bod opslaan"}</Button>
        </div>
      </div>
      {result && <p className={`mt-4 rounded-lg p-3 text-sm font-semibold ${result.ok ? "bg-emerald-100 text-emerald-900" : "bg-red-100 text-red-900"}`} role="status">{result.message}</p>}
    </form>
  );
}
