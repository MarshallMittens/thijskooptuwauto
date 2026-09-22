import { z } from "zod";

import { normalizeRegistration } from "../applications/schema";

const RDW_VEHICLES_ENDPOINT = "https://opendata.rdw.nl/resource/m9d7-ebf2.json";
const RDW_FUELS_ENDPOINT = "https://opendata.rdw.nl/resource/8ys7-d773.json";

const rdwRecordSchema = z.object({
  kenteken: z.string(),
  voertuigsoort: z.string().optional(),
  merk: z.string().optional(),
  handelsbenaming: z.string().optional(),
  variant: z.string().optional(),
  uitvoering: z.string().optional(),
  datum_eerste_toelating: z.string().optional(),
  eerste_kleur: z.string().optional(),
  tweede_kleur: z.string().optional(),
  inrichting: z.string().optional(),
  aantal_zitplaatsen: z.string().optional(),
});

const rdwFuelRecordSchema = z.object({
  kenteken: z.string(),
  brandstof_volgnummer: z.string().optional(),
  brandstof_omschrijving: z.string().optional(),
});

export type RdwVehicle = {
  registration: string;
  make: string;
  model: string;
  variant: string;
  year: number | null;
  fuelType: string;
  color: string;
  vehicleType: string;
  sourceData: {
    vehicle: z.infer<typeof rdwRecordSchema>;
    fuels: z.infer<typeof rdwFuelRecordSchema>[] | null;
  };
  fetchedAt: string;
};

export async function lookupRdwVehicle(
  registrationInput: string,
  fetcher: typeof fetch = fetch,
): Promise<RdwVehicle | null> {
  const registration = normalizeRegistration(registrationInput);
  if (!/^[A-Z0-9]{6,8}$/.test(registration)) return null;

  const vehicleQuery = new URLSearchParams({
    "$select": "kenteken,voertuigsoort,merk,handelsbenaming,variant,uitvoering,datum_eerste_toelating,eerste_kleur,tweede_kleur,inrichting,aantal_zitplaatsen",
    "$where": `kenteken='${registration}'`,
    "$limit": "1",
  });
  const fuelQuery = new URLSearchParams({
    "$select": "kenteken,brandstof_volgnummer,brandstof_omschrijving",
    "$where": `kenteken='${registration}'`,
    "$order": "brandstof_volgnummer ASC",
  });
  const headers: HeadersInit = { Accept: "application/json" };
  if (process.env.RDW_APP_TOKEN) headers["X-App-Token"] = process.env.RDW_APP_TOKEN;

  const requestOptions = (): RequestInit => ({
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(6_000),
  });
  const [vehicleResult, fuelResult] = await Promise.allSettled([
    fetcher(`${RDW_VEHICLES_ENDPOINT}?${vehicleQuery}`, requestOptions()),
    fetcher(`${RDW_FUELS_ENDPOINT}?${fuelQuery}`, requestOptions()),
  ]);
  if (vehicleResult.status === "rejected") throw vehicleResult.reason;
  const response = vehicleResult.value;
  if (!response.ok) throw new Error(`RDW antwoordde met status ${response.status}.`);

  const parsed = z.array(rdwRecordSchema).safeParse(await response.json());
  if (!parsed.success) throw new Error("RDW gaf een onverwacht antwoord.");
  const record = parsed.data[0];
  if (!record) return null;

  let fuels: z.infer<typeof rdwFuelRecordSchema>[] | null = null;
  if (fuelResult.status === "fulfilled" && fuelResult.value.ok) {
    const parsedFuels = z.array(rdwFuelRecordSchema).safeParse(await fuelResult.value.json());
    if (parsedFuels.success) fuels = parsedFuels.data;
  }
  const fuelType = [...new Set(
    (fuels ?? [])
      .map((fuel) => fuel.brandstof_omschrijving?.trim())
      .filter((fuel): fuel is string => Boolean(fuel)),
  )].join(" / ");

  const date = record.datum_eerste_toelating;
  const year = date && /^\d{8}$/.test(date) ? Number(date.slice(0, 4)) : null;
  return {
    registration,
    make: record.merk ?? "",
    model: record.handelsbenaming ?? "",
    variant: record.uitvoering ?? record.variant ?? "",
    year,
    fuelType,
    color: [record.eerste_kleur, record.tweede_kleur]
      .filter((value) => value && value !== "Niet geregistreerd")
      .join(" / "),
    vehicleType: record.voertuigsoort ?? "",
    sourceData: { vehicle: record, fuels },
    fetchedAt: new Date().toISOString(),
  };
}
