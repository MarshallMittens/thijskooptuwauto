import { describe, expect, it } from "vitest";

import { passwordUpdateSchema, recoveryEmailSchema } from "./validation";

describe("authvalidatie", () => {
  it("accepteert een geldig hersteladres", () => {
    expect(recoveryEmailSchema.safeParse({ email: "dealer@example.test" }).success).toBe(true);
  });

  it("weigert een ongeldig hersteladres", () => {
    expect(recoveryEmailSchema.safeParse({ email: "geen-adres" }).success).toBe(false);
  });

  it("vereist een lang en gelijk bevestigd nieuw wachtwoord", () => {
    expect(
      passwordUpdateSchema.safeParse({
        password: "veilig-testwachtwoord",
        confirmation: "veilig-testwachtwoord",
      }).success,
    ).toBe(true);
    expect(
      passwordUpdateSchema.safeParse({
        password: "veilig-testwachtwoord",
        confirmation: "ander-testwachtwoord",
      }).success,
    ).toBe(false);
    expect(
      passwordUpdateSchema.safeParse({ password: "te-kort", confirmation: "te-kort" }).success,
    ).toBe(false);
  });
});
