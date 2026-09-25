import { describe, expect, it } from "vitest";

import { getAllowedApplicationTransitions } from "./application-status";

describe("aanvraagstatusovergangen", () => {
  it("vereist controle voordat een nieuwe aanvraag gereed kan worden gezet", () => {
    expect(getAllowedApplicationTransitions("submitted")).toEqual([
      "in_review",
      "needs_information",
      "withdrawn",
    ]);
    expect(getAllowedApplicationTransitions("submitted")).not.toContain("ready");
  });

  it("staat gereed toe vanuit in controle", () => {
    expect(getAllowedApplicationTransitions("in_review")).toContain("ready");
  });

  it("toont geen acties voor eindstatussen of onbekende waarden", () => {
    expect(getAllowedApplicationTransitions("withdrawn")).toEqual([]);
    expect(getAllowedApplicationTransitions("closed")).toEqual([]);
    expect(getAllowedApplicationTransitions("onbekend")).toEqual([]);
  });
});
