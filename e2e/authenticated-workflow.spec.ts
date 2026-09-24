import path from "node:path";
import { spawnSync } from "node:child_process";

import { createClient } from "@supabase/supabase-js";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";

import { enrollMfa, getLatestMailLink, signIn } from "./helpers/local-acceptance";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const runAcceptance = process.env.E2E_ACCEPTANCE === "true";

test.describe("lokale acceptatieroute met gescheiden identiteiten", () => {
  test.skip(!runAcceptance, "Zet E2E_ACCEPTANCE=true uitsluitend voor de lokale acceptatieproef.");

  test("volledige fictieve route van aanmelding tot akkoord en klacht", async ({ browser }) => {
    test.setTimeout(120_000);
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Lokale Supabase-variabelen ontbreken.");
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const password = `Lokaal-Test-${suffix}!`;
    const adminEmail = `e2e-admin-${suffix}@example.test`;
    const dealerOneEmail = `e2e-dealer-1-${suffix}@example.test`;
    const dealerTwoEmail = `e2e-dealer-2-${suffix}@example.test`;
    const sellerEmail = `e2e-seller-${suffix}@example.test`;
    const registration = `ZZ${suffix.slice(-4).toUpperCase()}`.replace(/[^A-Z0-9]/g, "").slice(0, 6).padEnd(6, "Z");
    const kvkBase = Number(String(Date.now()).slice(-5)) * 10;

    const createUser = async (email: string) => {
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (error || !data.user) throw error ?? new Error(`Testgebruiker ${email} kon niet worden gemaakt.`);
      return data.user.id;
    };

    const adminUserId = await createUser(adminEmail);
    await createUser(dealerOneEmail);
    await createUser(dealerTwoEmail);
    const { error: staffError } = await admin.from("staff_memberships").insert({ user_id: adminUserId, role: "admin" });
    if (staffError) throw staffError;

    const contexts: BrowserContext[] = [];
    const newPage = async (forwardedFor?: string) => {
      const context = await browser.newContext({
        extraHTTPHeaders: forwardedFor ? { "x-forwarded-for": forwardedFor } : undefined,
      });
      contexts.push(context);
      return context.newPage();
    };

    try {
      const dealerOne = await newPage();
      await registerDealer(dealerOne, dealerOneEmail, password, suffix, "1", String(80_000_000 + kvkBase + 1));
      const dealerTwo = await newPage();
      await registerDealer(dealerTwo, dealerTwoEmail, password, suffix, "2", String(80_000_000 + kvkBase + 2));

      const administrator = await newPage();
      await signIn(administrator, adminEmail, password, "/beheer");
      await enrollMfa(administrator, "/beheer");
      for (const email of [dealerOneEmail, dealerTwoEmail]) {
        const row = administrator.getByRole("row").filter({ hasText: email });
        await expect(row).toContainText("pending");
        await row.getByRole("button", { name: "Goedkeuren" }).click();
        await expect(administrator.getByRole("row").filter({ hasText: email })).toContainText("approved");
      }

      await dealerOne.goto("/dealer");
      await enrollMfa(dealerOne, "/dealer");
      await expect(dealerOne.getByRole("heading", { name: "Beschikbare auto’s" })).toBeVisible();
      await dealerTwo.goto("/dealer");
      await enrollMfa(dealerTwo, "/dealer");
      await expect(dealerTwo.getByRole("heading", { name: "Beschikbare auto’s" })).toBeVisible();

      const seller = await newPage(`192.0.2.${(Date.now() % 250) + 1}`);
      await submitApplication(seller, registration, sellerEmail);
      const reference = (await seller.locator("p.font-mono").textContent())?.trim();
      expect(reference).toMatch(/^[0-9a-f]{24}$/);
      await seller.getByRole("link", { name: "E-mailadres verifiëren" }).click();
      await seller.getByLabel("E-mailadres uit de aanvraag").fill(sellerEmail);
      await seller.getByRole("button", { name: "Beveiligde link aanvragen" }).click();
      await expect(seller.getByRole("status")).toContainText("beveiligde e-mail");
      const magicLink = await getLatestMailLink(sellerEmail, "/auth/v1/verify");
      await seller.goto(magicLink);
      await expect(seller).toHaveURL(/\/mijn-aanvraag\?geverifieerd=1$/);
      await seller.reload();
      await expect(seller.getByRole("heading", { name: "Mijn autoaanvraag" })).toBeVisible();
      await expect(seller.getByText(reference!)).toBeVisible();

      await administrator.goto("/beheer/aanvragen");
      const applicationLink = administrator.getByRole("link", { name: reference! });
      await expect(applicationLink).toBeVisible();
      await applicationLink.click();
      await expect(administrator.getByRole("heading", { name: registration })).toBeVisible();
      await administrator.getByRole("button", { name: "Goedkeuren" }).click();
      await administrator.getByRole("button", { name: "In controle" }).click();
      await administrator.getByRole("button", { name: "Gereed" }).click();
      await expect(administrator.getByText("Status: ready")).toBeVisible();
      administrator.once("dialog", (dialog) => dialog.accept());
      await administrator.getByRole("button", { name: "Publiceren en 24 uur openen" }).click();
      await expect(administrator.getByRole("status")).toContainText("biedronde is nu geopend");

      await placeBid(dealerOne, registration, "10000");
      await placeBid(dealerTwo, registration, "10050");
      await dealerOne.goto("/dealer");
      const dealerOneListing = dealerOne.locator("article").filter({ hasText: registration });
      await expect(dealerOneListing.getByText("€ 10.050,00")).toBeVisible();
      await expect(dealerOne.getByText(dealerTwoEmail)).toHaveCount(0);

      const { data: application } = await admin.from("applications").select("id").eq("public_reference", reference!).single();
      const { data: listing } = await admin.from("listings").select("id").eq("application_id", application!.id).single();
      const { data: round } = await admin.from("bid_rounds").select("id").eq("listing_id", listing!.id).single();
      moveLocalTestRoundPastDeadline(round!.id);

      await administrator.reload();
      administrator.once("dialog", (dialog) => dialog.accept());
      await administrator.getByRole("button", { name: "Uitslag vastleggen" }).click();
      await expect(administrator.getByRole("status")).toContainText("vastgelegd");
      await dealerTwo.goto("/dealer/gewonnen");
      await expect(dealerTwo.getByRole("heading", { name: "Gewonnen dossiers" })).toBeVisible();
      await expect(dealerTwo.getByText(registration)).toBeVisible();

      const appointmentSlot = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
      await dealerTwo.getByLabel("Moment 1 *").fill(appointmentSlot);
      await dealerTwo.getByRole("button", { name: "Voorstellen versturen" }).click();
      await expect(dealerTwo.getByRole("status")).toContainText("afspraakmogelijkheden zijn opgeslagen");

      await seller.reload();
      await seller.locator('input[type="radio"]').first().check();
      await expect(seller.locator('input[type="radio"]').first()).toBeChecked();
      await seller.getByRole("button", { name: "Gekozen moment bevestigen" }).click();
      await expect(seller.getByText("De afspraak is bevestigd.", { exact: true })).toBeVisible();

      await dealerTwo.reload();
      await expect(dealerTwo.getByText("Contact na bevestigde afspraak")).toBeVisible();
      await dealerTwo.getByLabel("Inspectietijdstip").fill(new Date().toISOString().slice(0, 16));
      await dealerTwo.getByLabel("Kilometerstand").fill("42025");
      await dealerTwo.getByLabel("Belangrijkste bevindingen").fill("Fictieve E2E-inspectie zonder materiële afwijkingen.");
      await dealerTwo.getByRole("button", { name: "Inspectie opslaan" }).click();
      await expect(dealerTwo.getByRole("status")).toContainText("Inspectie opgeslagen");

      await dealerTwo.reload();
      dealerTwo.once("dialog", (dialog) => dialog.accept());
      await dealerTwo.getByRole("button", { name: "Exact concept bevestigen" }).click();
      await expect(dealerTwo.getByRole("status")).toContainText("Jouw bevestiging is opgeslagen");

      await seller.reload();
      seller.once("dialog", (dialog) => dialog.accept());
      await seller.getByRole("button", { name: "Exact koopconcept bevestigen" }).click();
      await expect(seller.getByText("Jouw bevestiging is opgeslagen.", { exact: false })).toBeVisible();
      await seller.reload();
      await expect(seller.getByText("Beide partijen hebben exact dit concept bevestigd")).toBeVisible();

      await dealerTwo.goto("/dealer/klachten");
      const complaintCase = dealerTwo.locator("article").filter({ hasText: registration });
      await complaintCase.getByLabel("Wat is er gebeurd?").fill("Fictieve E2E-melding om de afgeschermde klachtenroute te controleren.");
      await complaintCase.getByRole("button", { name: "Klachtendossier openen" }).click();
      await expect(complaintCase.getByRole("status")).toContainText("Klacht ontvangen");

      await dealerOne.goto("/dealer/klachten");
      await expect(dealerOne.getByText(registration)).toHaveCount(0);
      await expect(dealerOne.getByText("nog geen gewonnen dossier", { exact: false })).toBeVisible();

      await administrator.goto(`/beheer/aanvragen/${application!.id}`);
      await expect(administrator.getByRole("heading", { name: "appointment · dealer" })).toBeVisible();
      await expect(administrator.getByText("agreed", { exact: true })).toBeVisible();
    } finally {
      await Promise.all(contexts.map((context) => context.close()));
    }
  });
});

