import { randomUUID, createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { expect, test } from "@playwright/test";
import { signIn } from "./helpers/local-acceptance";

test("lokaal: beheer verwijdert foto en biedt aanvraag met een klik aan", async ({ browser }) => {
  test.skip(process.env.E2E_APPROVE !== "true", "Alleen uitvoeren in de aparte lokale goedkeuringstestomgeving.");
  test.setTimeout(120_000);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const baseURL = process.env.E2E_BASE_URL;
  if (supabaseUrl !== "http://127.0.0.1:54321" || baseURL !== "http://127.0.0.1:3107" || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Uitsluitend de lokale geïsoleerde testomgeving is toegestaan.");
  const admin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const suffix = randomUUID();
  const password = `Fictieve-Test-${suffix}!`;
  const user = async (kind: string) => {
    const email = `approve-${kind}-${suffix}@example.test`;
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user) throw error ?? new Error("Testaccount ontbreekt.");
    return { id: data.user.id, email };
  };
  const check = (result: { error: unknown }) => { if (result.error) throw result.error; };
  const staff = await user("admin");
  const seller = await user("seller");
  const dealer = await user("dealer");
  check(await admin.from("staff_memberships").insert({ user_id: staff.id, role: "admin" }));
  const companyId = randomUUID();
  check(await admin.from("companies").insert({ id: companyId, legal_name: `Fictief archiefbedrijf ${suffix}`, kvk_number: String(10_000_000 + Math.floor(Math.random() * 80_000_000)), street: "Testweg", house_number: "1", postal_code: "1234AB", city: "Testdam", contact_name: "Fictieve koper", email: dealer.email, phone: "0612345678", status: "approved" }));
  check(await admin.from("company_memberships").insert({ company_id: companyId, user_id: dealer.id, role: "owner", status: "active" }));
  const contactId = randomUUID();
  check(await admin.from("seller_contacts").insert({ id: contactId, full_name: "Fictieve archiefverkoper", email: seller.email, phone: "0612345678", postal_code: "1234AB" }));
  const photo = await sharp({ create: { width: 320, height: 200, channels: 3, background: "#e2e8f0" } }).jpeg().toBuffer();
  const applicationId = randomUUID(), vehicleId = randomUUID();
  check(await admin.from("vehicles").insert({ id: vehicleId, registration_normalized: "AK11AA", make: "TEST", model: "GOEDKEURING", year: 2020 }));
  check(await admin.from("applications").insert({ id: applicationId, seller_contact_id: contactId, vehicle_id: vehicleId, status: "submitted" }));
  check(await admin.from("condition_reports").insert({ application_id: applicationId, mileage_km: 12345, key_count: 2 }));
  const photoIds: string[] = [];
  for (let index = 0; index < 3; index++) {
    const id = randomUUID(); photoIds.push(id);
    const path = `applications/${applicationId}/photo-${index}.jpg`;
    check(await admin.storage.from("vehicle-photos").upload(path, photo, { contentType: "image/jpeg" }));
    check(await admin.from("vehicle_photos").insert({ id, application_id: applicationId, storage_path: path, media_type: "image/jpeg", size_bytes: photo.length, sha256: createHash("sha256").update(photo).digest("hex"), review_status: index === 2 ? "rejected" : "pending", sort_order: index }));
  }
  const staffContext = await browser.newContext({ baseURL });
  const dealerContext = await browser.newContext({ baseURL });
  try {
    const page = await staffContext.newPage(), dealerPage = await dealerContext.newPage();
    await signIn(dealerPage, dealer.email, password, "/dealer");
    await expect(dealerPage.getByText("Geen voertuigen gevonden met deze filters.")).toBeVisible();
    await signIn(page, staff.email, password, `/beheer/aanvragen/${applicationId}`);
    await expect(page.getByRole("button", { name: "Auto goedkeuren en aanbieden" })).toBeVisible();
    await expect(page.getByTestId(/^application-photo-/)).toHaveCount(3);
    const unwanted = page.getByTestId(`application-photo-${photoIds[1]}`);
    await unwanted.getByRole("button", { name: "Foto 2 verwijderen" }).click();
    await expect(unwanted).toHaveCount(0);
    await expect(page.getByTestId(/^application-photo-/)).toHaveCount(2);
    await page.getByRole("button", { name: "Auto goedkeuren en aanbieden" }).click();
    await expect(page.getByRole("button", { name: "Auto goedkeuren en aanbieden" })).toHaveCount(0);
    await expect(page.getByText("Status: active", { exact: true })).toBeVisible();
    const { data: links, error } = await admin.from("seller_application_access").select("application_id").eq("application_id", applicationId);
    if (error) throw error;
    expect(links).toHaveLength(0);
    await dealerPage.reload();
    await expect(dealerPage.getByRole("heading", { name: "TEST GOEDKEURING" })).toBeVisible();
    await expect(dealerPage.getByRole("button", { name: "Auto goedkeuren en aanbieden" })).toHaveCount(0);
    await dealerPage.getByRole("link", { name: "Bekijk voertuig en bied mee" }).click();
    await expect(dealerPage.getByRole("img", { name: /Voertuigfoto/i })).toHaveCount(1);
    const remaining = page.getByTestId(`application-photo-${photoIds[0]}`);
    await remaining.getByRole("button", { name: "Foto 1 verwijderen" }).click();
    await expect(remaining.getByRole("alert")).toContainText("laatste goedgekeurde foto");
    await expect(remaining).toBeVisible();
  } finally {
    await staffContext.close(); await dealerContext.close();
    // Fictitious records remain only in the disposable local test database.
  }
});
