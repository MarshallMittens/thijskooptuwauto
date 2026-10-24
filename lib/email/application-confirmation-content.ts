import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { getAppUrl } from "@/lib/config/app-url";
import { buildApplicationConfirmationEmail } from "@/lib/email/application-confirmation-template";

const vehicleSchema = z.object({
  registration_normalized: z.string(), make: z.string().nullable(), model: z.string().nullable(),
  variant: z.string().nullable(), year: z.number().nullable(), fuel_type: z.string().nullable(), color: z.string().nullable(),
});
const conditionSchema = z.object({ mileage_km: z.number().nullable(), key_count: z.number().nullable() });

export async function loadApplicationConfirmationEmail(admin: SupabaseClient, applicationId: string, payload: unknown) {
  const { data: application, error: applicationError } = await admin.from("applications").select("vehicle_id, public_reference").eq("id", applicationId).maybeSingle();
  if (applicationError || !application) throw new Error("application_confirmation_data_unavailable");

  const [vehicleResult, conditionResult] = await Promise.all([
    admin.from("vehicles").select("registration_normalized, make, model, variant, year, fuel_type, color").eq("id", application.vehicle_id).maybeSingle(),
    admin.from("condition_reports").select("mileage_km, key_count").eq("application_id", applicationId).maybeSingle(),
  ]);
  const vehicle = vehicleSchema.safeParse(vehicleResult.data);
  const condition = conditionSchema.nullable().safeParse(conditionResult.data);
  if (vehicleResult.error || conditionResult.error || !vehicle.success || !condition.success) throw new Error("application_confirmation_data_unavailable");

  const name = z.object({ full_name: z.string() }).safeParse(payload);
  return buildApplicationConfirmationEmail({
    fullName: name.success ? name.data.full_name : "autoverkoper",
    reference: application.public_reference,
    vehicle: {
      registration: vehicle.data.registration_normalized, make: vehicle.data.make, model: vehicle.data.model,
      variant: vehicle.data.variant, year: vehicle.data.year, fuelType: vehicle.data.fuel_type, color: vehicle.data.color,
    },
    mileageKm: condition.data?.mileage_km ?? null,
    keyCount: condition.data?.key_count ?? null,
  }, getAppUrl());
}
