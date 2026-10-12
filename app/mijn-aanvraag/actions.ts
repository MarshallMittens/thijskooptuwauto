"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { sellerUpdateSchema } from "@/lib/sellers/schema";
import { createClient } from "@/lib/supabase/server";

export type SellerUpdateState = { ok?: boolean; message?: string };

const sellerClaimSchema = z.string().regex(/^[0-9a-f]{24}$/);

export async function claimSellerApplicationAction(formData: FormData) {
  await requireUser("/mijn-aanvraag");
  const parsedReference = sellerClaimSchema.safeParse(formData.get("reference"));
  if (!parsedReference.success) redirect("/mijn-aanvraag?fout=ongeldige-referentie");

  const supabase = await createClient();
  const { error } = await supabase.rpc("claim_seller_application", {
    p_reference: parsedReference.data,
  });
  if (error) {
    redirect(`/mijn-aanvraag?referentie=${parsedReference.data}&fout=koppelen`);
  }

  revalidatePath("/mijn-aanvraag");
  redirect("/mijn-aanvraag?geverifieerd=1");
}

export async function updateSellerApplication(
  _previousState: SellerUpdateState,
  formData: FormData,
): Promise<SellerUpdateState> {
  await requireUser("/mijn-aanvraag");
  const parsed = sellerUpdateSchema.safeParse({
    applicationId: formData.get("applicationId"),
    mileageKm: formData.get("mileageKm"),
    keyCount: formData.get("keyCount"),
    damageDescription: formData.get("damageDescription"),
    technicalIssues: formData.get("technicalIssues"),
    maintenanceDescription: formData.get("maintenanceDescription"),
    remarks: formData.get("remarks"),
    desiredSaleDate: formData.get("desiredSaleDate"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Controleer de aanvulling." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("seller_update_application", {
    p_application_id: parsed.data.applicationId,
    p_mileage_km: parsed.data.mileageKm,
    p_damage_description: parsed.data.damageDescription,
    p_technical_issues: parsed.data.technicalIssues,
    p_maintenance_description: parsed.data.maintenanceDescription,
    p_key_count: parsed.data.keyCount,
    p_remarks: parsed.data.remarks,
    p_desired_sale_date: parsed.data.desiredSaleDate || null,
  });
  if (error) {
    const message = error.message.includes("seller_update_not_allowed")
      ? "Deze aanvraag wacht niet meer op een aanvulling. Vernieuw de pagina."
      : "De aanvulling is veilig geweigerd.";
    return { ok: false, message };
  }

  revalidatePath("/mijn-aanvraag");
  return { ok: true, message: "Je aanvulling is opgeslagen en staat opnieuw klaar voor controle." };
}
