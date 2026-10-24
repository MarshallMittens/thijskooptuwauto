"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin, requireAdminRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export type OperationActionResult = { ok: boolean; message: string };

function refresh() {
  revalidatePath("/beheer");
  revalidatePath("/beheer/operatie");
  revalidatePath("/beheer/aanvragen/[id]", "page");
  revalidatePath("/mijn-aanvraag");
  revalidatePath("/dealer/klachten");
}

export async function adminComplaintAction(input: unknown): Promise<OperationActionResult> {
  await requireAdmin();
  const parsed = z.object({
    complaintId: z.string().uuid(),
    command: z.enum(["review", "in_review", "waiting_external", "resolved", "rejected"]),
    text: z.string().trim().max(4000),
  }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Ongeldige klachtactie." };
  const supabase = await createClient();
  const { error } = parsed.data.command === "review"
    ? await supabase.rpc("admin_review_complaint", { p_complaint_id: parsed.data.complaintId, p_notes: parsed.data.text })
    : await supabase.rpc("admin_update_complaint", { p_complaint_id: parsed.data.complaintId, p_status: parsed.data.command, p_resolution: parsed.data.text });
  if (error) {
    const message = error.message.includes("independent_second_reviewer_required")
      ? "Een andere medewerker moet eerst de tweede beoordeling vastleggen of deze daarna afzonderlijk afronden."
      : error.message.includes("independent_review_not_allowed")
        ? "Deze tweede beoordeling is niet nodig of mag niet door deze medewerker worden vastgelegd."
        : "De klachtactie is veilig geweigerd.";
    return { ok: false, message };
  }
  refresh();
  return { ok: true, message: parsed.data.command === "review" ? "Tweede beoordeling vastgelegd." : "Klachtstatus bijgewerkt en geaudit." };
}

export async function createIncidentAction(input: unknown): Promise<OperationActionResult> {
  await requireAdmin();
  const parsed = z.object({ severity: z.enum(["low", "medium", "high", "critical"]), summary: z.string().trim().min(10).max(300), impact: z.string().trim().min(10).max(4000) }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Omschrijf het probleem en de gevolgen voor gebruikers duidelijk." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_create_incident", { p_severity: parsed.data.severity, p_summary: parsed.data.summary, p_impact: parsed.data.impact });
  if (error) return { ok: false, message: "Het probleem kon niet worden opgeslagen." };
  refresh();
  return { ok: true, message: "Probleem opgeslagen. Je kunt de voortgang volgen bij ‘Open problemen’." };
}

export async function updateIncidentAction(input: unknown): Promise<OperationActionResult> {
  await requireAdmin();
  const parsed = z.object({ incidentId: z.string().uuid(), status: z.enum(["investigating", "monitoring", "resolved"]), resolution: z.string().trim().max(4000) }).safeParse(input);
  if (!parsed.success || (parsed.data.status === "resolved" && parsed.data.resolution.length < 10)) return { ok: false, message: "Geef bij oplossen minimaal tien tekens toelichting." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_incident", { p_incident_id: parsed.data.incidentId, p_status: parsed.data.status, p_resolution: parsed.data.resolution });
  if (error) return { ok: false, message: "De status van het probleem kon niet worden gewijzigd." };
  refresh();
  return { ok: true, message: "De status van het probleem is bijgewerkt." };
}

export async function createTestInvoiceRecordAction(input: unknown): Promise<OperationActionResult> {
  await requireAdmin();
  const parsed = z.object({ paymentOrderId: z.string().uuid(), documentType: z.enum(["invoice", "credit_note"]), correctedInvoiceId: z.string().uuid().nullable(), reason: z.string().trim().min(10).max(1000) }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Geef een geldige reden voor het testdocument." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_create_test_invoice_record", {
    p_payment_order_id: parsed.data.paymentOrderId,
    p_document_type: parsed.data.documentType,
    p_corrected_invoice_id: parsed.data.correctedInvoiceId,
    p_reason: parsed.data.reason,
  });
  if (error) return { ok: false, message: "Het geblokkeerde testdocument kon niet worden gemaakt; mogelijk bestaat het al." };
  refresh();
  return { ok: true, message: "Testdocument opgeslagen met €0, zonder btw-aanname en geblokkeerd voor verzending." };
}

export async function setPlatformAffiliationAction(input: unknown): Promise<OperationActionResult> {
  await requireAdminRole();
  const parsed = z.object({ companyId: z.string().uuid(), affiliated: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Ongeldig bedrijf." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_platform_affiliation", { p_company_id: parsed.data.companyId, p_affiliated: parsed.data.affiliated });
  if (error) return { ok: false, message: "De platformverbinding kon niet worden gewijzigd." };
  refresh();
  return { ok: true, message: "Platformverbinding bijgewerkt. Nieuwe klachten krijgen de juiste tweede-beoordelingsregel." };
}
