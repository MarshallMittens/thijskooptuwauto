"use server";

import { redirect } from "next/navigation";

import { getSafeInternalPath } from "@/lib/auth/safe-redirect";
import { credentialsSchema } from "@/lib/auth/validation";
import { getAppUrl } from "@/lib/config/app-url";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = { error?: string };

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
  redirect(getSafeInternalPath(returnTo, "/dealer"));
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
