"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.string().uuid();
const statusSchema = z.enum(["in_review", "needs_information", "ready", "withdrawn", "closed"]);
const photoStatusSchema = z.enum(["approved", "rejected"]);

export async function updateApplicationStatus(formData: FormData) {
  await requireAdmin();
  const applicationId = idSchema.parse(formData.get("applicationId"));
  const status = statusSchema.parse(formData.get("status"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_application_status", { p_application_id: applicationId, p_status: status });
  if (error) throw new Error("De aanvraagstatus kon niet veilig worden gewijzigd.");
  revalidatePath("/beheer/aanvragen");
  revalidatePath(`/beheer/aanvragen/${applicationId}`);
}

export async function addInternalNote(formData: FormData) {
  await requireAdmin();
  const applicationId = idSchema.parse(formData.get("applicationId"));
  const body = z.string().trim().min(1).max(2000).parse(formData.get("body"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_add_internal_note", { p_application_id: applicationId, p_body: body });
  if (error) throw new Error("De interne notitie kon niet veilig worden opgeslagen.");
  revalidatePath(`/beheer/aanvragen/${applicationId}`);
}

export async function reviewPhoto(formData: FormData) {
  await requireAdmin();
  const applicationId = idSchema.parse(formData.get("applicationId"));
  const photoId = idSchema.parse(formData.get("photoId"));
  const status = photoStatusSchema.parse(formData.get("status"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_photo_review", { p_photo_id: photoId, p_status: status });
  if (error) throw new Error("De fotocontrole kon niet veilig worden opgeslagen.");
  revalidatePath(`/beheer/aanvragen/${applicationId}`);
}
