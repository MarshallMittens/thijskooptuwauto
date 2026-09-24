import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const rules = { userAgent: "*", allow: "/", disallow: ["/beheer/", "/dealer/", "/auth/", "/api/", "/inloggen", "/registreren", "/mijn-aanvraag"] };
  return process.env.APP_URL ? { rules, sitemap: `${process.env.APP_URL}/sitemap.xml` } : { rules };
}
