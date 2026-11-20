import { randomInt, randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import { expect, test, type BrowserContext } from "@playwright/test";

import { signIn } from "./helpers/local-acceptance";

const runLocalPasswordOnly = process.env.E2E_PASSWORD_ONLY_ACCESS === "true";

function requireLoopbackUrl(value: string, name: string, expectedPort?: string) {
  const url = new URL(value);
  if (
    url.protocol !== "http:"
    || !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
    || (expectedPort !== undefined && url.port !== expectedPort)
    || url.username || url.password || url.pathname !== "/" || url.search || url.hash
  ) {
    throw new Error(`${name} moet naar een lokale http-loopbackserver verwijzen.`);
  }
  return url.origin;
}

test.describe("lokale toegang met alleen e-mail en wachtwoord", () => {
  test.skip(!runLocalPasswordOnly, "Zet E2E_PASSWORD_ONLY_ACCESS=true uitsluitend voor deze lokale toegangsproef.");

  test("behoudt rollen en bedrijfsstatus zonder authenticatorstap", async ({ browser }) => {
    test.setTimeout(120_000);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Lokale Supabase-variabelen ontbreken.");

    // Validate every configured destination before creating any fictitious account.
    const localSupabaseUrl = requireLoopbackUrl(supabaseUrl, "Supabase", "54321");
    const appOrigin = requireLoopbackUrl(process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000", "De applicatie");
    const admin = createClient(localSupabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const suffix = randomUUID();
    const password = `Lokaal-Toegang-${suffix}!`;
    const userIds: string[] = [];
    const companyIds: string[] = [];
    const contexts: BrowserContext[] = [];

    const createUser = async (role: string) => {
      const email = `e2e-password-${role}-${suffix}@example.test`;
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (error || !data.user) throw error ?? new Error("Een fictieve testgebruiker kon niet worden gemaakt.");
      userIds.push(data.user.id);
      expect(data.user.factors ?? []).toHaveLength(0);
      return { email, userId: data.user.id };
    };

    const createDealer = async (status: "approved" | "pending" | "blocked") => {
      const user = await createUser(status);
      const companyId = randomUUID();
      const { error: companyError } = await admin.from("companies").insert({
        id: companyId,
        legal_name: `Fictieve toegangstest ${status} ${suffix}`,
        kvk_number: String(randomInt(10_000_000, 100_000_000)),
        street: "Teststraat",
        house_number: "1",
        postal_code: "1234AB",
        city: "Testdam",
        contact_name: "Fictieve Testpersoon",
        email: user.email,
        phone: "0612345678",
        status,
      });
      if (companyError) throw companyError;
      companyIds.push(companyId);
      const { error: membershipError } = await admin.from("company_memberships").insert({
        company_id: companyId,
        user_id: user.userId,
        role: "owner",
        status: "active",
      });
      if (membershipError) throw membershipError;
      return user;
    };

    const newPage = async () => {
      const context = await browser.newContext({ baseURL: appOrigin });
      contexts.push(context);
      return context.newPage();
    };

    try {
      const administrator = await createUser("admin");
      const operator = await createUser("operator");
      const { error: staffError } = await admin.from("staff_memberships").insert([
        { user_id: administrator.userId, role: "admin" },
        { user_id: operator.userId, role: "operator" },
      ]);
      if (staffError) throw staffError;
      const approvedDealer = await createDealer("approved");
      const pendingDealer = await createDealer("pending");
      const blockedDealer = await createDealer("blocked");

      const anonymousPage = await newPage();
      await anonymousPage.goto("/beheer");
      await expect(anonymousPage).toHaveURL(/\/inloggen\?returnTo=%2Fbeheer$/);
      await anonymousPage.goto("/auth/mfa?next=https://example.test");
      await expect(anonymousPage).toHaveURL(/\/inloggen\?returnTo=%2Fauth%2Fmfa$/);

      const adminPage = await newPage();
      await signIn(adminPage, administrator.email, password, "/beheer");
      await expect(adminPage).toHaveURL(`${appOrigin}/beheer`);
      await expect(adminPage.getByRole("heading", { name: "Autobedrijven", exact: true })).toBeVisible();
      await expect(adminPage.getByRole("row").filter({ hasText: pendingDealer.email }).getByRole("button", { name: "Goedkeuren", exact: true })).toBeVisible();
      await adminPage.goto("/auth/mfa?next=https://example.test");
      await expect(adminPage).toHaveURL(`${appOrigin}/beheer`);
      await adminPage.goto("/dealer");
      await expect(adminPage).toHaveURL(`${appOrigin}/geen-toegang`);

      const dealerPage = await newPage();
      await signIn(dealerPage, approvedDealer.email, password, "/dealer");
      await expect(dealerPage).toHaveURL(`${appOrigin}/dealer`);
      await expect(dealerPage.getByRole("heading", { name: "Beschikbare auto’s", exact: true })).toBeVisible();
      await expect(dealerPage.getByText("Het aanbod kon niet veilig worden geladen.", { exact: true })).toHaveCount(0);
      await dealerPage.goto("/auth/mfa?next=https://example.test");
      await expect(dealerPage).toHaveURL(`${appOrigin}/dealer`);
      await dealerPage.goto("/auth/mfa?next=/beheer");
      await expect(dealerPage).toHaveURL(`${appOrigin}/dealer`);
      await dealerPage.goto("/beheer");
      await expect(dealerPage).toHaveURL(`${appOrigin}/geen-toegang`);

      for (const [dealer, expectedPath] of [
        [pendingDealer, "/dealer/wachten"],
        [blockedDealer, "/dealer/geblokkeerd"],
      ] as const) {
        const page = await newPage();
        await signIn(page, dealer.email, password, "/dealer");
        await expect(page).toHaveURL(`${appOrigin}${expectedPath}`);
        await page.goto("/auth/mfa?next=/beheer");
        await expect(page).toHaveURL(`${appOrigin}${expectedPath}`);
        await page.goto("/beheer");
        await expect(page).toHaveURL(`${appOrigin}/geen-toegang`);
      }

      const operatorPage = await newPage();
      await signIn(operatorPage, operator.email, password, "/beheer");
      await expect(operatorPage).toHaveURL(`${appOrigin}/beheer`);
      await expect(operatorPage.getByRole("row").filter({ hasText: pendingDealer.email })).toBeVisible();
      await expect(operatorPage.getByRole("button", { name: "Goedkeuren", exact: true })).toHaveCount(0);
      await expect(operatorPage.getByRole("button", { name: "Blokkeren", exact: true })).toHaveCount(0);
      await operatorPage.goto("/dealer");
      await expect(operatorPage).toHaveURL(`${appOrigin}/geen-toegang`);
    } finally {
      await Promise.all(contexts.map((context) => context.close()));
      if (companyIds.length) {
        const { error } = await admin.from("companies").delete().in("id", companyIds);
        if (error) throw new Error("De fictieve testbedrijven konden niet worden opgeruimd.");
      }
      for (const userId of userIds) {
        const { error } = await admin.auth.admin.deleteUser(userId);
        if (error) throw new Error("Een fictieve testgebruiker kon niet worden opgeruimd.");
      }
    }
  });
});
