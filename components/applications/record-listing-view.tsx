"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";
export function RecordListingView({ listingId }: { listingId: string }) {
  useEffect(() => { const client = createClient(); void client.rpc("record_dealer_listing_view", { p_listing_id: listingId }); }, [listingId]);
  return <p className="mt-3 text-xs text-slate-500">Bij het openen wordt voor Thijs geregistreerd dat jouw garage deze auto heeft bekeken.</p>;
}
