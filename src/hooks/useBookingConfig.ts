import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { BookingConfig } from "@/types/booking";
import { DEFAULT_BOOKING_CONFIG } from "@/types/booking";

/** Clé partagée : une seule requête `site_config` pour toute l’app (déduplication + cache). */
export const BOOKING_CONFIG_QUERY_KEY = ["site_config"] as const;

const STALE_MS = 5 * 60 * 1000;
const GC_MS = 30 * 60 * 1000;

async function fetchBookingConfig(): Promise<BookingConfig> {
  if (!supabase) return { ...DEFAULT_BOOKING_CONFIG };
  const { data, error } = await supabase
    .from("site_config")
    .select("key, value")
    .in("key", ["prestations", "admin_schedule", "prestation_activity", "slot_duration_minutes", "activity_quota"]);
  if (error || !data?.length) return { ...DEFAULT_BOOKING_CONFIG };
  const next: BookingConfig = { ...DEFAULT_BOOKING_CONFIG };
  data.forEach((row: { key: string; value: unknown }) => {
    if (row.key === "prestations" && Array.isArray(row.value)) next.prestations = row.value as BookingConfig["prestations"];
    else if (row.key === "admin_schedule" && Array.isArray(row.value)) next.adminSchedule = row.value as BookingConfig["adminSchedule"];
    else if (row.key === "prestation_activity" && row.value && typeof row.value === "object") next.prestationActivity = row.value as BookingConfig["prestationActivity"];
    else if (row.key === "slot_duration_minutes" && typeof row.value === "number") next.slotDurationMinutes = row.value;
    else if (row.key === "activity_quota" && row.value && typeof row.value === "object") next.activityQuota = row.value as BookingConfig["activityQuota"];
  });
  return next;
}

export function useBookingConfig(): { config: BookingConfig; loading: boolean } {
  const { data, isPending } = useQuery({
    queryKey: BOOKING_CONFIG_QUERY_KEY,
    queryFn: fetchBookingConfig,
    staleTime: STALE_MS,
    gcTime: GC_MS,
    enabled: !!supabase,
  });
  const config = data ?? DEFAULT_BOOKING_CONFIG;
  const loading = !!supabase && isPending;
  return { config, loading };
}
