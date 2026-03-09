import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { BookingConfig } from "@/types/booking";
import { DEFAULT_BOOKING_CONFIG } from "@/types/booking";

export function useBookingConfig(): { config: BookingConfig; loading: boolean } {
  const [config, setConfig] = useState<BookingConfig>(DEFAULT_BOOKING_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase
      .from("site_config")
      .select("key, value")
      .in("key", ["prestations", "admin_schedule", "prestation_activity", "slot_duration_minutes", "activity_quota"])
      .then(({ data, error }) => {
        setLoading(false);
        if (error || !data?.length) return;
        const next: BookingConfig = { ...DEFAULT_BOOKING_CONFIG };
        data.forEach((row: { key: string; value: unknown }) => {
          if (row.key === "prestations" && Array.isArray(row.value)) next.prestations = row.value as BookingConfig["prestations"];
          else if (row.key === "admin_schedule" && Array.isArray(row.value)) next.adminSchedule = row.value as BookingConfig["adminSchedule"];
          else if (row.key === "prestation_activity" && row.value && typeof row.value === "object") next.prestationActivity = row.value as BookingConfig["prestationActivity"];
          else if (row.key === "slot_duration_minutes" && typeof row.value === "number") next.slotDurationMinutes = row.value;
          else if (row.key === "activity_quota" && row.value && typeof row.value === "object") next.activityQuota = row.value as BookingConfig["activityQuota"];
        });
        setConfig(next);
      });
  }, []);

  return { config, loading };
}
