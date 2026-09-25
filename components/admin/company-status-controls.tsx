"use client";

import { useState, useTransition } from "react";
import { Ban, CheckCircle2, LoaderCircle, X } from "lucide-react";

import {
  changeCompanyStatusAction,
  type CompanyStatusActionResult,
} from "@/app/beheer/actions";
import { Button } from "@/components/ui/button";
import type { CompanyStatus } from "@/lib/domain/access";

export function CompanyStatusControls({
  companyId,
  companyName,
  status,
}: {
  companyId: string;
  companyName: string;
  status: CompanyStatus;
}) {
  const [result, setResult] = useState<CompanyStatusActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  function update(nextStatus: Exclude<CompanyStatus, "pending">) {
    setResult(null);
    startTransition(async () => {
      setResult(await changeCompanyStatusAction({ companyId, status: nextStatus }));
    });
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {status !== "approved" ? (
          <Button type="button" size="sm" disabled={pending} onClick={() => update("approved")}>
            {pending ? <LoaderCircle className="animate-spin" /> : <CheckCircle2 />}
            Goedkeuren
          </Button>
        ) : null}
        {status !== "blocked" ? (
          <Button type="button" size="sm" variant="destructive" disabled={pending} onClick={() => update("blocked")}>
            {pending ? <LoaderCircle className="animate-spin" /> : <Ban />}
            Blokkeren
          </Button>
        ) : null}
      </div>

      {result ? (
        <div
          className={`fixed right-4 top-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-2xl border p-4 shadow-2xl ${result.ok ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-red-200 bg-red-50 text-red-950"}`}
          role={result.ok ? "status" : "alert"}
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            {result.ok ? <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-700" aria-hidden="true" /> : <Ban className="mt-0.5 size-6 shrink-0 text-red-700" aria-hidden="true" />}
            <div className="min-w-0 flex-1">
              <p className="font-black">{result.ok && result.status === "approved" ? "Garage goedgekeurd" : result.ok ? "Garage geblokkeerd" : "Wijziging niet gelukt"}</p>
              <p className="mt-1 text-sm leading-6">{result.ok && result.status === "approved" ? `${companyName} is goedgekeurd en kan nu na inloggen verder naar het dealerportaal.` : result.ok ? `${companyName} is geblokkeerd en heeft geen toegang meer tot het dealerportaal.` : result.message}</p>
            </div>
            <button type="button" onClick={() => setResult(null)} className="rounded-lg p-1 hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current" aria-label="Melding sluiten"><X className="size-5" /></button>
          </div>
        </div>
      ) : null}
    </>
  );
}
