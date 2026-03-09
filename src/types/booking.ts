export type ActivityType = "sport" | "naturopathie" | "massage" | "madero";

export interface SessionOption {
  name: string;
  price: string;
}

export interface PrestationOption {
  name: string;
  sessions: SessionOption[];
}

export interface ScheduleSlot {
  day: number;
  type: ActivityType;
  startHour: number;
  endHour: number;
  /** Durée d'une séance en minutes pour ce créneau (ex: 35). Si absent, utilise slotDurationMinutes global. */
  slotDurationMinutes?: number;
}

/** Quota max de clients par créneau (même date, même heure) par type d'activité. Ex: sport 2 = 2 RDV possibles à 9h. */
export type ActivityQuota = Record<ActivityType, number>;

export interface BookingConfig {
  prestations: PrestationOption[];
  adminSchedule: ScheduleSlot[];
  prestationActivity: Record<string, ActivityType>;
  slotDurationMinutes: number;
  /** Quota par type d'activité (nombre max de réservations au même créneau). */
  activityQuota: ActivityQuota;
}

export const DEFAULT_BOOKING_CONFIG: BookingConfig = {
  slotDurationMinutes: 60,
  prestations: [
    { name: "Coaching sportif personnalisé", sessions: [{ name: "Séance individuelle 1h", price: "60 €" }, { name: "Pack 5 séances", price: "270 €" }, { name: "Pack 10 séances", price: "500 €" }] },
    { name: "Madérothérapie", sessions: [{ name: "Séance madérothérapie corps", price: "80 €" }, { name: "Séance madérothérapie ventre", price: "50 €" }, { name: "Séance madérothérapie cuisses & fessiers", price: "65 €" }, { name: "Cure 5 séances corps", price: "350 €" }, { name: "Cure 10 séances corps", price: "650 €" }] },
    { name: "Massage bien-être", sessions: [{ name: "Massage relaxant corps entier", price: "70 €" }, { name: "Massage dos & nuque", price: "40 €" }, { name: "Massage sportif récupération", price: "75 €" }, { name: "Massage aux pierres chaudes", price: "85 €" }, { name: "Massage drainant jambes légères", price: "55 €" }, { name: "Massage visage & crâne", price: "35 €" }] },
    { name: "Naturopathie", sessions: [{ name: "Consultation initiale 1h30", price: "80 €" }, { name: "Consultation de suivi 1h", price: "55 €" }] },
  ],
  adminSchedule: [
    { day: 1, type: "sport", startHour: 9, endHour: 19, slotDurationMinutes: 60 },
    { day: 2, type: "sport", startHour: 9, endHour: 19, slotDurationMinutes: 60 },
    { day: 3, type: "naturopathie", startHour: 9, endHour: 19, slotDurationMinutes: 60 },
    { day: 4, type: "naturopathie", startHour: 9, endHour: 12, slotDurationMinutes: 60 },
    { day: 4, type: "sport", startHour: 12, endHour: 19, slotDurationMinutes: 60 },
    { day: 5, type: "massage", startHour: 9, endHour: 19, slotDurationMinutes: 60 },
    { day: 6, type: "massage", startHour: 14, endHour: 19, slotDurationMinutes: 60 },
  ],
  prestationActivity: {
    "Coaching sportif personnalisé": "sport",
    "Madérothérapie": "madero",
    "Massage bien-être": "massage",
    "Naturopathie": "naturopathie",
  },
  activityQuota: { sport: 1, naturopathie: 1, massage: 1, madero: 1 },
};
