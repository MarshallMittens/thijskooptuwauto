"use client";

import { useActionState } from "react";

import {
  signIn,
  signUpDealer,
  type AuthActionState,
} from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

export function CredentialsForm({
  mode,
  returnTo,
}: {
  mode: "sign-in" | "sign-up";
  returnTo?: string;
}) {
  const action = mode === "sign-in" ? signIn : signUpDealer;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
      <div className="space-y-2">
        <Label htmlFor="email">E-mailadres</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required className="h-12" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Wachtwoord</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          minLength={12}
          required
          className="h-12"
        />
        {mode === "sign-up" ? (
          <p className="text-sm text-slate-500">Gebruik minimaal 12 tekens.</p>
        ) : null}
      </div>
      {state.error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-800" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="h-12 w-full bg-[#1554d1] text-base font-bold hover:bg-[#0f42aa]">
        {pending ? "Even geduld…" : mode === "sign-in" ? "Inloggen" : "Account maken"}
      </Button>
    </form>
  );
}
