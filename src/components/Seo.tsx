import { useEffect } from "react";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  getOgImageUrl,
  getSiteOrigin,
  SITE_NAME,
} from "@/lib/seo";

type SeoProps = {
  /** Titre court (suffixe « | KaruZen Guadeloupe » ajouté si absent du nom du site). */
  title: string;
  description?: string;
  /** Chemin commençant par / (ex. `/admin`). Utilisé pour canonical et og:url. */
  path?: string;
  /** À désactiver sur les pages 404 (évite un canonical trompeur). */
  includeCanonical?: boolean;
  /** Pages admin / erreurs : masquage moteurs de recherche. */
  noindex?: boolean;
  /** Données structurées JSON-LD (ex. LocalBusiness sur l’accueil). */
  jsonLd?: Record<string, unknown> | null;
};

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  const selector = `link[rel="${rel}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function buildPageTitle(title: string): string {
  const t = title.trim();
  if (t.includes(SITE_NAME)) return t;
  return `${t} | ${SITE_NAME}`;
}

export function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "",
  includeCanonical = true,
  noindex = false,
  jsonLd = null,
}: SeoProps) {
  const origin = getSiteOrigin();
  const pageTitle = buildPageTitle(title);
  const canonical =
    includeCanonical && origin
      ? `${origin}${path === "" ? "/" : path.startsWith("/") ? path : `/${path}`}`
      : "";
  const ogImage = getOgImageUrl();

  useEffect(() => {
    document.title = pageTitle;

    upsertMeta("name", "description", description);
    upsertMeta("name", "keywords", DEFAULT_KEYWORDS);

    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:title", pageTitle);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:locale", "fr_FR");

    if (canonical) {
      upsertMeta("property", "og:url", canonical);
      upsertLink("canonical", canonical);
    } else {
      document.head.querySelector('link[rel="canonical"]')?.remove();
      document.head.querySelector('meta[property="og:url"]')?.remove();
    }

    if (ogImage) {
      upsertMeta("property", "og:image", ogImage);
    } else {
      document.head.querySelector('meta[property="og:image"]')?.remove();
      document.head.querySelector('meta[name="twitter:image"]')?.remove();
    }

    upsertMeta("name", "twitter:card", ogImage ? "summary_large_image" : "summary");
    upsertMeta("name", "twitter:title", pageTitle);
    upsertMeta("name", "twitter:description", description);
    if (ogImage) {
      upsertMeta("name", "twitter:image", ogImage);
    }

    if (noindex) {
      upsertMeta("name", "robots", "noindex, nofollow");
    } else {
      upsertMeta("name", "robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
    }
  }, [pageTitle, description, canonical, noindex, ogImage]);

  useEffect(() => {
    const id = "seo-jsonld";
    document.getElementById(id)?.remove();
    if (!jsonLd) return;
    const script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => {
      document.getElementById(id)?.remove();
    };
  }, [jsonLd]);

  return null;
}
