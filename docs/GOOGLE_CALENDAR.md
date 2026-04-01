# Synchronisation Google Agenda (Calendar)

Les réservations (insertions et modifications de date/heure) sont synchronisées avec un calendrier Google. Chaque RDV crée ou met à jour un événement dans l’agenda.

---

## Vue d’ensemble : quel onglet / quel service ?

| Où ? | Ce que tu configures pour la sync Calendar |
|------|---------------------------------------------|
| **Google Cloud Console** | Projet Google, activation de **Google Calendar API**, **compte de service**, clé **JSON** (identifiants pour la « machine », pas pour un humain). |
| **Google Calendar** (calendar.google.com) | Partage du calendrier avec l’**e-mail du compte de service** (`…@….iam.gserviceaccount.com`) et lecture de l’**ID du calendrier**. |
| **Supabase** (dashboard) | **Secrets** de l’Edge Function (`GOOGLE_SERVICE_ACCOUNT_JSON`, `CALENDAR_ID`, …), **déploiement** de `sync-google-calendar`, **webhook** sur la table `bookings`. |
| **Vercel** (ou Netlify, etc.) | **Aucun secret Google** ici. Seulement les variables du site : `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (comme pour le reste du site). La sync ne passe **pas** par Vercel : elle va **Supabase → Edge Function → Google**. |

En résumé : **Google Cloud** = autoriser l’API + robot ; **Google Agenda** = donner accès au robot ; **Supabase** = coller les secrets + relier la base au robot ; **Vercel** = héberger le site, sans toucher à Google Calendar.

---

## Parcours pas à pas (ordre recommandé)

### Étape A — Google Cloud Console

1. Ouvre [Google Cloud Console](https://console.cloud.google.com/) et connecte-toi avec un compte Google **du client** (ou un compte auquel le client t’a invité sur le projet).
2. **Sélectionne le projet** (menu en haut) ou crée-en un nouveau.
3. Menu **☰** → **APIs & Services** → **Library** (ou *Enable APIs and Services*).
4. Cherche **Google Calendar API** → **Enable**.
5. Toujours dans **APIs & Services** → **Credentials** → **Create credentials** → **Service account**.
6. Nom du compte (ex. `supabase-calendar-sync`) → **Create and Continue** → **Done**.
7. Ouvre le **compte de service** créé → onglet **Keys** → **Add key** → **Create new key** → **JSON** → télécharge le fichier.
8. **Note** : l’adresse e-mail du compte de service est du type `xxx@yyy.iam.gserviceaccount.com` — tu en auras besoin pour **Google Calendar** (étape B).

### Étape B — Google Calendar (agenda)

1. Ouvre [Google Calendar](https://calendar.google.com) avec le **compte Google qui possède** l’agenda des RDV (souvent le client).
2. Choisis le calendrier (principal ou un calendrier dédié « RDV site »).
3. **Paramètres du calendrier** (roue dentée) → calendrier concerné → **Paramètres et partage**.
4. Section **Partager avec des personnes** (ou *Share with specific people*) → **Ajouter des personnes** → colle l’**e-mail du compte de service** (`…@….iam.gserviceaccount.com`).
5. Donne le droit **Modifier les événements** (*Make changes to events*) / équivalent « voir + modifier ».
6. **Note l’ID du calendrier** : même écran, section **Intégrer le calendrier** / *Integrate calendar*, champ **Calendar ID** (souvent une adresse e-mail ou `primary` pour l’agenda principal).
7. Tu n’as **pas** besoin d’ouvrir Vercel pour cette étape.

### Étape C — Supabase

1. Ouvre le [dashboard Supabase](https://supabase.com/dashboard) du **projet** du site.
2. **Project Settings** (icône engrenage) → **Edge Functions** → **Secrets** (ou *Manage secrets*).
3. Ajoute les secrets suivants :

| Nom du secret | Valeur |
|---------------|--------|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Contenu **complet** du fichier JSON du compte de service (une seule ligne possible, JSON minifié). |
| `CALENDAR_ID` | L’ID du calendrier copié à l’étape B (ex. `primary` ou l’e-mail du calendrier). |
| `WEBHOOK_SECRET` | (Optionnel) Une phrase secrète au choix ; la même valeur sera mise dans le webhook. |

`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont en général **injectés automatiquement** pour les Edge Functions ; sinon ajoute-les aussi (voir doc Supabase).

4. **Colonne** `google_event_id` sur `bookings` : si pas déjà faite, exécute dans **SQL Editor** :

```sql
alter table public.bookings add column if not exists google_event_id text;
```

5. **Déploie l’Edge Function** (depuis la machine du dev, avec CLI) :

```bash
npx supabase login
npx supabase link --project-ref VOTRE_PROJECT_REF
npx supabase functions deploy sync-google-calendar
```

`VOTRE_PROJECT_REF` = l’identifiant dans l’URL du projet (`https://supabase.com/dashboard/project/XXXX`).

6. **Webhook base de données** : **Database** → **Webhooks** → **Create a new hook**  
   - Table : `public.bookings`  
   - Événements : **Insert** et **Update**  
   - Type : **HTTP Request**  
   - URL : `https://VOTRE_PROJECT_REF.supabase.co/functions/v1/sync-google-calendar`  
   - Si tu utilises `WEBHOOK_SECRET` : en-tête `x-webhook-secret` = même valeur que le secret.

### Étape D — Vercel (site web uniquement)

1. **Rien à configurer** pour Google Calendar en tant que tel.
2. Pour que le site parle à Supabase (réservations, admin), vérifie dans **Settings** → **Environment Variables** :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`  
3. Redéploie le site après une modification de variables.

Si le client ne veut pas te donner ses identifiants : il peut te **inviter** sur le projet Vercel avec ton e-mail, ou **lui-même** coller ces deux variables en suivant `docs/DEPLOIEMENT.md`.

---

## Fonctionnement technique (rappel)

1. **Insertion** : un client prend rendez-vous → la base enregistre la réservation → un **webhook** Supabase appelle l’Edge Function → création d’un événement Google Calendar → l’ID est enregistré dans `bookings.google_event_id`.
2. **Modification** : l’admin modifie la date ou l’heure → webhook sur **UPDATE** → l’Edge Function met à jour l’événement Google (ou le crée si `google_event_id` était vide).

La durée d’un événement est fixée à **60 minutes** dans l’Edge Function (modifiable dans le code si besoin).

---

## Vérification

- Crée une réservation depuis le site : un événement doit apparaître dans Google Agenda.
- Modifie un RDV depuis l’admin : l’événement doit se mettre à jour.

En cas d’erreur : **Supabase** → **Edge Functions** → `sync-google-calendar` → **Logs**.

---

## Résumé des fichiers dans le repo

- **Migration** : `supabase/migrations/20250301000000_add_google_event_id.sql` (colonne `google_event_id`).
- **Edge Function** : `supabase/functions/sync-google-calendar/index.ts`.

Aucune modification du code React (BookingModal, AdminDashboard) n’est nécessaire pour activer la sync : tout passe par webhooks + Edge Function.

---

## Liens utiles

- Déploiement général du site (Vercel, variables, SPA) : [`docs/DEPLOIEMENT.md`](./DEPLOIEMENT.md).  
- Avis Google (autre sujet Google Cloud / Places) : [`docs/GOOGLE_AVIS.md`](./GOOGLE_AVIS.md).
