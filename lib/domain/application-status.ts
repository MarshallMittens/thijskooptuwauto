export const applicationStatuses = [
  "draft",
  "submitted",
  "in_review",
  "needs_information",
  "ready",
  "withdrawn",
  "closed",
] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  draft: "Concept",
  submitted: "Nieuw",
  in_review: "In controle",
  needs_information: "Informatie nodig",
  ready: "Gereed",
  withdrawn: "Ingetrokken",
  closed: "Gesloten",
};

const transitions: Record<ApplicationStatus, readonly ApplicationStatus[]> = {
  draft: [],
  submitted: ["in_review", "needs_information", "withdrawn"],
  in_review: ["needs_information", "ready", "withdrawn", "closed"],
  needs_information: ["in_review", "withdrawn"],
  ready: ["in_review", "closed", "withdrawn"],
  withdrawn: [],
  closed: [],
};

export function getAllowedApplicationTransitions(status: string): readonly ApplicationStatus[] {
  return applicationStatuses.includes(status as ApplicationStatus)
    ? transitions[status as ApplicationStatus]
    : [];
}
