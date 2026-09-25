"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import localFont from "next/font/local";
import { ArrowRight } from "lucide-react";

import { Input } from "@/components/ui/input";
import { formatRegistration, normalizeRegistration } from "@/lib/applications/schema";

const kentekenFont = localFont({
  src: "../../public/fonts/Kenteken.ttf",
  display: "swap",
  weight: "400",
  variable: "--font-kenteken",
});

export function LicensePlateStart() {
  const router = useRouter();
  const [registration, setRegistration] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeRegistration(registration);
    if (!/^[A-Z0-9]{6,8}$/.test(normalized)) { setError("Vul een volledig Nederlands kenteken in."); return; }
    router.push(`/auto-aanmelden?kenteken=${encodeURIComponent(normalized)}&ophalen=1`);
  }

  return (
    <form onSubmit={submit} noValidate className={kentekenFont.variable}>
      <label htmlFor="license-plate" className="mb-2.5 block px-1 text-sm font-bold">Vul je kenteken in</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex min-h-[4.5rem] flex-1 items-stretch overflow-hidden rounded-[0.6rem] border-[3px] border-[#111111] bg-[#f9cf00] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] focus-within:ring-4 focus-within:ring-orange-500/30">
          <span className="flex w-12 shrink-0 flex-col items-center justify-center gap-0.5 bg-[#003f8f] pb-1 text-white sm:w-14" aria-hidden="true">
            <svg viewBox="0 0 32 32" className="size-7" focusable="false">
              <g fill="#ffdf00">
                <circle cx="16" cy="3.8" r="1.25" /><circle cx="22.1" cy="5.4" r="1.25" />
                <circle cx="26.6" cy="9.9" r="1.25" /><circle cx="28.2" cy="16" r="1.25" />
                <circle cx="26.6" cy="22.1" r="1.25" /><circle cx="22.1" cy="26.6" r="1.25" />
                <circle cx="16" cy="28.2" r="1.25" /><circle cx="9.9" cy="26.6" r="1.25" />
                <circle cx="5.4" cy="22.1" r="1.25" /><circle cx="3.8" cy="16" r="1.25" />
                <circle cx="5.4" cy="9.9" r="1.25" /><circle cx="9.9" cy="5.4" r="1.25" />
              </g>
            </svg>
            <span className="text-[0.8rem] font-black leading-none tracking-[-0.04em]">NL</span>
          </span>
          <Input id="license-plate" value={formatRegistration(registration)} onChange={(event) => { setRegistration(normalizeRegistration(event.target.value)); setError(""); }} placeholder="12-AB-34" maxLength={10} autoComplete="off" autoCapitalize="characters" spellCheck={false} aria-describedby="plate-message" aria-invalid={Boolean(error)} className="license-plate-text h-[4.5rem] min-w-0 rounded-none border-0 bg-transparent px-1 text-center uppercase text-[#080808] shadow-none placeholder:text-black/35 focus-visible:ring-0 sm:px-3" />
        </div>
        <button type="submit" className="license-plate-submit group flex h-[4.5rem] w-full shrink-0 items-center justify-between gap-2 px-4 text-left sm:w-auto">
          <span>Start je aanvraag</span>
          <span className="license-plate-submit-icon flex size-8 shrink-0 items-center justify-center" aria-hidden="true"><ArrowRight className="size-4" /></span>
        </button>
      </div>
      <p id="plate-message" className={`mt-2.5 px-1 text-sm ${error ? "font-semibold text-red-700" : "text-slate-500"}`} role={error ? "alert" : undefined}>{error || "Je zit nergens aan vast. We gebruiken het kenteken om beschikbare voertuiggegevens op te halen."}</p>
    </form>
  );
}
