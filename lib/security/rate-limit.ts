import "server-only";

import { createRateLimitActorKey } from "@/lib/security/public-request";
import { createAdminClient } from "@/lib/supabase/admin";

export async function consumePublicRateLimit(
  request: Request,
  scope: "form_start" | "rdw_lookup",
  maximum: number,
) {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("consume_public_rate_limit", {
      p_actor_key: createRateLimitActorKey(request),
      p_scope: scope,
      p_max_attempts: maximum,
    });
    if (error) throw error;
    return data === true;
  } catch (error) {
    if (process.env.NODE_ENV === "development") return true;
    throw error;
  }
}
