import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { AccessContext } from "@/lib/domain/access";
import { createClient } from "@/lib/supabase/server";

const accessSchema = z.object({
  is_staff: z.boolean(),
  staff_role: z.enum(["admin", "operator"]).nullable(),
  can_use_dealer_portal: z.boolean(),
  company_id: z.string().uuid().nullable(),
  company_status: z.enum(["pending", "approved", "blocked"]).nullable(),
});

export const getAccessContext = cache(async (): Promise<AccessContext | null> => {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const subject = claimsData?.claims?.sub;

  if (claimsError || typeof subject !== "string") return null;

  const { data, error } = await supabase.rpc("get_my_access_context");
  if (error) throw new Error("Toegangscontext kon niet veilig worden bepaald.");

  const parsed = accessSchema.safeParse(data);
  if (!parsed.success) throw new Error("Ongeldige toegangscontext ontvangen.");

  return {
    userId: subject,
    assuranceLevel:
      claimsData?.claims?.aal === "aal2" ? "aal2" : "aal1",
    isStaff: parsed.data.is_staff,
    staffRole: parsed.data.staff_role,
    canUseDealerPortal: parsed.data.can_use_dealer_portal,
    companyId: parsed.data.company_id,
    companyStatus: parsed.data.company_status,
  };
});

export async function requireUser(returnTo: string) {
  const context = await getAccessContext();
  if (!context) redirect(`/inloggen?returnTo=${encodeURIComponent(returnTo)}`);
  return context;
}

export async function requireDealer() {
  const context = await requireUser("/dealer");

  if (context.isStaff && !context.canUseDealerPortal) redirect("/geen-toegang");
  if (!context.companyId) redirect("/dealer/registreren");
  if (context.companyStatus === "pending") redirect("/dealer/wachten");
  if (context.companyStatus === "blocked") redirect("/dealer/geblokkeerd");
  if (context.companyStatus !== "approved") redirect("/geen-toegang");
  if (context.assuranceLevel !== "aal2") redirect("/auth/mfa?next=/dealer");

  return context;
}

export async function requireAdmin() {
  const context = await requireUser("/beheer");
  if (!context.isStaff) redirect("/geen-toegang");
  if (context.assuranceLevel !== "aal2") redirect("/auth/mfa");
  return context;
}

export async function requireAdminRole() {
  const context = await requireAdmin();
  if (context.staffRole !== "admin") redirect("/geen-toegang");
  return context;
}
