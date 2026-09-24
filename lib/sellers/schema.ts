import { z } from "zod";

export const sellerUpdateSchema = z.object({
  applicationId: z.string().uuid(),
  mileageKm: z.coerce.number().int().min(0).max(3_000_000),
  keyCount: z.coerce.number().int().min(0).max(10),
  damageDescription: z.string().trim().max(2000),
  technicalIssues: z.string().trim().max(2000),
  maintenanceDescription: z.string().trim().max(2000),
  remarks: z.string().trim().max(2000),
  desiredSaleDate: z.string().trim().refine(
    (value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value),
    "Controleer de gewenste verkoopdatum.",
  ),
});
