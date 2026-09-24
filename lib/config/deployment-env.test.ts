import { describe, expect, it } from "vitest";

import { getVercelDeploymentEnvironmentErrors } from "./deployment-env";

const validPreviewEnvironment = {
  VERCEL: "1",
  VERCEL_ENV: "preview",
  APP_URL: "https://test-thijskooptuauto.vercel.app",
  NEXT_PUBLIC_SUPABASE_URL: "https://acceptatievoorbeeld.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_fictieve_testwaarde",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-fictief-12345678901234567890",
  DRAFT_TOKEN_SECRET: "draft-fictief-123456789012345678901234",
  REQUEST_FINGERPRINT_SECRET: "fingerprint-fictief-1234567890123456789",
  OPERATIONS_JOB_SECRET: "operations-fictief-123456789012345678901",
  PAYMENT_SIMULATOR_ENABLED: "false",
  OUTBOX_DELIVERY_ENABLED: "false",
  PRODUCTION_DEPLOYMENT_APPROVED: "false",
};

describe("Vercel-omgevingscontrole", () => {
  it("accepteert een afgescheiden previewconfiguratie", () => {
    expect(getVercelDeploymentEnvironmentErrors(validPreviewEnvironment)).toEqual([]);
  });

  it("doet lokaal niets", () => {
    expect(getVercelDeploymentEnvironmentErrors({})).toEqual([]);
  });

  it("weigert localhost en een actieve betaalsimulator", () => {
    const errors = getVercelDeploymentEnvironmentErrors({
      ...validPreviewEnvironment,
      APP_URL: "http://127.0.0.1:3000",
      PAYMENT_SIMULATOR_ENABLED: "true",
    });
    expect(errors).toContain("APP_URL moet een HTTPS-origin zonder pad, query of inloggegevens zijn.");
    expect(errors).toContain("APP_URL mag bij een Vercel-deployment niet naar de lokale computer wijzen.");
    expect(errors).toContain("PAYMENT_SIMULATOR_ENABLED moet op Vercel uitgeschakeld blijven.");
  });

  it("weigert ontbrekende, korte en hergebruikte geheimen", () => {
    const errors = getVercelDeploymentEnvironmentErrors({
      ...validPreviewEnvironment,
      DRAFT_TOKEN_SECRET: "te-kort",
      REQUEST_FINGERPRINT_SECRET: "te-kort",
      OPERATIONS_JOB_SECRET: "<vul-in>",
    });
    expect(errors.some((error) => error.startsWith("DRAFT_TOKEN_SECRET moet"))).toBe(true);
    expect(errors.some((error) => error.includes("moeten verschillende waarden hebben"))).toBe(true);
    expect(errors.some((error) => error.startsWith("OPERATIONS_JOB_SECRET ontbreekt"))).toBe(true);
  });

  it("blokkeert productie zonder afzonderlijke goedkeuring", () => {
    const errors = getVercelDeploymentEnvironmentErrors({
      ...validPreviewEnvironment,
      VERCEL_ENV: "production",
    });
    expect(errors).toContain(
      "Productiedeployment is geblokkeerd totdat PRODUCTION_DEPLOYMENT_APPROVED expliciet true is.",
    );
  });
});
