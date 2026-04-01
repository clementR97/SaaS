# Contexte projet — à coller dans ChatGPT (ou autre LLM)

Document de synthèse : **rôle du projet**, **stack**, **structure**, **données**, **déploiement**.  
Repo interne : `quentin` (nom package npm).

---

## 1. À quoi sert ce projet

Application **web** (SPA) pour un **professionnel du bien-être** (coaching, massage, madérothérapie, naturopathie, etc.) — branding type **KaruZen Guadeloupe**.

- **Site vitrine** : sections accueil, à propos, services (cartes configurables), bénéfices, méthode, témoignages, CTA, footer contact.
- **Prise de rendez-vous en ligne** : modal multi-étapes (prestation → séance → date/créneau selon emploi du temps → coordonnées → confirmation). Créneaux avec **quota** par type d’activité ; créneaux complets masqués.
- **Back-office** (`/admin`) : authentification Supabase ; tableau des réservations à venir ; édition date/heure et statut de paiement ; onglets de **configuration** (prestations / horaires / cartes services).
- **Données** : PostgreSQL via **Supabase** (table `bookings`, table `site_config`, etc.).
- **Optionnel** : sync **Google Calendar** (Edge Function + webhooks DB) ; **avis Google** (Edge Function Places API + `VITE_ENABLE_GOOGLE_REVIEWS`).
- **SEO** : meta dynamiques (`Seo.tsx`), JSON-LD sur l’accueil, `robots.txt`, favicon depuis `public/`.

Fuseau horaire métier dans la logique calendrier : **America/Guadeloupe** (UTC-4 fixe dans l’Edge Function Calendar).

---

## 2. Langages et technologies

| Couche | Technologie |
|--------|-------------|
| Langage principal | **TypeScript** |
| UI | **React 19** (composants fonctionnels) |
| Build / dev server | **Vite 7** |
| Styles | **Tailwind CSS 4** (+ `tailwindcss-animate`, `tailwind-merge`) |
| Composants UI | **Radix UI** (shadcn-style sous `src/components/ui/`) |
| Routing | **react-router-dom** v7 |
| Données serveur (cache) | **TanStack Query** (ex. config réservation, cartes services) |
| Animations | **Framer Motion** |
| Icônes | **lucide-react** |
| Formulaires / calendrier UI | **react-hook-form**, **react-day-picker** |
| Backend BaaS | **Supabase** : PostgreSQL, Auth, Row Level Security, **Edge Functions** (Deno) |
| Google (optionnel) | **Google Calendar API** (compte de service) ; **Places API (New)** (avis) |

Fichiers de config : `vite.config.ts`, `tailwind.config.ts`, `tsconfig.app.json`, `eslint`.

---

## 3. Structure des dossiers (principale)

```
quentin/
├── index.html                 # Point d’entrée HTML, meta SEO de base, favicon
├── public/                    # Fichiers statiques (robots.txt, logo.png / favicon copiés depuis src/assets)
├── src/
│   ├── main.tsx               # Entry React, favicon cache-bust en dev
│   ├── App.tsx                # Routes, QueryClient, providers
│   ├── index.css              # Styles globaux / Tailwind
│   ├── pages/
│   │   ├── Index.tsx          # Page d’accueil (landing)
│   │   ├── AdminLogin.tsx
│   │   ├── AdminDashboard.tsx # Table réservations + tabs config
│   │   └── NotFound.tsx
│   ├── components/            # Sections landing + BookingModal, Navbar, Seo, etc.
│   │   └── ui/                # Bibliothèque de composants (button, dialog, table, …)
│   ├── hooks/                 # useBookingConfig, useServicesCards, …
│   ├── lib/                   # supabase.ts, seo.ts, publicContact.ts, utils
│   ├── types/                 # booking.ts, services.ts
│   └── utils/                 # bookingSlots.ts, syncServicesToPrestations.ts
├── supabase/
│   ├── config.toml            # Config Edge Functions (ex. JWT pour get-google-reviews)
│   ├── functions/
│   │   ├── sync-google-calendar/   # Deno — webhook bookings → Google Calendar
│   │   └── get-google-reviews/     # Deno — Places API → avis
│   └── migrations/            # SQL migrations versionnées
├── supabase-schema.sql        # Schéma initial (hors dossier migrations si usage manuel)
├── supabase-admin-schema.sql
└── docs/                      # DEPLOIEMENT, GOOGLE_CALENDAR, GOOGLE_AVIS, etc.
```

