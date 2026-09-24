"use client";

import { useActionState } from "react";

import {
  requestPasswordReset,
  updatePassword,
  type PasswordRecoveryState,
} from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: PasswordRecoveryState = {};

export function PasswordRecoveryForm({ mode }: { mode: "request" | "update" }) {
  const action = mode === "request" ? requestPasswordReset : updatePassword;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      {mode === "request" ? (
        <div className="space-y-2">
          <Label htmlFor="recovery-email">E-mailadres</Label>
          <Input id="recovery-email" name="email" type="email" autoComplete="email" required className="h-12" />
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nieuw wachtwoord</Label>
            <Input id="new-password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required className="h-12" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-confirmation">Herhaal nieuw wachtwoord</Label>
            <Input id="password-confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} required className="h-12" />
          </div>
          <p className="text-sm text-slate-500">Gebruik minimaal 12 tekens. Na wijzigen worden bestaande sessies afgemeld.</p>
        </>
      )}
      {state.error ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-800" role="alert">{state.error}</p> : null}
      {state.message ? <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900" role="status">{state.message}</p> : null}
      <Button type="submit" disabled={pending} className="h-12 w-full bg-[#f7941e] text-base font-bold text-[#090909] hover:bg-[#ffad45]">
        {pending ? "Even geduld…" : mode === "request" ? "Herstellink aanvragen" : "Wachtwoord wijzigen"}
      </Button>
    </form>
  );
}
