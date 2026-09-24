"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function remainingLabel(milliseconds: number) {
  if (milliseconds <= 0) return "De biedronde is afgelopen";
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function AuctionRefresh({ endsAt, active }: { endsAt: string; active: boolean }) {
  const router = useRouter();
  const [remaining, setRemaining] = useState<string>("");

  useEffect(() => {
    const end = new Date(endsAt).getTime();
    let wasActive = active;
    const update = () => {
      const left = end - Date.now();
      setRemaining(remainingLabel(left));
      if (wasActive && left <= 0) {
        wasActive = false;
        router.refresh();
      }
    };
    update();
    const clock = window.setInterval(update, 1000);
    const refresh = window.setInterval(() => router.refresh(), 15000);
    const onVisible = () => { if (document.visibilityState === "visible") router.refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(clock);
      window.clearInterval(refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [active, endsAt, router]);

  return <p className="mt-2 font-mono text-sm font-bold text-[#a64b00]" aria-live="polite">{remaining}</p>;
}
