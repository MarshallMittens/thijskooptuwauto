import "server-only";

type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
};

type SupabaseAdminConfig = SupabasePublicConfig & {
  serviceRoleKey: string;
};

export function getSupabasePublicConfig(): SupabasePublicConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Supabase is nog niet ingesteld. Kopieer .env.example naar .env.local en vul de lokale waarden in.",
    );
  }

  return { url, publishableKey };
}

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function getSupabaseAdminConfig(): SupabaseAdminConfig {
  const publicConfig = getSupabasePublicConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is niet ingesteld voor serveropdrachten.");
  }

  return { ...publicConfig, serviceRoleKey };
}
