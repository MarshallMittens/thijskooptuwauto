import { createHash, createHmac } from "node:crypto";

export function getRateLimitAddress(request: Request) {
  return request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "local";
}

export function hashRateLimitAddress(address: string, secret: string) {
  return createHmac("sha256", secret).update(address).digest("hex");
}

export function deriveDraftToken(idempotencyKey: string, secret: string) {
  return createHmac("sha256", secret).update(idempotencyKey).digest("hex");
}

export function hashDraftToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
