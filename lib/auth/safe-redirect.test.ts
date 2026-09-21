import { describe, expect, it } from "vitest";

import { getSafeInternalPath } from "./safe-redirect";

describe("getSafeInternalPath", () => {
  it("behoudt een intern pad met query en fragment", () => {
    expect(getSafeInternalPath("/dealer?tab=biedingen#actief", "/dealer")).toBe(
      "/dealer?tab=biedingen#actief",
    );
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/%5cevil.example",
    "/%2f%2fevil.example",
    " /dealer",
    "%2Fdealer",
  ])("weigert een onveilig redirectdoel: %s", (candidate) => {
    expect(getSafeInternalPath(candidate, "/dealer")).toBe("/dealer");
  });

  it("gebruikt de fallback voor ontbrekende invoer", () => {
    expect(getSafeInternalPath(null, "/dealer")).toBe("/dealer");
  });
});
