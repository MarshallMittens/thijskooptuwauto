import { z } from "zod";

export const paymentHandoverSchema = z.object({
  sellerConfirmedAt: z.string().nullable(),
  dealerConfirmedAt: z.string().nullable(),
  verifiedAt: z.string().nullable(),
});

export const dealerPaymentCaseSchema = z.object({
  agreementId: z.string().uuid(),
  applicationId: z.string().uuid(),
  agreedPriceCents: z.number(),
  vehicle: z.object({
    registration: z.string(), make: z.string().nullable(), model: z.string().nullable(),
    variant: z.string().nullable(), year: z.number().nullable(),
  }).passthrough(),
  onboardingStatus: z.string(),
  payment: z.object({
    id: z.string().uuid(), status: z.string(), vehicleAmountCents: z.number(), platformFeeCents: z.number(),
    feeConfigurationStatus: z.string(), buyerChargeCents: z.number(), sellerPayoutCents: z.number(),
    receivedCents: z.number(), refundedCents: z.number(), currency: z.string(), providerPaymentReference: z.string(),
    handover: paymentHandoverSchema,
  }).nullable(),
});

export const dealerPaymentCasesSchema = z.array(dealerPaymentCaseSchema);

export const sellerPaymentStateSchema = z.object({
  simulatorEnabled: z.boolean(),
  agreementStatus: z.string().nullable(),
  onboarding: z.object({ id: z.string().uuid(), status: z.string(), verifiedAt: z.string().nullable() }).nullable(),
  payment: z.object({
    id: z.string().uuid(), status: z.string(), vehicleAmountCents: z.number(), platformFeeCents: z.number(),
    feeConfigurationStatus: z.string(), sellerPayoutCents: z.number(), receivedCents: z.number(),
    refundedCents: z.number(), currency: z.string(), handover: paymentHandoverSchema,
  }).nullable(),
});

export type SellerPaymentState = z.infer<typeof sellerPaymentStateSchema>;

export const adminPaymentStateSchema = z.object({
  simulatorEnabled: z.boolean(),
  onboarding: z.object({ id: z.string().uuid(), status: z.string(), verified_at: z.string().nullable() }).passthrough().nullable(),
  payment: z.object({
    id: z.string().uuid(), status: z.string(), vehicle_amount_cents: z.number(), platform_fee_cents: z.number(),
    fee_configuration_status: z.string(), buyer_charge_cents: z.number(), seller_payout_cents: z.number(),
    received_cents: z.number(), refunded_cents: z.number(), currency: z.string(), provider_payment_reference: z.string(), recipient_reference: z.string(),
  }).passthrough().nullable(),
  handover: z.object({ seller_confirmed_at: z.string().nullable(), dealer_confirmed_at: z.string().nullable(), vrijwaring_verified_at: z.string().nullable() }).passthrough().nullable(),
  events: z.array(z.object({ id: z.string().uuid(), eventType: z.string(), amountCents: z.number().nullable(), occurredAt: z.string() })),
  refunds: z.array(z.object({ id: z.string().uuid(), amountCents: z.number(), status: z.string(), reason: z.string(), createdAt: z.string() })),
  lastReconciliation: z.object({ id: z.string().uuid(), status: z.string(), checkedCount: z.number(), mismatchCount: z.number(), completedAt: z.string().nullable() }).nullable(),
});

export type AdminPaymentState = z.infer<typeof adminPaymentStateSchema>;
