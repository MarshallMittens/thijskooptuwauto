const MAX_BID_CENTS = 10_000_000_000;

export function parseEuroAmountToCents(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d{1,9}(?:\.\d{1,2})?$/.test(normalized)) return null;

  const [euros, decimals = ""] = normalized.split(".");
  const cents = Number(euros) * 100 + Number(decimals.padEnd(2, "0"));
  return cents > 0 && cents <= MAX_BID_CENTS ? cents : null;
}

export function formatEuroCents(cents: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
