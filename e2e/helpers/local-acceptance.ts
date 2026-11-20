import type { Page } from "@playwright/test";

export async function signIn(page: Page, email: string, password: string, returnTo: string) {
  await page.goto(`/inloggen?returnTo=${encodeURIComponent(returnTo)}`);
  await page.getByLabel("E-mailadres").fill(email);
  await page.getByLabel("Wachtwoord").fill(password);
  await page.getByRole("button", { name: "Inloggen" }).click();
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
