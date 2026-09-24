import { describe, expect, it } from "vitest";

import { sellerUpdateSchema } from "./schema";

const valid = {
  applicationId: "10000000-0000-0000-0000-000000000001",
  mileageKm: "125000",
  keyCount: "2",
  damageDescription: "Kleine kras linksachter",
  technicalIssues: "",
  maintenanceDescription: "Onderhouden",
  remarks: "",
  desiredSaleDate: "2026-10-01",
};

describe("verkopersaanvulling", () => {
  it("normaliseert geldige numerieke velden", () => {
    const parsed = sellerUpdateSchema.parse(valid);
    expect(parsed.mileageKm).toBe(125000);
    expect(parsed.keyCount).toBe(2);
  });

  it("weigert ongeldige kilometerstanden en datums", () => {
    expect(sellerUpdateSchema.safeParse({ ...valid, mileageKm: -1 }).success).toBe(false);
    expect(sellerUpdateSchema.safeParse({ ...valid, desiredSaleDate: "morgen" }).success).toBe(false);
  });
});
