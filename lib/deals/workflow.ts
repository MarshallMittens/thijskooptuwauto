import { z } from "zod";

export const dealStatusSchema = z.enum([
  "not_started",
  "discussing",
  "agreement_pending",
  "agreed",
  "completed",
  "not_sold",
  "withdrawn",
]);

export const contactInputSchema = z.object({
  applicationId: z.string().uuid(),
  channel: z.enum(["phone", "email", "in_person", "other"]),
  summary: z.string().trim().min(1).max(2000),
  occurredAt: z.string().datetime(),
});

export const dealInputSchema = z.object({
  applicationId: z.string().uuid(),
  status: dealStatusSchema,
  selectedBidId: z.string().uuid().nullable(),
});

export const materialChangeInputSchema = z.object({
  applicationId: z.string().uuid(),
  expectedRevisionId: z.string().uuid().nullable(),
  mileageKm: z.number().int().min(0).max(5_000_000).nullable(),
  damageDescription: z.string().trim().max(4000),
  technicalIssues: z.string().trim().max(4000),
  maintenanceDescription: z.string().trim().max(4000),
  keyCount: z.number().int().min(0).max(20).nullable(),
  remarks: z.string().trim().max(4000),
  reason: z.string().trim().min(10).max(1000),
});

export type DealStatus = z.infer<typeof dealStatusSchema>;

export const dealStatusLabels: Record<DealStatus, string> = {
  not_started: "Nog niet gestart",
  discussing: "In bespreking",
  agreement_pending: "Akkoord in behandeling",
  agreed: "Akkoord geregistreerd",
  completed: "Afgehandeld",
  not_sold: "Niet verkocht",
  withdrawn: "Ingetrokken",
};

const transitions: Record<DealStatus, DealStatus[]> = {
  not_started: ["discussing", "not_sold", "withdrawn"],
  discussing: ["agreement_pending", "not_sold", "withdrawn"],
  agreement_pending: ["discussing", "agreed", "not_sold", "withdrawn"],
  agreed: ["completed"],
  completed: [],
  not_sold: [],
  withdrawn: [],
};

export function getAllowedDealStatuses(current: DealStatus): DealStatus[] {
  return [current, ...transitions[current]];
}
