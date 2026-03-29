import type { ActivityType, PrestationOption, SessionOption } from "@/types/booking";
import type { ServiceCardConfig, ServiceImageKey } from "@/types/services";

/** Déduit le type d’activité pour l’emploi du temps à partir de la photo choisie sur la carte. */
export function inferActivityFromImageKey(imageKey: ServiceImageKey): ActivityType {
  switch (imageKey) {
    case "coaching":
      return "sport";
    case "madero":
      return "madero";
    case "massage":
    case "zen":
      return "massage";
    case "naturo":
      return "naturopathie";
    default:
      return "sport";
  }
}

/** Transforme les cartes services en liste utilisée par le formulaire de réservation. */
export function cardsToPrestations(cards: ServiceCardConfig[]): PrestationOption[] {
  return cards.map((card) => {
    const name = card.title.trim() || "Prestation";
    let sessions: SessionOption[] = [];
    switch (card.sessions.kind) {
      case "simple":
        sessions = card.sessions.items.map((x) => ({ name: x.name, price: x.price }));
        break;
      case "madero":
        sessions = card.sessions.items.map((x) => ({
          name: x.name,
          price: `Z1 ${x.zone1} · Z2 ${x.zone2}`,
        }));
        break;
      case "zen":
        sessions = card.sessions.packs.map((p) => ({ name: p.name, price: p.price }));
        break;
      case "empty":
        sessions = [{ name: "Sur demande", price: "—" }];
        break;
      default:
        sessions = [{ name: "Séance", price: "—" }];
    }
    if (sessions.length === 0) {
      sessions = [{ name: "Séance", price: "—" }];
    }
    return { name, sessions };
  });
}

/** Conserve les associations existantes quand le nom de prestation ne change pas ; sinon infère depuis l’image. */
export function mergePrestationActivityFromCards(
  cards: ServiceCardConfig[],
  existing: Record<string, ActivityType>,
): Record<string, ActivityType> {
  const next: Record<string, ActivityType> = {};
  for (const c of cards) {
    const title = c.title.trim();
    if (!title) continue;
    next[title] = existing[title] ?? inferActivityFromImageKey(c.imageKey);
  }
  return next;
}
