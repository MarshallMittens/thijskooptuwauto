import { expect, test } from "@playwright/test";

test("de openbare statuscontrole toont geen interne gegevens", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
  expect(response.headers()["cache-control"]).toContain("no-store");

  const deepResponse = await request.get("/api/health?deep=1");
  expect(deepResponse.status()).toBe(401);
  expect(await deepResponse.json()).toEqual({ status: "unauthorized" });
});

test("de kentekenactie opent de aanmeldwizard met genormaliseerd kenteken", async ({ page }) => {
  await page.route("**/api/analytics/form-start", (route) => route.fulfill({ status: 204 }));
  await page.route("**/api/rdw", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ found: false }),
  }));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Je auto verkopen");
  await expect(page.getByText("Veilig en vrijblijvend aanmelden")).toBeVisible();
  await expect(page.getByRole("link", { name: "Bekijk echte klantervaringen" })).toBeVisible();

  const registration = page.getByRole("textbox", { name: "Vul je kenteken in" });
  await registration.fill("zz-zz-zz");
  await expect(registration).toHaveValue("ZZ-ZZ-ZZ");
  await page.getByRole("button", { name: "Start je aanvraag" }).click();

  await expect(page).toHaveURL(/\/auto-aanmelden\?kenteken=ZZZZZZ&ophalen=1$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Vertel ons over je auto");
  await expect(page.getByText("Stap 2 van 6")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Controleer de voertuiggegevens" })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Vul de gegevens handmatig in");
});

test("een onvolledig kenteken geeft een fout en verzendt niet", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Vul je kenteken in" }).fill("ZZ");
  await page.getByRole("button", { name: "Start je aanvraag" }).click();

  await expect(page.locator("#plate-message")).toContainText("Vul een volledig Nederlands kenteken in");
  await expect(page).toHaveURL("/");
});

test("besloten dealer- en beheerroutes leiden gasten naar inloggen", async ({ page }) => {
  await page.goto("/dealer");
  await expect(page).toHaveURL(/\/inloggen\?returnTo=%2Fdealer$/);
  await expect(page.getByRole("heading", { name: "Inloggen" })).toBeVisible();

  await page.goto("/beheer");
  await expect(page).toHaveURL(/\/inloggen\?returnTo=%2Fbeheer$/);
  await expect(page.getByRole("heading", { name: "Inloggen" })).toBeVisible();
});

test("publieke procespagina en mobiel kentekenveld blijven bruikbaar", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("textbox", { name: "Vul je kenteken in" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start je aanvraag" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Voor bedrijven: inloggen" })).toHaveAttribute("href", "/inloggen?returnTo=%2Fdealer");
  await page.locator("summary[aria-label='Taal: Nederlands']").click();
  await expect(page.getByText("Nederlands", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Français/ })).toBeDisabled();
  await expect(page.getByRole("button", { name: /Deutsch/ })).toBeDisabled();
  await expect(page.getByRole("button", { name: /English/ })).toBeDisabled();
  await expect(page.locator("#klantervaringen").getByText("“Top service!”")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.goto("/hoe-werkt-het");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.goto("/over-ons#klantervaringen");
  await expect(page.getByRole("heading", { name: "Wat klanten eerder over Thijs vertelden." })).toBeVisible();
  await expect(page.locator("#klantervaringen").getByText("“Top service!”")).toBeVisible();
});

test("RDW-uitval laat handmatige invoer toe zonder contactgegevens op te slaan", async ({ page }) => {
  await page.route("**/api/analytics/form-start", (route) => route.fulfill({ status: 204 }));
  await page.route("**/api/rdw", (route) => route.fulfill({
    status: 503,
    contentType: "application/json",
    body: JSON.stringify({ unavailable: true }),
  }));

  await page.goto("/auto-aanmelden?kenteken=ZZZZZZ");
  await page.getByRole("button", { name: "Gegevens ophalen" }).click();
  await expect(page.getByRole("status")).toContainText("Vul de gegevens handmatig in");
  await page.locator("#make").fill("TESTMERK");
  await page.locator("#model").fill("TESTMODEL");
  await page.getByRole("button", { name: "Volgende" }).click();

  await expect(page.getByRole("heading", { name: "Technische staat van je auto" })).toBeVisible();
  await page.locator("#mileage").fill("42000");
  await page.getByRole("button", { name: "1 sleutel" }).click();
  await expect(page.getByRole("button", { name: "1 sleutel" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "4 van 5 sterren voor beoordeling buitenkant" }).click();
  await page.getByRole("button", { name: "3 van 5 sterren voor beoordeling interieur" }).click();
  await page.getByRole("button", { name: "Geen schade" }).click();
  await page.getByRole("button", { name: "Geen gebreken" }).click();
  await page.getByRole("button", { name: "Vakgarage" }).click();
  await page.getByRole("button", { name: "Volgende" }).click();

  await page.locator("#photos").setInputFiles({
    name: "fictieve-testfoto.png",
    mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aAocAAAAASUVORK5CYII=", "base64"),
  });
  await page.getByRole("button", { name: "Volgende" }).click();
  await page.locator("#fullName").fill("Fictieve Verkoper");
  await page.locator("#email").fill("proefpersoon@example.test");
  await page.locator("#phone").fill("0612345678");
  await page.locator("#postalCode").fill("1234AB");
  await page.getByRole("button", { name: "Volgende" }).click();

  await expect(page.getByRole("heading", { name: "Klaar om je aanvraag te versturen?" })).toBeVisible();
  await expect(page.getByText("Buitenkant 4/5 · Interieur 3/5")).toBeVisible();
  const savedDraft = await page.evaluate(() => sessionStorage.getItem("thijskooptuauto.application.v1"));
  expect(savedDraft).not.toContain("proefpersoon@example.test");
  expect(savedDraft).not.toContain("0612345678");
  // Bewust geen klik op 'Aanvraag versturen': deze proef schrijft geen aanvraag weg.
});
