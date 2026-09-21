"use client";

import { FormEvent, useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";

import { placeBidAction, type BidActionResult } from "@/app/dealer/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BidForm({ listingId, roundId }: { listingId: string; roundId: string }) {
  const [amount, setAmount] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [result, setResult] = useState<BidActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const next = await placeBidAction({ listingId, roundId, amount, idempotencyKey });
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
      <p className="mt-2 text-sm leading-6 text-slate-600">Je bod is besloten. Een eenmaal opgeslagen bod kan niet worden verlaagd of verwijderd.</p>
      <div className="mt-4 max-w-sm">
        <Label htmlFor="bid-amount">Bedrag in euro’s</Label>
        <div className="mt-2 flex gap-2">
          <span className="grid h-12 place-items-center rounded-l-md border border-r-0 border-slate-300 bg-white px-4 font-bold">€</span>
          <Input id="bid-amount" value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="12500" required className="h-12 rounded-l-none bg-white" />
          <Button type="submit" disabled={pending} className="h-12">{pending && <LoaderCircle className="animate-spin" />}Bod opslaan</Button>
        </div>
      </div>
      {result && <p className={`mt-4 rounded-lg p-3 text-sm font-semibold ${result.ok ? "bg-emerald-100 text-emerald-900" : "bg-red-100 text-red-900"}`} role="status">{result.message}</p>}
    </form>
  );
}
