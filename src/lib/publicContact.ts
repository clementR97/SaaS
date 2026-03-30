export const PUBLIC_INSTAGRAM_URL =
  import.meta.env.VITE_PUBLIC_INSTAGRAM_URL?.trim() ;
  
export const PUBLIC_WHATSAPP_URL =
  import.meta.env.VITE_PUBLIC_WHATSAPP_URL?.trim() ;

/** Numéro affiché pour les appels (footer, modal réservation). Surcharge via `VITE_PUBLIC_PHONE`. */
export const PUBLIC_CONTACT_PHONE =
  import.meta.env.VITE_PUBLIC_PHONE?.trim() ;

/** Lien `tel:` adapté aux mobiles (ex. 06 → +33). */
export function publicContactTelHref(): string {
  const digits = PUBLIC_CONTACT_PHONE.replace(/\D/g, "");
  if (digits.startsWith("590") && digits.length >= 11) return `tel:+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `tel:+590${digits.slice(1)}`;
  return digits ? `tel:${digits}` : "tel:";
}
