/** Ancien modèle : 4 types techniques (migration uniquement). */
export type ActivityType = "sport" | "naturopathie" | "massage" | "madero";

const LEGACY_ACTIVITY_TYPES: ActivityType[] = ["sport", "naturopathie", "massage", "madero"];

export function isLegacyActivityKey(s: string): s is ActivityType {
  return LEGACY_ACTIVITY_TYPES.includes(s as ActivityType);
}

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
  /** Nom exact de la prestation (comme dans « Cartes services » / formulaire). */
  type: string;
  startHour: number;
  endHour: number;
  /** Durée d'une séance en minutes pour ce créneau (ex: 35). Si absent, utilise slotDurationMinutes global. */
  slotDurationMinutes?: number;
}

/** Quota max de RDV au même créneau (même date, même heure), par nom de prestation. */
export type PrestationQuota = Record<string, number>;

export interface BookingModalFlags {
  /** Bloc « Me contacter ou plus d'informations » en tête de l’étape prestations. */
  showContactBlock: boolean;
  /** Par nom de prestation (titres des cartes services). Absent ou `true` = affiché dans le modal ; `false` = masqué. */
  prestationModalVisibility?: Record<string, boolean>;
}

/** Fusionne les préférences modal avec la liste courante des prestations. Nouvelle carte → visible par défaut. */
export function mergeBookingModalFlags(
  prestations: PrestationOption[],
  raw?: Partial<BookingModalFlags> | null,
): BookingModalFlags {
  const vis: Record<string, boolean> = {};
  for (const p of prestations) {
    vis[p.name] = raw?.prestationModalVisibility?.[p.name] !== false;
  }
  return {
    showContactBlock: raw?.showContactBlock !== false,
    prestationModalVisibility: vis,
  };
}

export interface BookingConfig {
  prestations: PrestationOption[];
  adminSchedule: ScheduleSlot[];
  /** Ancien mapping prestation → type technique ; utilisé seulement pour migrer les configs stockées avant le modèle « tout par prestation ». */
  prestationActivity?: Record<string, ActivityType>;
  slotDurationMinutes: number;
  /** Quota par nom de prestation. */
  activityQuota: PrestationQuota;
  bookingModalFlags?: BookingModalFlags;
}

export const DEFAULT_BOOKING_CONFIG: BookingConfig = {
  slotDurationMinutes: 60,
  bookingModalFlags: { showContactBlock: true },
  prestations: [
    { name: "Coaching sportif personnalisé", sessions: [{ name: "Séance individuelle 1h", price: "60 €" }, { name: "Pack 5 séances", price: "270 €" }, { name: "Pack 10 séances", price: "500 €" }] },
    { name: "Madérothérapie", sessions: [{ name: "Séance madérothérapie corps", price: "80 €" }, { name: "Séance madérothérapie ventre", price: "50 €" }, { name: "Séance madérothérapie cuisses & fessiers", price: "65 €" }, { name: "Cure 5 séances corps", price: "350 €" }, { name: "Cure 10 séances corps", price: "650 €" }] },
    { name: "Massage bien-être", sessions: [{ name: "Massage relaxant corps entier", price: "70 €" }, { name: "Massage dos & nuque", price: "40 €" }, { name: "Massage sportif récupération", price: "75 €" }, { name: "Massage aux pierres chaudes", price: "85 €" }, { name: "Massage drainant jambes légères", price: "55 €" }, { name: "Massage visage & crâne", price: "35 €" }] },
    { name: "Naturopathie", sessions: [{ name: "Consultation initiale 1h30", price: "80 €" }, { name: "Consultation de suivi 1h", price: "55 €" }] },
  ],
  adminSchedule: [
    { day: 1, type: "Coaching sportif personnalisé", startHour: 9, endHour: 19, slotDurationMinutes: 60 },
    { day: 2, type: "Coaching sportif personnalisé", startHour: 9, endHour: 19, slotDurationMinutes: 60 },
    { day: 3, type: "Naturopathie", startHour: 9, endHour: 19, slotDurationMinutes: 60 },
    { day: 4, type: "Naturopathie", startHour: 9, endHour: 12, slotDurationMinutes: 60 },
    { day: 4, type: "Coaching sportif personnalisé", startHour: 12, endHour: 19, slotDurationMinutes: 60 },
    { day: 5, type: "Massage bien-être", startHour: 9, endHour: 19, slotDurationMinutes: 60 },
    { day: 6, type: "Massage bien-être", startHour: 14, endHour: 19, slotDurationMinutes: 60 },
  ],
  activityQuota: {
    "Coaching sportif personnalisé": 1,
    Madérothérapie: 1,
    "Massage bien-être": 1,
    Naturopathie: 1,
  },
};
