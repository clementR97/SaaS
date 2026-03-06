# Application de réservation (RDV)

Site vitrine avec formulaire de prise de rendez-vous en ligne, back-office admin et synchronisation Google Calendar. Pensé pour les professionnels (coaching, massage, naturopathie, etc.) — fuseau Guadeloupe (America/Guadeloupe).

---

## Fonctionnalités

- **Côté public**
  - Formulaire de réservation : choix de la prestation, de la séance, date et créneau horaire (selon l’emploi du temps configurable).
  - Créneaux déjà réservés affichés comme indisponibles.
  - Données enregistrées en base (Supabase).

- **Côté admin** (`/admin` → connexion → `/admin/dashboard`)
  - Tableau des **réservations à venir**.
  - **Statut de paiement** : Payé / Non payé.
  - **Modification date et heure** d’un RDV (respect de l’emploi du temps et des créneaux déjà pris).
  - **Configuration** : prestations, emploi du temps (par jour et type d’activité), durée des séances par créneau, lien prestation → type d’activité.

- **Google Calendar**
  - Synchronisation automatique : chaque nouveau RDV crée un événement ; chaque modification de date/heure met à jour l’événement (via webhooks Supabase + Edge Function).

---

## Stack

| Rôle              | Techno                          |
|-------------------|----------------------------------|
| Frontend          | React 19, Vite, TypeScript       |
| UI                | Tailwind CSS, Radix UI, Framer Motion |
| Backend / Données | Supabase (PostgreSQL, Auth, Edge Functions) |
| Calendrier        | Google Calendar API (compte de service) |

---

## Prérequis

- Node.js 18+
- Compte [Supabase](https://supabase.com)
- (Optionnel) Compte Google Cloud pour la sync Google Calendar

---

## Installation

### 1. Cloner et installer les dépendances

```bash
git clone <url-du-repo>
cd quentin
npm install
```

### 2. Variables d’environnement

Créer un fichier `.env` à la racine avec les valeurs Supabase (Dashboard → Settings → API) :

```env
VITE_SUPABASE_URL=https://VOTRE_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### 3. Base de données Supabase

Dans le **SQL Editor** Supabase, exécuter dans l’ordre :

1. **`supabase-schema.sql`** — table `bookings`, RLS, fonction `get_booked_slots`.
2. **`supabase-admin-schema.sql`** — colonnes admin (`statut_paiement`, `email`, `google_event_id`), table `site_config`, policies admin.

### 4. Lancer l’app

```bash
npm run dev
```

Ouvrir [http://localhost:5173](http://localhost:5173). La prise de RDV est sur la page d’accueil ; l’admin est sur `/admin` (créer un utilisateur dans Supabase → Authentication → Users pour se connecter).

---

## Google Calendar (optionnel)

Pour synchroniser les RDV avec un calendrier Google :

1. Configurer Google Cloud (API Calendar, compte de service, partage du calendrier) — voir **`docs/GOOGLE_CALENDAR.md`**.
2. Déployer l’Edge Function et configurer les secrets + webhooks Supabase (détails dans le même doc).

```bash
npx supabase login
npx supabase link --project-ref VOTRE_PROJECT_REF
npx supabase functions deploy sync-google-calendar
```

---

## Scripts

| Commande        | Description              |
|-----------------|--------------------------|
| `npm run dev`   | Serveur de développement |
| `npm run build` | Build de production      |
| `npm run preview` | Prévisualiser le build |
| `npm run lint`  | Vérification ESLint      |

---

## Structure du projet

```
quentin/
├── src/
│   ├── components/     # Composants React (dont BookingModal)
│   ├── pages/          # Index, AdminLogin, AdminDashboard, NotFound
│   ├── hooks/          # useBookingConfig
│   ├── lib/            # Client Supabase
│   ├── types/          # Types booking (config, créneaux)
│   └── utils/          # bookingSlots (génération créneaux)
├── supabase/
│   ├── functions/sync-google-calendar/   # Edge Function Calendar
│   └── migrations/                       # Migration google_event_id
├── docs/
│   ├── GOOGLE_CALENDAR.md   # Config Google Calendar
│   └── SECURITE-ADMIN.md    # Sécurité et architecture admin
├── supabase-schema.sql      # Schéma de base (bookings, RLS)
├── supabase-admin-schema.sql # Admin + site_config + policies
└── README.md
```

---

## Documentation

- **`SUPABASE.md`** — Configuration Supabase, schéma, créneaux réservés.
- **`docs/GOOGLE_CALENDAR.md`** — Synchronisation Google Agenda (Google Cloud, webhooks, Edge Function).
- **`docs/SECURITE-ADMIN.md`** — Sécurité de l’admin et des données (RLS, auth).

---

## Licence

Projet privé. Tous droits réservés.
