import "server-only";

import { getEmailSender } from "@/lib/email/sender";

type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
};

type SupabaseAdminConfig = SupabasePublicConfig & {
  serviceRoleKey: string;
};

type PaymentSimulatorConfig = {
  webhookSecret: string;
};

type OperationsConfig = {
  jobSecret: string;
  deliveryEnabled: boolean;
  resendApiKey: string;
  resendFromEmail: string;
};

export function getSupabasePublicConfig(): SupabasePublicConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Supabase is nog niet ingesteld. Kopieer .env.example naar .env.local en vul de lokale waarden in.",
    );
  }

  return { url, publishableKey };
}

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function getSupabaseAdminConfig(): SupabaseAdminConfig {
  const publicConfig = getSupabasePublicConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is niet ingesteld voor serveropdrachten.");
  }

  return { ...publicConfig, serviceRoleKey };
}

export function getPaymentSimulatorConfig(): PaymentSimulatorConfig {
  if (process.env.PAYMENT_SIMULATOR_ENABLED !== "true") {
    throw new Error("De lokale betaalsimulator is niet ingeschakeld.");
  }
  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
    throw new Error("De testbetaalsimulator is verboden in productie.");
  }
  const webhookSecret = process.env.PAYMENT_SIMULATOR_WEBHOOK_SECRET;
  if (!webhookSecret || webhookSecret.length < 32) {
    throw new Error("PAYMENT_SIMULATOR_WEBHOOK_SECRET moet lokaal minimaal 32 tekens bevatten.");
  }
  return { webhookSecret };
}

export function getOperationsConfig(): OperationsConfig {
  const jobSecret = process.env.OPERATIONS_JOB_SECRET;
  if (!jobSecret || jobSecret.length < 32) throw new Error("OPERATIONS_JOB_SECRET moet minimaal 32 tekens bevatten.");
  const deliveryEnabled = process.env.OUTBOX_DELIVERY_ENABLED === "true";
  const resendApiKey = process.env.RESEND_API_KEY ?? "";
  const resendFromEmail = getEmailSender();
  if (deliveryEnabled && !resendApiKey) {
    throw new Error("Outboxbezorging vereist RESEND_API_KEY.");
  }
  return { jobSecret, deliveryEnabled, resendApiKey, resendFromEmail };
}
