import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/dal";
import { getDefaultPortalPath } from "@/lib/domain/access";

export default async function LegacyMfaPage() {
  const context = await requireUser("/auth/mfa");
  redirect(getDefaultPortalPath(context));
}
