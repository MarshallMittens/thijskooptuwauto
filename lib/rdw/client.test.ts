import { describe, expect, it, vi } from "vitest";

import { lookupRdwVehicle } from "./client";

describe("lookupRdwVehicle", () => {
  it("mapt uitsluitend gedocumenteerde RDW-velden", async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();
      return url.includes("8ys7-d773")
        ? new Response(JSON.stringify([
            { kenteken: "12AB34", brandstof_volgnummer: "1", brandstof_omschrijving: "Benzine" },
            { kenteken: "12AB34", brandstof_volgnummer: "2", brandstof_omschrijving: "Elektriciteit" },
          ]), { status: 200 })
        : new Response(JSON.stringify([{
            kenteken: "12AB34",
            voertuigsoort: "Personenauto",
            merk: "VOLVO",
            handelsbenaming: "V60",
            variant: "ZONDER-UITVOERING",
            uitvoering: "PLUS",
            datum_eerste_toelating: "20200312",
            eerste_kleur: "BLAUW",
          }]), { status: 200 });
    });

    const result = await lookupRdwVehicle("12-ab-34", fetcher as typeof fetch);
    expect(result).toMatchObject({
      registration: "12AB34",
      make: "VOLVO",
      model: "V60",
      variant: "PLUS",
      year: 2020,
      fuelType: "Benzine / Elektriciteit",
      color: "BLAUW",
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("geeft null terug wanneer het kenteken niet voorkomt", async () => {
    const fetcher = vi.fn(async () => new Response("[]", { status: 200 }));
    await expect(lookupRdwVehicle("12AB34", fetcher as typeof fetch)).resolves.toBeNull();
  });

  it("houdt de basisgegevens bruikbaar als de brandstoftabel niet bereikbaar is", async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      if (input.toString().includes("8ys7-d773")) throw new Error("timeout");
      return new Response(JSON.stringify([{
        kenteken: "12AB34",
        merk: "VOLVO",
        handelsbenaming: "V60",
        variant: "B4",
      }]), { status: 200 });
    });

    await expect(lookupRdwVehicle("12AB34", fetcher as typeof fetch)).resolves.toMatchObject({
      make: "VOLVO",
      model: "V60",
      variant: "B4",
      fuelType: "",
      sourceData: { fuels: null },
    });
  });

  it("stuurt een ongeldig kenteken niet naar RDW", async () => {
    const fetcher = vi.fn();
    await expect(lookupRdwVehicle("x", fetcher as typeof fetch)).resolves.toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });
});
