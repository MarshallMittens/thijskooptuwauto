import "server-only";

import { getAccessContext } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

/** Keep identities on the server and use the session's existing RLS permissions. */
export async function getAdminBidderNames(roundId: string): Promise<Map<string, string> | null> {
  const context = await getAccessContext();
  if (!context?.isStaff || context.staffRole !== "admin") return null;

  const names = new Map<string, string>();
  const client = await createClient();
  const { data: bids, error: bidsError } = await client.from("bids").select("id, company_id").eq("bid_round_id", roundId);
  if (bidsError || !bids?.length) return names;

  const companyIds = [...new Set(bids.map((bid) => bid.company_id))];
  const { data: companies, error: companiesError } = await client.from("companies").select("id, legal_name, trade_name").in("id", companyIds);
  if (companiesError || !companies) return names;

  const companyNames = new Map(companies.map((company) => [company.id, company.trade_name?.trim() || company.legal_name]));
  for (const bid of bids) {
    const companyName = companyNames.get(bid.company_id);
    if (companyName) names.set(bid.id, companyName);
  }
  return names;
}
