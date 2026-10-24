type DeploymentEnvironment = Record<string, string | undefined>;

const REQUIRED_PREVIEW_VALUES = [
  "APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DRAFT_TOKEN_SECRET",
  "REQUEST_FINGERPRINT_SECRET",
  "OPERATIONS_JOB_SECRET",
] as const;

const PRIVATE_SECRET_NAMES = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "DRAFT_TOKEN_SECRET",
  "REQUEST_FINGERPRINT_SECRET",
  "OPERATIONS_JOB_SECRET",
] as const;

function isPlaceholder(value: string) {
  return /^<.*>$/.test(value) || /placeholder|change[-_ ]?me|vul[-_ ]?in/i.test(value);
}

function parseHttpsOrigin(name: string, value: string, errors: string[]) {
  try {
    const parsed = new URL(value);
    if (
      parsed.protocol !== "https:" ||
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    ) {
      errors.push(`${name} moet een HTTPS-origin zonder pad, query of inloggegevens zijn.`);
    }
    if (["localhost", "127.0.0.1", "0.0.0.0"].includes(parsed.hostname)) {
      errors.push(`${name} mag bij een Vercel-deployment niet naar de lokale computer wijzen.`);
    }
  } catch {
    errors.push(`${name} is geen geldige URL.`);
  }
}

export function getVercelDeploymentEnvironmentErrors(env: DeploymentEnvironment) {
  if (env.VERCEL !== "1") return [];

  const errors: string[] = [];
  const vercelEnvironment = env.VERCEL_ENV;
  if (!vercelEnvironment || !["preview", "production", "development"].includes(vercelEnvironment)) {
    errors.push("VERCEL_ENV ontbreekt of heeft een onbekende waarde.");
  }

  for (const name of REQUIRED_PREVIEW_VALUES) {
    const value = env[name]?.trim();
    if (!value || isPlaceholder(value)) errors.push(`${name} ontbreekt of bevat nog een voorbeeldwaarde.`);
  }

  if (env.APP_URL) parseHttpsOrigin("APP_URL", env.APP_URL, errors);
  if (env.NEXT_PUBLIC_SUPABASE_URL) {
    parseHttpsOrigin("NEXT_PUBLIC_SUPABASE_URL", env.NEXT_PUBLIC_SUPABASE_URL, errors);
  }

  for (const name of PRIVATE_SECRET_NAMES) {
    const value = env[name]?.trim();
    if (value && value.length < 32) errors.push(`${name} moet minimaal 32 tekens bevatten.`);
  }

  const secretValues = PRIVATE_SECRET_NAMES
    .map((name) => [name, env[name]?.trim()] as const)
    .filter((entry): entry is readonly [typeof PRIVATE_SECRET_NAMES[number], string] => Boolean(entry[1]));
  for (let left = 0; left < secretValues.length; left += 1) {
    for (let right = left + 1; right < secretValues.length; right += 1) {
      if (secretValues[left][1] === secretValues[right][1]) {
        errors.push(`${secretValues[left][0]} en ${secretValues[right][0]} moeten verschillende waarden hebben.`);
      }
    }
  }

  if (
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY === env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    errors.push("De publieke Supabase-sleutel mag nooit gelijk zijn aan de service-role-sleutel.");
  }

  if (env.PAYMENT_SIMULATOR_ENABLED === "true") {
    errors.push("PAYMENT_SIMULATOR_ENABLED moet op Vercel uitgeschakeld blijven.");
  }

  if (env.OUTBOX_DELIVERY_ENABLED === "true" && !env.RESEND_API_KEY) {
    errors.push("Actieve e-mailbezorging vereist RESEND_API_KEY.");
  }

  if (vercelEnvironment === "production" && env.PRODUCTION_DEPLOYMENT_APPROVED !== "true") {
    errors.push("Productiedeployment is geblokkeerd totdat PRODUCTION_DEPLOYMENT_APPROVED expliciet true is.");
  }

  return errors;
}

export function assertVercelDeploymentEnvironment(env: DeploymentEnvironment) {
  const errors = getVercelDeploymentEnvironmentErrors(env);
  if (errors.length > 0) {
    throw new Error(`Vercel-configuratie is niet veilig:\n- ${errors.join("\n- ")}`);
  }
}
