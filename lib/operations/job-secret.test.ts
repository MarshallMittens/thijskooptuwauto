import { describe, expect, it } from "vitest";

import { verifyJobSecret } from "./job-secret";

describe("verifyJobSecret", () => {
  const secret = "a".repeat(32);
  it("accepteert alleen exact hetzelfde geheim", () => expect(verifyJobSecret(secret, secret)).toBe(true));
  it("weigert ontbrekend, ander en afwijkend lang geheim", () => {
    expect(verifyJobSecret(null, secret)).toBe(false);
    expect(verifyJobSecret("b".repeat(32), secret)).toBe(false);
    expect(verifyJobSecret("a".repeat(31), secret)).toBe(false);
  });
});
