const INTERNAL_ORIGIN = "https://internal.invalid";

export function getSafeInternalPath(
  candidate: FormDataEntryValue | string | null | undefined,
  fallback: string,
) {
  if (typeof candidate !== "string" || candidate !== candidate.trim()) {
    return fallback;
  }

  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  try {
    const decoded = decodeURIComponent(candidate);
    if (decoded.includes("\\") || decoded.startsWith("//")) return fallback;

    const parsed = new URL(candidate, INTERNAL_ORIGIN);
    if (parsed.origin !== INTERNAL_ORIGIN) return fallback;

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