function moveLocalTestRoundPastDeadline(roundId: string) {
  if (!/^[0-9a-f-]{36}$/.test(roundId)) throw new Error("Ongeldige lokale testronde.");
  const sql = [
    "begin",
    "alter table public.bids disable trigger bids_append_only",
    `update public.bids set created_at = now() - interval '2 hours' where bid_round_id = '${roundId}'::uuid`,
    "alter table public.bids enable trigger bids_append_only",
    `update public.bid_rounds set starts_at = now() - interval '25 hours', ends_at = now() - interval '1 hour' where id = '${roundId}'::uuid`,
    "commit",
  ].join("; ");
  const result = spawnSync(
    "docker",
    ["exec", "supabase_db_thijskooptuauto", "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-c", sql],
    { encoding: "utf8" },
  );
  if (result.status !== 0) throw new Error(`Lokale tijdversnelling mislukt: ${result.stderr}`);
}

async function registerDealer(page: Page, email: string, password: string, suffix: string, number: string, kvk: string) {
  await signIn(page, email, password, "/dealer");
  await expect(page).toHaveURL(/\/dealer\/registreren$/);
  await page.getByLabel("Statutaire bedrijfsnaam").fill(`E2E Garage ${number} ${suffix}`);
  await page.getByLabel("Handelsnaam (optioneel)").fill(`E2E Garage ${number}`);
  await page.getByLabel("KvK-nummer").fill(kvk);
  await page.getByLabel("Straat").fill("Teststraat");
  await page.getByLabel("Huisnummer").fill(number);
  await page.getByLabel("Postcode").fill("1234AB");
  await page.getByLabel("Plaats").fill("Testdam");
  await page.getByLabel("Contactpersoon").fill(`Fictieve Dealer ${number}`);
  await page.getByLabel("Zakelijk e-mailadres").fill(email);
  await page.getByLabel("Telefoonnummer").fill(`061234567${number}`);
  await page.getByRole("button", { name: "Bedrijf ter goedkeuring aanmelden" }).click();
  await expect(page).toHaveURL(/\/dealer\/wachten$/);
}

