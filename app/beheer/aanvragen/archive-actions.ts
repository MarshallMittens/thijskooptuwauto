"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export async function archiveApplicationAction(input: unknown) {
  await requireAdminRole();
  const parsed = z.object({ applicationId: z.string().uuid(), reason: z.string().trim().min(10).max(500) }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Vul een reden van 10 tot 500 tekens in." };
  const client = await createClient();
  const { error } = await client.rpc("admin_archive_application", { p_application_id: parsed.data.applicationId, p_reason: parsed.data.reason });
  if (error) return { ok: false, message: error.message.includes("archive_followup_active")
    ? "Er loopt nog een afspraak, koopafhandeling of geschil. Rond dit eerst af voordat je de auto archiveert."
    : "De auto kon niet veilig worden gearchiveerd." };
  for (const path of ["/beheer/aanvragen", "/beheer/veilingen", "/dealer", "/dealer/biedingen", "/dealer/gewonnen", `/beheer/aanvragen/${parsed.data.applicationId}`]) revalidatePath(path);
  revalidatePath("/dealer/aanbod", "layout");
  return { ok: true, message: "De auto is gearchiveerd." };
}
