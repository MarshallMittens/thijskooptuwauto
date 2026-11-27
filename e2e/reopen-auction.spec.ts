import { randomUUID, createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { expect, test } from "@playwright/test";
import { signIn } from "./helpers/local-acceptance";

test("lokaal: beheer herstart afgelopen en afgeronde veilingen voor 24 uur", async ({ browser }) => {
  test.skip(process.env.E2E_REOPEN !== "true", "Alleen uitvoeren in de aparte lokale herstarttestomgeving.");
  test.setTimeout(120_000);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const baseURL = process.env.E2E_BASE_URL;
  if (supabaseUrl !== "http://127.0.0.1:54321" || baseURL !== "http://127.0.0.1:3107" || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Uitsluitend de lokale geïsoleerde testomgeving is toegestaan.");
  const admin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const suffix = randomUUID();
  const password = `Fictieve-Test-${suffix}!`;
  const user = async (kind: string) => {
    const email = `reopen-${kind}-${suffix}@example.test`;
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
  const applications: string[] = [];
  for (const [registration, status] of [["RH11AA", "active"], ["RH22AA", "closed"]] as const) {
    const applicationId = randomUUID(), vehicleId = randomUUID(), revisionId = randomUUID(), listingId = randomUUID();
    applications.push(applicationId);
    check(await admin.from("vehicles").insert({ id: vehicleId, registration_normalized: registration, make: "TEST", model: `HERSTART ${registration}` }));
    check(await admin.from("applications").insert({ id: applicationId, seller_contact_id: contactId, vehicle_id: vehicleId, status: "ready" }));
    check(await admin.from("seller_application_access").insert({ application_id: applicationId, user_id: seller.id }));
    check(await admin.from("vehicle_revisions").insert({ id: revisionId, vehicle_id: vehicleId, revision_number: 1, snapshot: { vehicle: { registration, make: "TEST", model: `HERSTART ${registration}`, variant: null, year: 2020, fuelType: "Benzine", color: "GRIJS", vehicleType: "Personenauto" }, condition: { mileageKm: 12345 } } }));
    const path = `applications/${applicationId}/fictieve-foto.jpg`;
    check(await admin.storage.from("vehicle-photos").upload(path, photo, { contentType: "image/jpeg" }));
    check(await admin.from("vehicle_photos").insert({ application_id: applicationId, vehicle_revision_id: revisionId, storage_path: path, media_type: "image/jpeg", size_bytes: photo.length, sha256: createHash("sha256").update(photo).digest("hex"), review_status: "approved", sort_order: 0 }));
    check(await admin.from("listings").insert({ id: listingId, application_id: applicationId, vehicle_revision_id: revisionId, status: "published", published_at: new Date().toISOString() }));
    const startsAt = Date.now() - 90_000_000;
    check(await admin.from("bid_rounds").insert({ listing_id: listingId, status, starts_at: new Date(startsAt).toISOString(), ends_at: new Date(startsAt + 86_400_000).toISOString(), outcome_status: status === "closed" ? "closed_no_bids" : "pending" }));
  }
  const staffContext = await browser.newContext({ baseURL });
  const dealerContext = await browser.newContext({ baseURL });
  try {
    const page = await staffContext.newPage();
    const dealerPage = await dealerContext.newPage();
    await signIn(dealerPage, dealer.email, password, "/dealer");
    await expect(dealerPage.getByRole("heading", { name: "Beschikbare auto’s" })).toBeVisible();
    await expect(dealerPage.getByRole("button", { name: "Opnieuw starten voor 24 uur" })).toHaveCount(0);
    await signIn(page, staff.email, password, "/beheer/aanvragen");
    const expiredRow = page.getByRole("row").filter({ hasText: "HERSTART RH11AA" });
    await expect(expiredRow.getByRole("button", { name: "Opnieuw starten voor 24 uur" })).toBeVisible();
    await expiredRow.getByRole("link").first().click();
    await expect(page).toHaveURL(`${baseURL}/beheer/aanvragen/${applications[0]}`);
    await page.getByRole("button", { name: "Opnieuw starten voor 24 uur" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByLabel("Reden voor de nieuwe ronde")).toHaveValue(/opnieuw aanbieden/);
    await expect(page.getByRole("button", { name: "Start nieuwe ronde van 24 uur" })).toBeEnabled();
    await page.getByRole("button", { name: "Annuleren", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByRole("button", { name: "Opnieuw starten voor 24 uur" }).click();
    await page.getByRole("button", { name: "Start nieuwe ronde van 24 uur" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Opnieuw starten voor 24 uur" })).toHaveCount(0);
    await page.goto("/beheer/aanvragen");
    const closedRow = page.getByRole("row").filter({ hasText: "HERSTART RH22AA" });
    await closedRow.getByRole("button", { name: "Opnieuw starten voor 24 uur" }).click();
    await page.getByRole("button", { name: "Start nieuwe ronde van 24 uur" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(closedRow.getByRole("button", { name: "Opnieuw starten voor 24 uur" })).toHaveCount(0);
    for (const id of applications) {
      const { data: listing, error: listingError } = await admin.from("listings").select("id").eq("application_id", id).single();
      if (listingError) throw listingError;
      const { data: rounds, error } = await admin.from("bid_rounds").select("id,status,starts_at,ends_at").eq("listing_id", listing!.id);
      if (error) throw error;
      expect(rounds).toHaveLength(2);
      const active = rounds!.find(round => round.status === "active");
      expect(active).toBeTruthy();
      expect(new Date(active!.ends_at).getTime() - new Date(active!.starts_at).getTime()).toBe(86_400_000);
      expect(rounds!.filter(round => round.status === "closed")).toHaveLength(1);
    }
    await dealerPage.reload();
    await expect(dealerPage.getByText("Bieden mogelijk", { exact: true })).toHaveCount(2);
  } finally {
    await staffContext.close();
    await dealerContext.close();
    // Retain fictitious audit/history only in this disposable local database.
  }
});
