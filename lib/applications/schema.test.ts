import { describe, expect, it } from "vitest";

import { applicationPayloadSchema, formatRegistration } from "./schema";

const validPayload = {
  vehicle: {
    registration: "12-ab-34",
    make: "Volvo",
    model: "V60",
    variant: "",
    year: 2020,
    fuelType: "Benzine",
    color: "Blauw",
    vehicleType: "Personenauto",
  },
  condition: {
    mileageKm: 85000,
    damageDescription: "",
    technicalIssues: "",
    maintenanceDescription: "Dealeronderhouden",
    keyCount: 2,
    remarks: "",
  },
  seller: {
    fullName: "Test Persoon",
    email: "test@example.test",
    phone: "0612345678",
    postalCode: "1234 ab",
    desiredSaleDate: "",
  },
};

describe("applicationPayloadSchema", () => {
  it("normaliseert kenteken en postcode", () => {
    const result = applicationPayloadSchema.parse(validPayload);
    expect(result.vehicle.registration).toBe("12AB34");
    expect(result.seller.postalCode).toBe("1234AB");
  });

  it("toont gangbare Nederlandse kentekens met streepjes", () => {
    expect(formatRegistration("345435")).toBe("34-54-35");
    expect(formatRegistration("K556TF")).toBe("K-556-TF");
    expect(formatRegistration("12AB34")).toBe("12-AB-34");
    expect(formatRegistration("AB1234")).toBe("AB-12-34");
  });

  it("accepteert handmatig ingevulde voertuiggegevens", () => {
    expect(applicationPayloadSchema.safeParse(validPayload).success).toBe(true);
  });

  it("weigert onbegrensde vrije tekst", () => {
    const result = applicationPayloadSchema.safeParse({
      ...validPayload,
      condition: { ...validPayload.condition, remarks: "x".repeat(2001) },
    });
    expect(result.success).toBe(false);
  });
});
