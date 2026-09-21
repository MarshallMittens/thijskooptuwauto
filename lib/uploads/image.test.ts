import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { inspectAndNormalizePhoto } from "./image";

describe("inspectAndNormalizePhoto", () => {
  it("controleert de inhoud en verwijdert metadata door hercodering", async () => {
    const input = await sharp({
      create: { width: 20, height: 10, channels: 3, background: "#1554d1" },
    }).withMetadata({ orientation: 6 }).png().toBuffer();

    const result = await inspectAndNormalizePhoto(input, "image/png");
    const metadata = await sharp(result.data).metadata();
    expect(result.mediaType).toBe("image/jpeg");
    expect(metadata.format).toBe("jpeg");
    expect(metadata.exif).toBeUndefined();
    expect(result.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("weigert een bestand waarvan inhoud en opgegeven type verschillen", async () => {
    const input = await sharp({
      create: { width: 10, height: 10, channels: 3, background: "white" },
    }).png().toBuffer();
    await expect(inspectAndNormalizePhoto(input, "image/jpeg")).rejects.toThrow("photo_content_mismatch");
  });
});
