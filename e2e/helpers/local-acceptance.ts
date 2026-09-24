import { createHmac } from "node:crypto";

import { expect, type Page } from "@playwright/test";

function decodeBase32(value: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const normalized = value.toUpperCase().replace(/=+$/g, "").replace(/\s+/g, "");
  let bits = "";
  for (const character of normalized) {
    const index = alphabet.indexOf(character);
    if (index < 0) throw new Error("Ongeldig lokaal TOTP-geheim.");
    bits += index.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let offset = 0; offset + 8 <= bits.length; offset += 8) {
    bytes.push(Number.parseInt(bits.slice(offset, offset + 8), 2));
  }
  return Buffer.from(bytes);
}

export function createTotp(secret: string, timestamp = Date.now()) {
  const counter = Math.floor(timestamp / 30_000);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", decodeBase32(secret)).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = ((digest[offset] & 0x7f) << 24)
    | ((digest[offset + 1] & 0xff) << 16)
    | ((digest[offset + 2] & 0xff) << 8)
    | (digest[offset + 3] & 0xff);
  return String(binary % 1_000_000).padStart(6, "0");
}

export async function signIn(page: Page, email: string, password: string, returnTo: string) {
  await page.goto(`/inloggen?returnTo=${encodeURIComponent(returnTo)}`);
  await page.getByLabel("E-mailadres").fill(email);
  await page.getByLabel("Wachtwoord").fill(password);
  await page.getByRole("button", { name: "Inloggen" }).click();
}

export async function enrollMfa(page: Page, expectedPath: string) {
  await expect(page).toHaveURL(/\/auth\/mfa/);
  const factorResponse = page.waitForResponse((response) =>
    response.url().includes("/auth/v1/factors")
      && response.request().method() === "POST"
      && response.status() < 400,
  );
  await page.getByRole("button", { name: "Authenticator instellen" }).click();
  const body = await (await factorResponse).json() as { totp?: { secret?: string } };
  const secret = body.totp?.secret;
  if (!secret) throw new Error("De lokale MFA-respons bevatte geen TOTP-geheim.");
  await page.getByLabel("Zescijferige code").fill(createTotp(secret));
  await page.getByRole("button", { name: "Code controleren" }).click();
  await expect(page).toHaveURL(new RegExp(`${expectedPath.replaceAll("/", "\\/")}$`));
  return secret;
}

export async function getLatestMailLink(recipient: string, pathPart: string) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const response = await fetch("http://127.0.0.1:54324/api/v1/messages");
    if (!response.ok) throw new Error("Mailpit is lokaal niet bereikbaar.");
    const listing = await response.json() as {
      messages?: Array<{ ID?: string; To?: Array<{ Address?: string }> }>;
    };
    const message = listing.messages?.find((item) =>
      item.To?.some((address) => address.Address?.toLowerCase() === recipient.toLowerCase()),
    );
    if (message?.ID) {
      const detailResponse = await fetch(`http://127.0.0.1:54324/api/v1/message/${message.ID}`);
      const detail = await detailResponse.json() as { HTML?: string; Text?: string };
      const content = `${detail.HTML ?? ""}\n${detail.Text ?? ""}`.replaceAll("&amp;", "&");
      const links = content.match(/https?:\/\/[^\s"'<>]+/g) ?? [];
      const link = links.find((candidate) => candidate.includes(pathPart));
      if (link) return link;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Geen lokale e-maillink met ${pathPart} gevonden voor ${recipient}.`);
}
