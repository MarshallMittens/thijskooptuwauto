import { describe, expect, it } from "vitest";

import { formatEuroCents, parseEuroAmountToCents } from "./amount";

describe("biedbedragen", () => {
  it("zet Nederlandse en internationale decimalen exact om naar centen", () => {
    expect(parseEuroAmountToCents("12500")).toBe(1_250_000);
    expect(parseEuroAmountToCents("12500,50")).toBe(1_250_050);
    expect(parseEuroAmountToCents("12500.5")).toBe(1_250_050);
  });

  it("weigert nul, negatieve, te precieze en buitensporige bedragen", () => {
    expect(parseEuroAmountToCents("0")).toBeNull();
    expect(parseEuroAmountToCents("-1")).toBeNull();
    expect(parseEuroAmountToCents("10,999")).toBeNull();
    expect(parseEuroAmountToCents("100000001")).toBeNull();
  });

  it("formatteert gehele centen als eurobedrag", () => {
    expect(formatEuroCents(1_250_050)).toContain("12.500,50");
  });
});
