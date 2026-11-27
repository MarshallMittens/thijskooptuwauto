"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, X } from "lucide-react";
import { archiveApplicationAction } from "@/app/beheer/aanvragen/archive-actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function ArchiveApplicationButton({ applicationId, registration, className = "" }: { applicationId: string; registration: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return <Dialog open={open} onOpenChange={(value) => { if (!pending) { setOpen(value); setError(""); } }}>
    <DialogTrigger asChild><button type="button" title={`${registration} archiveren`} aria-label={`${registration} archiveren`} className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-red-200 bg-white text-red-700 shadow-sm transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 ${className}`}><X className="size-5" aria-hidden="true" /></button></DialogTrigger>
    <DialogContent showCloseButton={!pending}>
      <DialogHeader><DialogTitle>{registration} archiveren?</DialogTitle><DialogDescription>De auto verdwijnt uit het aanbod en een actieve biedronde stopt. Biedingen, foto’s en dossiers blijven bewaard. Een lopende afspraak of koopafhandeling moet eerst worden afgerond.</DialogDescription></DialogHeader>
      <form onSubmit={(event) => { event.preventDefault(); startTransition(async () => {
        try {
          const result = await archiveApplicationAction({ applicationId, reason });
          if (!result.ok) { setError(result.message); return; }
          setOpen(false); setReason(""); router.refresh();
        } catch { setError("Archiveren is niet gelukt. Probeer het opnieuw."); }
      }); }} className="space-y-4">
        <label className="block text-sm font-bold">Reden voor archiveren<Textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={10} maxLength={500} required disabled={pending} className="mt-2" /></label>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <DialogFooter><Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>Annuleren</Button><Button type="submit" variant="destructive" disabled={pending || reason.trim().length < 10}>{pending && <LoaderCircle className="size-4 animate-spin" />}Archiveren</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
