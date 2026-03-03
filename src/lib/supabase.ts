import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export type BookingRow = {
  id?: string;
  prenom: string;
  nom: string;
  telephone: string;
  date_rdv: string;
  heure_rdv: string;
  mode_paiement: string;
  prestation: string;
  session: string;
  created_at?: string;
};
