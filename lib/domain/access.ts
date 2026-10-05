export const companyStatuses = ["pending", "approved", "blocked"] as const;
export type CompanyStatus = (typeof companyStatuses)[number];

export type AccessContext = {
  userId: string;
  assuranceLevel: "aal1" | "aal2";
  isStaff: boolean;
  staffRole: "admin" | "operator" | null;
  canUseDealerPortal: boolean;
  companyId: string | null;
  companyStatus: CompanyStatus | null;
};

export function canAccessDealerPortal(context: AccessContext) {
  return (
    (!context.isStaff || context.canUseDealerPortal) &&
    context.assuranceLevel === "aal2" &&
    context.companyStatus === "approved" &&
    Boolean(context.companyId)
  );
}

export function canManageCompanies(context: AccessContext) {
  return (
    context.isStaff &&
    context.staffRole === "admin" &&
    context.assuranceLevel === "aal2"
  );
}

export function canBid(context: AccessContext) {
  return canAccessDealerPortal(context);
}

export function getDefaultPortalPath(
  context: Pick<AccessContext, "isStaff"> | null,
) {
  return context?.isStaff ? "/beheer" : "/dealer";
}
