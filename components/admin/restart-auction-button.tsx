"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, RotateCcw } from "lucide-react";
import { restartBidRoundAction } from "@/app/beheer/aanvragen/market-actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function RestartAuctionButton({ applicationId }: { applicationId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("De auto opnieuw aanbieden na afloop van de vorige veiling.");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const requestKey = useRef<string | null>(null);
  const router = useRouter();
  return <Dialog open={open} onOpenChange={(value) => { if (!pending) { setOpen(value); setError(""); } }}>
    <DialogTrigger asChild><Button type="button"><RotateCcw className="size-4" />Opnieuw starten voor 24 uur</Button></DialogTrigger>
    <DialogContent showCloseButton={!pending}>
      <DialogHeader><DialogTitle>Veiling opnieuw starten voor 24 uur?</DialogTitle><DialogDescription>De nieuwe ronde begint direct, zonder biedingen. De vorige ronde en biedingen blijven bewaard. Een eventuele winnaarreservering vervalt. Dit kan alleen na afloop en zolang er geen afspraak, koopafhandeling of geschil loopt.</DialogDescription></DialogHeader>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); startTransition(async () => {
        requestKey.current ??= crypto.randomUUID();
        try {
          const result = await restartBidRoundAction({ applicationId, reason, idempotencyKey: requestKey.current });
          if (!result.ok) { setError(result.message); return; }
          requestKey.current = null; setOpen(false); router.refresh();
        } catch { setError("De nieuwe ronde kon niet worden bevestigd. Probeer het opnieuw."); }
      }); }}>
        <label className="block text-sm font-bold">Reden voor de nieuwe ronde<Textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={10} maxLength={500} required disabled={pending} className="mt-2" /></label>
        <p className="text-sm text-slate-600">Je kunt de voorgestelde reden laten staan of aanpassen.</p>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <DialogFooter><Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>Annuleren</Button><Button type="submit" disabled={pending || reason.trim().length < 10}>{pending && <LoaderCircle className="size-4 animate-spin" />}Start nieuwe ronde van 24 uur</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
