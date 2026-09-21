import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().trim().email("Vul een geldig e-mailadres in."),
  password: z
    .string()
    .min(12, "Gebruik minimaal 12 tekens.")
    .max(128, "Het wachtwoord is te lang."),
});

export const companyRegistrationSchema = z.object({
  legalName: z.string().trim().min(2).max(160),
  tradeName: z.string().trim().max(160).optional(),
  kvkNumber: z.string().trim().regex(/^\d{8}$/, "Een KvK-nummer heeft 8 cijfers."),
  street: z.string().trim().min(2).max(120),
  houseNumber: z.string().trim().min(1).max(16),
  postalCode: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase().replace(/\s+/g, ""))
    .pipe(z.string().regex(/^\d{4}[A-Z]{2}$/, "Gebruik bijvoorbeeld 1234AB.")),
  city: z.string().trim().min(2).max(100),
  contactName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().min(8).max(30),
});
