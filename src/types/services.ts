export type ServiceImageKey = "coaching" | "madero" | "massage" | "naturo" | "zen";

export type ServiceSessions =
  | { kind: "simple"; items: { name: string; price: string }[] }
  | { kind: "madero"; items: { name: string; zone1: string; zone2: string }[] }
  | { kind: "zen"; packs: { name: string; price: string; descriptionItems: string[] }[] }
  | { kind: "empty" };

export type ServiceCardConfig = {
  id: string;
  title: string;
  description: string;
  alt: string;
  imageKey: ServiceImageKey;
  flippable: boolean;
  backTitle: string;
  sessions: ServiceSessions;
};

const IMAGE_KEYS: ServiceImageKey[] = ["coaching", "madero", "massage", "naturo", "zen"];

function isImageKey(x: unknown): x is ServiceImageKey {
  return typeof x === "string" && IMAGE_KEYS.includes(x as ServiceImageKey);
}

function parseSessions(raw: unknown): ServiceSessions | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as { kind?: string; items?: unknown; packs?: unknown };
  if (o.kind === "empty") return { kind: "empty" };
  if (o.kind === "simple" && Array.isArray(o.items)) {
    const items = o.items
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const r = row as { name?: unknown; price?: unknown };
        if (typeof r.name !== "string" || typeof r.price !== "string") return null;
        return { name: r.name, price: r.price };
      })
      .filter((x): x is { name: string; price: string } => x != null);
    return { kind: "simple", items };
  }
  if (o.kind === "madero" && Array.isArray(o.items)) {
    const items = o.items
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const r = row as { name?: unknown; zone1?: unknown; zone2?: unknown };
        if (typeof r.name !== "string" || typeof r.zone1 !== "string" || typeof r.zone2 !== "string") return null;
        return { name: r.name, zone1: r.zone1, zone2: r.zone2 };
      })
      .filter((x): x is { name: string; zone1: string; zone2: string } => x != null);
    return { kind: "madero", items };
  }
  if (o.kind === "zen" && Array.isArray(o.packs)) {
    const packs = o.packs
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const r = row as { name?: unknown; price?: unknown; descriptionItems?: unknown };
        if (typeof r.name !== "string" || typeof r.price !== "string") return null;
        const di = r.descriptionItems;
        const descriptionItems = Array.isArray(di)
          ? di.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
          : [];
        return { name: r.name, price: r.price, descriptionItems };
      })
      .filter((x): x is { name: string; price: string; descriptionItems: string[] } => x != null);
    return { kind: "zen", packs };
  }
  return null;
}

function parseCard(raw: unknown): ServiceCardConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id.trim()) return null;
  if (typeof o.title !== "string") return null;
  if (typeof o.description !== "string") return null;
  if (typeof o.alt !== "string") return null;
  if (!isImageKey(o.imageKey)) return null;
  if (typeof o.flippable !== "boolean") return null;
  if (typeof o.backTitle !== "string") return null;
  const sessions = parseSessions(o.sessions);
  if (!sessions) return null;
  return {
    id: o.id,
    title: o.title,
    description: o.description,
    alt: o.alt,
    imageKey: o.imageKey,
    flippable: o.flippable,
    backTitle: o.backTitle,
    sessions,
  };
}

/** Retourne null si JSON invalide → l’app utilisera les défauts. */
export function parseServicesCardsFromDb(value: unknown): ServiceCardConfig[] | null {
  if (!Array.isArray(value)) return null;
  const out: ServiceCardConfig[] = [];
  for (const row of value) {
    const c = parseCard(row);
    if (c) out.push(c);
  }
  return out.length > 0 ? out : [];
}

