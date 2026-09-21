"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/dal";
import { companyRegistrationSchema } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

export type CompanyActionState = { error?: string };

export async function registerCompany(
  _previousState: CompanyActionState,
  formData: FormData,
): Promise<CompanyActionState> {
  const context = await requireUser("/dealer/registreren");
  if (context.companyId) redirect("/dealer");

  const parsed = companyRegistrationSchema.safeParse({
    legalName: formData.get("legalName"),
    tradeName: formData.get("tradeName"),
    kvkNumber: formData.get("kvkNumber"),
    street: formData.get("street"),
    houseNumber: formData.get("houseNumber"),
    postalCode: formData.get("postalCode"),
    city: formData.get("city"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Controleer de bedrijfsgegevens." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("register_company", {
    p_legal_name: parsed.data.legalName,
    p_trade_name: parsed.data.tradeName || null,
    p_kvk_number: parsed.data.kvkNumber,
    p_street: parsed.data.street,
    p_house_number: parsed.data.houseNumber,
    p_postal_code: parsed.data.postalCode,
    p_city: parsed.data.city,
    p_contact_name: parsed.data.contactName,
    p_email: parsed.data.email,
    p_phone: parsed.data.phone,
  });

  if (error) {
    return { error: "Het bedrijf kon niet worden geregistreerd. Mogelijk bestaat het KvK-nummer al." };
  }

  redirect("/dealer/wachten");
}
