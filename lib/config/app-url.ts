export function resolveAppUrl(
  configuredValue: string | undefined,
  environment: string | undefined,
) {
  if (!configuredValue) {
    if (environment === "development" || environment === "test") {
      return "http://127.0.0.1:3000";
    }
    throw new Error("APP_URL is verplicht buiten de lokale ontwikkelomgeving.");
  }

  const parsed = new URL(configuredValue);
  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error("APP_URL moet een geldige http(s)-origin zonder pad zijn.");
  }

  return parsed.origin;
}

export function getAppUrl() {
  return resolveAppUrl(
    process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL,
    process.env.NODE_ENV,
  );
}
