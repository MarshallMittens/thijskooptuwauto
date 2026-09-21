import { describe, expect, it } from "vitest";

import { resolveAppUrl } from "./app-url";

describe("resolveAppUrl", () => {
  it("normaliseert een ingestelde origin", () => {
    expect(resolveAppUrl("https://voorbeeld.nl/", "production")).toBe(
      "https://voorbeeld.nl",
    );
  });

  it("staat alleen lokaal een ontwikkelstandaard toe", () => {
    expect(resolveAppUrl(undefined, "development")).toBe(
      "http://127.0.0.1:3000",
    );
    expect(() => resolveAppUrl(undefined, "production")).toThrow(/verplicht/);
  });

  it.each([
    "javascript:alert(1)",
    "https://user:pass@voorbeeld.nl",
    "https://voorbeeld.nl/subpad",
    "https://voorbeeld.nl?omgeving=fout",
  ])("weigert een ongeldige applicatie-origin: %s", (value) => {
    expect(() => resolveAppUrl(value, "production")).toThrow();
  });
});
