import { PUBLIC_CONTACT_PHONE } from "@/lib/publicContact";

/** Nom affiché sur le site (cohérent avec le footer). */
export const SITE_NAME = "KaruZen Guadeloupe";

/** URL publique du site, sans slash final. À définir en prod : `VITE_SITE_URL=https://www.example.com` */
export function getSiteOrigin(): string {
  return (import.meta.env.VITE_SITE_URL ?? "").replace(/\/$/, "");
}

export const DEFAULT_DESCRIPTION =
  "Coach sportif, madérothérapie, massages bien-être et naturopathie en Guadeloupe. Approche holistique, prise de rendez-vous en ligne. Choisy, Sainte-Claude, 97120.";

export const DEFAULT_KEYWORDS =
  "coach sportif Guadeloupe, massage bien-être, madérothérapie, naturopathie, KaruZen, Sainte-Claude, 97120, rendez-vous, bien-être Basse-Terre";

/** Image absolue pour Open Graph (optionnel). Ex. `https://monsite.com/og.jpg` ou fichier dans `public/og.jpg` + `VITE_SITE_URL`. */
export function getOgImageUrl(): string | undefined {
  const explicit = import.meta.env.VITE_OG_IMAGE_URL?.trim();
  if (explicit) return explicit;
  const origin = getSiteOrigin();
  if (!origin) return undefined;
  return `${origin}/og.jpg`;
}

/** JSON-LD pour la page d’accueil (référence locale). Nécessite `VITE_SITE_URL` en prod. */
export function buildHomeJsonLd(): Record<string, unknown> | null {
  const url = getSiteOrigin();
  if (!url) return null;

  const digits = PUBLIC_CONTACT_PHONE.replace(/\D/g, "");
  const telephone =
    digits.startsWith("590") && digits.length >= 11
      ? `+${digits}`
      : digits.startsWith("0") && digits.length === 10
        ? `+590${digits.slice(1)}`
        : digits
          ? `+${digits}`
          : undefined;

  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    url,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Choisy, Sainte-Claude",
      postalCode: "97120",
      addressRegion: "Guadeloupe",
      addressCountry: "FR",
    },
    areaServed: { "@type": "AdministrativeArea", name: "Guadeloupe" },
    priceRange: "$$",
  };

  if (telephone) {
    base.telephone = telephone;
  }

  return base;
}
