import { describe, expect, it } from "vitest";

import {
  canAccessDealerPortal,
  canBid,
  canManageCompanies,
  getDefaultPortalPath,
  type AccessContext,
} from "./access";

const base: AccessContext = {
  userId: "user-1",
  isStaff: false,
  staffRole: null,
  canUseDealerPortal: false,
  companyId: "company-1",
  companyStatus: "pending",
};

describe("toegangsregels", () => {
  it.each(["pending", "blocked", null] as const)("weigert bedrijven met status %s", (companyStatus) => {
    expect(canAccessDealerPortal({ ...base, companyStatus })).toBe(false);
    expect(canBid({ ...base, companyStatus })).toBe(false);
  });

  it("geeft een ingelogd goedgekeurd bedrijf direct toegang tot het dealerportaal", () => {
    expect(
      canAccessDealerPortal({
        ...base,
        companyStatus: "approved",
      }),
    ).toBe(true);
    expect(canBid({ ...base, companyStatus: "approved" })).toBe(true);
  });

  it("vereist een bedrijf voor dealertoegang en bieden", () => {
    const context = { ...base, companyId: null, companyStatus: "approved" as const };
    expect(canAccessDealerPortal(context)).toBe(false);
    expect(canBid(context)).toBe(false);
  });

  it("laat een beheeridentiteit nooit als dealer bieden", () => {
    expect(
      canBid({
        ...base,
        companyStatus: "approved",
        isStaff: true,
        staffRole: "admin",
      }),
    ).toBe(false);
  });

  it("laat uitsluitend een expliciet bevoegde platformadmin ook als dealer werken", () => {
    expect(
      canBid({
        ...base,
        companyStatus: "approved",
        isStaff: true,
        staffRole: "admin",
        canUseDealerPortal: true,
      }),
    ).toBe(true);

    expect(
      canBid({
        ...base,
        companyStatus: "approved",
        isStaff: true,
        staffRole: "operator",
        canUseDealerPortal: false,
      }),
    ).toBe(false);
  });

  it("geeft alleen een ingelogde staff-admin toegang tot bedrijfsgoedkeuring", () => {
    const admin = { ...base, isStaff: true, staffRole: "admin" as const };
    expect(canManageCompanies(admin)).toBe(true);
    expect(canManageCompanies({ ...admin, isStaff: false })).toBe(false);
    expect(canManageCompanies(base)).toBe(false);
    expect(
      canManageCompanies({
        ...admin,
        staffRole: "operator",
      }),
    ).toBe(false);
  });

  it("stuurt een beheerder na algemeen inloggen naar beheer", () => {
    expect(getDefaultPortalPath({ isStaff: true })).toBe("/beheer");
    expect(getDefaultPortalPath({ isStaff: false })).toBe("/dealer");
    expect(getDefaultPortalPath(null)).toBe("/dealer");
  });
});
