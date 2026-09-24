import { NextResponse } from "next/server";

import { getSafeInternalPath } from "@/lib/auth/safe-redirect";
import { getAppUrl } from "@/lib/config/app-url";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next") ?? "/dealer";
  const next = getSafeInternalPath(requestedNext, "/dealer");
  const appUrl = getAppUrl();

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const target = new URL(next, appUrl);
      if (target.pathname === "/mijn-aanvraag/activeren") {
        const reference = target.searchParams.get("referentie");
        if (!reference || !/^[0-9a-f]{24}$/.test(reference)) {
          return NextResponse.redirect(new URL("/mijn-aanvraag?fout=ongeldige-link", appUrl));
        }
        const { error: claimError } = await supabase.rpc("claim_seller_application", {
          p_reference: reference,
        });
        return NextResponse.redirect(
          new URL(claimError ? "/mijn-aanvraag?fout=koppelen" : "/mijn-aanvraag?geverifieerd=1", appUrl),
        );
      }
      return NextResponse.redirect(target);
    }
  }

  return NextResponse.redirect(new URL("/inloggen?error=callback", appUrl));
}
