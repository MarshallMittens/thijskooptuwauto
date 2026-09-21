import { describe, expect, it } from "vitest";

import {
  deriveDraftToken,
  getRateLimitAddress,
  hashDraftToken,
  hashRateLimitAddress,
} from "./public-request-core";

describe("publieke verzoeksbeveiliging", () => {
  it("laat een gewijzigde user-agent de rate-limitidentifier niet omzeilen", () => {
    const first = new Request("https://example.test", {
      headers: { "x-vercel-forwarded-for": "203.0.113.8", "user-agent": "bot/1" },
    });
    const second = new Request("https://example.test", {
      headers: { "x-vercel-forwarded-for": "203.0.113.8", "user-agent": "bot/2" },
    });

    expect(hashRateLimitAddress(getRateLimitAddress(first), "f".repeat(32)))
      .toBe(hashRateLimitAddress(getRateLimitAddress(second), "f".repeat(32)));
  });

  it("geeft verschillende adressen verschillende rate-limitidentifiers", () => {
    const first = new Request("https://example.test", { headers: { "x-vercel-forwarded-for": "203.0.113.8" } });
    const second = new Request("https://example.test", { headers: { "x-vercel-forwarded-for": "203.0.113.9" } });

    expect(hashRateLimitAddress(getRateLimitAddress(first), "f".repeat(32)))
      .not.toBe(hashRateLimitAddress(getRateLimitAddress(second), "f".repeat(32)));
  });

  it("maakt een stabiele capability per willekeurige idempotentiesleutel", () => {
    const secret = "d".repeat(32);
    const first = deriveDraftToken("10000000-0000-0000-0000-000000000001", secret);
    const retry = deriveDraftToken("10000000-0000-0000-0000-000000000001", secret);
    const second = deriveDraftToken("10000000-0000-0000-0000-000000000002", secret);

    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(retry).toBe(first);
    expect(first).not.toBe(second);
    expect(hashDraftToken(first)).not.toBe(first);
  });
});
