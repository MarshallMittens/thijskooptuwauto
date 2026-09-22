import { z } from "zod";

export const MAX_PHOTOS = 12;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function normalizeRegistration(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

export function formatRegistration(value: string) {
  const registration = normalizeRegistration(value);
  if (registration.length !== 6) return registration;

  const groups = registration.match(/[A-Z]+|\d+/g) ?? [];
  if (groups.length === 3) return groups.join("-");
  if (groups.length === 2 && groups[0].length === 4) {
    return `${groups[0].slice(0, 2)}-${groups[0].slice(2)}-${groups[1]}`;
  }
  if (groups.length === 2 && groups[1].length === 4) {
    return `${groups[0]}-${groups[1].slice(0, 2)}-${groups[1].slice(2)}`;
  }
  if (groups.length === 1) {
    return `${registration.slice(0, 2)}-${registration.slice(2, 4)}-${registration.slice(4)}`;
  }
  return registration;
}

const optionalText = (maximum: number) =>
  z.string().trim().max(maximum).optional().default("");

export const applicationPayloadSchema = z.object({
  vehicle: z.object({
    registration: z
      .string()
      .transform(normalizeRegistration)
      .pipe(z.string().regex(/^[A-Z0-9]{6,8}$/, "Vul een geldig kenteken in.")),
    make: z.string().trim().min(1).max(80),
    model: z.string().trim().min(1).max(120),
    variant: optionalText(120),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1).nullable(),
    fuelType: optionalText(60),
    color: optionalText(60),
    vehicleType: optionalText(80),
  }),
  condition: z.object({
    mileageKm: z.number().int().min(0).max(3_000_000),
    damageDescription: optionalText(2_000),
    technicalIssues: optionalText(2_000),
    maintenanceDescription: optionalText(2_000),
    keyCount: z.number().int().min(0).max(10),
    remarks: optionalText(2_000),
  }),
  seller: z.object({
    fullName: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().min(8).max(30),
    postalCode: z
      .string()
      .trim()
      .transform((value) => value.toUpperCase().replace(/\s+/g, ""))
      .pipe(z.string().regex(/^\d{4}[A-Z]{2}$/)),
    desiredSaleDate: z.string().date().or(z.literal("")).optional().default(""),
  }),
});

export type ApplicationPayload = z.infer<typeof applicationPayloadSchema>;
