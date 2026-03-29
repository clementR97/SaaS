import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  DEFAULT_SERVICES_CARDS,
  parseServicesCardsFromDb,
  type ServiceCardConfig,
} from "@/types/services";

export const SERVICES_CARDS_QUERY_KEY = ["site_config", "services_cards"] as const;

const STALE_MS = 5 * 60 * 1000;
const GC_MS = 30 * 60 * 1000;

async function fetchServicesCards(): Promise<ServiceCardConfig[]> {
  if (!supabase) return DEFAULT_SERVICES_CARDS;
  const { data, error } = await supabase.from("site_config").select("value").eq("key", "services_cards").maybeSingle();
  if (error || data?.value == null) return DEFAULT_SERVICES_CARDS;
  const parsed = parseServicesCardsFromDb(data.value);
  if (!parsed || parsed.length === 0) return DEFAULT_SERVICES_CARDS;
  return parsed;
}

export function useServicesCards(): { cards: ServiceCardConfig[]; loading: boolean } {
  const { data, isPending } = useQuery({
    queryKey: SERVICES_CARDS_QUERY_KEY,
    queryFn: fetchServicesCards,
    staleTime: STALE_MS,
    gcTime: GC_MS,
    enabled: !!supabase,
  });
  const cards = data ?? DEFAULT_SERVICES_CARDS;
  const loading = !!supabase && isPending;
  return { cards, loading };
}
