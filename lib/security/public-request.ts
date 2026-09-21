import "server-only";

import {
  deriveDraftToken,
  getRateLimitAddress,
  hashRateLimitAddress,
} from "@/lib/security/public-request-core";

export { hashDraftToken } from "@/lib/security/public-request-core";

function requiredSecret(name: "REQUEST_FINGERPRINT_SECRET" | "DRAFT_TOKEN_SECRET") {
  const value = process.env[name];
  if (!value || value.length < 32) {
    throw new Error(`${name} moet minimaal 32 tekens bevatten.`);
  }
  return value;
}

export function createRateLimitActorKey(request: Request) {
  return hashRateLimitAddress(getRateLimitAddress(request), requiredSecret("REQUEST_FINGERPRINT_SECRET"));
}

export function createDraftToken(idempotencyKey: string) {
  return deriveDraftToken(idempotencyKey, requiredSecret("DRAFT_TOKEN_SECRET"));
}
