import { mergeBookingModalFlags, type BookingConfig, type ScheduleSlot } from "@/types/booking";
import { isLegacyActivityKey } from "@/types/booking";

/** Migre les configs sauvegardées avec l’ancien modèle (type = sport | massage | …) vers des noms de prestation. */
export function migrateBookingConfig(c: BookingConfig): BookingConfig {
  const names = c.prestations.map((p) => p.name);
  if (names.length === 0) return c;

  let adminSchedule = [...c.adminSchedule];
  let activityQuota = { ...c.activityQuota };
  const pa = c.prestationActivity ?? {};

  const firstType = adminSchedule[0]?.type ?? "";
  const isLegacySchedule = adminSchedule.length > 0 && isLegacyActivityKey(firstType);

  if (isLegacySchedule) {
    const expanded: ScheduleSlot[] = [];
    for (const slot of adminSchedule) {
      if (!isLegacyActivityKey(slot.type)) continue;
      const lt = slot.type as string;
      let matched = false;
      for (const name of names) {
        if (pa[name] === lt) {
          expanded.push({ ...slot, type: name });
          matched = true;
        }
      }
      if (!matched && names[0]) {
        expanded.push({ ...slot, type: names[0] });
      }
    }
    if (expanded.length) adminSchedule = expanded;
  }

  const quotaKeys = Object.keys(activityQuota);
  const isLegacyQuota = quotaKeys.length > 0 && quotaKeys.every((k) => isLegacyActivityKey(k));

  if (isLegacyQuota) {
    const nq: Record<string, number> = {};
    for (const name of names) {
      const t = (pa[name] ?? "sport") as string;
      const v = activityQuota[t];
      nq[name] = typeof v === "number" ? v : 1;
    }
    activityQuota = nq;
  } else {
    for (const name of names) {
      if (activityQuota[name] == null) activityQuota[name] = 1;
    }
    for (const k of Object.keys(activityQuota)) {
      if (!names.includes(k)) delete activityQuota[k];
    }
  }

  const bookingModalFlags = mergeBookingModalFlags(c.prestations, c.bookingModalFlags);

  return {
    ...c,
    adminSchedule,
    activityQuota,
    bookingModalFlags,
  };
}
