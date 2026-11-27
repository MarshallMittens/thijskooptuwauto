import { randomUUID, createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { expect, test } from "@playwright/test";
import { signIn } from "./helpers/local-acceptance";

test("lokaal: beheer archiveert via thumbnail en overzicht; dealer kan dit niet", async ({ browser }) => {
  test.skip(process.env.E2E_ARCHIVE !== "true", "Alleen uitvoeren in de aparte lokale archiveringstestomgeving.");
  test.setTimeout(120_000);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const baseURL = process.env.E2E_BASE_URL;
  if (supabaseUrl !== "http://127.0.0.1:54321" || baseURL !== "http://127.0.0.1:3107" || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Uitsluitend de lokale geïsoleerde testomgeving is toegestaan.");
  const admin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const suffix = randomUUID();
  const password = `Fictieve-Test-${suffix}!`;
  const user = async (kind: string) => {
    const email = `archive-${kind}-${suffix}@example.test`;
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
  for (const [registration, status] of [["AR11AA", "active"], ["AR22AA", "closed"]] as const) {
    const applicationId = randomUUID(), vehicleId = randomUUID(), revisionId = randomUUID(), listingId = randomUUID();
    applications.push(applicationId);
    check(await admin.from("vehicles").insert({ id: vehicleId, registration_normalized: registration, make: "TEST", model: `ARCHIEF ${registration}` }));
    check(await admin.from("applications").insert({ id: applicationId, seller_contact_id: contactId, vehicle_id: vehicleId, status: "ready" }));
    check(await admin.from("seller_application_access").insert({ application_id: applicationId, user_id: seller.id }));
    check(await admin.from("vehicle_revisions").insert({ id: revisionId, vehicle_id: vehicleId, revision_number: 1, snapshot: { vehicle: { registration, make: "TEST", model: `ARCHIEF ${registration}`, variant: null, year: 2020, fuelType: "Benzine", color: "GRIJS", vehicleType: "Personenauto" }, condition: { mileageKm: 12345 } } }));
    const path = `applications/${applicationId}/fictieve-foto.jpg`;
    check(await admin.storage.from("vehicle-photos").upload(path, photo, { contentType: "image/jpeg" }));
    check(await admin.from("vehicle_photos").insert({ application_id: applicationId, vehicle_revision_id: revisionId, storage_path: path, media_type: "image/jpeg", size_bytes: photo.length, sha256: createHash("sha256").update(photo).digest("hex"), review_status: "approved", sort_order: 0 }));
    check(await admin.from("listings").insert({ id: listingId, application_id: applicationId, vehicle_revision_id: revisionId, status: "published", published_at: new Date().toISOString() }));
    const startsAt = Date.now() - (status === "active" ? 60_000 : 90_000_000);
    check(await admin.from("bid_rounds").insert({ listing_id: listingId, status, starts_at: new Date(startsAt).toISOString(), ends_at: new Date(startsAt + 86_400_000).toISOString(), outcome_status: status === "closed" ? "closed_no_bids" : "pending" }));
  }
  const staffContext = await browser.newContext({ baseURL });
  const dealerContext = await browser.newContext({ baseURL });
  try {
    const page = await staffContext.newPage();
    const dealerPage = await dealerContext.newPage();
    await signIn(dealerPage, dealer.email, password, "/dealer");
    await expect(dealerPage.getByRole("heading", { name: "Beschikbare auto’s" })).toBeVisible();
    await expect(dealerPage.getByRole("button", { name: /archiveren/ })).toHaveCount(0);
    await signIn(page, staff.email, password, "/beheer/aanvragen");
    const activeRow = page.getByRole("row").filter({ hasText: "ARCHIEF AR11AA" });
    await expect(activeRow.getByRole("button", { name: "AR11AA archiveren" })).toHaveCount(2);
    await activeRow.getByRole("button", { name: "AR11AA archiveren" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("button", { name: "Archiveren", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: "Annuleren", exact: true }).click();
    await expect(activeRow).toBeVisible();
    await activeRow.getByRole("button", { name: "AR11AA archiveren" }).first().click();
    await page.getByLabel("Reden voor archiveren").fill("Fictieve actieve veiling uit het aanbod halen.");
    await page.getByRole("button", { name: "Archiveren", exact: true }).click();
    await expect(activeRow).toHaveCount(0);
    const closedRow = page.getByRole("row").filter({ hasText: "ARCHIEF AR22AA" });
    await closedRow.getByRole("button", { name: "AR22AA archiveren" }).last().click();
    await page.getByLabel("Reden voor archiveren").fill("Fictieve afgeronde veiling archiveren.");
    await page.getByRole("button", { name: "Archiveren", exact: true }).click();
    await expect(closedRow).toHaveCount(0);
    await page.getByRole("link", { name: "Bekijk archief" }).click();
    await expect(page.getByRole("row").filter({ hasText: "ARCHIEF AR11AA" })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "ARCHIEF AR22AA" })).toBeVisible();
    await expect(page.getByRole("button", { name: /archiveren/ })).toHaveCount(0);
    await dealerPage.reload();
    await expect(dealerPage.getByText("Geen voertuigen gevonden met deze filters.")).toBeVisible();
    const { data, error } = await admin.from("applications").select("id,archived_at").in("id", applications);
    if (error) throw error;
    expect(data).toHaveLength(2);
    expect(data?.every(item => item.archived_at)).toBe(true);
  } finally {
    await staffContext.close();
    await dealerContext.close();
    // Audit/history are deliberately retained in this disposable, local-only database.
  }
});