---

## 4. Routes frontend

| Chemin | Rôle |
|--------|------|
| `/` | Landing + modal réservation |
| `/admin` | Connexion admin |
| `/admin/dashboard` | Dashboard (auth requise) |
| `*` | 404 |

SPA : nécessite **rewrite** vers `index.html` en production (Vercel `vercel.json`, Netlify `_redirects`, etc.).

---

## 5. Variables d’environnement (frontend)

Préfixe **`VITE_`** (exposées au navigateur). Exemples :

- `VITE_SUPABASE_URL` — URL projet Supabase
- `VITE_SUPABASE_ANON_KEY` — clé publique anon
- `VITE_ENABLE_GOOGLE_REVIEWS` — `"true"` pour activer les avis Google (sinon témoignages statiques)
- `VITE_SITE_URL`, `VITE_PUBLIC_PHONE`, `VITE_OG_IMAGE_URL`, etc. — SEO / contact (voir `src/lib/seo.ts`, `publicContact.ts`)

**Ne jamais** commiter `.env` avec secrets.

---

## 6. Supabase (résumé technique)

- **Table `bookings`** : réservations (prénom, nom, téléphone, date/heure, prestation, session, `activity_type`, `statut_paiement`, `google_event_id`, …).
- **Table `site_config`** : paires clé/valeur JSON (prestations, horaires admin, quotas, cartes services `services_cards`, etc.).
- **RPC** : `get_slot_counts`, `get_booked_slots`, etc. (voir migrations et schémas SQL).
- **RLS** : insert anonyme pour réservations ; lecture/écriture admin pour utilisateurs authentifiés.
- **Edge Functions** :
  - `sync-google-calendar` : secrets `GOOGLE_SERVICE_ACCOUNT_JSON`, `CALENDAR_ID`, … ; déclenchée par **Database Webhook** sur `bookings` (INSERT/UPDATE).
  - `get-google-reviews` : secrets `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID` ; appelée depuis le front via `supabase.functions.invoke`.

---

## 7. Scripts npm

- `npm run dev` — Vite dev (plugin copie `src/assets/logo.png` → `public/logo.png` au démarrage)
- `npm run build` — `tsc -b && vite build` → sortie `dist/`
- `npm run preview` — prévisualisation production locale
- `npm run lint` — ESLint

---

## 8. Documentation interne

- `docs/DEPLOIEMENT.md` — Vercel/Netlify, variables, migration prestataire → client, maintenance abonnement
- `docs/GOOGLE_CALENDAR.md` — Google Cloud, Agenda, Supabase, pas de secrets Google dans Vercel
- `docs/GOOGLE_AVIS.md` — Places API, secrets, `VITE_ENABLE_GOOGLE_REVIEWS`
- `README.md` — installation rapide

---

## 9. Contraintes utiles pour l’IA

- Le projet est **frontend-only** hébergé (fichiers statiques) ; **pas** de serveur Node dédié pour l’API métier.
- La logique serveur métier est **Supabase** (SQL + Edge Functions Deno).
- Modifier le comportement des réservations implique souvent **SQL/RLS**, **RPC**, et/ou **Edge Functions**, pas seulement React.
- Les **cartes services** (landing) peuvent piloter les **prestations** réservables via sync (`syncServicesToPrestations` + `site_config`).

---

*Généré pour contexte LLM — à mettre à jour si le repo évolue.*
