import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { extname } from "node:path";

const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);
const findings = [];
const forbiddenNames = /(^|\/)(\.env($|\.)|[^/]+\.(pem|key|p12|pfx))$/i;
const allowedEnvironmentExample = ".env.example";
const textExtensions = new Set([
  "", ".css", ".html", ".js", ".json", ".jsx", ".md", ".mjs", ".sql", ".ts", ".tsx", ".txt", ".yaml", ".yml",
]);
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bsb_secret_[A-Za-z0-9_-]{12,}\b/,
  /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/,
  /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/,
  /(?:SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY|PAYMENT_SIMULATOR_WEBHOOK_SECRET|OPERATIONS_JOB_SECRET)\s*=\s*(?!\s*(?:$|<))[^\s#]{12,}/,
];

for (const path of tracked) {
  const normalized = path.replaceAll("\\", "/");
  if (normalized !== allowedEnvironmentExample && forbiddenNames.test(normalized)) {
    findings.push(`${normalized}: verboden geheim- of omgevingsbestand`);
    continue;
  }
  if (!textExtensions.has(extname(normalized).toLowerCase()) || statSync(path).size > 2_000_000) continue;
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    if (secretPatterns.some((pattern) => pattern.test(line))) {
      findings.push(`${normalized}:${index + 1}: mogelijk geheim sleutelpatroon`);
    }
  });
}

if (findings.length > 0) {
  console.error("Repositorycontrole geweigerd. Waarden worden bewust niet weergegeven:");
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exit(1);
}

console.log(`Repositorycontrole geslaagd voor ${tracked.length} bijgehouden bestanden.`);
