"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/browser";

type Factor = { id: string; status: string; friendly_name?: string };
const factorName = "Thijskooptuauto account";

export function MfaSetup({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [factor, setFactor] = useState<Factor | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.mfa.listFactors().then(({ data, error: listError }) => {
      if (listError) setError("MFA-status kon niet worden geladen.");
      const verified = data?.totp.find((item) => item.status === "verified");
      if (verified) setFactor(verified);
      setBusy(false);
    });
  }, []);

  async function enroll() {
    setBusy(true);
    setError("");
    const supabase = createClient();

    const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
    if (listError) {
      setError("MFA-status kon niet worden geladen.");
      setBusy(false);
      return;
    }

    const unfinishedFactors = factors.all.filter(
      (item) => item.factor_type === "totp" && item.status === "unverified",
    );
    for (const unfinishedFactor of unfinishedFactors) {
      const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId: unfinishedFactor.id });
      if (removeError) {
        setError("De onafgemaakte authenticator-instelling kon niet worden hersteld.");
        setBusy(false);
        return;
      }
    }

    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: factorName,
    });
    if (enrollError) {
      setError("De authenticator kon niet worden ingesteld.");
    } else {
      setFactor({ id: data.id, status: "unverified" });
      setQrCode(data.totp.qr_code.trimEnd());
    }
    setBusy(false);
  }

  async function verify() {
    if (!factor || code.length !== 6) return;
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factor.id });
    if (challengeError) {
      setError("De verificatie kon niet worden gestart.");
      setBusy(false);
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: factor.id,
      challengeId: challenge.id,
      code,
    });
    if (verifyError) {
      setError("De code is onjuist of verlopen.");
      setBusy(false);
      return;
    }
    router.push(nextPath);
    router.refresh();
  }

  if (busy && !factor) return <p className="mt-6 text-slate-600">MFA-instellingen laden…</p>;

  return (
    <div className="mt-8 space-y-6">
      {!factor ? (
        <Button onClick={enroll} disabled={busy}>Authenticator instellen</Button>
      ) : (
        <>
          {qrCode ? (
            <div className="space-y-3">
              <p className="text-sm leading-6 text-slate-600">Scan deze QR-code met een authenticator-app. De QR-code bevat een geheim en wordt alleen tijdens de inrichting getoond.</p>
              <Image src={qrCode} alt="QR-code voor authenticator" width={220} height={220} unoptimized className="rounded-xl border border-slate-200" />
            </div>
          ) : null}
          <div className="max-w-xs space-y-2">
            <Label htmlFor="mfa-code">Zescijferige code</Label>
            <Input id="mfa-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} className="h-12 text-lg tracking-[0.25em]" />
          </div>
          <Button onClick={verify} disabled={busy || code.length !== 6}>Code controleren</Button>
        </>
      )}
      {error ? <p className="rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-800" role="alert">{error}</p> : null}
    </div>
  );
}
