import { describe, expect, it } from "vitest";

import {
  canAccessDealerPortal,
  canBid,
  canManageCompanies,
  type AccessContext,
} from "./access";

const base: AccessContext = {
  userId: "user-1",
  assuranceLevel: "aal1",
  isStaff: false,
  staffRole: null,
  companyId: "company-1",
  companyStatus: "pending",
};

describe("toegangsregels", () => {
  it("weigert pending en geblokkeerde bedrijven", () => {
    expect(canAccessDealerPortal(base)).toBe(false);
    expect(canBid({ ...base, companyStatus: "blocked" })).toBe(false);
  });

  it("vereist een goedgekeurd bedrijf en MFA voor het dealerportaal", () => {
    expect(canAccessDealerPortal({ ...base, companyStatus: "approved" })).toBe(false);
    expect(
      canAccessDealerPortal({
        ...base,
        companyStatus: "approved",
        assuranceLevel: "aal2",
      }),
    ).toBe(true);
  });

  it("laat een beheeridentiteit nooit als dealer bieden", () => {
    expect(
      canBid({
        ...base,
        companyStatus: "approved",
        assuranceLevel: "aal2",
        isStaff: true,
        staffRole: "admin",
      }),
    ).toBe(false);
  });

  it("vereist admin én aal2 voor bedrijfsgoedkeuring", () => {
    const admin = { ...base, isStaff: true, staffRole: "admin" as const };
    expect(canManageCompanies(admin)).toBe(false);
    expect(
      canManageCompanies({ ...admin, assuranceLevel: "aal2" }),
    ).toBe(true);
    expect(
      canManageCompanies({
        ...admin,
        assuranceLevel: "aal2",
        staffRole: "operator",
      }),
    ).toBe(false);
  });
});
