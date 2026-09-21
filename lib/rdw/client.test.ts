import { describe, expect, it, vi } from "vitest";

import { lookupRdwVehicle } from "./client";

describe("lookupRdwVehicle", () => {
  it("mapt uitsluitend gedocumenteerde RDW-velden", async () => {
    const fetcher = vi.fn(async () =>
      new Response(JSON.stringify([{
        kenteken: "12AB34",
        voertuigsoort: "Personenauto",
        merk: "VOLVO",
        handelsbenaming: "V60",
        datum_eerste_toelating: "20200312",
        eerste_kleur: "BLAUW",
      }]), { status: 200 }),
    );

    const result = await lookupRdwVehicle("12-ab-34", fetcher as typeof fetch);
    expect(result).toMatchObject({
      registration: "12AB34",
      make: "VOLVO",
      model: "V60",
      year: 2020,
      color: "BLAUW",
    });
  });

  it("geeft null terug wanneer het kenteken niet voorkomt", async () => {
    const fetcher = vi.fn(async () => new Response("[]", { status: 200 }));
    await expect(lookupRdwVehicle("12AB34", fetcher as typeof fetch)).resolves.toBeNull();
  });

  it("stuurt een ongeldig kenteken niet naar RDW", async () => {
    const fetcher = vi.fn();
    await expect(lookupRdwVehicle("x", fetcher as typeof fetch)).resolves.toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });
});
