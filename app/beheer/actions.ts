"use server";

import { revalidatePath } from "next/cache";

import { requireAdminRole } from "@/lib/auth/dal";
import type { CompanyStatus } from "@/lib/domain/access";
import { createClient } from "@/lib/supabase/server";

export async function changeCompanyStatus(formData: FormData) {
  await requireAdminRole();
  const companyId = formData.get("companyId");
  const status = formData.get("status");

  if (
    typeof companyId !== "string" ||
    (status !== "approved" && status !== "blocked")
  ) {
    throw new Error("Ongeldige statuswijziging.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_company_status", {
    p_company_id: companyId,
    p_status: status as Exclude<CompanyStatus, "pending">,
  });
  if (error) throw new Error("De bedrijfsstatus kon niet worden gewijzigd.");

  revalidatePath("/beheer");
}