export const DEFAULT_SERVICES_CARDS: ServiceCardConfig[] = [
  {
    id: "default-coaching",
    title: "Coaching sportif personnalisé",
    description:
      "Des séances sur mesure adaptées à vos objectifs : remise en forme, perte de poids, renforcement musculaire ou préparation physique.",
    alt: "Coaching sportif en extérieur",
    imageKey: "coaching",
    flippable: true,
    backTitle: "La séance de coaching",
    sessions: {
      kind: "simple",
      items: [
        { name: "Coaching", price: "30€/h" },
        { name: "Cure minceur", price: "sur devis" },
        { name: "Intervention en entreprise", price: "sur devis" },
      ],
    },
  },
  {
    id: "default-madero",
    title: "Madérothérapie",
    description:
      "Technique naturelle utilisant des instruments en bois pour stimuler le drainage, réduire la cellulite et tonifier la silhouette.",
    alt: "Outils de madérothérapie en bois",
    imageKey: "madero",
    flippable: true,
    backTitle: "Nos séances madérothérapie",
    sessions: {
      kind: "madero",
      items: [
        { name: "séance découverte", zone1: "50€", zone2: "—" },
        { name: "1 séance", zone1: "60€", zone2: "100€" },
        { name: "4 séances", zone1: "220€", zone2: "380€" },
        { name: "8 séances", zone1: "450€", zone2: "780€" },
        { name: "14 séances", zone1: "800€", zone2: "1350€" },
      ],
    },
  },
  {
    id: "default-massage",
    title: "Massage bien-être",
    description:
      "Des massages relaxants et revitalisants pour libérer les tensions, réduire le stress et retrouver une harmonie corps-esprit.",
    alt: "Pierres chaudes et huiles essentielles pour massage",
    imageKey: "massage",
    flippable: true,
    backTitle: "Nos séances massage",
    sessions: {
      kind: "simple",
      items: [
        { name: "Fwotman 35min (sportif)", price: "45€" },
        { name: "Karu'zen 1h (relaxant)", price: "65€" },
        { name: "Californien 1h (relaxant)", price: "65€" },
        { name: "Reflexologie plantaire 30min", price: "30€" },
        { name: "Amma assis (relaxant)", price: "25€" },
      ],
    },
  },
  {
    id: "default-naturo",
    title: "Naturopathie",
    description:
      "Un accompagnement en hygiène de vie, alimentation et remèdes naturels pour renforcer votre vitalité et prévenir les déséquilibres.",
    alt: "Herbes et remèdes naturels de naturopathie",
    imageKey: "naturo",
    flippable: true,
    backTitle: "Nos séances Naturopathie",
    sessions: { kind: "empty" },
  },
  {
    id: "default-zen",
    title: "Pack Zen",
    description: "Un pack de 3 qui vous permet de profiter de tous nos soins pour un moment de détente et de bien-être.",
    alt: "Pack Zen",
    imageKey: "zen",
    flippable: true,
    backTitle: "Nos packs Zen",
    sessions: {
      kind: "zen",
      packs: [
        {
          name: "Zen Standard (4 semaines)",
          price: "170€",
          descriptionItems: [
            "1 bilan initial",
            "1 séance encadrée par semaine",
            "Conseils nutritionnels",
            "1 massage Fwotman",
          ],
        },
        {
          name: "Zen Premium (4 semaines)",
          price: "300€",
          descriptionItems: [
            "1 bilan initial et naturopathie",
            "1 suivi naturopathie",
            "2 séances encadrées par semaine",
            "Conseils nutritionnels",
            "Suivi renforcé (massages)",
            "2 massages au choix",
            "Accès prioritaire sur les créneaux",
          ],
        },
      ],
    },
  },
];

export function newServiceCard(partial?: Partial<Pick<ServiceCardConfig, "title">>): ServiceCardConfig {
  return {
    id: crypto.randomUUID(),
    title: partial?.title ?? "Nouvelle prestation",
    description: "",
    alt: "",
    imageKey: "coaching",
    flippable: true,
    backTitle: "Tarifs",
    sessions: { kind: "simple", items: [{ name: "Séance", price: "—" }] },
  };
}
