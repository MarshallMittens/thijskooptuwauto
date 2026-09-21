import { describe, expect, it } from "vitest";

import { contactInputSchema, getAllowedDealStatuses, materialChangeInputSchema } from "./workflow";

describe("fase-4 workflowvalidatie", () => {
  it("staat niet toe dat een nieuwe afhandeling direct wordt voltooid", () => {
    expect(getAllowedDealStatuses("not_started")).not.toContain("completed");
  });

  it("weigert een te korte reden voor een materiële wijziging", () => {
    expect(materialChangeInputSchema.safeParse({
      applicationId: "40000000-0000-0000-0000-000000000401",
      expectedRevisionId: null,
      mileageKm: 100,
      damageDescription: "",
      technicalIssues: "",
      maintenanceDescription: "",
      keyCount: 2,
      remarks: "",
      reason: "te kort",
    }).success).toBe(false);
  });

  it("weigert een contactmoment in een onbekend kanaal", () => {
    expect(contactInputSchema.safeParse({
      applicationId: "40000000-0000-0000-0000-000000000401",
      channel: "whatsapp",
      summary: "Test",
      occurredAt: new Date().toISOString(),
    }).success).toBe(false);
  });
});
