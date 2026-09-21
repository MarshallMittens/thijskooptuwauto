import { createHash } from "node:crypto";
import sharp from "sharp";

import { ACCEPTED_PHOTO_TYPES, MAX_PHOTO_BYTES } from "../applications/schema";

const formatsByMime = new Map<string, string>([
  ["image/jpeg", "jpeg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export type ProcessedPhoto = {
  data: Buffer;
  mediaType: "image/jpeg";
  sizeBytes: number;
  sha256: string;
};

export async function inspectAndNormalizePhoto(
  data: ArrayBuffer | Buffer,
  claimedType: string,
): Promise<ProcessedPhoto> {
  if (!ACCEPTED_PHOTO_TYPES.includes(claimedType as (typeof ACCEPTED_PHOTO_TYPES)[number])) {
    throw new Error("unsupported_photo_type");
  }

  const input = Buffer.isBuffer(data) ? data : Buffer.from(data);
  if (input.length < 1 || input.length > MAX_PHOTO_BYTES) throw new Error("invalid_photo_size");

  const pipeline = sharp(input, { failOn: "error", limitInputPixels: 40_000_000 });
  const metadata = await pipeline.metadata();
  if (!metadata.format || formatsByMime.get(claimedType) !== metadata.format) {
    throw new Error("photo_content_mismatch");
  }

  const normalized = await pipeline
    .rotate()
    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
  if (normalized.length > MAX_PHOTO_BYTES) throw new Error("normalized_photo_too_large");

  return {
    data: normalized,
    mediaType: "image/jpeg",
    sizeBytes: normalized.length,
    sha256: createHash("sha256").update(normalized).digest("hex"),
  };
}
