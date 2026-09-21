import { z } from "zod";

import { normalizeRegistration } from "../applications/schema";

const RDW_ENDPOINT = "https://opendata.rdw.nl/resource/m9d7-ebf2.json";

const rdwRecordSchema = z.object({
  kenteken: z.string(),
  voertuigsoort: z.string().optional(),
  merk: z.string().optional(),
  handelsbenaming: z.string().optional(),
  datum_eerste_toelating: z.string().optional(),
  eerste_kleur: z.string().optional(),
  tweede_kleur: z.string().optional(),
  inrichting: z.string().optional(),
  aantal_zitplaatsen: z.string().optional(),
});

export type RdwVehicle = {
  registration: string;
  make: string;
  model: string;
  year: number | null;
  color: string;
  vehicleType: string;
  sourceData: z.infer<typeof rdwRecordSchema>;
  fetchedAt: string;
};

export async function lookupRdwVehicle(
  registrationInput: string,
  fetcher: typeof fetch = fetch,
): Promise<RdwVehicle | null> {
  const registration = normalizeRegistration(registrationInput);
  if (!/^[A-Z0-9]{6,8}$/.test(registration)) return null;

  const query = new URLSearchParams({
    "$select": "kenteken,voertuigsoort,merk,handelsbenaming,datum_eerste_toelating,eerste_kleur,tweede_kleur,inrichting,aantal_zitplaatsen",
    "$where": `kenteken='${registration}'`,
    "$limit": "1",
  });
  const headers: HeadersInit = { Accept: "application/json" };
  if (process.env.RDW_APP_TOKEN) headers["X-App-Token"] = process.env.RDW_APP_TOKEN;

  const response = await fetcher(`${RDW_ENDPOINT}?${query}`, {
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(6_000),
  });
  if (!response.ok) throw new Error(`RDW antwoordde met status ${response.status}.`);

  const parsed = z.array(rdwRecordSchema).safeParse(await response.json());
  if (!parsed.success) throw new Error("RDW gaf een onverwacht antwoord.");
  const record = parsed.data[0];
  if (!record) return null;

  const date = record.datum_eerste_toelating;
  const year = date && /^\d{8}$/.test(date) ? Number(date.slice(0, 4)) : null;
  return {
    registration,
    make: record.merk ?? "",
    model: record.handelsbenaming ?? "",
    year,
    color: [record.eerste_kleur, record.tweede_kleur]
      .filter((value) => value && value !== "Niet geregistreerd")
      .join(" / "),
    vehicleType: record.voertuigsoort ?? "",
    sourceData: record,
    fetchedAt: new Date().toISOString(),
  };
}
