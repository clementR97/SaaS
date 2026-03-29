/** Numéro affiché pour les appels (footer, modal réservation). Surcharge via `VITE_PUBLIC_PHONE`. */
export const PUBLIC_CONTACT_PHONE =
  import.meta.env.VITE_PUBLIC_PHONE?.trim() || "06 12 34 56 78";

/** Lien `tel:` adapté aux mobiles (ex. 06 → +33). */
export function publicContactTelHref(): string {
  const digits = PUBLIC_CONTACT_PHONE.replace(/\D/g, "");
  if (digits.startsWith("33") && digits.length >= 11) return `tel:+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `tel:+33${digits.slice(1)}`;
  return digits ? `tel:${digits}` : "tel:";
}
