import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.APP_URL;
  if (!baseUrl) return [];
  return ["", "/auto-aanmelden", "/hoe-werkt-het", "/over-ons", "/veelgestelde-vragen", "/contact", "/privacy-en-voorwaarden"].map((path) => ({ url: `${baseUrl}${path}`, changeFrequency: path === "" ? "weekly" : "monthly" }));
}
