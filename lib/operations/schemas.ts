import { z } from "zod";

export const complaintMessageSchema = z.object({
  id: z.string().uuid(),
  authorKind: z.enum(["seller", "dealer", "staff"]),
  body: z.string(),
  createdAt: z.string(),
});

export const complaintEvidenceSchema = z.object({
  id: z.string().uuid(),
  storagePath: z.string(),
  createdAt: z.string(),
  signedUrl: z.string().url().nullable().optional(),
});

export const complaintSchema = z.object({
  id: z.string().uuid(),
  reference: z.string().regex(/^[0-9a-f]{24}$/),
  applicationId: z.string().uuid().optional(),
  paymentOrderId: z.string().uuid().nullable().optional(),
  category: z.string(),
  status: z.string(),
  summary: z.string(),
  complainantKind: z.string().optional(),
  requiresIndependentReview: z.boolean().optional(),
  independentReviewedBy: z.string().uuid().nullable().optional(),
  independentReviewedAt: z.string().nullable().optional(),
  independentReviewNotes: z.string().nullable().optional(),
  resolution: z.string().nullable(),
  resolvedBy: z.string().uuid().nullable().optional(),
  createdAt: z.string(),
  messages: z.array(complaintMessageSchema),
  evidence: z.array(complaintEvidenceSchema),
});

export const complaintsSchema = z.array(complaintSchema);
export type ComplaintState = z.infer<typeof complaintSchema>;

export const operationsDashboardSchema = z.object({
  outbox: z.object({
    pending: z.number(),
    failed: z.number(),
    processing: z.number(),
    deadLetter: z.number(),
    oldestDueAt: z.string().nullable(),
  }),
  complaints: z.object({ open: z.number(), independentReviewRequired: z.number() }),
  incidents: z.array(z.object({
    id: z.string().uuid(), severity: z.string(), status: z.string(), summary: z.string(),
    impact: z.string(), resolution: z.string().nullable(), createdAt: z.string(),
  })),
  lastReconciliation: z.object({
    id: z.string().uuid(), status: z.string(), checkedCount: z.number(), mismatchCount: z.number(), completedAt: z.string().nullable(),
  }).nullable(),
  lastOutboxRun: z.object({
    id: z.string().uuid(), status: z.string(), processedCount: z.number(), failedCount: z.number(), completedAt: z.string().nullable(),
  }).nullable(),
  lastRecoveryTest: z.object({
    id: z.string().uuid(), status: z.string(), databaseRestored: z.boolean(), storageRestored: z.boolean(),
    tableCount: z.number(), objectCount: z.number(), completedAt: z.string(),
  }).nullable(),
  testInvoices: z.array(z.object({
    id: z.string().uuid(), paymentOrderId: z.string().uuid(), documentType: z.string(), documentNumber: z.string(),
    status: z.string(), reason: z.string(), createdAt: z.string(),
  })),
});

export type OperationsDashboard = z.infer<typeof operationsDashboardSchema>;
