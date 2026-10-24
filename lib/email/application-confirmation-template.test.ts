import { describe, expect, it } from "vitest";
import { buildApplicationConfirmationEmail, type ApplicationConfirmationDetails } from "./application-confirmation-template";

const details: ApplicationConfirmationDetails = {
  fullName: "Voorbeeld Verkoper", reference: "fictieve-aanvraag",
  vehicle: { registration: "12AB34", make: "VOLKSWAGEN", model: "Golf", variant: "Comfortline", year: 2021, fuelType: "Benzine", color: "GRIJS" },
  mileageKm: 85000, keyCount: 2,
};

describe("bevestigingsmail voor particuliere autoaanmelding", () => {
  it("bevat de aangeleverde banner, autogegevens, kenteken en afsluiting namens Thijs", () => {
    const result = buildApplicationConfirmationEmail(details, "https://acceptatie.example.test");
    expect(result.html).toContain('src="https://acceptatie.example.test/emails/bedankt-autoaanmelding.png"');
    expect(result.subject).toContain("12-AB-34");
    for (const value of ["Voorbeeld Verkoper", "12-AB-34", "VOLKSWAGEN", "Golf", "Comfortline", "2021", "Benzine", "GRIJS", "85.000 km", "Thijs Bongers", "info@thijskooptuwauto.nl"]) {
      expect(result.html).toContain(value);
      expect(result.text).toContain(value);
    }
    expect(result.html).not.toContain("/mijn-aanvraag");
    expect(result.html).not.toContain("/auth/");
    expect(result.text).toContain("Je hoeft niets meer te bevestigen");
  });

  it("maakt ingevulde tekst onschadelijk in de HTML", () => {
    const result = buildApplicationConfirmationEmail({ ...details, fullName: '<script>alert("x")</script>', vehicle: { ...details.vehicle, model: 'Golf <img src=x onerror="alert(1)">' } }, "https://acceptatie.example.test");
    expect(result.html).not.toContain("<script>");
    expect(result.html).not.toContain("<img src=x");
    expect(result.html).toContain("&lt;script&gt;");
    expect(result.html).toContain("&lt;img src=x");
  });

  it("laat onbekende velden weg, maar behoudt nul kilometer en nul sleutels", () => {
    const result = buildApplicationConfirmationEmail({ ...details, vehicle: { ...details.vehicle, variant: null, year: null, color: null }, mileageKm: 0, keyCount: 0 }, "https://acceptatie.example.test");
    expect(result.text).not.toContain("Uitvoering:");
    expect(result.text).not.toContain("Bouwjaar:");
    expect(result.text).not.toContain("Kleur:");
    expect(result.text).toContain("Kilometerstand: 0 km");
    expect(result.text).toContain("Aantal sleutels: 0");
    expect(result.html).not.toContain("undefined");
  });
});
