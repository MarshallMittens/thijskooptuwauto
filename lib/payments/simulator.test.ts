import { describe, expect, it } from "vitest";

import { signSimulatedWebhook, verifySimulatedWebhook } from "./webhook-signature";

describe("lokale betaalwebhook", () => {
  const secret = "uitsluitend-een-lang-fictief-testgeheim-123456";
  const body = JSON.stringify({ id: "test_evt_1" });
  const timestamp = 1_800_000_000;

  it("accepteert dezelfde inhoud, tijd en handtekening", () => {
    expect(verifySimulatedWebhook(body, String(timestamp), signSimulatedWebhook(body, timestamp, secret), secret, timestamp)).toBe(true);
  });

  it("weigert gewijzigde inhoud", () => {
    expect(verifySimulatedWebhook(`${body} `, String(timestamp), signSimulatedWebhook(body, timestamp, secret), secret, timestamp)).toBe(false);
  });

  it("weigert een te oud bericht", () => {
    expect(verifySimulatedWebhook(body, String(timestamp), signSimulatedWebhook(body, timestamp, secret), secret, timestamp + 301)).toBe(false);
  });

  it("weigert een ontbrekende of verkeerde handtekening", () => {
    expect(verifySimulatedWebhook(body, String(timestamp), null, secret, timestamp)).toBe(false);
    expect(verifySimulatedWebhook(body, String(timestamp), "v1=00", secret, timestamp)).toBe(false);
  });
});