async function submitApplication(page: Page, registration: string, sellerEmail: string) {
  await page.route("**/api/rdw", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ unavailable: true }) }));
  await page.goto(`/auto-aanmelden?kenteken=${registration}`);
  await page.getByRole("button", { name: "Gegevens ophalen" }).click();
  await page.locator("#make").fill("TESTMERK");
  await page.locator("#model").fill("TESTMODEL");
  await page.locator("#year").fill("2020");
  await page.getByRole("button", { name: "Volgende" }).click();
  await page.locator("#mileage").fill("42000");
  await page.locator("#keys").fill("2");
  await page.getByRole("button", { name: "Volgende" }).click();
  await page.locator("#photos").setInputFiles(path.resolve("public/car-inspection-hero.png"));
  await page.getByRole("button", { name: "Volgende" }).click();
  await page.locator("#fullName").fill("Fictieve E2E Verkoper");
  await page.locator("#email").fill(sellerEmail);
  await page.locator("#phone").fill("0612345678");
  await page.locator("#postalCode").fill("1234AB");
  await page.getByRole("button", { name: "Volgende" }).click();
  await page.getByRole("button", { name: "Aanvraag versturen" }).click();
  await expect(page).toHaveURL(/\/auto-aanmelden\/bedankt\?referentie=[0-9a-f]{24}$/);
}

async function placeBid(page: Page, registration: string, amount: string) {
  await page.goto("/dealer");
  const card = page.locator("article").filter({ hasText: registration });
  await card.getByRole("link", { name: "Bekijk voertuig en bied mee" }).click();
  await page.getByLabel("Bedrag in euro’s").fill(amount);
  await page.getByRole("button", { name: "Bod opslaan" }).click();
  await expect(page.getByRole("status")).toContainText("opgeslagen");
}
