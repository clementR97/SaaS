import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

/** Colonnes lues pour le tableau admin (évite `select('*')`). */
export const BOOKINGS_LIST_COLUMNS =
  "id, prenom, nom, telephone, email, date_rdv, heure_rdv, mode_paiement, prestation, session, activity_type, statut_paiement, google_event_id, created_at" as const;

export type BookingRow = {
  id?: string;
  prenom: string;
  nom: string;
  telephone: string;
  email?: string;
  date_rdv: string;
  heure_rdv: string;
  mode_paiement: string;
  prestation: string;
  session: string;
  activity_type?: string | null;
  statut_paiement?: string;
  google_event_id?: string | null;
  created_at?: string;
};
