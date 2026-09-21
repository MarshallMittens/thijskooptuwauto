import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

function requiredSecret(name: "REQUEST_FINGERPRINT_SECRET" | "DRAFT_TOKEN_SECRET") {
  const value = process.env[name];
  if (!value || value.length < 32) {
    throw new Error(`${name} moet minimaal 32 tekens bevatten.`);
  }
  return value;
}

export function createActorKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwardedFor || request.headers.get("x-real-ip") || "local";
  const userAgent = request.headers.get("user-agent")?.slice(0, 300) || "unknown";
  return createHmac("sha256", requiredSecret("REQUEST_FINGERPRINT_SECRET"))
    .update(`${address}\n${userAgent}`)
    .digest("hex");
}

export function createDraftToken(actorKey: string, idempotencyKey: string) {
  return createHmac("sha256", requiredSecret("DRAFT_TOKEN_SECRET"))
    .update(`${actorKey}\n${idempotencyKey}`)
    .digest("hex");
}

export function hashDraftToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function tokensMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
