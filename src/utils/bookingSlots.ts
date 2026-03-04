import type { ActivityType, ScheduleSlot } from "@/types/booking";

const DEFAULT_SLOT_DURATION = 60;

export type TimeRange = { startHour: number; endHour: number; slotDurationMinutes: number };

export function getTimeRangesForDay(
  schedule: ScheduleSlot[],
  dayOfWeek: number,
  activityType: ActivityType,
  defaultSlotDurationMinutes: number = DEFAULT_SLOT_DURATION,
): TimeRange[] {
  return schedule
    .filter((s) => s.day === dayOfWeek && s.type === activityType)
    .map((s) => ({
      startHour: s.startHour,
      endHour: s.endHour,
      slotDurationMinutes: s.slotDurationMinutes ?? defaultSlotDurationMinutes,
    }));
}

export function isDateDisabledForActivity(
  date: Date,
  activityType: ActivityType,
  schedule: ScheduleSlot[],
  defaultSlotDurationMinutes?: number,
): boolean {
  return getTimeRangesForDay(schedule, date.getDay(), activityType, defaultSlotDurationMinutes).length === 0;
}

export type TimeSlotOption = { value: string; label: string; minutesFromMidnight: number };

export function getTimeSlotsForDate(
  date: Date,
  activityType: ActivityType,
  schedule: ScheduleSlot[],
  defaultSlotDurationMinutes: number = DEFAULT_SLOT_DURATION,
): TimeSlotOption[] {
  const ranges = getTimeRangesForDay(schedule, date.getDay(), activityType, defaultSlotDurationMinutes);
  const seen = new Set<number>();
  const slots: TimeSlotOption[] = [];
  for (const { startHour, endHour, slotDurationMinutes } of ranges) {
    const startMin = startHour * 60;
    const endMin = endHour * 60;
    for (let m = startMin; m < endMin; m += slotDurationMinutes) {
      if (seen.has(m)) continue;
      seen.add(m);
      const h = Math.floor(m / 60);
      const min = m % 60;
      const value = min === 0 ? `${h}h` : `${h}h${String(min).padStart(2, "0")}`;
      const endM = m + slotDurationMinutes;
      const endH = Math.floor(endM / 60);
      const endMinPart = endM % 60;
      const endLabel = endMinPart === 0 ? `${endH}h` : `${endH}h${String(endMinPart).padStart(2, "0")}`;
      slots.push({ value, label: `${value} - ${endLabel}`, minutesFromMidnight: m });
    }
  }
  slots.sort((a, b) => a.minutesFromMidnight - b.minutesFromMidnight);
  return slots;
}
