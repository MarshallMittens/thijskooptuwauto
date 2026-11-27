"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle } from "lucide-react";
import { approveAndPublishApplicationAction } from "@/app/beheer/aanvragen/acceptance-actions";
import { Button } from "@/components/ui/button";

export function ApproveApplicationButton({ applicationId }: { applicationId: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const router = useRouter();
  return <section className="mt-8 rounded-2xl border border-orange-200 bg-orange-50/40 p-6">
    <h2 className="text-xl font-black">Klaar om aan te bieden?</h2>
    <p className="mb-4 mt-2 text-sm leading-6 text-slate-700">Controleer de gegevens en foto’s hieronder. Met deze knop keur je de aanvraag en alle nog te controleren foto’s goed en start je direct de veiling van 24 uur. Afgewezen of verwijderde foto’s gaan niet mee. De particulier hoeft geen extra e-mailbevestiging te doen.</p>
    <Button type="button" disabled={pending || result?.ok} onClick={() => startTransition(async () => {
      try {
        const response = await approveAndPublishApplicationAction({ applicationId });
        setResult(response);
        if (response.ok) router.refresh();
      } catch { setResult({ ok: false, message: "Goedkeuren is niet gelukt. Probeer het opnieuw." }); }
    })}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}Auto goedkeuren en aanbieden</Button>
    {result && <p role="status" className={`mt-4 rounded-lg p-3 text-sm font-semibold ${result.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`}>{result.message}</p>}
  </section>;
}
