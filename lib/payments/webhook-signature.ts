import { createHmac, timingSafeEqual } from "node:crypto";

export function signSimulatedWebhook(rawBody: string, timestamp: number, secret: string) {
  return `v1=${createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex")}`;
}

export function verifySimulatedWebhook(rawBody: string, timestampHeader: string | null, signatureHeader: string | null, secret: string, nowSeconds = Math.floor(Date.now() / 1000)) {
  const timestamp = Number(timestampHeader);
  if (!Number.isInteger(timestamp) || Math.abs(nowSeconds - timestamp) > 300 || !signatureHeader?.startsWith("v1=")) return false;
  const expected = signSimulatedWebhook(rawBody, timestamp, secret);
  const suppliedBuffer = Buffer.from(signatureHeader);
  const expectedBuffer = Buffer.from(expected);
  return suppliedBuffer.length === expectedBuffer.length && timingSafeEqual(suppliedBuffer, expectedBuffer);
}
