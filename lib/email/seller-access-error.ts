type SellerAccessEmailError = {
  code?: string;
  message?: string;
  status?: number;
};

export type SellerAccessEmailFailure = {
  status: 429 | 503;
  message: string;
  retryAfterSeconds?: number;
};

export function mapSellerAccessEmailError(error: SellerAccessEmailError): SellerAccessEmailFailure {
  const code = error.code?.toLowerCase() ?? "";
  const message = error.message?.toLowerCase() ?? "";
  const rateLimited = error.status === 429
    || code.includes("rate_limit")
    || message.includes("rate limit");

  if (rateLimited) {
    return {
      status: 429,
      message: "De e-maildienst heeft tijdelijk te veel berichten verwerkt. Wacht een paar minuten en probeer het opnieuw.",
      retryAfterSeconds: 300,
    };
  }

  const providerRejected = code.includes("email_address_not_authorized")
    || message.includes("email address not authorized")
    || message.includes("not authorized");

  return {
    status: 503,
    message: providerRejected
      ? "De e-maildienst accepteert dit adres momenteel niet. Neem contact op met Thijs zodat je aanvraag handmatig kan worden gecontroleerd."
      : "De beveiligde e-mail kon tijdelijk niet worden verstuurd. Probeer het later opnieuw.",
  };
}
