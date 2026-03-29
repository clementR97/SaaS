import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { BookingConfig } from "@/types/booking";
import { DEFAULT_BOOKING_CONFIG } from "@/types/booking";
import { parseServicesCardsFromDb } from "@/types/services";
import { cardsToPrestations } from "@/utils/syncServicesToPrestations";

/** Clé partagée : une seule requête `site_config` pour toute l’app (déduplication + cache). */
export const BOOKING_CONFIG_QUERY_KEY = ["site_config"] as const;

const STALE_MS = 5 * 60 * 1000;
const GC_MS = 30 * 60 * 1000;

const CONFIG_KEYS = [
  "prestations",
  "admin_schedule",
  "prestation_activity",
  "slot_duration_minutes",
  "activity_quota",
  "services_cards",
] as const;

async function fetchBookingConfig(): Promise<BookingConfig> {
  if (!supabase) return { ...DEFAULT_BOOKING_CONFIG };
  const { data, error } = await supabase.from("site_config").select("key, value").in("key", [...CONFIG_KEYS]);
  if (error || !data?.length) return { ...DEFAULT_BOOKING_CONFIG };
  const next: BookingConfig = { ...DEFAULT_BOOKING_CONFIG };
  const byKey = Object.fromEntries(data.map((r: { key: string; value: unknown }) => [r.key, r.value]));

  const servicesCardsParsed = parseServicesCardsFromDb(byKey.services_cards);
  if (servicesCardsParsed !== null && servicesCardsParsed.length > 0) {
    next.prestations = cardsToPrestations(servicesCardsParsed);
  } else if (Array.isArray(byKey.prestations)) {
    next.prestations = byKey.prestations as BookingConfig["prestations"];
  }

  if (Array.isArray(byKey.admin_schedule)) next.adminSchedule = byKey.admin_schedule as BookingConfig["adminSchedule"];
  if (byKey.prestation_activity && typeof byKey.prestation_activity === "object" && !Array.isArray(byKey.prestation_activity)) {
    next.prestationActivity = byKey.prestation_activity as BookingConfig["prestationActivity"];
  }
  if (typeof byKey.slot_duration_minutes === "number") next.slotDurationMinutes = byKey.slot_duration_minutes;
  if (byKey.activity_quota && typeof byKey.activity_quota === "object" && !Array.isArray(byKey.activity_quota)) {
    next.activityQuota = byKey.activity_quota as BookingConfig["activityQuota"];
  }

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
