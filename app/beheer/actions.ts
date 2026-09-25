"use server";

import { revalidatePath } from "next/cache";

import { requireAdminRole } from "@/lib/auth/dal";
import type { CompanyStatus } from "@/lib/domain/access";
import { createClient } from "@/lib/supabase/server";

export type CompanyStatusActionResult =
  | { ok: true; status: Exclude<CompanyStatus, "pending">; message: string }
  | { ok: false; message: string };

export async function changeCompanyStatusAction(input: {
  companyId: string;
  status: Exclude<CompanyStatus, "pending">;
}): Promise<CompanyStatusActionResult> {
  await requireAdminRole();

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.companyId) ||
    (input.status !== "approved" && input.status !== "blocked")
  ) {
    return { ok: false, message: "Ongeldige statuswijziging." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_company_status", {
    p_company_id: input.companyId,
    p_status: input.status,
  });
  if (error) return { ok: false, message: "De bedrijfsstatus kon niet worden gewijzigd." };

  revalidatePath("/beheer");
  return {
    ok: true,
    status: input.status,
    message: input.status === "approved" ? "De garage is goedgekeurd." : "De garage is geblokkeerd.",
  };
}
