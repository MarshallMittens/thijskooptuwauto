"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, X } from "lucide-react";
import { removeApplicationPhotoAction } from "@/app/beheer/aanvragen/acceptance-actions";

export function RemovePhotoButton({ applicationId, photoId, number }: { applicationId: string; photoId: string; number: number }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();
  return <>
    <button type="button" title="Foto verwijderen" aria-label={`Foto ${number} verwijderen`} disabled={pending} className="absolute right-2 top-2 inline-flex size-11 items-center justify-center rounded-full border border-red-200 bg-white text-red-700 shadow-sm transition-colors hover:bg-red-50 active:bg-red-100 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-red-600" onClick={() => startTransition(async () => {
      try {
        const response = await removeApplicationPhotoAction({ applicationId, photoId });
        if (!response.ok) { setError(response.message); return; }
        router.refresh();
      } catch { setError("Verwijderen is niet gelukt. Probeer het opnieuw."); }
    })}>{pending ? <LoaderCircle className="size-5 animate-spin" /> : <X className="size-5" />}</button>
    {error && <p role="alert" className="absolute inset-x-2 top-16 rounded-lg border border-red-200 bg-white p-3 text-xs font-bold text-red-800 shadow">{error}</p>}
  </>;
}
