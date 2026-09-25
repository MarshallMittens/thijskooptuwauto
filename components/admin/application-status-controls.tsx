"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";

import {
  updateApplicationStatusAction,
  type ApplicationStatusActionResult,
} from "@/app/beheer/aanvragen/actions";
import { Button } from "@/components/ui/button";
import {
  applicationStatusLabels,
  getAllowedApplicationTransitions,
} from "@/lib/domain/application-status";

export function ApplicationStatusControls({
  applicationId,
  status,
}: {
  applicationId: string;
  status: string;
}) {
  const [result, setResult] = useState<ApplicationStatusActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const transitions = getAllowedApplicationTransitions(status);

  function update(nextStatus: (typeof transitions)[number]) {
    startTransition(async () => {
      setResult(await updateApplicationStatusAction({ applicationId, status: nextStatus }));
    });
  }

  return (
    <div>
      {transitions.length ? (
        <div className="flex flex-wrap gap-2">
          {transitions.map((nextStatus) => (
            <Button
              key={nextStatus}
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => update(nextStatus)}
            >
              {pending && <LoaderCircle className="animate-spin" />}
              {applicationStatusLabels[nextStatus]}
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-600">Voor deze status zijn geen vervolgstappen beschikbaar.</p>
      )}
      {result && (
        <p
          className={`mt-3 rounded-lg p-3 text-sm font-semibold ${result.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`}
          role="status"
          aria-live="polite"
        >
          {result.message}
        </p>
      )}
    </div>
  );
}
