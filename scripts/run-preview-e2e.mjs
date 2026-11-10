import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const baseUrl = process.env.E2E_BASE_URL;
if (!baseUrl) {
  console.error("E2E_BASE_URL ontbreekt. Gebruik de HTTPS-URL van de Vercel Preview.");
  process.exit(1);
}

let parsed;
try {
  parsed = new URL(baseUrl);
} catch {
  console.error("E2E_BASE_URL is geen geldige URL.");
  process.exit(1);
}

if (
  parsed.protocol !== "https:" ||
  ["localhost", "127.0.0.1", "0.0.0.0"].includes(parsed.hostname)
) {
  console.error("De previewtest accepteert uitsluitend een externe HTTPS-URL.");
  process.exit(1);
}

const playwrightCli = createRequire(import.meta.url).resolve("@playwright/test/cli");
const child = spawn(
  process.execPath,
  [playwrightCli, "test", "e2e/public-and-access.spec.ts"],
  { stdio: "inherit", env: process.env },
);

child.on("error", (error) => {
  console.error(`De previewtest kon niet starten: ${error.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`De previewtest stopte door signaal ${signal}.`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});
