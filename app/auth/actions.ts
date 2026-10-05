"use server";

import { redirect } from "next/navigation";

import { getAccessContext, requireUser } from "@/lib/auth/dal";
import { getSafeInternalPath } from "@/lib/auth/safe-redirect";
import {
  credentialsSchema,
  passwordUpdateSchema,
  recoveryEmailSchema,
} from "@/lib/auth/validation";
import { getAppUrl } from "@/lib/config/app-url";
import { getDefaultPortalPath } from "@/lib/domain/access";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = { error?: string };
export type PasswordRecoveryState = { error?: string; message?: string };

export async function signIn(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Controleer de invoer." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Inloggen is niet gelukt. Controleer je gegevens." };

  const returnTo = formData.get("returnTo");
  const context = await getAccessContext();
  redirect(getSafeInternalPath(returnTo, getDefaultPortalPath(context)));
}

export async function signUpDealer(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Controleer de invoer." };
  }

  const supabase = await createClient();
  const appUrl = getAppUrl();
  const { error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${appUrl}/auth/callback?next=/dealer/registreren` },
  });

  if (error) return { error: "Registreren is niet gelukt." };
  redirect("/registreren/bevestig-email");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(
  _previousState: PasswordRecoveryState,
  formData: FormData,
): Promise<PasswordRecoveryState> {
  const parsed = recoveryEmailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Controleer het e-mailadres." };
  }

  const supabase = await createClient();
  const appUrl = getAppUrl();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appUrl}/auth/callback?next=/wachtwoord-wijzigen`,
  });

  return {
    message: "Als dit e-mailadres bekend is, ontvang je een beveiligde herstelmail.",
  };
}

export async function updatePassword(
  _previousState: PasswordRecoveryState,
  formData: FormData,
): Promise<PasswordRecoveryState> {
  await requireUser("/wachtwoord-wijzigen");
  const parsed = passwordUpdateSchema.safeParse({
    password: formData.get("password"),
    confirmation: formData.get("confirmation"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Controleer de wachtwoorden." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "Het wachtwoord kon niet veilig worden gewijzigd." };

  await supabase.auth.signOut({ scope: "global" });
  redirect("/inloggen?wachtwoord=gewijzigd");
}
