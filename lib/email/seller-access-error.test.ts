import { describe, expect, it } from "vitest";

import { mapSellerAccessEmailError } from "./seller-access-error";

describe("verkopersmailfouten", () => {
  it("maakt een providerlimiet zichtbaar als herstelbare 429", () => {
    expect(mapSellerAccessEmailError({ code: "over_email_send_rate_limit", status: 429 })).toEqual({
      status: 429,
      message: "De e-maildienst heeft tijdelijk te veel berichten verwerkt. Wacht een paar minuten en probeer het opnieuw.",
      retryAfterSeconds: 300,
    });
  });

  it("legt een geweigerd extern adres begrijpelijk uit", () => {
    expect(mapSellerAccessEmailError({ message: "Email address not authorized" })).toEqual({
      status: 503,
      message: "De e-maildienst accepteert dit adres momenteel niet. Neem contact op met Thijs zodat je aanvraag handmatig kan worden gecontroleerd.",
    });
  });

  it("lekt geen onbekende providerfout naar de browser", () => {
    expect(mapSellerAccessEmailError({ message: "smtp_password=gevoelig" })).toEqual({
      status: 503,
      message: "De beveiligde e-mail kon tijdelijk niet worden verstuurd. Probeer het later opnieuw.",
    });
  });
});
